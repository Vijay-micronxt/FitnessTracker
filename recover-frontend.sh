#!/bin/bash

# Fitness Chat - Frontend Recovery Script
# This script rebuilds the frontend when build files are corrupted or missing
# Usage: ./recover-frontend.sh

set -e

echo "=========================================="
echo "  Fitness Chat - Frontend Recovery"
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo ""
echo "[1/4] Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo "✗ Node.js not found. Please install Node.js 18+"
  exit 1
fi
NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION detected"

echo ""
echo "[2/4] Stopping existing frontend process..."
# Kill any existing npm dev processes in the frontend directory
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm run start" 2>/dev/null || true
sleep 2
echo "✓ Frontend processes stopped"

echo ""
echo "[3/4] Cleaning and rebuilding frontend..."
cd "$FRONTEND_DIR"

# Remove corrupted build
if [ -d ".next" ]; then
  echo "  Removing corrupted .next directory..."
  rm -rf .next
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies..."
  npm install
fi

# Build the frontend
echo "  Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "✗ Frontend build failed"
  exit 1
fi
echo "✓ Frontend build successful"

echo ""
echo "[4/4] Starting frontend..."
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
echo "=========================================="
echo "✓ Frontend Recovery Complete!"
echo "=========================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Log file: $SCRIPT_DIR/frontend.log"
echo ""
echo "To stop the frontend:"
echo "  kill $FRONTEND_PID"
echo "  # or"
echo "  pkill -f 'npm run dev'"
echo ""
