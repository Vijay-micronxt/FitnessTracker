#!/bin/bash

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BACKEND_DIR="/Users/vijay/Documents/FitnessTracker/fitness-chat-app/backend"

echo -e "${YELLOW}Starting Fitness Chat Backend...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing globally...${NC}"
    npm install -g pm2
fi

cd "$BACKEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Start the backend with PM2
pm2 start npm --name "fitness-backend" -- run dev

# Save PM2 config for autostart on system reboot
pm2 save
pm2 startup

echo -e "${GREEN}✓ Backend is now running in the background${NC}"
echo -e "${GREEN}✓ Server listening at http://localhost:3001${NC}"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 logs fitness-backend       - View backend logs"
echo "  pm2 stop fitness-backend       - Stop the backend"
echo "  pm2 restart fitness-backend    - Restart the backend"
echo "  pm2 delete fitness-backend     - Remove from PM2"
echo "  pm2 monit                      - Monitor all processes"
