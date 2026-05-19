.PHONY: setup dev client backend build check clean

setup:
	bash scripts/setup.sh

dev:
	@echo "Run client and backend in separate terminals: make client / make backend"

client:
	npm --prefix client run dev -- --host 0.0.0.0

backend:
	cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8080

build:
	npm --prefix client run build

check:
	python -m py_compile backend/main.py backend/crew.py
	npm --prefix client run build

clean:
	bash scripts/clean.sh
