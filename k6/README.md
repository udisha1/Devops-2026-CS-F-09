# TaskFlow k6 Load Testing Suite

This directory contains automated **k6** load testing scripts designed to simulate realistic user traffic against the TaskFlow backend.

## Why use k6?
Because the TaskFlow project is running in local/test environments and is not currently taking live human traffic, Grafana dashboards will appear flat or display zero requests.

Running k6 simulates concurrent Virtual Users (VUs) making API requests (Health checks, User Registration, Login, Creating Tasks, Querying Tasks). This allows:
1. **Prometheus** to capture real-time HTTP metrics, latency percentiles, error rates, and system resources.
2. **Grafana** to display dynamic live graphs, latency curves (p50/p95), and traffic spikes.

---

## Quick Start

### Method 1: Run via Docker (Zero installation required)

If your Docker stack is running (`docker compose up -d`):

```powershell
# Run the complete load test (ramp up -> sustained load -> spike -> cool down)
docker compose --profile loadtest run --rm k6

# Run a quick 45-second burst test for fast demos / screenshots
docker compose --profile loadtest run --rm k6 run /scripts/quick-burst.js
```

---

### Method 2: Run via Local k6 CLI (Windows)

1. **Install k6 on Windows**:
   ```powershell
   winget install k6 --source winget
   # or with Chocolatey:
   choco install k6
   ```

2. **Run against your local backend**:
   ```powershell
   # Run full load test against localhost:5001
   k6 run k6/load-test.js

   # Run quick burst test
   k6 run k6/quick-burst.js
   ```

   To target a custom address or port:
   ```powershell
   k6 run -e TARGET_URL=http://localhost:5001 k6/load-test.js
   ```

---

## Viewing the Results in Grafana

1. Open Grafana: [http://localhost:3001](http://localhost:3001)
2. Login with `admin` / `admin`.
3. Open the **Taskflow Overview** dashboard (`Dashboards` -> `Taskflow Overview`).
4. Set the top-right time picker to **Last 5 minutes** or **Last 15 minutes**.
5. Set the auto-refresh interval to **5s**.
6. Run the k6 script and watch the panels populate with live traffic!
