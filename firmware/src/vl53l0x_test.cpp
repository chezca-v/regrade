#include <Arduino.h>
#include <VL53L0X.h>
#include <Wire.h>

#include "i2c_diagnostics.h"
#include "regrade_config.h"

namespace {
VL53L0X sensor;
bool sensorReady = false;
uint32_t lastReadingAt = 0;

// The VL53L0X reports 8190/8191 mm when no target returns enough light.
constexpr uint16_t OUT_OF_RANGE_MM = 8190;
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);
  i2c_diagnostics::beginWithDiagnostics();

  sensor.setTimeout(500);
  sensorReady = sensor.init();
  if (sensorReady) {
    sensor.startContinuous(100);
  }

  Serial.println("ReGrade VL53L0X ToF test");
  Serial.printf("Sensor init=%s (SDA=GPIO%u, SCL=GPIO%u, expected addr=0x29)\n",
                sensorReady ? "ok" : "failed",
                static_cast<unsigned int>(config::I2C_SDA_PIN),
                static_cast<unsigned int>(config::I2C_SCL_PIN));
}

void loop() {
  if (millis() - lastReadingAt < 500) {
    return;
  }
  lastReadingAt = millis();

  if (!sensorReady) {
    Serial.println("VL53L0X status=init_failed");
    return;
  }

  const uint16_t distanceMm = sensor.readRangeContinuousMillimeters();
  if (sensor.timeoutOccurred()) {
    Serial.println("VL53L0X status=timeout");
    return;
  }
  if (distanceMm >= OUT_OF_RANGE_MM) {
    Serial.println("VL53L0X status=out_of_range");
    return;
  }

  Serial.printf("VL53L0X distance_mm=%u\n",
                static_cast<unsigned int>(distanceMm));
}
