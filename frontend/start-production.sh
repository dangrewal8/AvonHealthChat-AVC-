#!/bin/bash
# ============================================================================
# Avon Health RAG - Frontend Production Startup Script
# ============================================================================
#
# This script builds and serves the frontend React app in production mode.
#
# Prerequisites:
# 1. .env.production file must exist with API URL
# 2. Dependencies must be installed (npm install)
#
# ============================================================================

set -e  # Exit on error

# Change to frontend directory
cd "$(dirname "$0")"

echo "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
echo "<¨ Avon Health RAG - Frontend Startup"
echo "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
echo ""

# Check if .env.production file exists
if [ ! -f .env.production ]; then
    echo "L ERROR: .env.production file not found!"
    echo ""
    echo "Please configure .env.production with your API URL:"
    echo "  VITE_API_BASE_URL=https://api.yourdomain.com"
    echo "  VITE_ADMIN_USERNAME=admin"
    echo "  VITE_ADMIN_PASSWORD=your_password_here"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "=æ Installing dependencies..."
    npm install
    echo ""
fi

# Build production bundle
echo "=( Building production bundle..."
npm run build
echo ""

# Start preview server
echo "=€ Starting preview server on port 4173..."
echo ""
npm run preview
