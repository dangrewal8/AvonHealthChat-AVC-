#!/bin/bash
#
# Docker Installation Script
# Run this with: sudo ./install-docker.sh

set -e

echo "=========================================="
echo "Installing Docker & Docker Compose"
echo "=========================================="
echo ""

# Update package list
echo "Step 1: Updating package list..."
apt-get update

# Install Docker
echo ""
echo "Step 2: Installing Docker..."
apt-get install -y docker.io docker-compose

# Start Docker service
echo ""
echo "Step 3: Starting Docker service..."
systemctl start docker
systemctl enable docker

# Add current user to docker group
echo ""
echo "Step 4: Adding user to docker group..."
usermod -aG docker $SUDO_USER

echo ""
echo "=========================================="
echo "Docker Installation Complete!"
echo "=========================================="
echo ""
echo "IMPORTANT: You need to log out and back in for group changes to take effect"
echo "Or run: newgrp docker"
echo ""
echo "Then run: ./start-demo.sh"
echo ""
