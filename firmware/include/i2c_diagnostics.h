#pragma once

#include <Arduino.h>
#include <Wire.h>

#include "regrade_config.h"

// Bench-test helpers for diagnosing I2C wiring. Not used by the main firmware.
namespace i2c_diagnostics {

// Reads each line with the ESP32's internal pull-down enabled. Breakout boards
// such as the GY-906 and GY-530 have their own pull-up resistors, so a line
// that still reads HIGH is wired to a powered sensor board. LOW means no
// pull-up reaches that pin.
inline void checkBusLines() {
  pinMode(config::I2C_SDA_PIN, INPUT_PULLDOWN);
  pinMode(config::I2C_SCL_PIN, INPUT_PULLDOWN);
  delay(5);
  const int sdaPulled = digitalRead(config::I2C_SDA_PIN);
  const int sclPulled = digitalRead(config::I2C_SCL_PIN);

  pinMode(config::I2C_SDA_PIN, INPUT_PULLUP);
  pinMode(config::I2C_SCL_PIN, INPUT_PULLUP);
  delay(5);
  const int sdaIdle = digitalRead(config::I2C_SDA_PIN);
  const int sclIdle = digitalRead(config::I2C_SCL_PIN);

  Serial.println("Bus line check:");
  Serial.printf("  SDA GPIO%u: external_pullup=%s idle=%s\n",
                static_cast<unsigned int>(config::I2C_SDA_PIN),
                sdaPulled ? "yes" : "NO", sdaIdle ? "high" : "LOW (shorted?)");
  Serial.printf("  SCL GPIO%u: external_pullup=%s idle=%s\n",
                static_cast<unsigned int>(config::I2C_SCL_PIN),
                sclPulled ? "yes" : "NO", sclIdle ? "high" : "LOW (shorted?)");
  if (!sdaPulled && !sclPulled) {
    Serial.println("  -> sensor board not detected on either line: check "
                   "VIN/GND power and that wires land on GPIO21/GPIO22");
  } else if (!sdaPulled || !sclPulled) {
    Serial.println("  -> only one line shows a pull-up: check the other "
                   "wire, unless the scan below finds the device (some "
                   "modules have no pull-up on that line)");
  }
}

// Holding SCL low for >1.44 ms requests SMBus mode on an MLX90614 that was
// configured for PWM output; nine clocks free a slave holding SDA low.
inline void recoverBus() {
  pinMode(config::I2C_SCL_PIN, OUTPUT_OPEN_DRAIN);
  digitalWrite(config::I2C_SCL_PIN, LOW);
  delay(3);
  for (int i = 0; i < 9; ++i) {
    digitalWrite(config::I2C_SCL_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(config::I2C_SCL_PIN, LOW);
    delayMicroseconds(10);
  }
  digitalWrite(config::I2C_SCL_PIN, HIGH);
  pinMode(config::I2C_SCL_PIN, INPUT_PULLUP);
  delay(5);
}

inline void scanI2cBus() {
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

// Runs the line check, bus recovery, a swapped-pin scan to detect crossed
// wires, then leaves Wire started on the configured pins and scanned.
inline void beginWithDiagnostics() {
  checkBusLines();
  recoverBus();

  Serial.println("Swapped-pin check (SDA=GPIO22, SCL=GPIO21):");
  Wire.begin(config::I2C_SCL_PIN, config::I2C_SDA_PIN, 100000);
  scanI2cBus();
  Wire.end();

  Wire.begin(config::I2C_SDA_PIN, config::I2C_SCL_PIN, 100000);
  scanI2cBus();
}

}  // namespace i2c_diagnostics
