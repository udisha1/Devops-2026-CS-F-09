# Taskflow App - Docker & Kubernetes Deployment Guide

This guide provides complete instructions for containerizing and deploying **Taskflow App** using **Docker** and **Kubernetes**.

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
                 |     Backend Pod (taskflow-server)     |
                 |  - Express / Node.js API              |
                 |  - JWT Auth & Gemini AI endpoints     |
                 +-------------------+-------------------+
                                     |
                   +-----------------+-----------------+
                   |                                   |
                   v                                   v
+------------------------------------+  +-------------------------------+
| In-Cluster MongoDB (Optional)      |  | MongoDB Atlas (Cloud)         |
| Service: taskflow-mongodb:27017    |  | mongodb+srv://...             |
+------------------------------------+  +-------------------------------+
```

---

## 1. Prerequisites

1. **Docker Desktop**:
   - Ensure Docker Desktop is installed and running.
   - To verify:
     ```powershell
     docker --version
     ```
2. **Kubernetes Cluster**:
   - **Option A (Simplest - Docker Desktop)**:
     - Open Docker Desktop settings (Gear icon) -> **Kubernetes** -> Check **Enable Kubernetes** -> Click **Apply & restart**.
   - **Option B (Minikube)**:
     - Run `minikube start`
   - **Option C (Cloud / Remote)**:
     - Ensure your `kubectl` context is configured (`kubectl config current-context`).

---

## 2. Quick Local Testing with Docker Compose

Before deploying to Kubernetes, you can test the entire multi-container stack locally:

```powershell
# 1. Build and start all containers (MongoDB, Server, Client)
docker compose up --build

# 2. Access the application in your browser:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5001/healthz

# 3. Stop containers when finished:
docker compose down
```

---

## 3. Kubernetes Deployment (Step-by-Step)

### Step 3.1: Build Docker Images

Build both images locally so Kubernetes can run them:

```powershell
# Build Backend Server Image
docker build -t taskflow-server:latest ./server

# Build Frontend Client Image
docker build -t taskflow-client:latest ./client
```

> **Note for Minikube users:** If using Minikube, run `minikube docker-env | Invoke-Expression` (PowerShell) or `eval $(minikube docker-env)` (Bash) before building so images are stored inside the Minikube Docker daemon.

---

### Step 3.2: Configure Secrets & Database

Review [k8s/secret.yaml](k8s/secret.yaml):
- By default, it contains your MongoDB Atlas connection string, JWT Secret, and Gemini API key.
- If you prefer to run MongoDB inside the Kubernetes cluster instead of Atlas:
  1. Open [k8s/kustomization.yaml](k8s/kustomization.yaml) and uncomment `- mongodb.yaml`.
  2. In [k8s/secret.yaml](k8s/secret.yaml), set `MONGO_URI` to `"mongodb://taskflow-mongodb:27017/taskflow"`.

---

### Step 3.3: Deploy to Kubernetes

Deploy all resources with a single command:

```powershell
# Deploy everything using Kustomize
kubectl apply -k k8s/

# Or use the provided PowerShell helper script:
.\deploy-k8s.ps1
```

Or deploy individual manifests in order:
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/server.yaml
kubectl apply -f k8s/client.yaml
# Optional:
# kubectl apply -f k8s/mongodb.yaml
# kubectl apply -f k8s/ingress.yaml
```

---

### Step 3.4: Verify Deployment

Check the status of your pods and services:

```powershell
# Check pods in the 'taskflow' namespace
kubectl get pods -n taskflow

# Check services
kubectl get svc -n taskflow
```

Example expected output:
```
NAME                               READY   STATUS    RESTARTS   AGE
taskflow-client-7f888f4b5-x2n8m    1/1     Running   0          45s
taskflow-client-7f888f4b5-z9jlp    1/1     Running   0          45s
taskflow-server-675cf88db-4v8m2    1/1     Running   0          45s
taskflow-server-675cf88db-lw9k2    1/1     Running   0          45s
```

---

### Step 3.5: Access the Application

1. **Via NodePort (Default)**:
   - The frontend service is exposed on NodePort **30080**.
   - Open your browser to: **`http://localhost:30080`**
2. **Via Port-Forwarding (Alternative)**:
   ```powershell
   kubectl port-forward svc/taskflow-client 8080:80 -n taskflow
   ```
   Open `http://localhost:8080`.
3. **Via Ingress (If Ingress Controller is installed)**:
   - Apply `k8s/ingress.yaml`:
     ```powershell
     kubectl apply -f k8s/ingress.yaml
     ```
   - Access at `http://localhost`.

---

## 4. Useful Operations & Troubleshooting

### View Pod Logs
```powershell
# Server logs
kubectl logs -l app=taskflow-server -n taskflow -f

# Client logs
kubectl logs -l app=taskflow-client -n taskflow -f
```

### Restart Deployments
```powershell
kubectl rollout restart deployment/taskflow-server -n taskflow
kubectl rollout restart deployment/taskflow-client -n taskflow
```

### Scaling Up / Down
```powershell
# Scale server to 4 replicas
kubectl scale deployment/taskflow-server --replicas=4 -n taskflow
```

### Clean Up / Teardown
```powershell
# Remove all deployed resources
kubectl delete -k k8s/
```
