#pragma once

#include <Arduino.h>

namespace config {
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t HX711_DOUT_PIN = 16;
constexpr uint8_t HX711_SCK_PIN = 17;
// Set after calibrating the assembled station; zero keeps a value unavailable.
constexpr float HX711_COUNTS_PER_GRAM = 0.0F;
// Measured empty-bed VL53L0X reading: averaged ~251.2mm across repeated
// samples, cross-checked against a ruler (~250mm) and confirmed repeatable
// across a power cycle. Re-measure and update if the sensor is re-mounted.
constexpr float TOF_EMPTY_BED_DISTANCE_MM = 251.2F;
constexpr uint8_t START_BUTTON_PIN = 27;
constexpr uint8_t SERVO_PIN = 18;
constexpr uint8_t LCD_I2C_ADDRESS = 0x27;
constexpr uint8_t LCD_COLUMNS = 16;
constexpr uint8_t LCD_ROWS = 2;

constexpr uint32_t BUTTON_DEBOUNCE_MS = 35;
constexpr uint32_t SERVO_SETTLE_MS = 800;
constexpr uint32_t NETWORK_RETRY_MS = 5000;
constexpr uint32_t MQTT_KEEPALIVE_SECONDS = 20;
constexpr uint16_t MQTT_BUFFER_SIZE = 1024;

constexpr int SERVO_REFURBISH_ANGLE = 30;
constexpr int SERVO_RECYCLE_ANGLE = 90;
constexpr int SERVO_DISPOSE_ANGLE = 150;

constexpr char STATION_ID[] = "regrade-station-001";
constexpr char MQTT_TOPIC[] = "regrade/regrade-station-001/diagnostics";
}  // namespace config
