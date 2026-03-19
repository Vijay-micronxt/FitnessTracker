#!/bin/bash

# Fitness Chat - AWS Recovery Script
# This script handles AWS-specific issues like port conflicts
# Usage: ./recover-aws.sh

set -e

echo "=========================================="
echo "  Fitness Chat - AWS Recovery"
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo ""
echo "[1/7] Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo "✗ Node.js not found. Please install Node.js 18+"
  exit 1
fi
NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION detected"

echo ""
echo "[2/7] Killing ALL existing processes..."
echo "  Force killing all node/npm processes..."
pkill -9 -f "node" 2>/dev/null || true
pkill -9 -f "npm" 2>/dev/null || true
pkill -9 -f "tsx" 2>/dev/null || true
pkill -9 -f "next" 2>/dev/null || true
pkill -9 -f "dev" 2>/dev/null || true

# Kill PM2 if running
if command -v pm2 &> /dev/null; then
  pm2 kill 2>/dev/null || true
  pm2 delete all 2>/dev/null || true
fi

echo "  Waiting 8 seconds for ports to be completely freed..."
sleep 8

echo ""
echo "[3/7] Clearing ports 3000-3010..."
# Use lsof if available to see what's using ports
if command -v lsof &> /dev/null; then
  echo "  Checking for processes on ports 3000-3010:"
  lsof -i :3000-3010 2>/dev/null || echo "  No processes found"
fi

echo ""
echo "[4/7] Recovering backend..."
cd "$BACKEND_DIR"

# Clean and install
echo "  Cleaning backend..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

echo "  Installing backend dependencies..."
npm install --legacy-peer-deps 2>&1 | tail -5

echo "  Starting backend on port 3002..."
nohup npm run start > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 3

if kill -0 $BACKEND_PID 2>/dev/null; then
  echo "✓ Backend started (PID: $BACKEND_PID)"
else
  echo "✗ Backend failed to start"
  tail -30 "$SCRIPT_DIR/backend.log"
fi

echo ""
echo "[5/7] Recovering frontend..."
cd "$FRONTEND_DIR"

# Aggressive clean
echo "  Aggressive clean of frontend..."
rm -rf .next node_modules package-lock.json .turbo 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

echo "  Installing frontend dependencies..."
npm install --legacy-peer-deps 2>&1 | tail -5

echo "  Building frontend..."
npm run build 2>&1 | tail -10

if [ $? -ne 0 ]; then
  echo "✗ Frontend build failed"
  npm run build 2>&1 | tail -50
  exit 1
fi
echo "✓ Frontend build successful"

echo ""
echo "[6/7] Starting frontend on port 3000..."
# Explicitly set PORT environment variable
PORT=3000 nohup npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 5

if kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "✓ Frontend started (PID: $FRONTEND_PID)"
else
  echo "✗ Frontend failed to start"
  tail -30 "$SCRIPT_DIR/frontend.log"
fi

echo ""
echo "[7/7] Verifying services..."
sleep 3

# Test backend
echo "  Testing backend health..."
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
  echo "  ✓ Backend responding (port 3002)"
else
  echo "  ⚠ Backend not responding yet"
fi

# Test frontend
echo "  Testing frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "  ✓ Frontend responding (port 3000)"
else
  echo "  ⚠ Frontend may still be loading..."
fi

echo ""
echo "=========================================="
echo "✓ AWS Recovery Complete!"
echo "=========================================="
echo ""
echo "Backend:  http://localhost:3002"
echo "Frontend: http://localhost:3000"
echo ""
echo "EC2 URLs (replace IP with your EC2 IP):"
echo "  Backend:  http://YOUR_EC2_IP:3002"
echo "  Frontend: http://YOUR_EC2_IP:3000"
echo ""
echo "Log files:"
echo "  Backend:  $SCRIPT_DIR/backend.log"
echo "  Frontend: $SCRIPT_DIR/frontend.log"
echo ""
echo "Process IDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "To check logs:"
echo "  tail -f $SCRIPT_DIR/backend.log"
echo "  tail -f $SCRIPT_DIR/frontend.log"
echo ""
echo "To kill all services:"
echo "  pkill -9 -f node"
echo "  pkill -9 -f npm"
echo ""
