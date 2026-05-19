#!/usr/bin/env bash
set -euo pipefail
python -m py_compile backend/main.py backend/crew.py
npm --prefix client run build
