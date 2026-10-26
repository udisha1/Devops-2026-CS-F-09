# Taskflow App - Docker & Kubernetes Deployment Guide

This guide provides complete instructions for containerizing, monitoring, and deploying **Taskflow App** using **Docker**, **Kubernetes**, **Prometheus**, and **Grafana**.

---

## Architecture Overview

```
                      +-----------------------------+
                      |         User Browser        |
                      +--------------+--------------+
                                     |
                       NodePort:30080 or Ingress (/)
                                     v
                 +---------------------------------------+
                 |    Frontend Pod (taskflow-client)     |
                 |  - React + Vite built static assets   |
                 |  - Nginx Alpine web server            |
                 |  - Reverse-proxies /api -> server     |
                 +-------------------+-------------------+
                                     |
                                     | ClusterIP:5000 (/api)
                                     v
                 +---------------------------------------+
                 |     Backend Pod (taskflow-server)     |  <---+
                 |  - Express / Node.js API              |      |
                 |  - JWT Auth & Gemini AI endpoints     |      | Scrapes /metrics
                 |  - Prometheus metrics instrumentation |      |
                 +-------------------+-------------------+      |
                                     |                          |
                   +-----------------+-----------------+        |
                   |                                   |        |
                   v                                   v        |
+------------------------------------+  +--------------------+  |
| In-Cluster MongoDB (Optional)      |  | MongoDB Atlas      |  |
| Service: taskflow-mongodb:27017    |  | mongodb+srv://...  |  |
+------------------------------------+  +--------------------+  |
                                                                |
        +-------------------------------------------------------+
        |
        v
+-----------------------+           +-----------------------+
|  Prometheus Server    | --------> |   Grafana Dashboards  |
|  Port: 9090 / 30090   |           |   Port: 3001 / 30001  |
+-----------------------+           +-----------------------+
```

---

## 1. Prerequisites

1. **Docker Desktop**:
   - Ensure Docker Desktop is installed and running.
   - Verify with `docker --version`.
2. **Kubernetes Cluster**:
   - **Docker Desktop**: Settings -> **Kubernetes** -> **Enable Kubernetes** -> **Apply & restart**.
   - **Minikube**: Run `minikube start`.
   - **Cloud**: Configure your context (`kubectl config current-context`).

---

## 2. Local Multi-Container Testing with Monitoring

Start the entire application, database, and monitoring stack with Docker Compose:

```powershell
docker compose up -d
```

### Accessible Services:

| Service | Accessible URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Main React App |
| **Backend API Health** | [http://localhost:5001/healthz](http://localhost:5001/healthz) | Returns health & DB status |
| **Backend Metrics** | [http://localhost:5001/metrics](http://localhost:5001/metrics) | Raw Prometheus metrics |
| **Prometheus Dashboard** | [http://localhost:9090](http://localhost:9090) | Targets & metric queries |
| **Grafana Dashboards** | [http://localhost:3001](http://localhost:3001) | **User:** `admin`, **Password:** `admin` |

> [!TIP]
> Grafana automatically loads the **Taskflow Overview** dashboard (`http://localhost:3001/d/taskflow-overview/taskflow-overview`) with charts for HTTP Request Rate, p95/p50 Latencies, Process CPU & Memory usage, and MongoDB status!

To shut down:
```powershell
docker compose down
```

---

## 3. Kubernetes Deployment (Step-by-Step)

### Step 3.1: Build Docker Images

```powershell
# Build Backend Server Image (with prom-client)
docker build -t taskflow-server:latest ./server

# Build Frontend Client Image
docker build -t taskflow-client:latest ./client
```

---

### Step 3.2: Configure Secrets & Database

Review [k8s/secret.yaml](k8s/secret.yaml):
- Configure your MongoDB connection string, JWT Secret, and Gemini API key.
- `k8s/secret.yaml` is added to `.gitignore` so your private credentials are never pushed to GitHub.

---

### Step 3.3: Deploy to Kubernetes

Deploy all resources (Application + Prometheus + Grafana) with a single command:

```powershell
kubectl apply -k k8s/
```

Or run the helper script:
```powershell
.\deploy-k8s.ps1
```

---

### Step 3.4: Verify Deployment

```powershell
# Check pods in the 'taskflow' namespace
kubectl get pods -n taskflow

# Check services
kubectl get svc -n taskflow
```

Example expected output:
```
NAME                                   READY   STATUS    RESTARTS   AGE
taskflow-client-7f888f4b5-x2n8m        1/1     Running   0          1m
taskflow-client-7f888f4b5-z9jlp        1/1     Running   0          1m
taskflow-server-675cf88db-4v8m2        1/1     Running   0          1m
taskflow-server-675cf88db-lw9k2        1/1     Running   0          1m
taskflow-prometheus-6bd5c4f8d-4b82x    1/1     Running   0          1m
taskflow-grafana-79d5f78b9-k82mx       1/1     Running   0          1m
```

---

### Step 3.5: Access Kubernetes Services

| Service | NodePort | Browser URL |
| :--- | :--- | :--- |
| **Frontend** | `30080` | [http://localhost:30080](http://localhost:30080) |
| **Prometheus** | `30090` | [http://localhost:30090](http://localhost:30090) |
| **Grafana** | `30001` | [http://localhost:30001](http://localhost:30001) |

---

## 4. Useful Operations & Troubleshooting

### View Metrics in Real Time
```powershell
# Query total HTTP requests
curl http://localhost:5001/metrics
```

### View Pod Logs
```powershell
kubectl logs -l app=taskflow-server -n taskflow -f
kubectl logs -l app=taskflow-prometheus -n taskflow -f
kubectl logs -l app=taskflow-grafana -n taskflow -f
```

### Teardown
```powershell
kubectl delete -k k8s/
```
