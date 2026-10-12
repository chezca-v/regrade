#pragma once

// Copy this file to secrets.h and fill in local values. Do not commit secrets.h.
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define MQTT_HOST ""
#define MQTT_PORT 8883
#define MQTT_USERNAME ""
#define MQTT_PASSWORD ""

// Paste the broker's trusted CA certificate as a C string. TLS verification
// remains enabled; an empty value prevents MQTT connection.
#define MQTT_CA_CERT ""
