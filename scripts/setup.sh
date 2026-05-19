#!/usr/bin/env bash
set -euo pipefail

echo "Installing SimOffice client dependencies..."
npm --prefix client install

echo "Creating Python virtual environment..."
python -m venv backend/.venv

if [[ -f backend/.venv/bin/activate ]]; then
  source backend/.venv/bin/activate
else
  source backend/.venv/Scripts/activate
fi

echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env. Add your API keys before running real agents."
fi

if [[ ! -f client/.env.local ]]; then
  cp client/.env.example client/.env.local
  echo "Created client/.env.local."
fi

echo "SimOffice setup complete."
