#!/bin/bash

# Start backend in background
echo "Starting backend..."
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app/backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 5

# Check if frontend node_modules exists, if not install
echo "Checking frontend dependencies..."
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app/frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --legacy-peer-deps > /tmp/frontend-install.log 2>&1
    echo "Frontend dependencies installed"
fi

# Start frontend
echo "Starting frontend..."
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Display logs
echo ""
echo "=== BACKEND LOG ==="
tail -20 /tmp/backend.log
echo ""
echo "=== FRONTEND LOG ==="
tail -20 /tmp/frontend.log

# Keep script running
wait
