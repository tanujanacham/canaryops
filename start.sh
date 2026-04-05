#!/bin/bash
# CanaryOps — start backend + frontend together

set -e

echo ""
echo "  ◈ CANARYOPS — starting up"
echo "  ─────────────────────────"

# Check Node
if ! command -v node &>/dev/null; then
  echo "  ✗ Node.js not found. Install Node 18+ first."
  exit 1
fi

# Install deps if needed
if [ ! -d backend/node_modules ]; then
  echo "  → Installing backend deps..."
  (cd backend && npm install --silent)
fi

if [ ! -d frontend/node_modules ]; then
  echo "  → Installing frontend deps..."
  (cd frontend && npm install --silent)
fi

# Check backend .env
if [ ! -f backend/.env ]; then
  echo ""
  echo "  ⚠  backend/.env not found."
  echo "     Copy backend/.env.example → backend/.env and fill in your config."
  echo ""
  exit 1
fi

echo "  → Starting backend on http://localhost:4000"
(cd backend && npm run dev) &
BACKEND_PID=$!

sleep 1

echo "  → Starting frontend on http://localhost:3000"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "  ✓ Both servers running."
echo "    Portfolio  →  http://localhost:3000/portfolio"
echo "    Dashboard  →  http://localhost:3000/dashboard"
echo "    API        →  http://localhost:4000"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '  Stopped.'" EXIT
wait
