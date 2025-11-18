#!/bin/bash
#
# Avon Health RAG System - Status Check Script
#
# Displays current status of all demo services
#
# Usage: ./status-demo.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Avon Health RAG Demo - Status Check"
echo "=========================================="
echo ""

# Check Ollama
echo "AI Services:"
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo -e "  Ollama:         ${GREEN}✓ Running${NC} (localhost:11434)"
    
    # Check models
    if ollama list | grep -q "meditron"; then
        echo -e "  - Meditron:     ${GREEN}✓ Installed${NC}"
    else
        echo -e "  - Meditron:     ${RED}✗ Not found${NC}"
    fi
    
    if ollama list | grep -q "nomic-embed-text"; then
        echo -e "  - Embeddings:   ${GREEN}✓ Installed${NC}"
    else
        echo -e "  - Embeddings:   ${RED}✗ Not found${NC}"
    fi
else
    echo -e "  Ollama:         ${RED}✗ Not running${NC}"
fi

echo ""
echo "Docker Containers:"

# Check if containers exist
if docker ps -a | grep -q "avon-backend\|avon-frontend"; then
    # Check backend
    if docker ps | grep -q "avon-backend"; then
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' avon-backend 2>/dev/null || echo "unknown")
        if [ "$HEALTH" = "healthy" ]; then
            echo -e "  Backend:        ${GREEN}✓ Running (healthy)${NC}"
        elif [ "$HEALTH" = "starting" ]; then
            echo -e "  Backend:        ${YELLOW}⚠ Starting...${NC}"
        else
            echo -e "  Backend:        ${YELLOW}⚠ Running (${HEALTH})${NC}"
        fi
    else
        echo -e "  Backend:        ${RED}✗ Stopped${NC}"
    fi
    
    # Check frontend
    if docker ps | grep -q "avon-frontend"; then
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' avon-frontend 2>/dev/null || echo "unknown")
        if [ "$HEALTH" = "healthy" ]; then
            echo -e "  Frontend:       ${GREEN}✓ Running (healthy)${NC}"
        elif [ "$HEALTH" = "starting" ]; then
            echo -e "  Frontend:       ${YELLOW}⚠ Starting...${NC}"
        else
            echo -e "  Frontend:       ${YELLOW}⚠ Running (${HEALTH})${NC}"
        fi
    else
        echo -e "  Frontend:       ${RED}✗ Stopped${NC}"
    fi
else
    echo -e "  ${YELLOW}No containers found${NC}"
    echo "  Run ./start-demo.sh to start the demo"
fi

echo ""
echo "Service Endpoints:"

# Test backend
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo -e "  Backend API:    ${GREEN}✓ http://localhost:3001${NC}"
else
    echo -e "  Backend API:    ${RED}✗ Not accessible${NC}"
fi

# Test frontend
if curl -s http://localhost/ >/dev/null 2>&1; then
    echo -e "  Frontend UI:    ${GREEN}✓ http://localhost${NC}"
else
    echo -e "  Frontend UI:    ${RED}✗ Not accessible${NC}"
fi

echo ""
echo "Resource Usage:"
if docker ps | grep -q "avon-backend\|avon-frontend"; then
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" avon-backend avon-frontend 2>/dev/null || true
fi

echo ""
echo "Quick Commands:"
echo "  • View logs:      docker-compose logs -f"
echo "  • Start demo:     ./start-demo.sh"
echo "  • Stop demo:      ./stop-demo.sh"
echo "  • Run tests:      ./test-demo.sh"
echo ""
