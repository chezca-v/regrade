// Exhibit demo assist: publishes ONE real MLX90614 ambient/surface reading
// per scan, under a station id the dashboard's "Exhibit demo" station mode
// polls separately from its own fabricated weight/thickness/current/voltage.
// Every other field on that demo diagnostic stays fabricated in the
// dashboard (see dashboard/app/diagnostics.tsx); this sketch never reports
// weight, thickness, or current, and never produces a grade.
//
// Fails closed like the rest of the firmware: if the MLX90614 isn't
// detected, this publishes stable:false with null temperature fields
// instead of inventing a reading, so the dashboard falls back to its own
// fabricated temperature rather than trusting a sensor that isn't there.
#include <Adafruit_MLX90614.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <esp_system.h>
#include <math.h>
#include <string.h>

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
constexpr uint8_t kTemperatureSamples = 5;
constexpr uint32_t kSampleIntervalMs = 300;

Adafruit_MLX90614 irSensor;
#if MQTT_TLS_ENABLED
using MqttTransport = WiFiClientSecure;
#else
using MqttTransport = WiFiClient;
#endif
MqttTransport mqttTransport;
PubSubClient mqttClient(mqttTransport);

bool mlxReady = false;
bool scanRequested = false;
uint32_t lastNetworkAttemptAt = 0;

void publishReading() {
  char sessionId[64];
  snprintf(sessionId, sizeof(sessionId), "%s-%08lx-%08lx",
           config::DEMO_STATION_ID,
           static_cast<unsigned long>(ESP.getEfuseMac() & 0xFFFFFFFFUL),
           static_cast<unsigned long>(esp_random()));

  StaticJsonDocument<384> document;
  document["session_id"] = sessionId;
  document["station_id"] = config::DEMO_STATION_ID;
  JsonObject sensorData = document.createNestedObject("readings");

  if (!mlxReady) {
    document["status"] = "calibration_required";
    document["fault"] = "MLX90614 unavailable";
    sensorData["stable"] = false;
    sensorData["surface_temp_c"] = nullptr;
    sensorData["temperature_rise_c"] = nullptr;
  } else {
    float ambientTotal = 0.0F;
    float surfaceTotal = 0.0F;
    uint8_t validSamples = 0;
    for (uint8_t sample = 0; sample < kTemperatureSamples; ++sample) {
      const float ambientC = irSensor.readAmbientTempC();
      const float surfaceC = irSensor.readObjectTempC();
      if (isfinite(ambientC) && isfinite(surfaceC)) {
        ambientTotal += ambientC;
        surfaceTotal += surfaceC;
        ++validSamples;
      }
      delay(kSampleIntervalMs);
    }

    if (validSamples == 0) {
      document["status"] = "sensor_unstable";
      document["fault"] = "MLX90614 returned no finite samples";
      sensorData["stable"] = false;
      sensorData["surface_temp_c"] = nullptr;
      sensorData["temperature_rise_c"] = nullptr;
    } else {
      const float ambientC = ambientTotal / validSamples;
      const float surfaceC = surfaceTotal / validSamples;
      document["status"] = "readings_stable";
      sensorData["stable"] = true;
      sensorData["surface_temp_c"] = surfaceC;
      sensorData["temperature_rise_c"] = surfaceC - ambientC;
    }
  }

  if (!mqttClient.connected()) {
    Serial.println("Demo temperature reading not published: MQTT is disconnected");
    return;
  }
  char payload[384];
  const size_t payloadSize = serializeJson(document, payload, sizeof(payload));
  if (payloadSize == 0 || payloadSize >= sizeof(payload)) {
    Serial.println("Demo temperature reading serialization failed");
    return;
  }
  if (!mqttClient.publish(config::DEMO_MQTT_TOPIC, payload, false)) {
    Serial.println("Demo temperature reading publish failed");
    return;
  }
  Serial.println("Demo temperature reading published");
}

void onMqttMessage(char* topic, uint8_t* payload, unsigned int length) {
  if (strcmp(topic, config::DEMO_MQTT_COMMAND_TOPIC) != 0) {
    return;
  }
  StaticJsonDocument<128> command;
  if (deserializeJson(command, payload, length) != DeserializationError::Ok) {
    return;
  }
  const char* action = command["command"] | "";
  if (strcmp(action, "start") == 0) {
    scanRequested = true;
  }
}

void serviceNetwork() {
  if (WiFi.status() != WL_CONNECTED) {
    const uint32_t now = millis();
    if (now - lastNetworkAttemptAt >= config::NETWORK_RETRY_MS) {
      lastNetworkAttemptAt = now;
      Serial.printf("WiFi not connected, status=%d\n", WiFi.status());
    }
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

  char clientId[48];
  const uint64_t chipId = ESP.getEfuseMac();
  snprintf(clientId, sizeof(clientId), "regrade-demo-temp-%08lx",
           static_cast<unsigned long>(chipId & 0xFFFFFFFFUL));

  bool connected = false;
  if (MQTT_USERNAME[0] != '\0') {
    connected = mqttClient.connect(clientId, MQTT_USERNAME, MQTT_PASSWORD);
  } else {
    connected = mqttClient.connect(clientId);
  }
  if (!connected) {
    Serial.printf("MQTT connect failed, state=%d\n", mqttClient.state());
    return;
  }
  if (!mqttClient.subscribe(config::DEMO_MQTT_COMMAND_TOPIC)) {
    Serial.println("Failed to subscribe to demo command topic");
  }
}
}  // namespace

void setup() {
  Serial.begin(115200);
  Wire.begin(config::I2C_SDA_PIN, config::I2C_SCL_PIN);
  mlxReady = irSensor.begin();
  if (!mlxReady) {
    Serial.println("MLX90614 initialization failed");
  }

  if (WIFI_SSID[0] != '\0') {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  } else {
    Serial.println("Wi-Fi not configured");
  }

#if MQTT_TLS_ENABLED
  if (MQTT_CA_CERT[0] != '\0') {
    mqttTransport.setCACert(MQTT_CA_CERT);
  }
#endif
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setKeepAlive(config::MQTT_KEEPALIVE_SECONDS);
  mqttClient.setSocketTimeout(2);
  mqttClient.setBufferSize(512);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  serviceNetwork();
  if (scanRequested) {
    scanRequested = false;
    publishReading();
  }
}
