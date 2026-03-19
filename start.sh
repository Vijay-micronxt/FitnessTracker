#!/bin/bash

# Portable startup script for Fitness Chat (Frontend + Backend)
# Works on any system (macOS, Ubuntu, EC2, etc.)
# Uses relative paths based on script location

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Fitness Chat - Full Stack Startup${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"

# Check if PM2 is available
USE_PM2=false
if command -v pm2 &> /dev/null; then
    USE_PM2=true
fi

# ===== START BACKEND =====
echo ""
echo -e "${YELLOW}[1/4] Setting up backend...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Build if dist doesn't exist
if [ ! -f "dist/main.js" ]; then
    echo -e "${YELLOW}Building backend...${NC}"
    npm run build
fi

if [ "$USE_PM2" = true ]; then
    echo -e "${YELLOW}[2/4] Starting backend with PM2...${NC}"
    pm2 start npm --name "fitness-backend" -- run start
else
    echo -e "${YELLOW}[2/4] Starting backend with nohup...${NC}"
    nohup npm run start > "$SCRIPT_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
fi

echo -e "${GREEN}✓ Backend starting...${NC}"
sleep 3

# ===== START FRONTEND =====
echo ""
echo -e "${YELLOW}[3/4] Setting up frontend...${NC}"
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Build if .next doesn't exist
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}Building frontend...${NC}"
    npm run build
fi

if [ "$USE_PM2" = true ]; then
    echo -e "${YELLOW}[4/4] Starting frontend with PM2...${NC}"
    pm2 start npm --name "fitness-frontend" -- run start
    pm2 save
    pm2 startup
else
    echo -e "${YELLOW}[4/4] Starting frontend with nohup...${NC}"
    nohup npm run start > "$SCRIPT_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
fi

echo -e "${GREEN}✓ Frontend starting...${NC}"
sleep 2

# ===== DISPLAY STATUS =====
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Services Started Successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Backend:${NC}  http://localhost:3002"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
echo ""

if [ "$USE_PM2" = true ]; then
    echo -e "${YELLOW}PM2 is managing your services.${NC}"
    echo ""
    echo "Useful commands:"
    echo "  pm2 status                  - View all services"
    echo "  pm2 logs fitness-backend    - View backend logs"
    echo "  pm2 logs fitness-frontend   - View frontend logs"
    echo "  pm2 stop all                - Stop all services"
    echo "  pm2 restart all             - Restart all services"
    echo "  pm2 delete all              - Remove all services"
else
    echo -e "${YELLOW}Services running with nohup.${NC}"
    echo ""
    echo "Log files:"
    echo "  Backend:  $SCRIPT_DIR/backend.log"
    echo "  Frontend: $SCRIPT_DIR/frontend.log"
    echo ""
    echo "To stop services:"
    echo "  kill $BACKEND_PID  (backend)"
    echo "  kill $FRONTEND_PID (frontend)"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
