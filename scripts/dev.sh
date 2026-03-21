#!/bin/bash
set -e

cleanup() {
    echo ""
    echo "→ Stopping..."
    kill $FRONTEND_PID 2>/dev/null
    docker stop coinflow-frontend-dev 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "✓ Stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "→ Starting frontend dev server (Docker)..."
docker run --rm \
    --name coinflow-frontend-dev \
    -v "$(pwd)":/app \
    -w /app \
    -p 1420:1420 \
    node:22-slim \
    sh -c "npm install --silent 2>/dev/null && npm run dev" &
FRONTEND_PID=$!

echo "→ Waiting for frontend on http://localhost:1420..."
until curl -s http://localhost:1420 > /dev/null 2>&1; do
    sleep 1
done
echo "✓ Frontend ready"

echo "→ Starting Tauri dev..."
cd src-tauri && cargo tauri dev

cleanup
