# Deploy Taskflow to Kubernetes
Write-Host "=== 1. Building Docker Images ===" -ForegroundColor Cyan
Write-Host "Building Server image: taskflow-server:latest..."
docker build -t taskflow-server:latest ./server

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build server image!"
    exit 1
}

Write-Host "Building Client image: taskflow-client:latest..."
docker build -t taskflow-client:latest ./client

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build client image!"
    exit 1
}

Write-Host "=== 2. Applying Kubernetes Manifests ===" -ForegroundColor Cyan
kubectl apply -k k8s/

Write-Host "=== 3. Checking Deployment Status ===" -ForegroundColor Cyan
kubectl rollout status deployment/taskflow-server -n taskflow
kubectl rollout status deployment/taskflow-client -n taskflow

Write-Host "`n=== Deployment Completed Successfully! ===" -ForegroundColor Green
Write-Host "Get Pods:    kubectl get pods -n taskflow"
Write-Host "Get Services: kubectl get svc -n taskflow"
Write-Host "Access Client via NodePort: http://localhost:30080 (or your cluster node IP:30080)"
