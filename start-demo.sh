#!/bin/bash
#
# Avon Health RAG System - Local Demo Startup Script
# 
# This script starts the complete demo environment including:
# - Backend API (Node.js + Express + RAG pipeline)
# - Frontend UI (React + Vite + Nginx)
# - Checks Ollama service is running
#
# Usage: ./start-demo.sh

set -e

echo "=========================================="
echo "Avon Health RAG System - Local Demo"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Ollama is running
echo "Step 1: Checking Ollama service..."
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
else
    echo -e "${RED}✗ Ollama is not running${NC}"
    echo ""
    echo "Please start Ollama first:"
    echo "  export PATH=\"\$HOME/ollama-bin:\$PATH\""
    echo "  ollama serve &"
    echo ""
    exit 1
fi

# Check required models
echo ""
echo "Step 2: Verifying AI models..."
MODELS_OK=true

if ollama list | grep -q "meditron"; then
    echo -e "${GREEN}✓ Meditron model installed${NC}"
else
    echo -e "${RED}✗ Meditron model not found${NC}"
    echo "  Run: ollama pull meditron"
    MODELS_OK=false
fi

if ollama list | grep -q "nomic-embed-text"; then
    echo -e "${GREEN}✓ nomic-embed-text model installed${NC}"
else
    echo -e "${RED}✗ nomic-embed-text model not found${NC}"
    echo "  Run: ollama pull nomic-embed-text"
    MODELS_OK=false
fi

if [ "$MODELS_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}Please install missing models before continuing${NC}"
    exit 1
fi

# Check if Docker is available
echo ""
echo "Step 3: Checking Docker..."
if command -v docker >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker is installed${NC}"
else
    echo -e "${RED}✗ Docker not found${NC}"
    echo "  Install Docker: sudo apt-get install docker.io docker-compose"
    exit 1
fi

if command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose is available${NC}"
else
    echo -e "${RED}✗ Docker Compose not found${NC}"
    exit 1
fi

# Check if containers are already running
echo ""
echo "Step 4: Checking existing containers..."
if docker ps | grep -q "avon-backend\|avon-frontend"; then
    echo -e "${YELLOW}⚠ Demo containers are already running${NC}"
    echo ""
    read -p "Stop and restart? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping existing containers..."
        docker-compose down
    else
        echo "Keeping existing containers. Run './stop-demo.sh' to stop them."
        exit 0
    fi
fi

# Build and start containers
echo ""
echo "Step 5: Building and starting containers..."
echo ""
docker-compose up --build -d

# Wait for services to be healthy
echo ""
echo "Step 6: Waiting for services to start..."
echo "This may take 30-60 seconds..."
echo ""

MAX_WAIT=60
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if docker ps | grep -q "avon-backend.*healthy" && docker ps | grep -q "avon-frontend.*healthy"; then
        echo -e "${GREEN}✓ All services are healthy${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo -n "."
done

echo ""

# Check final status
echo ""
echo "Step 7: Verifying services..."
echo ""

# Check backend
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API:${NC}       http://localhost:3001"
else
    echo -e "${RED}✗ Backend API:${NC}       Not responding"
    echo "  Check logs: docker-compose logs backend"
fi

# Check frontend
if curl -s http://localhost/ >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend UI:${NC}       http://localhost"
else
    echo -e "${YELLOW}⚠ Frontend UI:${NC}       Starting... (may take a few more seconds)"
fi

echo ""
echo "=========================================="
echo "Demo Environment Ready!"
echo "=========================================="
echo ""
echo "Access Points:"
echo "  • Frontend UI:    http://localhost"
echo "  • Backend API:    http://localhost:3001"
echo "  • Health Check:   http://localhost:3001/health"
echo ""
echo "Management Commands:"
echo "  • View logs:      docker-compose logs -f"
echo "  • Stop demo:      ./stop-demo.sh"
echo "  • Check status:   ./status-demo.sh"
echo "  • Run tests:      ./test-demo.sh"
echo ""
echo "Test Patient ID:  user_n15wtm6xCNQGrmgfMCGOVaqEq0S2"
echo ""
