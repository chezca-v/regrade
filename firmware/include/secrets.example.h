#pragma once

// Copy this file to secrets.h and fill in local values. Do not commit secrets.h.
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define MQTT_HOST ""
#define MQTT_PORT 8883
#define MQTT_USERNAME ""
#define MQTT_PASSWORD ""

// For the local Docker broker: set this to 0 and MQTT_PORT to 1883.
// Set to 0 only for a trusted local network broker using plain MQTT (1883).
#define MQTT_TLS_ENABLED 1

// Paste the broker's trusted CA certificate as a C string. TLS verification
// remains enabled; an empty value prevents MQTT connection.
#define MQTT_CA_CERT ""
