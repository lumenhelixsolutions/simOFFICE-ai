#!/usr/bin/env bash
set -euo pipefail

echo "Start these in two terminals:"
echo "  npm --prefix client run dev -- --host 0.0.0.0"
echo "  cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8080"
