#include <Adafruit_INA219.h>
#include <Arduino.h>
#include <Wire.h>
#include <math.h>

#include "i2c_diagnostics.h"
#include "regrade_config.h"

// Read-only INA219 bench test. It measures whatever circuit is wired through
// VIN+/VIN- and never switches or applies a load.
namespace {
Adafruit_INA219 sensor;  // Default address 0x40 (A0/A1 unbridged).
bool sensorReady = false;
uint32_t lastReadingAt = 0;
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);
  i2c_diagnostics::beginWithDiagnostics();

  sensorReady = sensor.begin(&Wire);
  if (sensorReady) {
    // Library default: 32 V bus range, 2 A range, assumes a 0.1 ohm shunt.
    sensor.setCalibration_32V_2A();
  }

  Serial.println("ReGrade INA219 test (read-only, uncalibrated)");
  Serial.printf("Sensor init=%s (SDA=GPIO%u, SCL=GPIO%u, expected addr=0x40)\n",
                sensorReady ? "ok" : "failed",
                static_cast<unsigned int>(config::I2C_SDA_PIN),
                static_cast<unsigned int>(config::I2C_SCL_PIN));
}

void loop() {
  if (millis() - lastReadingAt < 1000) {
    return;
  }
  lastReadingAt = millis();

  if (!sensorReady) {
    Serial.println("INA219 status=init_failed");
    return;
  }

  const float busV = sensor.getBusVoltage_V();
  const float shuntMv = sensor.getShuntVoltage_mV();
  const float currentMa = sensor.getCurrent_mA();
  const float powerMw = sensor.getPower_mW();
  if (!isfinite(busV) || !isfinite(shuntMv) || !isfinite(currentMa) ||
      !isfinite(powerMw)) {
    Serial.println("INA219 status=invalid_reading");
    return;
  }

  // bus_v is measured at VIN- (load side); the source side is VIN+.
  const float sourceV = busV + shuntMv / 1000.0f;
  Serial.printf(
      "INA219 source_v=%.3f load_v=%.3f current_ma=%.1f power_mw=%.1f "
      "shunt_mv=%.2f\n",
      static_cast<double>(sourceV), static_cast<double>(busV),
      static_cast<double>(currentMa), static_cast<double>(powerMw),
      static_cast<double>(shuntMv));
}
