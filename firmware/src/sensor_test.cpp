#include <Arduino.h>
#include <HX711.h>
#include <VL53L0X.h>
#include <Wire.h>

#include "regrade_config.h"

namespace {
HX711 loadCell;
VL53L0X tofSensor;
bool hx711ReadyAtBoot = false;
bool tofReady = false;
uint32_t lastReadingAt = 0;

void scanI2cBus() {
  Serial.println("I2C scan:");
  bool foundDevice = false;
  for (uint8_t address = 0x03; address <= 0x77; ++address) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("  found address=0x%02X\n",
                    static_cast<unsigned int>(address));
      foundDevice = true;
    }
  }
  if (!foundDevice) {
    Serial.println("  no devices found");
  }
}

void printSensorReadings() {
  if (loadCell.is_ready()) {
    Serial.printf("HX711 raw_counts=%ld\n", loadCell.read());
  } else {
    Serial.println("HX711 status=not_ready");
  }

  if (tofReady) {
    const uint16_t distanceMm = tofSensor.readRangeContinuousMillimeters();
    if (tofSensor.timeoutOccurred()) {
      Serial.println("VL53L0X status=timeout");
    } else {
      Serial.printf("VL53L0X distance_mm=%u\n",
                    static_cast<unsigned int>(distanceMm));
    }
  } else {
    Serial.println("VL53L0X status=init_failed");
  }
  Serial.println();
}
}  // namespace

void setup() {
  Serial.begin(115200);
  Wire.begin(config::I2C_SDA_PIN, config::I2C_SCL_PIN);
  scanI2cBus();

  loadCell.begin(config::HX711_DOUT_PIN, config::HX711_SCK_PIN);
  hx711ReadyAtBoot = loadCell.wait_ready_timeout(1000);

  tofSensor.setTimeout(500);
  tofReady = tofSensor.init();
  if (tofReady) {
    tofSensor.startContinuous(100);
  }

  Serial.println("ReGrade sensor-only test");
  Serial.println("No grading, calibration, Wi-Fi, or actuator control.");
  Serial.printf("HX711 init=%s (DOUT=%u, SCK=%u)\n",
                hx711ReadyAtBoot ? "ready" : "not_ready_at_boot",
                static_cast<unsigned int>(config::HX711_DOUT_PIN),
                static_cast<unsigned int>(config::HX711_SCK_PIN));
  Serial.printf("VL53L0X init=%s (SDA=%u, SCL=%u)\n",
                tofReady ? "ok" : "failed",
                static_cast<unsigned int>(config::I2C_SDA_PIN),
                static_cast<unsigned int>(config::I2C_SCL_PIN));
}

void loop() {
  if (millis() - lastReadingAt >= 1000) {
    lastReadingAt = millis();
    printSensorReadings();
  }
}
