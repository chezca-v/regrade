#include <Adafruit_MLX90614.h>
#include <Arduino.h>
#include <Wire.h>
#include <math.h>

#include "i2c_diagnostics.h"
#include "regrade_config.h"

namespace {
Adafruit_MLX90614 sensor;
bool sensorReady = false;
uint32_t lastReadingAt = 0;
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);
  i2c_diagnostics::beginWithDiagnostics();

  sensorReady = sensor.begin();
  Serial.println("ReGrade GY-906 / MLX90614 test");
  Serial.printf("Sensor init=%s (SDA=GPIO%u, SCL=GPIO%u)\n",
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
    Serial.println("MLX90614 status=init_failed");
    return;
  }

  const float ambientC = sensor.readAmbientTempC();
  const float objectC = sensor.readObjectTempC();
  if (!isfinite(ambientC) || !isfinite(objectC)) {
    Serial.println("MLX90614 status=invalid_reading");
    return;
  }

  Serial.printf("MLX90614 ambient_c=%.2f object_c=%.2f\n",
                static_cast<double>(ambientC),
                static_cast<double>(objectC));
}
