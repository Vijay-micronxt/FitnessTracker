#!/bin/bash

# Fitness Chat - Full Stack Recovery Script
# This script recovers both backend and frontend when build files are corrupted
# Usage: ./recover-all.sh

set -e

echo "=========================================="
echo "  Fitness Chat - Full Stack Recovery"
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo ""
echo "[1/6] Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo "✗ Node.js not found. Please install Node.js 18+"
  exit 1
fi
NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION detected"

echo ""
echo "[2/6] Stopping existing services..."
# Kill any existing processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm run start" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true
sleep 2
echo "✓ Services stopped"

echo ""
echo "[3/6] Recovering backend..."
cd "$BACKEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "  Installing backend dependencies..."
  npm install
fi

# Build backend
if [ -f "tsconfig.json" ]; then
  echo "  Building backend TypeScript..."
  npx tsc 2>/dev/null || true
fi

# Start backend
echo "  Starting backend..."
nohup npm run start > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2

if kill -0 $BACKEND_PID 2>/dev/null; then
  echo "✓ Backend started (PID: $BACKEND_PID)"
else
  echo "⚠ Backend may have failed. Check logs at: $SCRIPT_DIR/backend.log"
fi

echo ""
echo "[4/6] Recovering frontend..."
cd "$FRONTEND_DIR"

# Aggressive clean
echo "  Cleaning old builds and dependencies..."
rm -rf .next node_modules package-lock.json 2>/dev/null || true

# Fresh install
echo "  Installing fresh dependencies..."
npm install

# Clear npm cache
echo "  Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Build the frontend
echo "  Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "✗ Frontend build failed"
  echo "Checking for errors..."
  npm run build 2>&1 | tail -50
  exit 1
fi
echo "✓ Frontend build successful"

echo ""
echo "[5/6] Starting frontend..."
nohup npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 3

# Check if process is still running
if kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "✓ Frontend started (PID: $FRONTEND_PID)"
else
  echo "✗ Frontend failed to start. Check logs:"
  tail -20 "$SCRIPT_DIR/frontend.log"
  exit 1
fi

echo ""
echo "[6/6] Verifying services..."
sleep 2

# Test backend health
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
  echo "✓ Backend is responding (port 3002)"
else
  echo "⚠ Backend health check failed"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✓ Frontend is responding (port 3000)"
else
  echo "⚠ Frontend health check failed"
fi

echo ""
echo "=========================================="
echo "✓ Full Stack Recovery Complete!"
echo "=========================================="
echo ""
echo "Backend:  http://localhost:3002"
echo "Frontend: http://localhost:3000"
echo ""
echo "Log files:"
echo "  Backend:  $SCRIPT_DIR/backend.log"
echo "  Frontend: $SCRIPT_DIR/frontend.log"
echo ""
echo "Process IDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
