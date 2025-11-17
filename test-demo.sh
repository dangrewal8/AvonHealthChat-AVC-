#!/bin/bash
#
# Avon Health RAG System - Testing Script
#
# Tests the complete RAG pipeline with real queries
#
# Usage: ./test-demo.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Avon Health RAG Demo - Testing Suite"
echo "=========================================="
echo ""

# Check if services are running
if ! curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "Please start the demo first: ./start-demo.sh"
    exit 1
fi

# Test patient ID (from API discovery)
PATIENT_ID="user_n15wtm6xCNQGrmgfMCGOVaqEq0S2"

echo -e "${BLUE}Testing RAG System with Sample Queries${NC}"
echo ""
echo "Patient ID: $PATIENT_ID"
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
echo "--------------------"
RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$RESPONSE" | grep -q "ok\|healthy"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 2: Medication query
echo "Test 2: Medication Query"
echo "------------------------"
echo "Query: \"What medications is the patient taking?\""
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"What medications is the patient taking?\",
    \"patient_id\": \"$PATIENT_ID\"
  }")

if echo "$RESPONSE" | grep -q "answer\|medication"; then
    echo -e "${GREEN}✓ Query successful${NC}"
    echo ""
    echo "Response preview:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -30 || echo "$RESPONSE" | head -10
else
    echo -e "${RED}✗ Query failed${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 3: Care plan query
echo "Test 3: Care Plan Query"
echo "-----------------------"
echo "Query: \"What care plans are active for this patient?\""
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"What care plans are active for this patient?\",
    \"patient_id\": \"$PATIENT_ID\"
  }")

if echo "$RESPONSE" | grep -q "answer\|care"; then
    echo -e "${GREEN}✓ Query successful${NC}"
    echo ""
    echo "Response preview:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -30 || echo "$RESPONSE" | head -10
else
    echo -e "${RED}✗ Query failed${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 4: General medical query
echo "Test 4: Clinical Notes Query"
echo "----------------------------"
echo "Query: \"Summarize the patient's recent visit notes\""
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"Summarize the patient's recent visit notes\",
    \"patient_id\": \"$PATIENT_ID\"
  }")

if echo "$RESPONSE" | grep -q "answer\|note\|visit"; then
    echo -e "${GREEN}✓ Query successful${NC}"
    echo ""
    echo "Response preview:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -30 || echo "$RESPONSE" | head -10
else
    echo -e "${RED}✗ Query failed${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "  • Open UI:        http://localhost"
echo "  • View logs:      docker-compose logs -f backend"
echo "  • Check status:   ./status-demo.sh"
echo ""
echo "Try your own queries in the UI!"
echo ""
