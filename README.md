# 🚀 Taskflow - AI-Powered Task & Productivity Platform

Taskflow is a modern, full-stack productivity web application featuring AI-powered smart task parsing, Eisenhower Matrix prioritization, interactive Kanban workflows, a Feynman Technique learning partner, and full containerized observability with Prometheus and Grafana.

---

## 🌟 Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Three.js, Nginx
* **Backend:** Node.js, Express, Mongoose, JWT Authentication, Google Gemini AI (`@google/generative-ai`)
* **Database:** MongoDB (Local container or MongoDB Atlas Cloud)
* **DevOps & Containerization:** Docker, Docker Compose, Kubernetes (K8s manifests & Kustomize)
* **Observability & Monitoring:** Prometheus (`prom-client`), Grafana (pre-configured dashboards)

---

## 🏗️ System Architecture

```
                       +-----------------------------+
                       |         User Browser        |
                       +--------------+--------------+
                                      |
                      Port 3000 / NodePort 30080 / Ingress
                                      v
                  +---------------------------------------+
                  |     Frontend App (taskflow-client)    |
                  |   - React + Vite SPA (dist)           |
                  |   - Nginx Alpine Reverse Proxy        |
                  |   - Proxies /api/* -> Backend Server  |
                  +-------------------+-------------------+
                                      |
                                      | /api/* (Port 5000)
                                      v
                  +---------------------------------------+
                  |     Backend API (taskflow-server)     | <---+
                  |   - Express REST API                  |     |
                  |   - JWT Auth & Gemini AI Integration  |     | Scrapes /metrics
                  |   - Prometheus Instrumentation        |     | (Every 5s)
                  +-------------------+-------------------+     |
                                      |                         |
                    +-----------------+-----------------+       |
                    |                                   |       |
                    v                                   v       |
 +------------------------------------+  +--------------------+ |
 | In-Cluster / Local MongoDB         |  | MongoDB Atlas      | |
 | mongodb://taskflow-mongodb:27017   |  | mongodb+srv://...  | |
 +------------------------------------+  +--------------------+ |
                                                                |
         +------------------------------------------------------+
         |
         v
 +-----------------------+           +-----------------------+
 |  Prometheus Server    | --------> |   Grafana Dashboards  |
 |  Port: 9090 / 30090   |           |   Port: 3001 / 30001  |
 +-----------------------+           +-----------------------+
```

---

## 📋 Prerequisites

Before getting started, make sure you have the following installed on your system:

1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (version 20+ with Docker Compose v2)
2. **Node.js** (v18 or v20+) & **npm** *(optional, only needed for local development without Docker)*
3. **kubectl** *(optional, only needed if deploying to Kubernetes)*

---

## 🚀 How to Run the Project

You can run Taskflow using any of the three methods below:

### Method 1: Docker Compose (Recommended - Quickest & Easiest)

This spins up the entire stack (**Client + Server + MongoDB + Prometheus + Grafana**) with a single command.

#### Step 1: Ensure Docker Desktop is running
Open Docker Desktop on your machine and confirm it is running (green status).

#### Step 2: Open terminal in project root
```powershell
cd D:\Taskflow-app
```

#### Step 3: Start all services
```powershell
docker compose up -d
```
*(Use `docker compose up` without `-d` if you want to view live logs directly in your terminal).*

#### Step 4: Access the services

| Application | URL | Default Credentials / Info |
| :--- | :--- | :--- |
| **Taskflow Web App** | **[http://localhost:3000](http://localhost:3000)** | Main user interface |
| **Backend API Health** | **[http://localhost:5001/healthz](http://localhost:5001/healthz)** | `{"status":"healthy","database":"connected"}` |
| **Prometheus Metrics** | **[http://localhost:5001/metrics](http://localhost:5001/metrics)** | Live backend metric stream |
| **Prometheus UI** | **[http://localhost:9090](http://localhost:9090)** | Query metrics & check targets |
| **Grafana Dashboard** | **[http://localhost:3001](http://localhost:3001)** | **Username:** `admin`<br>**Password:** `admin` |

> [!TIP]
> **Viewing Live Grafana Dashboards:**
> 1. Open `http://localhost:3001` and log in with `admin` / `admin`.
> 2. Go to **Dashboards** -> **Taskflow** -> **Taskflow Overview**.
> 3. Enjoy live graphs of HTTP request rates, p95/p50 latency, active connections, and Node.js CPU & Memory!

#### Useful Docker Compose Commands:
```powershell
# View logs of all services
docker compose logs -f

# View logs of backend server only
docker compose logs -f taskflow-server

# Restart services
docker compose restart

# Stop and remove all containers
docker compose down
```

---

### Method 2: Kubernetes Deployment (K8s)

Deploy the multi-container application and monitoring stack to Kubernetes (Docker Desktop Kubernetes, Minikube, Kind, or Cloud EKS/GKE/AKS).

#### Step 1: Enable Kubernetes
* **In Docker Desktop:** Click **Settings (Gear icon)** -> **Kubernetes** -> Check **Enable Kubernetes** -> Click **Apply & restart**.
* **Or with Minikube:** Run `minikube start`.

#### Step 2: Build the Docker images
```powershell
cd D:\Taskflow-app

# Build Backend Image
docker build -t taskflow-server:latest ./server

# Build Frontend Image
docker build -t taskflow-client:latest ./client
```

#### Step 3: Deploy to Kubernetes
Deploy all manifests in the `k8s/` folder:

```powershell
kubectl apply -k k8s/
```
*(Or run the included automation script: `.\deploy-k8s.ps1`)*

#### Step 4: Verify the deployment
```powershell
# Check pods
kubectl get pods -n taskflow

# Check services
kubectl get svc -n taskflow
```

Expected output:
```text
NAME                                   READY   STATUS    RESTARTS   AGE
taskflow-client-xxxxxxxxx-xxxxx        1/1     Running   0          45s
taskflow-client-xxxxxxxxx-xxxxx        1/1     Running   0          45s
taskflow-server-xxxxxxxxx-xxxxx        1/1     Running   0          45s
taskflow-server-xxxxxxxxx-xxxxx        1/1     Running   0          45s
taskflow-prometheus-xxxxxxxxx-xxxxx    1/1     Running   0          45s
taskflow-grafana-xxxxxxxxx-xxxxx       1/1     Running   0          45s
```

#### Step 5: Access your Kubernetes services (via NodePort)

| Service | NodePort | Browser URL |
| :--- | :--- | :--- |
| **Frontend Web App** | `30080` | **[http://localhost:30080](http://localhost:30080)** |
| **Grafana Monitoring** | `30001` | **[http://localhost:30001](http://localhost:30001)** |
| **Prometheus UI** | `30090` | **[http://localhost:30090](http://localhost:30090)** |

#### To Teardown Kubernetes Deployment:
```powershell
kubectl delete -k k8s/
```

---

### Method 3: Local Development (Without Docker)

If you prefer to run the client and server directly with Node.js on your local machine:

#### Step 1: Install Dependencies
```powershell
# Install server dependencies
cd D:\Taskflow-app\server
npm install

# Install client dependencies
cd D:\Taskflow-app\client
npm install
```

#### Step 2: Configure Environment Variables
Ensure `server/.env` exists with your credentials:
```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.txwcyic.mongodb.net/taskflow?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_key_here
```

#### Step 3: Run the Backend Server
In terminal 1:
```powershell
cd D:\Taskflow-app\server
npm run dev
```
Backend will start listening on `http://localhost:5001`.

#### Step 4: Run the Frontend Client
In terminal 2:
```powershell
cd D:\Taskflow-app\client
npm run dev
```
Frontend will be accessible at `http://localhost:5173`. Vite automatically proxies `/api` calls to the backend on port `5001`.

---

## 📂 Project Directory Structure

```text
Taskflow-app/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # React components (Kanban, Matrix, etc.)
│   │   ├── config/              # Centralized API configuration (api.js)
│   │   ├── App.jsx              # Main React application
│   │   └── main.jsx
│   ├── default.conf.template    # Nginx reverse proxy configuration
│   ├── Dockerfile               # Multi-stage production frontend Dockerfile
│   └── vite.config.js           # Vite build & local dev proxy setup
│
├── server/                      # Node.js + Express backend
│   ├── middleware/              # Auth & Prometheus metrics middleware
│   │   ├── auth.js
│   │   └── metrics.js           # prom-client metrics instrumentation
│   ├── models/                  # Mongoose data models (Task, User, Feynman)
│   ├── routes/                  # Express API routes
│   ├── .env                     # Local environment secrets (gitignored)
│   ├── Dockerfile               # Hardened Node.js Alpine Dockerfile
│   └── server.js                # Express entrypoint & healthcheck (/healthz, /metrics)
│
├── k8s/                         # Kubernetes manifests
│   ├── namespace.yaml           # Dedicated 'taskflow' namespace
│   ├── configmap.yaml           # App configuration
│   ├── secret.example.yaml      # Template for K8s secrets
│   ├── server.yaml              # Server Deployment & ClusterIP Service
│   ├── client.yaml              # Client Deployment & NodePort Service (30080)
│   ├── mongodb.yaml             # In-cluster MongoDB with PersistentVolumeClaim
│   ├── ingress.yaml             # Ingress routing rules
│   ├── kustomization.yaml       # Single-command deployment bundle
│   └── monitoring/              # Kubernetes monitoring manifests
│       ├── prometheus.yaml      # Prometheus Deployment & Service (30090)
│       └── grafana.yaml         # Grafana Deployment & Service (30001)
│
├── monitoring/                  # Docker Compose monitoring setup
│   ├── prometheus/
│   │   └── prometheus.yml       # Prometheus scrape configuration
│   └── grafana/
│       ├── dashboards/          # Pre-configured Grafana dashboard JSON
│       │   └── taskflow-overview.json
│       └── provisioning/        # Auto-provisioning datasources & dashboards
│           ├── dashboards/
│           └── datasources/
│
├── docker-compose.yml           # Multi-container orchestration (5 services)
├── deploy-k8s.ps1               # Automated deployment script for PowerShell
├── deploy-k8s.sh                # Automated deployment script for Bash
├── DEPLOYMENT.md                # Comprehensive deployment documentation
└── README.md                    # Main documentation & getting started guide
```

---

## 🛠️ Common Troubleshooting

* **Port 27017 or 5001 already in use:**
  If you get `Bind for 0.0.0.0:27017 failed: port is already allocated`, make sure old containers or local MongoDB instances are stopped:
  ```powershell
  docker stop $(docker ps -q)
  ```
* **GitHub Push Protection triggered:**
  Never commit `k8s/secret.yaml` or `.env` files containing live GCP/Gemini keys. These files are listed in `.gitignore`. Use `k8s/secret.example.yaml` as reference.
* **Cannot connect to Docker daemon:**
  Confirm that Docker Desktop is launched and the WSL2 / Hyper-V backend is active.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
