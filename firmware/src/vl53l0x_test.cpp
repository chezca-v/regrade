#include <Arduino.h>
#include <Wire.h>

#include "i2c_diagnostics.h"
#include "regrade_config.h"
#include "tof_sensor.h"

namespace {
ToFSensor sensor;
bool sensorReady = false;
uint32_t lastReadingAt = 0;

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);
  i2c_diagnostics::beginWithDiagnostics();

  sensorReady = sensor.begin();

  Serial.println("ReGrade VL53L0X/VL53L1X ToF test");
  Serial.printf("Sensor init=%s model=%s (SDA=GPIO%u, SCL=GPIO%u, addr=0x29)\n",
                sensorReady ? "ok" : "failed",
                sensor.modelName(),
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

  uint16_t distanceMm = 0;
  if (!sensor.readRangeMillimeters(distanceMm)) {
    Serial.println("ToF status=no_new_valid_reading");
    return;
  }

  Serial.printf("%s distance_mm=%u\n", sensor.modelName(),
                static_cast<unsigned int>(distanceMm));
}
