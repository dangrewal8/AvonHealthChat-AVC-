#!/bin/bash
#
# Avon Health RAG System - Stop Demo Script
#
# Stops all demo containers gracefully
#
# Usage: ./stop-demo.sh

set -e

echo "=========================================="
echo "Stopping Avon Health RAG Demo"
echo "=========================================="
echo ""

# Stop and remove containers
echo "Stopping containers..."
docker-compose down

echo ""
echo "✓ Demo stopped successfully"
echo ""
echo "To start again, run: ./start-demo.sh"
echo ""
