#!/bin/bash
# ============================================================================
# Avon Health RAG - Backend Production Startup Script
# ============================================================================
#
# This script starts the backend Express API server in production mode.
#
# Prerequisites:
# 1. .env file must exist with all required credentials
# 2. Dependencies must be installed (npm install)
#
# ============================================================================

set -e  # Exit on error

# Change to backend directory
cd "$(dirname "$0")"

echo "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
echo "<å Avon Health RAG - Backend Startup"
echo "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "L ERROR: .env file not found!"
    echo ""
    echo "Please create .env file from .env.example:"
    echo "  cp .env.example .env"
    echo "  nano .env  # Edit with your credentials"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "=æ Installing dependencies..."
    npm install
    echo ""
fi

# Build TypeScript
echo "=( Building TypeScript..."
npm run build
echo ""

# Start the server
echo "=€ Starting backend server on port 3001..."
echo ""
NODE_ENV=production node dist/index.js
