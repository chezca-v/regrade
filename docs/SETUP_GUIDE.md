# ReGrade setup guide

This guide takes a new operator from a repository clone to live ESP32 sensor
reports on the local dashboard and a Vercel deployment. It uses Windows
PowerShell commands; macOS/Linux users can adapt the shell commands.

## How the pieces connect

```text
ESP32 sensors -> MQTT broker -> Python listener -> Supabase -> dashboard
                                                       ^          ^
                                                       |          |
                                                localhost       Vercel
```

The ESP32 and Python listener send reports to the broker. The listener must be
running on a computer that can reach the broker and Supabase. Both the local
website and Vercel read the same Supabase table, so both show new reports after
the listener saves them. Vercel does not connect directly to the local broker.

## 1. Install tools and get the project

Install Git, Docker Desktop, Python 3.10+, Node.js (20.19+ or 22.13+), and
PlatformIO (the VS Code PlatformIO IDE extension is convenient on Windows).
Connect the ESP32 by USB and install its USB serial driver if Windows does not
show a serial port.

In PowerShell:

```powershell
git clone https://github.com/chezca-v/regrade.git
cd regrade
npm ci
```

Run PlatformIO commands in the PlatformIO terminal or a terminal where the
`pio` command is available. If PowerShell says `pio` is not recognized, open
the project in VS Code, install the PlatformIO IDE extension, and use its
PlatformIO terminal.

## 2. Create and prepare Supabase

1. Create a Supabase project and save its project URL, project reference, and
   publishable key. Keep the database password and secret/service-role key
   private.
2. From the repository root, link the CLI to the project and apply the
   migrations:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

   Review the SQL under `supabase/migrations/` before applying it. The
   migrations create `station_telemetry` and allow public read-only access to
   that telemetry for the open dashboard. Ingestion remains restricted to the
   listener's server-side secret key. Do not put personal or confidential data
   in public telemetry.

3. If `db push` says `station_telemetry` already exists, stop and inspect the
   linked project's migration history and table/policies first. Do not drop the
   table or blindly rerun its `CREATE TABLE`. A database can contain the table
   even if the CLI migration history does not record the migration.
4. In Supabase **Project Settings / API** (or **Connect**), copy the project URL
   and publishable key. Do not use the secret key in a browser variable.

If a Supabase secret/service-role key has been exposed in a chat, screenshot,
repository, or terminal transcript, revoke it and create a replacement before
using the listener.

## 3. Configure the website

Create `dashboard/.env.local` from the template:

```powershell
Copy-Item dashboard/.env.example dashboard/.env.local
notepad dashboard/.env.local
```

Set these values using the same Supabase project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Start the site from the dashboard folder:

```powershell
cd dashboard
npm ci
npm run dev
```

Open <http://localhost:3000/diagnostics>. There is no sign-in screen anywhere
in the dashboard; every visitor gets a silent anonymous Supabase Auth session
automatically (requires "Allow anonymous sign-ins" enabled on the Supabase
project, and `enable_anonymous_sign_ins = true` in `supabase/config.toml` for
local dev). The page will say that no reports have arrived until telemetry is
saved. Leave this terminal running. Stop it with `Ctrl+C`.

## 4. Start a development MQTT broker

The simplest prototype setup is a broker on the same computer as the listener.
The repository has been used with HiveMQ in Docker. Start Docker Desktop, then
run this from PowerShell (the backtick is PowerShell's line continuation):

```powershell
docker run -d --name hivemq -p 8080:8080 -p 1883:1883 hivemq/hivemq4:latest
```

If a container named `hivemq` already exists, start it instead:

```powershell
docker start hivemq
```

Check that it is running with `docker ps`. The firmware on a local plain MQTT
connection uses port `1883`. The Python listener on the same PC connects to
`localhost:1883`. A broker configured without authentication/encryption is for
trusted development networks only; do not expose port 1883 to the internet.
For a remote broker, configure its TLS endpoint, username/password if required,
and trusted CA certificate instead.

## 5. Configure the MQTT listener and Supabase ingestion

From the repository root, create the Python environment and install its
dependency:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r cloud/requirements.txt
```

In the same PowerShell window, set the broker and Supabase settings. Enter the
new Supabase secret key only at the hidden prompt; never paste it into a
command, source file, or `NEXT_PUBLIC_` variable.

```powershell
$env:MQTT_HOST = "localhost"
$env:MQTT_PORT = "1883"
$env:MQTT_TOPIC = "regrade/+/diagnostics"
$env:MQTT_TLS = "false"
$env:MQTT_CLIENT_ID = "regrade-mqtt-listener-CHANGE-ME"
$env:SUPABASE_URL = Read-Host "Enter your Supabase project URL"
$secureKey = Read-Host "Enter your replacement Supabase secret key" -AsSecureString
$env:SUPABASE_SERVICE_ROLE_KEY = [System.Net.NetworkCredential]::new("", $secureKey).Password
py cloud/mqtt-listener.py
```

Replace `CHANGE-ME` with a unique listener name if multiple listeners share a
broker. Leave this process running. On success it logs:

```text
Connected; subscribed to regrade/+/diagnostics
```

When a station report arrives, expect `Diagnostic received` and then
`Persisted telemetry`. If it says persistence is disabled, the Supabase
variables were not set in this same PowerShell process. If persistence fails,
check the project URL, replacement key, migration status, and listener error.

For a TLS broker, set `MQTT_TLS=true`, its host/port and credentials, and
`MQTT_CA_CERT` as appropriate. The listener verifies TLS certificates.

## 6. Calibrate the station

Do this for each assembled station and whenever the sensor mounting changes.
Use the actual wiring described in `circuit/`; do not use this prototype for
safety, resale, or disposal decisions.

### HX711 load cell

1. In `firmware`, upload the calibration program:

   ```powershell
   cd firmware
   pio run -e esp32dev_hx711_calibrate_test --target upload
   pio device monitor -b 115200
   ```

2. Keep the platform empty during tare. Place a known reference mass on it.
3. Type the mass in grams in the serial monitor and press Enter. For example,
   type `192` for a verified 192 g reference.
4. Remove the reference mass. Check that the display is close to zero, and put
   the known mass back to check that the reading is close to its true mass. Fix
   mechanical binding, wiring, and platform movement before accepting a poor
   or unstable calibration.
5. Copy the reported `counts/gram` number, including its sign, into
   `HX711_COUNTS_PER_GRAM` in `firmware/include/regrade_config.h`. For example,
   `-40.6562` becomes `-40.6562F`.

### VL53L0X time-of-flight distance

The ToF sensor measures the gap from its fixed mount to the top of an object.
The firmware estimates thickness as empty-bed distance minus object distance.
The empty-bed calibration is a mechanical reference; detecting swelling also
requires a validated normal-thickness baseline for each device model, which is
not currently implemented as a grading rule.

1. Upload and open the ToF test monitor:

   ```powershell
   pio run -e esp32dev_vl53l0x_test --target upload
   pio device monitor -b 115200
   ```

2. Leave the bed empty and read several stable `distance_mm` values. Confirm
   the sensor is mounted perpendicular to the bed and the reading is repeatable.
3. Set `TOF_EMPTY_BED_DISTANCE_MM` in `firmware/include/regrade_config.h` to
   the stable empty-bed distance in millimeters (for example `251.2F`).
4. Place a flat object of known thickness and confirm the measured difference
   is plausible. Recalibrate if the sensor mount or bed height changes.

The stored HX711 result in the published repository may be the default zero;
each operator must enter their own measured calibration value. Do not copy a
reference value from another station without checking it.

## 7. Configure Wi-Fi and broker settings for the ESP32

From the repository root, make the ignored local secrets file:

```powershell
Copy-Item firmware/include/secrets.example.h firmware/include/secrets.h
notepad firmware/include/secrets.h
```

For the local Docker broker, fill it like this:

```cpp
#define WIFI_SSID "YOUR_2_4_GHZ_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define MQTT_HOST "YOUR_PC_LAN_IPV4"
#define MQTT_PORT 1883
#define MQTT_USERNAME ""
#define MQTT_PASSWORD ""
#define MQTT_TLS_ENABLED 0
#define MQTT_CA_CERT ""
```

Find the PC's Wi-Fi IPv4 address with `ipconfig`; use its **Wireless LAN
adapter Wi-Fi IPv4 Address**, such as `192.168.1.25`, not `localhost` and not
the Docker container address. The ESP32 and PC must be on the same trusted
network. Allow the broker through Windows Firewall on the private network if
the ESP32 cannot connect. Plain MQTT sends data without encryption, so use it
only on a trusted development LAN. For a hosted broker, use its TLS port,
credentials and verified CA certificate, and leave `MQTT_TLS_ENABLED` set to
`1`.

The `secrets.h` file is ignored by Git. Never commit it or share its contents.
The topic is set by the firmware as `regrade/regrade-station-001/diagnostics`.

## 8. Build and upload the main firmware

Stop the test firmware's serial monitor, then from `firmware`:

```powershell
pio run -e esp32dev
pio run -e esp32dev --target upload
pio device monitor -b 115200
```

Boot with the load-cell platform empty so the main firmware can tare it. Watch
for Wi-Fi/MQTT or sensor errors in the serial monitor. If upload cannot find a
port, check the USB cable, device driver, and the selected PlatformIO upload
port.

## 9. Send a reading and verify the full path

1. Repair any sensor initialization errors first. The station needs all sensors
   and their calibration to acquire a complete set of readings.
2. Stability approval is fail-closed. The five `*_STABILITY_TOLERANCE_*`
   values in `firmware/include/regrade_config.h` default to zero. Measure
   repeatability on the assembled station and obtain reviewed maximum ranges
   for weight, thickness, current, surface temperature, and temperature rise
   before setting them. Do not guess values. Until every tolerance is a
   validated positive value, the station will not mark a result stable or
   expose raw readings in the dashboard.
3. Confirm Docker, the Python listener, and the dashboard are running. The
   listener must log `Connected; subscribed to
   regrade/+/diagnostics`.
4. Open <http://localhost:3000/diagnostics>, choose **New diagnostic**, and
   select a saved phone reference. Add a missing reference in **Phone
   references** first.
5. Place one closed phone on the station. If you're signed in, continuing past
   **New diagnostic** queues a `station_command` row that the listener relays
   to the station's MQTT command topic to start scanning; this is best-effort
   (it depends on the listener and broker being reachable), so press the
   physical **START** button if scanning doesn't begin within a few seconds,
   or if you're not signed in. Firmware checks three consecutive sensor
   samples and ends the scan within 15 seconds; instability or uncalibrated
   tolerances produce no stable result.
6. On a stable report, review the readings and choose an operator disposition.
   **Save diagnosis** requires an authenticated dashboard user and writes the
   phone reference and disposition to `operator_diagnosis`. It then appears in
   Overview, Inventory, and Reports for that operator. These are operator
   reviews, not automated safety or recycling classifications.
7. The ESP32 serial monitor should report `Diagnostic report published`. The
   Python terminal should show `Diagnostic received` followed by
   `Persisted telemetry station=... session=...`. Confirm the row in Supabase
   **Table Editor** if needed. Do not insert test data with a service key in
   browser code.

MQTT messages are not saved for later by this setup. The listener must be
connected when the ESP32 publishes, or that report will be missed. Re-publish
by running another scan after fixing a disconnected listener or broker.

## 10. Deploy the dashboard to Vercel

1. Push the repository to a GitHub repository that Vercel can access.
2. Import it in Vercel. Set the **Root Directory** to `dashboard` and use the
   Next.js framework preset. The project build command is `npm run build`.
3. In Vercel project **Settings → Environment Variables**, set for Production
   (and Preview if needed):

   ```text
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

   These must point to the same Supabase project as the listener. Do not add
   `SUPABASE_SERVICE_ROLE_KEY` to Vercel; the website only reads public
   telemetry and the listener performs writes.
4. Deploy, then open `https://YOUR-VERCEL-DOMAIN/diagnostics`.
5. Publish another scan while the listener is running and refresh the Vercel
   page. The saved report should also appear there.

The public dashboard reads Supabase over the internet. To receive new readings,
the broker and listener still need to run and be reachable by the ESP32. Keep
the listener computer awake and online, or deploy the listener and broker to a
secure, always-on host with appropriate MQTT TLS and network settings.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `pio` is not recognized | Use the VS Code PlatformIO terminal or install PlatformIO Core. |
| Listener connection refused | Ensure Docker is running and `docker ps` shows the broker exposing port 1883. |
| Listener connects but never logs a report | Confirm ESP32 uses the PC's LAN IP, same Wi-Fi, correct topic, and that a scan was started. |
| ESP32 cannot connect to MQTT | Check Wi-Fi credentials, broker IP/port, Windows Firewall, and TLS mode match. |
| `LCD initialization failed` or `VL53L0X initialization failed` | Power off and check I²C power, shared ground, SDA=GPIO21, SCL=GPIO22, and sensor-module compatibility. Run the all-sensors I²C test before scanning. |
| `Supabase persistence disabled` | Set both Supabase variables in the same terminal that runs the listener. |
| Supabase returns an error | Confirm the telemetry migrations applied to the linked project and use a current secret key. |
| Local page says no reports | Check listener logs for `Persisted telemetry`, confirm both site keys point to the same project, then refresh. |
| Vercel page says no reports | Check Vercel environment variables, redeploy after changing them, and confirm telemetry is public-readable in Supabase. |
| Weight or thickness is absent | Check sensor wiring and readiness, then confirm station calibration values in `regrade_config.h`. |

## Current prototype limits

The dashboard displays readings only when firmware confirms stability. All
five sensor stability tolerances currently default to zero, so stable results
remain unavailable until the assembled station is repaired, calibrated, and
given reviewed tolerance values. The 15-second timeout bounds acquisition; it
does not guarantee that a reading will stabilize. Firmware grading remains
disabled with `GRADING_RULES_APPROVED = false`; grading thresholds and sorter
actuation must not be enabled without independent review and calibration. The
electrical test fixture remains unreviewed, and external readings do not
diagnose battery cells or establish that a phone is safe.
