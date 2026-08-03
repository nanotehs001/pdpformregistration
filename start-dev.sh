#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting PDP Membership Form App...${NC}"
echo ""

# Check if .env file exists in server
if [ ! -f "server/.env" ]; then
    echo -e "${RED}Error: server/.env file not found${NC}"
    echo "Please create server/.env using server/.env.example"
    echo "Run: cp server/.env.example server/.env"
    exit 1
fi

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found${NC}"
echo ""

# Start servers in background
echo "Starting backend server..."
cd server
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"

echo ""
echo "Starting frontend server..."
cd ../client
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Application is running!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
