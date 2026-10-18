#include <Adafruit_INA219.h>
#include <Adafruit_MLX90614.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <HX711.h>
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>
#include <VL53L0X.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <esp_system.h>
#include <math.h>

#include "regrade_config.h"

#if __has_include("secrets.h")
#include "secrets.h"
#endif

#ifndef WIFI_SSID
#define WIFI_SSID ""
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD ""
#endif
#ifndef MQTT_HOST
#define MQTT_HOST ""
#endif
#ifndef MQTT_PORT
#define MQTT_PORT 8883
#endif
#ifndef MQTT_USERNAME
#define MQTT_USERNAME ""
#endif
#ifndef MQTT_PASSWORD
#define MQTT_PASSWORD ""
#endif
#ifndef MQTT_CA_CERT
#define MQTT_CA_CERT ""
#endif
#ifndef MQTT_TLS_ENABLED
#define MQTT_TLS_ENABLED 1
#endif

namespace {
enum class State : uint8_t { IDLE, SCAN, GRADE, SORT, REPORT };
enum class Grade : char { A = 'A', B = 'B', C = 'C', D = 'D', INVALID = '-' };

struct SensorSnapshot {
  float weightG = 0.0F;
  float thicknessMm = 0.0F;
  float currentMa = 0.0F;
  float surfaceTempC = 0.0F;
  float temperatureRiseC = 0.0F;
};

struct GradingThresholds {
  float minimumWeightG = 0.0F;
  float baselineThicknessMm = 0.0F;
  float swellingMm = 0.0F;
  float zeroCurrentMa = 0.0F;
  float overcurrentMa = 0.0F;
  float temperatureRiseC = 0.0F;
  bool valid = false;
};

struct GradeResult {
  Grade grade = Grade::INVALID;
  uint8_t healthScore = 0;
  const char* status = "not_tested";
};

State state = State::IDLE;
SensorSnapshot readings;
GradingThresholds thresholds;
GradeResult result;

HX711 loadCell;
VL53L0X tofSensor;
Adafruit_MLX90614 irSensor;
Adafruit_INA219 currentSensor;
LiquidCrystal_I2C lcd(config::LCD_I2C_ADDRESS, config::LCD_COLUMNS,
                      config::LCD_ROWS);
Servo diverter;
#if MQTT_TLS_ENABLED
using MqttTransport = WiFiClientSecure;
#else
using MqttTransport = WiFiClient;
#endif
MqttTransport mqttTransport;
PubSubClient mqttClient(mqttTransport);

bool lcdReady = false;
bool hx711Ready = false;
bool tofReady = false;
bool mlxReady = false;
bool inaReady = false;
bool scanValid = false;
bool weightValid = false;
bool thicknessValid = false;
bool currentValid = false;
bool temperatureValid = false;
bool sortSuccess = false;
bool reportPending = false;
bool buttonStableState = HIGH;
bool buttonLastReading = HIGH;
uint32_t buttonChangedAt = 0;
uint32_t lastNetworkAttemptAt = 0;
uint32_t sessionStartedAt = 0;
uint32_t sortStartedAt = 0;
int sortAngle = config::SERVO_RECYCLE_ANGLE;
const char* faultMessage = "";

bool actuateDiverter(int angle);  // defined below; used by enterState()

void showMessage(const char* title, const char* detail = "") {
  if (!lcdReady) {
    return;
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  for (uint8_t index = 0; title[index] != '\0' && index < config::LCD_COLUMNS;
       ++index) {
    lcd.print(title[index]);
  }
  lcd.setCursor(0, 1);
  for (uint8_t index = 0;
       detail[index] != '\0' && index < config::LCD_COLUMNS; ++index) {
    lcd.print(detail[index]);
  }
}

void enterState(State nextState) {
  state = nextState;
  switch (state) {
    case State::IDLE:
      showMessage("ReGrade ready", "Press to begin");
      break;
    case State::SCAN:
      readings = SensorSnapshot{};
      scanValid = false;
      faultMessage = "";
      result = GradeResult{};
      sessionStartedAt = millis();
      showMessage("Scanning", "Do not remove item");
      break;
    case State::GRADE:
      showMessage("Evaluating", "Checking thresholds");
      break;
    case State::SORT:
      sortStartedAt = millis();
      sortSuccess = actuateDiverter(sortAngle);
      if (!sortSuccess) {
        faultMessage = "Servo actuation not implemented";
      }
      showMessage("Sorting", sortSuccess ? "Diverter moving" : "Actuator disabled");
      break;
    case State::REPORT:
      reportPending = true;
      break;
  }
}

bool readWeight(float& weightG) {
  if (!hx711Ready || config::HX711_COUNTS_PER_GRAM == 0.0F ||
      !loadCell.is_ready()) return false;
  const float grams = loadCell.get_units(5);
  if (!isfinite(grams) || grams < 0.0F) return false;
  weightG = grams;
  return true;
}

bool readThickness(float& thicknessMm) {
  if (!tofReady || config::TOF_EMPTY_BED_DISTANCE_MM <= 0.0F) return false;
  const uint16_t distanceMm = tofSensor.readRangeContinuousMillimeters();
  if (tofSensor.timeoutOccurred() || distanceMm >= 8190) return false;
  const float thickness = config::TOF_EMPTY_BED_DISTANCE_MM - distanceMm;
  if (!isfinite(thickness) || thickness <= 0.0F) return false;
  thicknessMm = thickness;
  return true;
}

bool readElectricalCurrent(float& currentMa) {
  if (!inaReady) return false;
  const float measured = currentSensor.getCurrent_mA();
  if (!isfinite(measured)) return false;
  currentMa = measured;
  return true;
}

bool readSurfaceTemperature(float& temperatureC, float& temperatureRiseC) {
  if (!mlxReady) return false;
  const float ambientC = irSensor.readAmbientTempC();
  const float objectC = irSensor.readObjectTempC();
  if (!isfinite(ambientC) || !isfinite(objectC)) return false;
  temperatureC = objectC;
  temperatureRiseC = objectC - ambientC;
  return true;
}

bool scanSensors() {
  weightValid = readWeight(readings.weightG);
  thicknessValid = readThickness(readings.thicknessMm);
  currentValid = readElectricalCurrent(readings.currentMa);
  temperatureValid =
      readSurfaceTemperature(readings.surfaceTempC, readings.temperatureRiseC);

  const bool allValid = weightValid && thicknessValid && currentValid && temperatureValid;
  if (!allValid) faultMessage = "Sensor read/calibration unavailable";
  return allValid;
}

bool loadThresholds(GradingThresholds& loadedThresholds) {
  // TODO: Load an approved, versioned rule set for the selected device model.
  // Never infer missing thresholds or silently substitute arbitrary defaults.
  (void)loadedThresholds;
  return false;
}

bool gradeDevice(const SensorSnapshot& sample,
                 const GradingThresholds& rules,
                 GradeResult& gradeResult) {
  if (!rules.valid) {
    return false;
  }

  const float swellMm = sample.thicknessMm - rules.baselineThicknessMm;
  const bool swollen = swellMm >= rules.swellingMm;
  const bool missingMass = sample.weightG < rules.minimumWeightG;
  const bool noCurrent = sample.currentMa <= rules.zeroCurrentMa;
  const bool overcurrent = sample.currentMa >= rules.overcurrentMa;
  const bool temperatureHazard =
      sample.temperatureRiseC >= rules.temperatureRiseC;

  if (swollen || overcurrent || temperatureHazard) {
    gradeResult.grade = Grade::D;
    gradeResult.healthScore = 0;
  } else if (missingMass || noCurrent) {
    gradeResult.grade = Grade::C;
    gradeResult.healthScore = 25;
  } else {
    // TODO: Add calibrated borderline criteria for Grade B before enabling
    // grading; this initial rule model only supports pass (A), recycle (C),
    // and hazard (D) outcomes.
    gradeResult.grade = Grade::A;
    gradeResult.healthScore = 100;
  }
  gradeResult.status = "graded";
  return true;
}

int angleForGrade(Grade grade) {
  switch (grade) {
    case Grade::A:
    case Grade::B:
      return config::SERVO_REFURBISH_ANGLE;
    case Grade::C:
      return config::SERVO_RECYCLE_ANGLE;
    case Grade::D:
      return config::SERVO_DISPOSE_ANGLE;
    case Grade::INVALID:
      return config::SERVO_RECYCLE_ANGLE;
  }
  return config::SERVO_RECYCLE_ANGLE;
}

bool actuateDiverter(int angle) {
  // TODO: Implement only after validating the mechanism, travel limits, and
  // independent servo supply. Keep this stub non-actuating by default.
  (void)angle;
  return false;
}

void serviceNetwork() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (mqttClient.connected()) {
    mqttClient.loop();
    return;
  }

  const uint32_t now = millis();
  if (now - lastNetworkAttemptAt < config::NETWORK_RETRY_MS) {
    return;
  }
  lastNetworkAttemptAt = now;

  if (MQTT_HOST[0] == '\0') {
    Serial.println("MQTT not configured: broker host is empty");
    return;
  }
#if MQTT_TLS_ENABLED
  if (MQTT_CA_CERT[0] == '\0') {
    Serial.println("MQTT not configured: trusted CA is empty");
    return;
  }
#endif

  char clientId[40];
  const uint64_t chipId = ESP.getEfuseMac();
  snprintf(clientId, sizeof(clientId), "regrade-%08lx",
           static_cast<unsigned long>(chipId & 0xFFFFFFFFUL));

  bool connected = false;
  if (MQTT_USERNAME[0] != '\0') {
    connected = mqttClient.connect(clientId, MQTT_USERNAME, MQTT_PASSWORD);
  } else {
    connected = mqttClient.connect(clientId);
  }

  if (!connected) {
    Serial.printf("MQTT connect failed, state=%d\n", mqttClient.state());
  }
}

void publishReport() {
  StaticJsonDocument<768> document;
  char sessionId[64];
  const uint64_t chipId = ESP.getEfuseMac();
  snprintf(sessionId, sizeof(sessionId), "%s-%08lx-%08lx", config::STATION_ID,
           static_cast<unsigned long>(chipId & 0xFFFFFFFFUL),
           static_cast<unsigned long>(esp_random()));

  document["session_id"] = sessionId;
  document["station_id"] = config::STATION_ID;
  document["status"] = result.status;
  if (result.grade == Grade::INVALID) {
    document["grade"] = nullptr;
    document["health_score"] = nullptr;
  } else {
    char gradeText[] = {static_cast<char>(result.grade), '\0'};
    document["grade"] = gradeText;
    document["health_score"] = result.healthScore;
  }
  document["duration_ms"] = millis() - sessionStartedAt;
  document["sort_success"] = sortSuccess;
  document["fault"] = faultMessage[0] == '\0' ? nullptr : faultMessage;

  JsonObject sensorData = document.createNestedObject("readings");
  if (weightValid) sensorData["weight_g"] = readings.weightG;
  else sensorData["weight_g"] = nullptr;
  if (thicknessValid) sensorData["thickness_mm"] = readings.thicknessMm;
  else sensorData["thickness_mm"] = nullptr;
  if (currentValid) sensorData["current_ma"] = readings.currentMa;
  else sensorData["current_ma"] = nullptr;
  if (temperatureValid) {
    sensorData["surface_temp_c"] = readings.surfaceTempC;
    sensorData["temperature_rise_c"] = readings.temperatureRiseC;
  } else {
    sensorData["surface_temp_c"] = nullptr;
    sensorData["temperature_rise_c"] = nullptr;
  }

  if (!mqttClient.connected()) {
    Serial.println("Diagnostic report not published: MQTT is disconnected");
    return;
  }

  char payload[config::MQTT_BUFFER_SIZE];
  const size_t payloadSize = serializeJson(document, payload, sizeof(payload));
  if (payloadSize == 0 || payloadSize >= sizeof(payload)) {
    Serial.println("Diagnostic report serialization failed");
    return;
  }

  if (!mqttClient.publish(config::MQTT_TOPIC, payload, false)) {
    Serial.println("Diagnostic report publish failed");
    return;
  }
  Serial.println("Diagnostic report published");
}

void updateButton() {
  const bool reading = digitalRead(config::START_BUTTON_PIN);
  if (reading != buttonLastReading) {
    buttonChangedAt = millis();
    buttonLastReading = reading;
  }

  if (millis() - buttonChangedAt < config::BUTTON_DEBOUNCE_MS ||
      reading == buttonStableState) {
    return;
  }

  buttonStableState = reading;
  if (buttonStableState == LOW && state == State::IDLE) {
    enterState(State::SCAN);
  }
}

void setupSensorsAndUi() {
  Wire.begin(config::I2C_SDA_PIN, config::I2C_SCL_PIN);

  // LiquidCrystal_I2C has no return value to confirm the LCD actually
  // acknowledged, so probe its address directly rather than assuming success.
  Wire.beginTransmission(config::LCD_I2C_ADDRESS);
  lcdReady = (Wire.endTransmission() == 0);
  if (lcdReady) {
    lcd.init();
    lcd.backlight();
    showMessage("ReGrade", "Initializing");
  } else {
    Serial.println("LCD initialization failed");
  }

  loadCell.begin(config::HX711_DOUT_PIN, config::HX711_SCK_PIN);
  hx711Ready = loadCell.wait_ready_timeout(1000);
  if (hx711Ready && config::HX711_COUNTS_PER_GRAM != 0.0F) {
    loadCell.set_scale(config::HX711_COUNTS_PER_GRAM);
    loadCell.tare(10);
  }
  tofSensor.setTimeout(500);
  tofReady = tofSensor.init();
  if (tofReady) tofSensor.startContinuous(100);
  mlxReady = irSensor.begin();
  inaReady = currentSensor.begin();
  if (inaReady) currentSensor.setCalibration_32V_2A();

  if (!hx711Ready) Serial.println("HX711 unavailable");
  if (!tofReady) Serial.println("VL53L0X initialization failed");
  if (!mlxReady) Serial.println("MLX90614 initialization failed");
  if (!inaReady) Serial.println("INA219 initialization failed");
}

void setupNetwork() {
  if (WIFI_SSID[0] == '\0') {
    Serial.println("Wi-Fi not configured");
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

#if MQTT_TLS_ENABLED
  mqttTransport.setCACert(MQTT_CA_CERT);
#endif
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setKeepAlive(config::MQTT_KEEPALIVE_SECONDS);
  mqttClient.setSocketTimeout(2);
  mqttClient.setBufferSize(config::MQTT_BUFFER_SIZE);
}
}  // namespace

void setup() {
  Serial.begin(115200);
  pinMode(config::START_BUTTON_PIN, INPUT_PULLUP);
  setupSensorsAndUi();

  setupNetwork();
  enterState(State::IDLE);
}

void loop() {
  serviceNetwork();
  updateButton();

  switch (state) {
    case State::IDLE:
      break;
    case State::SCAN:
      scanValid = scanSensors();
      if (!scanValid) {
        result.status = "diagnostic_incomplete";
        enterState(State::REPORT);
      } else {
        enterState(State::GRADE);
      }
      break;
    case State::GRADE:
      if (!loadThresholds(thresholds)) {
        faultMessage = "Approved grading rules unavailable";
        result.status = "calibration_required";
        enterState(State::REPORT);
        break;
      }
      if (!gradeDevice(readings, thresholds, result)) {
        faultMessage = "Grading failed";
        result.status = "grading_failed";
        enterState(State::REPORT);
        break;
      }
      sortAngle = angleForGrade(result.grade);
      enterState(State::SORT);
      break;
    case State::SORT:
      if (millis() - sortStartedAt >= config::SERVO_SETTLE_MS) {
        enterState(State::REPORT);
      }
      break;
    case State::REPORT:
      if (reportPending) {
        reportPending = false;
        publishReport();
        showMessage(result.grade == Grade::INVALID ? "Not graded" : "Complete",
                    result.grade == Grade::INVALID
                        ? result.status
                        : (sortSuccess
                               ? (result.grade == Grade::D ? "Hazard route"
                                                           : "Sorted")
                               : "Sort disabled"));
      }
      if (millis() - sessionStartedAt >= config::SERVO_SETTLE_MS) {
        enterState(State::IDLE);
      }
      break;
  }
}
