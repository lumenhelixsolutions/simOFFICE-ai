#!/usr/bin/env bash
set -euo pipefail
rm -rf client/dist client/node_modules backend/.venv backend/__pycache__ .pytest_cache
find . -type f \( -name '*.pyc' -o -name '*.pyo' -o -name '.DS_Store' \) -delete
