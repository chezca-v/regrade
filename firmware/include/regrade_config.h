#pragma once

#include <Arduino.h>

namespace config {
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t HX711_DOUT_PIN = 16;
constexpr uint8_t HX711_SCK_PIN = 17;
// Set after calibrating the assembled station; zero keeps a value unavailable.
constexpr float HX711_COUNTS_PER_GRAM = 0.0208F;
// Measured empty-bed VL53L0X reading: averaged ~251.2mm across repeated
// samples, cross-checked against a ruler (~250mm) and confirmed repeatable
// across a power cycle. Re-measure and update if the sensor is re-mounted.
constexpr float TOF_EMPTY_BED_DISTANCE_MM = 251.2F;
constexpr uint8_t START_BUTTON_PIN = 27;
constexpr uint8_t STOP_BUTTON_PIN = 14;
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
//
// Thickness has no tolerance here by design: this station's VL53L0X/VL53L1X
// unit has a confirmed-faulty I2C peripheral (verified wiring, power, and
// XSHUT; it still fails every real I2C transaction) and is excluded from
// stability and grading entirely until it is replaced. thickness_mm is still
// attempted and reported in telemetry (null while the sensor is down).
// +-5 g or 3% of the 192 g reference weight, whichever is larger (3% wins):
// a calibrated HX711 load cell settles within 1-2 g, so this band leaves
// room for cable drag/seating without letting real missing mass through.
constexpr float WEIGHT_STABILITY_TOLERANCE_G = 5.76F;
// Measured from two esp32dev_all_sensors_test captures on this station: INA219
// current held within roughly a 0.5 mA band sample-to-sample. ~2x margin.
constexpr float CURRENT_STABILITY_TOLERANCE_MA = 1.0F;
// MLX90614 datasheet accuracy is +-0.5 degC and its 35-degree FOV picks up
// background heat; a tolerance tighter than this would trigger false flags.
constexpr float SURFACE_TEMP_STABILITY_TOLERANCE_C = 2.0F;
constexpr float TEMP_RISE_STABILITY_TOLERANCE_C = 2.0F;

constexpr int SERVO_REFURBISH_ANGLE = 30;
constexpr int SERVO_RECYCLE_ANGLE = 90;
constexpr int SERVO_DISPOSE_ANGLE = 150;

constexpr char STATION_ID[] = "regrade-station-001";
constexpr char MQTT_TOPIC[] = "regrade/regrade-station-001/diagnostics";
constexpr char MQTT_COMMAND_TOPIC[] = "regrade/regrade-station-001/command";

// Used only by exhibit_demo_temperature.cpp. Keeps the exhibit demo's real
// MLX90614 reading on a station id distinct from STATION_ID above, matching
// the "<STATION_ID>-demo" suffix the dashboard's resolveStationId() appends
// for demo-mode telemetry (dashboard/lib/settings.ts). Update both if
// STATION_ID ever changes.
constexpr char DEMO_STATION_ID[] = "regrade-station-001-demo";
constexpr char DEMO_MQTT_TOPIC[] = "regrade/regrade-station-001-demo/diagnostics";
constexpr char DEMO_MQTT_COMMAND_TOPIC[] = "regrade/regrade-station-001-demo/command";

// --- Grading thresholds ---------------------------------------------------
// GRADING_RULES_APPROVED gates grading entirely: loadThresholds() in main.cpp
// refuses to treat this rule set as valid unless the flag is true and every
// value below is non-zero, so a zeroed/unapproved rule set can never grade a
// real device against meaningless thresholds. Approved below for the single
// 192 g reference phone this station is currently calibrated against. This
// rule set does not vary by device model; per-model thresholds would need a
// device-identification input the firmware does not currently have.
//
// Current-based grading (zero-current / overcurrent) is intentionally not
// part of this rule set: it would require an independently reviewed,
// current-limited test fixture to apply a real charge/load stimulus to the
// device (see circuit/README.md), which does not exist yet. current_ma is
// still measured and reported in telemetry; it just does not gate a grade.
//
// Thickness-based grading (swelling) is likewise excluded: the ToF sensor's
// I2C peripheral is confirmed faulty on this unit (see the stability-
// tolerance comment above), so there is no real thickness reading to grade
// against. Re-add a swelling check once a working ToF sensor is installed.
constexpr bool GRADING_RULES_APPROVED = true;
// Reference phone weighs 192 g; floored by the same +-5g/3% margin used for
// WEIGHT_STABILITY_TOLERANCE_G above (192 - 5.76), so normal seating/cable
// noise within that band never reads as missing mass on its own.
constexpr float GRADING_MINIMUM_WEIGHT_G = 186.2F;  // below this mass: missing/removed mass
constexpr float GRADING_TEMPERATURE_RISE_C = 15.0F; // at/above this: thermal hazard
}  // namespace config
