#pragma once

#include <Arduino.h>

namespace config {
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t HX711_DOUT_PIN = 32;
constexpr uint8_t HX711_SCK_PIN = 33;
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
