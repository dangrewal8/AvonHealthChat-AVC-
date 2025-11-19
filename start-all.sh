#!/bin/bash
# ============================================================================
# Avon Health RAG - Complete Production Startup Script
# ============================================================================
#
# This script starts ALL components required for production:
# 1. Backend API (Express on port 3001)
# 2. Frontend App (Vite preview on port 4173)
# 3. Cloudflare Tunnel (exposes to internet)
#
# Prerequisites:
# - Backend .env file configured
# - Frontend .env.production configured
# - Cloudflare Tunnel configured (~/.cloudflared/config.yml)
# - cloudflared installed
#
# Usage:
#   ./start-all.sh              # Start all services
#   ./start-all.sh --no-tunnel  # Start without Cloudflare Tunnel (local only)
#
# ============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${BLUE}PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP${NC}"
    echo ""
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"

    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$TUNNEL_PID" ]; then
        echo "Stopping Cloudflare Tunnel (PID: $TUNNEL_PID)..."
        kill $TUNNEL_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Change to project root directory
cd "$(dirname "$0")"

# Check if --no-tunnel flag is provided
USE_TUNNEL=true
if [ "$1" == "--no-tunnel" ]; then
    USE_TUNNEL=false
    echo -e "${YELLOW}Note: Running in local-only mode (no Cloudflare Tunnel)${NC}"
    echo ""
fi


# ============================================================================
# Start Ollama (AI Service)
# ============================================================================

print_step "ðŸ¤– Starting Ollama AI Service"

./start-ollama.sh
echo ""

# ============================================================================
# Pre-flight Checks
# ============================================================================

print_step "= Running Pre-flight Checks"

# Check backend .env
if [ ! -f backend/.env ]; then
    echo -e "${RED}L ERROR: backend/.env file not found!${NC}"
    echo ""
    echo "Create it from the example:"
    echo "  cp backend/.env.example backend/.env"
    echo "  nano backend/.env  # Add your Avon Health credentials"
    echo ""
    exit 1
fi

# Check frontend .env.production
if [ ! -f frontend/.env.production ]; then
    echo -e "${RED}L ERROR: frontend/.env.production file not found!${NC}"
    echo ""
    echo "Please configure frontend/.env.production with your API URL"
    exit 1
fi

# Check if cloudflared is installed (only if using tunnel)
if [ "$USE_TUNNEL" = true ]; then
    if ! command -v cloudflared &> /dev/null; then
        echo -e "${RED}L ERROR: cloudflared is not installed!${NC}"
        echo ""
        echo "Install cloudflared:"
        echo "  macOS:   brew install cloudflare/cloudflare/cloudflared"
        echo "  Linux:   https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        echo ""
        echo "Or run without tunnel: ./start-all.sh --no-tunnel"
        echo ""
        exit 1
    fi

    # Check if tunnel config exists
    if [ ! -f ~/.cloudflared/config.yml ]; then
        echo -e "${RED}L ERROR: Cloudflare Tunnel not configured!${NC}"
        echo ""
        echo "Please configure Cloudflare Tunnel first:"
        echo "  1. Copy cloudflare/config.yml.template to ~/.cloudflared/config.yml"
        echo "  2. Edit it with your tunnel ID and domain"
        echo ""
        echo "Or run without tunnel: ./start-all.sh --no-tunnel"
        echo ""
        exit 1
    fi
fi

echo -e "${GREEN} All pre-flight checks passed!${NC}"
echo ""

# ============================================================================
# Start Backend API
# ============================================================================

print_step "=€ Starting Backend API (port 3001)"

cd backend

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "Installing backend dependencies..."
    npm install
    echo ""
fi

# Build TypeScript
echo "Building backend..."
npm run build
echo ""

# Start backend in background
NODE_ENV=production node dist/index.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN} Backend started (PID: $BACKEND_PID)${NC}"
echo "   Logs: logs/backend.log"
echo ""

# Wait for backend to start
sleep 3

cd ..

# ============================================================================
# Start Frontend App
# ============================================================================

print_step "<¨ Starting Frontend App (port 4173)"

cd frontend

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo ""
fi

# Build production bundle
echo "Building frontend..."
npm run build
echo ""

# Start preview server in background
npm run preview > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN} Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Logs: logs/frontend.log"
echo ""

# Wait for frontend to start
sleep 3

cd ..

# ============================================================================
# Start Cloudflare Tunnel (if enabled)
# ============================================================================

if [ "$USE_TUNNEL" = true ]; then
    print_step "< Starting Cloudflare Tunnel"

    cloudflared tunnel run > logs/tunnel.log 2>&1 &
    TUNNEL_PID=$!

    echo -e "${GREEN} Cloudflare Tunnel started (PID: $TUNNEL_PID)${NC}"
    echo "   Logs: logs/tunnel.log"
    echo ""

    # Wait for tunnel to start
    sleep 3
fi

# ============================================================================
# Status Summary
# ============================================================================

print_step "( All Services Running!"

echo "Service Status:"
echo "  Backend API:      http://localhost:3001  (PID: $BACKEND_PID)"
echo "  Frontend App:     http://localhost:4173  (PID: $FRONTEND_PID)"

if [ "$USE_TUNNEL" = true ]; then
    echo "  Cloudflare Tunnel:  Active              (PID: $TUNNEL_PID)"
    echo ""
    echo "Public Access:"
    echo "  Frontend:  https://chat.yourdomain.com"
    echo "  API:       https://api.yourdomain.com"
else
    echo ""
    echo -e "${YELLOW}Note: Running in local-only mode (no public access)${NC}"
fi

echo ""
echo "Logs:"
echo "  Backend:  tail -f logs/backend.log"
echo "  Frontend: tail -f logs/frontend.log"
if [ "$USE_TUNNEL" = true ]; then
    echo "  Tunnel:   tail -f logs/tunnel.log"
fi

echo ""
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running (wait for Ctrl+C)
wait
