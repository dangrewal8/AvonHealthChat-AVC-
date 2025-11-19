#!/bin/bash

echo "🧹 Cleaning up existing processes..."
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

echo "🤖 Starting Ollama (AI service)..."
cd /home/user/AvonHealthChat-AVC-
./start-ollama.sh
echo ""

echo "🔨 Building backend..."
cd /home/user/AvonHealthChat-AVC-/backend
npm run build

echo "🚀 Starting backend server..."
nohup npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

echo "⏳ Waiting for backend to initialize..."
sleep 5

echo "🚀 Starting frontend server..."
cd /home/user/AvonHealthChat-AVC-/frontend
nohup npm run dev -- --port 8080 --host 0.0.0.0 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo "⏳ Waiting for frontend to initialize..."
sleep 5

echo ""
echo "🧪 Testing backend..."
curl -s http://localhost:3001/health | head -1

echo ""
echo "🧪 Testing frontend..."
curl -s http://localhost:8080 | grep -o "<title>.*</title>"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🎉 Both servers are running!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📱 Frontend: http://localhost:8080"
echo "🔌 Backend:  http://localhost:3001"
echo ""
echo "📋 View logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 Stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   OR: pkill -f 'node dist/index.js' && pkill -f vite"
echo "═══════════════════════════════════════════════════════"
