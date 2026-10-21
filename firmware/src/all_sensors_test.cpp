#include <Adafruit_INA219.h>
#include <Adafruit_MLX90614.h>
#include <Arduino.h>
#include <HX711.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <math.h>

#include "i2c_diagnostics.h"
#include "regrade_config.h"
#include "tof_sensor.h"

// Combined bench test for every module wired to the station: the shared I2C
// bus (VL53L0X, MLX90614, INA219, LCD) plus the HX711 load cell on its own
// pins. Read-only: no grading, no servo motion, no network. Confirms each
// module answers and prints live readings; it does not calibrate anything.
namespace {
HX711 loadCell;
ToFSensor tofSensor;
Adafruit_MLX90614 irSensor;
Adafruit_INA219 currentSensor;
LiquidCrystal_I2C lcd(config::LCD_I2C_ADDRESS, config::LCD_COLUMNS,
                      config::LCD_ROWS);

bool hx711Ready = false;
bool tofReady = false;
bool mlxReady = false;
bool inaReady = false;
bool lcdReady = false;
uint32_t lastReadingAt = 0;
uint8_t lcdPage = 0;

void showLcdLines(const String& line0, const String& line1) {
  if (!lcdReady) {
    return;
  }
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line0.substring(0, config::LCD_COLUMNS));
  lcd.setCursor(0, 1);
  lcd.print(line1.substring(0, config::LCD_COLUMNS));
}
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("ReGrade all-sensors test (read-only, no grading/servo)");
  i2c_diagnostics::beginWithDiagnostics();

  // LCD first so it can show status as each module comes up. LiquidCrystal_I2C
  // has no return value to confirm the LCD actually acknowledged, so probe
  // its address directly rather than assuming success.
  Wire.beginTransmission(config::LCD_I2C_ADDRESS);
  lcdReady = (Wire.endTransmission() == 0);
  if (lcdReady) {
    lcd.init();
    lcd.backlight();
    showLcdLines("ReGrade bench", "Initializing...");
  }

  loadCell.begin(config::HX711_DOUT_PIN, config::HX711_SCK_PIN);
  hx711Ready = loadCell.wait_ready_timeout(1000);

  tofReady = tofSensor.begin();

  mlxReady = irSensor.begin();
  inaReady = currentSensor.begin();
  if (inaReady) {
    currentSensor.setCalibration_32V_2A();
  }

  Serial.printf("LCD        init=%s (addr=0x%02X)\n",
                lcdReady ? "ok" : "failed", config::LCD_I2C_ADDRESS);
  Serial.printf("HX711      init=%s (DOUT=%u, SCK=%u)\n",
                hx711Ready ? "ok" : "failed",
                static_cast<unsigned int>(config::HX711_DOUT_PIN),
                static_cast<unsigned int>(config::HX711_SCK_PIN));
  Serial.printf("ToF        init=%s model=%s (addr=0x29)\n",
                tofReady ? "ok" : "failed", tofSensor.modelName());
  Serial.printf("MLX90614   init=%s (addr=0x5A)\n", mlxReady ? "ok" : "failed");
  Serial.printf("INA219     init=%s (addr=0x40)\n", inaReady ? "ok" : "failed");

  const uint8_t readyCount = static_cast<uint8_t>(hx711Ready) +
                             static_cast<uint8_t>(tofReady) +
                             static_cast<uint8_t>(mlxReady) +
                             static_cast<uint8_t>(inaReady);
  char summary[17];
  snprintf(summary, sizeof(summary), "%u/4 modules ok", readyCount);
  showLcdLines("ReGrade bench", summary);
  delay(1500);
}

void loop() {
  if (millis() - lastReadingAt < 1000) {
    return;
  }
  lastReadingAt = millis();

  // --- HX711 ---
  if (loadCell.is_ready()) {
    Serial.printf("HX711    raw_counts=%ld\n", loadCell.read());
  } else {
    Serial.println("HX711    status=not_ready");
  }

  // --- VL53L0X ---
  uint16_t distanceMm = 0;
  bool distanceValid = false;
  if (tofReady) {
    if (tofSensor.readRangeMillimeters(distanceMm)) {
      distanceValid = true;
      Serial.printf("ToF %s distance_mm=%u\n", tofSensor.modelName(),
                    static_cast<unsigned int>(distanceMm));
    } else {
      Serial.println("ToF     status=no_new_valid_reading");
    }
  } else {
    Serial.println("ToF     status=init_failed");
  }

  // --- MLX90614 ---
  float ambientC = NAN;
  float objectC = NAN;
  bool mlxValid = false;
  if (mlxReady) {
    ambientC = irSensor.readAmbientTempC();
    objectC = irSensor.readObjectTempC();
    mlxValid = isfinite(ambientC) && isfinite(objectC);
    if (mlxValid) {
      Serial.printf("MLX90614 ambient_c=%.2f object_c=%.2f\n",
                    static_cast<double>(ambientC),
                    static_cast<double>(objectC));
    } else {
      Serial.println("MLX90614 status=invalid_reading");
    }
  } else {
    Serial.println("MLX90614 status=init_failed");
  }

  // --- INA219 ---
  float busV = NAN, shuntMv = NAN, currentMa = NAN;
  bool inaValid = false;
  if (inaReady) {
    busV = currentSensor.getBusVoltage_V();
    shuntMv = currentSensor.getShuntVoltage_mV();
    currentMa = currentSensor.getCurrent_mA();
    inaValid = isfinite(busV) && isfinite(shuntMv) && isfinite(currentMa);
    if (inaValid) {
      const float sourceV = busV + shuntMv / 1000.0f;
      Serial.printf("INA219   source_v=%.3f load_v=%.3f current_ma=%.1f\n",
                    static_cast<double>(sourceV), static_cast<double>(busV),
                    static_cast<double>(currentMa));
    } else {
      Serial.println("INA219   status=invalid_reading");
    }
  } else {
    Serial.println("INA219   status=init_failed");
  }
  Serial.println();

  // Cycle the LCD through two pages so every reading gets screen time on a
  // 16x2 display.
  lcdPage = (lcdPage + 1) % 2;
  if (lcdPage == 0) {
    String line0 = "D:" + (distanceValid ? String(distanceMm) + "mm" : String("--"));
    String line1 = "T:" + (mlxValid ? String(objectC, 1) + "C" : String("--"));
    showLcdLines(line0, line1);
  } else {
    String line0 = "I:" + (inaValid ? String(currentMa, 0) + "mA" : String("--"));
    String line1 = "V:" + (inaValid ? String(busV, 2) + "V" : String("--"));
    showLcdLines(line0, line1);
  }
}
