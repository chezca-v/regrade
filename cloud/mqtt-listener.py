#!/usr/bin/env python3
"""Log ReGrade diagnostic JSON messages received over MQTT."""

from __future__ import annotations

import json
import logging
import os
import signal
import ssl
import sys
from pathlib import Path
from typing import Any

import paho.mqtt.client as mqtt


LOGGER = logging.getLogger("regrade.mqtt")


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean value")


def _on_connect(
    client: mqtt.Client,
    userdata: Any,
    flags: mqtt.ConnectFlags,
    reason_code: mqtt.ReasonCode,
    properties: mqtt.Properties | None,
) -> None:
    del userdata, flags, properties
    if reason_code.is_failure:
        LOGGER.error("MQTT connection refused: %s", reason_code)
        return

    topic = os.getenv("MQTT_TOPIC", "regrade/+/diagnostics")
    result, _ = client.subscribe(topic, qos=1)
    if result != mqtt.MQTT_ERR_SUCCESS:
        LOGGER.error("Failed to subscribe to %s (result=%s)", topic, result)
        return
    LOGGER.info("Connected; subscribed to %s", topic)


def _on_message(
    client: mqtt.Client,
    userdata: Any,
    message: mqtt.MQTTMessage,
) -> None:
    del client, userdata
    try:
        payload = json.loads(message.payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        LOGGER.warning("Ignoring invalid JSON on %s: %s", message.topic, error)
        return

    if not isinstance(payload, dict):
        LOGGER.warning("Ignoring non-object JSON on %s", message.topic)
        return

    LOGGER.info(
        "Diagnostic received topic=%s payload=%s",
        message.topic,
        json.dumps(payload, separators=(",", ":"), sort_keys=True),
    )


def create_client() -> mqtt.Client:
    host = os.getenv("MQTT_HOST", "localhost").strip()
    if not host:
        raise ValueError("MQTT_HOST must not be empty")

    client_id = os.getenv("MQTT_CLIENT_ID", "regrade-mqtt-listener")
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id=client_id,
        protocol=mqtt.MQTTv311,
    )

    username = os.getenv("MQTT_USERNAME")
    password = os.getenv("MQTT_PASSWORD")
    if username:
        client.username_pw_set(username, password)
    elif password:
        raise ValueError("MQTT_PASSWORD requires MQTT_USERNAME")

    if _env_bool("MQTT_TLS", False):
        ca_file = os.getenv("MQTT_CA_CERT")
        if ca_file:
            client.tls_set(
                ca_certs=str(Path(ca_file).expanduser()),
                tls_version=ssl.PROTOCOL_TLS_CLIENT,
            )
        else:
            client.tls_set(tls_version=ssl.PROTOCOL_TLS_CLIENT)
        client.tls_insecure_set(False)

    client.on_connect = _on_connect
    client.on_message = _on_message
    return client


def main() -> int:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    try:
        host = os.getenv("MQTT_HOST", "localhost").strip()
        port = int(os.getenv("MQTT_PORT", "1883"))
        keepalive = int(os.getenv("MQTT_KEEPALIVE", "60"))
        client = create_client()
        client.connect(host, port, keepalive)
    except (OSError, ValueError) as error:
        LOGGER.error("Unable to start MQTT listener: %s", error)
        return 1

    stopping = False

    def stop_listener(_signum: int, _frame: Any) -> None:
        nonlocal stopping
        stopping = True
        client.disconnect()

    signal.signal(signal.SIGINT, stop_listener)
    signal.signal(signal.SIGTERM, stop_listener)

    try:
        client.loop_forever(retry_first_connection=True)
    except KeyboardInterrupt:
        stop_listener(signal.SIGINT, None)
    finally:
        if not stopping:
            client.disconnect()

    return 0


if __name__ == "__main__":
    sys.exit(main())
