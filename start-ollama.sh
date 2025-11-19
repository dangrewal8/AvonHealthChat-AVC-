#!/bin/bash
# ============================================================================
# Ollama Startup Script for Avon Health RAG System
# ============================================================================
#
# This script starts Ollama (LLM service) for advanced AI features:
# - Chain-of-thought reasoning with Meditron
# - Multi-level confidence assessment
# - Detailed source citations
# - Intelligent uncertainty handling
#
# Methods (tried in order):
# 1. Docker (recommended for production)
# 2. Native binary (if installed)
# 3. Download & run native binary (fallback)
#
# Usage:
#   ./start-ollama.sh           # Start Ollama
#   ./start-ollama.sh --check   # Check if Ollama is running
#   ./start-ollama.sh --pull    # Pull Meditron model
#
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

OLLAMA_PORT=11434
OLLAMA_MODEL="meditron"

# ============================================================================
# Helper Functions
# ============================================================================

print_status() {
    echo -e "${BLUE}[Ollama]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Ollama is already running
check_ollama() {
    if curl -s http://localhost:${OLLAMA_PORT}/api/tags >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Wait for Ollama to be ready
wait_for_ollama() {
    print_status "Waiting for Ollama to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if check_ollama; then
            print_success "Ollama is ready!"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done

    print_error "Ollama failed to start after ${max_attempts} seconds"
    return 1
}

# Check if model is available
check_model() {
    local model=$1
    if curl -s http://localhost:${OLLAMA_PORT}/api/tags | grep -q "\"name\":\"${model}\""; then
        return 0
    else
        return 1
    fi
}

# Pull Meditron model
pull_model() {
    print_status "Pulling ${OLLAMA_MODEL} model (this may take a while)..."
    curl -X POST http://localhost:${OLLAMA_PORT}/api/pull \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"${OLLAMA_MODEL}\"}" \
        2>/dev/null || {
        print_error "Failed to pull ${OLLAMA_MODEL} model"
        return 1
    }
    print_success "${OLLAMA_MODEL} model is ready!"
}

# ============================================================================
# Main Logic
# ============================================================================

# Handle --check flag
if [ "$1" == "--check" ]; then
    if check_ollama; then
        print_success "Ollama is running on port ${OLLAMA_PORT}"

        if check_model "${OLLAMA_MODEL}"; then
            print_success "${OLLAMA_MODEL} model is available"
        else
            print_warning "${OLLAMA_MODEL} model not found. Run: ./start-ollama.sh --pull"
        fi
        exit 0
    else
        print_error "Ollama is not running"
        exit 1
    fi
fi

# Handle --pull flag
if [ "$1" == "--pull" ]; then
    if ! check_ollama; then
        print_error "Ollama is not running. Start it first: ./start-ollama.sh"
        exit 1
    fi
    pull_model
    exit 0
fi

# Check if already running
if check_ollama; then
    print_success "Ollama is already running on port ${OLLAMA_PORT}"

    # Check if model exists
    if check_model "${OLLAMA_MODEL}"; then
        print_success "${OLLAMA_MODEL} model is available"
    else
        print_warning "${OLLAMA_MODEL} model not found"
        pull_model
    fi
    exit 0
fi

print_status "Starting Ollama service..."

# ============================================================================
# Method 1: Try Docker (Recommended for Production)
# ============================================================================

if command -v docker &> /dev/null; then
    print_status "Attempting to start Ollama with Docker..."

    # Check if container already exists
    if docker ps -a | grep -q ollama; then
        print_status "Existing Ollama container found, starting it..."
        docker start ollama >/dev/null 2>&1 || {
            print_warning "Failed to start existing container, removing and recreating..."
            docker rm -f ollama >/dev/null 2>&1 || true
        }
    fi

    # Start new container if not running
    if ! docker ps | grep -q ollama; then
        print_status "Starting new Ollama Docker container..."
        docker run -d \
            --name ollama \
            --restart unless-stopped \
            -p ${OLLAMA_PORT}:11434 \
            -v ollama_data:/root/.ollama \
            ollama/ollama:latest >/dev/null 2>&1 || {
            print_warning "Docker start failed, trying next method..."
        }
    fi

    # Wait and check
    if wait_for_ollama; then
        print_success "Ollama started successfully with Docker!"

        # Pull model if needed
        if ! check_model "${OLLAMA_MODEL}"; then
            print_status "Downloading ${OLLAMA_MODEL} model (first time only)..."
            docker exec ollama ollama pull ${OLLAMA_MODEL} || {
                print_warning "Failed to pull ${OLLAMA_MODEL}. You can pull it later with:"
                echo "  docker exec ollama ollama pull ${OLLAMA_MODEL}"
            }
        fi

        print_success "Ollama is fully ready!"
        echo ""
        echo "Ollama Status:"
        echo "  URL:   http://localhost:${OLLAMA_PORT}"
        echo "  Model: ${OLLAMA_MODEL}"
        echo ""
        echo "Docker Commands:"
        echo "  View logs:    docker logs -f ollama"
        echo "  Stop:         docker stop ollama"
        echo "  Restart:      docker restart ollama"
        echo "  Remove:       docker rm -f ollama"
        echo ""
        exit 0
    fi
fi

# ============================================================================
# Method 2: Try Native Ollama Binary
# ============================================================================

if command -v ollama &> /dev/null; then
    print_status "Starting Ollama with native binary..."

    # Start Ollama in background
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    OLLAMA_PID=$!

    if wait_for_ollama; then
        print_success "Ollama started successfully (PID: ${OLLAMA_PID})!"

        # Pull model if needed
        if ! check_model "${OLLAMA_MODEL}"; then
            print_status "Downloading ${OLLAMA_MODEL} model (first time only)..."
            ollama pull ${OLLAMA_MODEL} || {
                print_warning "Failed to pull ${OLLAMA_MODEL}. You can pull it later with:"
                echo "  ollama pull ${OLLAMA_MODEL}"
            }
        fi

        print_success "Ollama is fully ready!"
        echo ""
        echo "Ollama Status:"
        echo "  URL:   http://localhost:${OLLAMA_PORT}"
        echo "  Model: ${OLLAMA_MODEL}"
        echo "  PID:   ${OLLAMA_PID}"
        echo "  Logs:  tail -f /tmp/ollama.log"
        echo ""
        exit 0
    fi
fi

# ============================================================================
# No Method Worked - Show Installation Instructions
# ============================================================================

print_error "Ollama could not be started!"
echo ""
echo "Ollama is required for advanced AI features:"
echo "  • Chain-of-thought reasoning with Meditron"
echo "  • Multi-level confidence assessment"
echo "  • Detailed source citations"
echo "  • Intelligent uncertainty handling"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "INSTALLATION OPTIONS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Docker (Recommended for Production)"
echo "  Install Docker:"
echo "    curl -fsSL https://get.docker.com | sh"
echo "  Then run this script again:"
echo "    ./start-ollama.sh"
echo ""
echo "Option 2: Native Binary"
echo "  Linux:"
echo "    curl -fsSL https://ollama.com/install.sh | sh"
echo "  macOS:"
echo "    brew install ollama"
echo "  Then start Ollama:"
echo "    ollama serve"
echo ""
echo "Option 3: Manual Docker Setup"
echo "  docker run -d -p 11434:11434 --name ollama ollama/ollama"
echo "  docker exec ollama ollama pull meditron"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Without Ollama, the system will use basic pattern matching (fallback mode)."
echo "Advanced AI features will not be available."
echo ""
exit 1
