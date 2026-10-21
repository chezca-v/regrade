#!/usr/bin/env python3
"""Log ReGrade diagnostic JSON messages received over MQTT."""

from __future__ import annotations

import json
import logging
import math
import os
import signal
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import paho.mqtt.client as mqtt


LOGGER = logging.getLogger("regrade.mqtt")


def _persist_telemetry(topic: str, payload: dict[str, Any]) -> None:
    """Upsert a validated station report using the server-only Supabase key."""
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        LOGGER.info("Supabase persistence disabled: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return

    readings = payload.get("readings")
    station_id = payload.get("station_id")
    session_id = payload.get("session_id")
    if not isinstance(readings, dict) or not isinstance(station_id, str) or not station_id:
        LOGGER.warning("Ignoring telemetry without station_id/readings on %s", topic)
        return
    if not isinstance(session_id, str) or not session_id:
        LOGGER.warning("Ignoring telemetry without session_id on %s", topic)
        return
    for key, value in readings.items():
        # Firmware includes boolean stability metadata and integer sample
        # counters alongside numeric measurements. Accept those explicit
        # metadata types while still rejecting booleans as sensor values.
        if key == "stable":
            if isinstance(value, bool):
                continue
            LOGGER.warning("Ignoring telemetry with invalid stability flag")
            return
        if key in {"stability_samples", "stability_window_ms"}:
            if (
                isinstance(value, int)
                and not isinstance(value, bool)
                and value >= 0
            ):
                continue
            LOGGER.warning("Ignoring telemetry with invalid reading %s", key)
            return
        if value is not None and (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            LOGGER.warning("Ignoring telemetry with invalid reading %s", key)
            return

    grade = payload.get("grade")
    if grade is not None and grade not in ("A", "B", "C", "D"):
        LOGGER.warning("Ignoring telemetry with invalid grade %r", grade)
        return

    health_score = payload.get("health_score")
    if health_score is not None and (
        isinstance(health_score, bool)
        or not isinstance(health_score, (int, float))
        or not math.isfinite(health_score)
        or not 0 <= health_score <= 100
    ):
        LOGGER.warning("Ignoring telemetry with invalid health_score %r", health_score)
        return

    sort_success = payload.get("sort_success")
    if sort_success is not None and not isinstance(sort_success, bool):
        LOGGER.warning("Ignoring telemetry with invalid sort_success %r", sort_success)
        return

    row = {
        "station_id": station_id,
        "session_id": session_id,
        "status": str(payload.get("status", "unknown"))[:80],
        "duration_ms": payload.get("duration_ms") if isinstance(payload.get("duration_ms"), int) and not isinstance(payload.get("duration_ms"), bool) and payload.get("duration_ms") >= 0 else None,
        "readings": readings,
        "fault": payload.get("fault") if isinstance(payload.get("fault"), str) else None,
        "grade": grade,
        "health_score": health_score,
        "sort_success": sort_success,
    }
    endpoint = f"{supabase_url}/rest/v1/station_telemetry?on_conflict=station_id%2Csession_id"
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(row, separators=(",", ":")).encode("utf-8"),
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status >= 300:
                raise RuntimeError(f"Supabase returned HTTP {response.status}")
        LOGGER.info("Persisted telemetry station=%s session=%s", station_id, session_id)
    except (OSError, urllib.error.URLError, RuntimeError) as error:
        LOGGER.error("Failed to persist telemetry: %s", error)


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
    _persist_telemetry(message.topic, payload)


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
