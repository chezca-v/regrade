#pragma once

#include <Arduino.h>

namespace config {
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t HX711_DOUT_PIN = 16;
constexpr uint8_t HX711_SCK_PIN = 17;
// Set after calibrating the assembled station; zero keeps a value unavailable.
constexpr float HX711_COUNTS_PER_GRAM =-36.9688F;
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
constexpr uint32_t SENSOR_STABILITY_TIMEOUT_MS = 15000;
constexpr uint32_t SENSOR_STABILITY_SAMPLE_INTERVAL_MS = 400;
constexpr uint8_t SENSOR_STABILITY_REQUIRED_SAMPLES = 3;
constexpr uint32_t SENSOR_STABILITY_SAMPLE_GUARD_MS = 1000;

// Set these only after validating repeatability on the assembled station.
// Zero keeps stability approval disabled until a measured tolerance is entered.
constexpr float WEIGHT_STABILITY_TOLERANCE_G = 0.0F;
constexpr float THICKNESS_STABILITY_TOLERANCE_MM = 0.0F;
constexpr float CURRENT_STABILITY_TOLERANCE_MA = 0.0F;
constexpr float SURFACE_TEMP_STABILITY_TOLERANCE_C = 0.0F;
constexpr float TEMP_RISE_STABILITY_TOLERANCE_C = 0.0F;

constexpr int SERVO_REFURBISH_ANGLE = 30;
constexpr int SERVO_RECYCLE_ANGLE = 90;
constexpr int SERVO_DISPOSE_ANGLE = 150;

constexpr char STATION_ID[] = "regrade-station-001";
constexpr char MQTT_TOPIC[] = "regrade/regrade-station-001/diagnostics";

// --- Grading thresholds ---------------------------------------------------
// GRADING_RULES_APPROVED must stay false until the team has reviewed and
// approved specific numbers below for this station's device population.
// Flipping it to true with the zeroed defaults below would grade every
// device against meaningless thresholds, so loadThresholds() in main.cpp
// also refuses to treat the rule set as valid unless every value here is
// non-zero. This single global rule set does not vary by device model;
// per-model thresholds would need a device-identification input the
// firmware does not currently have.
constexpr bool GRADING_RULES_APPROVED = false;
constexpr float GRADING_MINIMUM_WEIGHT_G = 0.0F;       // below this mass: missing/removed mass
constexpr float GRADING_BASELINE_THICKNESS_MM = 0.0F;  // expected unswollen thickness
constexpr float GRADING_SWELLING_MM = 0.0F;            // thickness increase over baseline that fails
constexpr float GRADING_ZERO_CURRENT_MA = 0.0F;        // at/below this: no charging draw
constexpr float GRADING_OVERCURRENT_MA = 0.0F;         // at/above this: overcurrent hazard
constexpr float GRADING_TEMPERATURE_RISE_C = 0.0F;     // at/above this: thermal hazard
}  // namespace config
