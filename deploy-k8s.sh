#!/usr/bin/env bash
set -e

echo "=== 1. Building Docker Images ==="
echo "Building Server image: taskflow-server:latest..."
docker build -t taskflow-server:latest ./server

echo "Building Client image: taskflow-client:latest..."
docker build -t taskflow-client:latest ./client

echo "=== 2. Applying Kubernetes Manifests ==="
kubectl apply -k k8s/

echo "=== 3. Checking Deployment Status ==="
kubectl rollout status deployment/taskflow-server -n taskflow
kubectl rollout status deployment/taskflow-client -n taskflow

echo ""
echo "=== Deployment Completed Successfully! ==="
echo "Check pods:     kubectl get pods -n taskflow"
echo "Check services: kubectl get svc -n taskflow"
echo "Access Client:  http://localhost:30080"
