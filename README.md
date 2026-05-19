<p align="center">
  <img src="docs/assets/hero.svg" alt="SimOffice — The 3D command center for AI agent teams" width="100%" />
</p>

# SimOffice

**SimOffice is a 3D command center for managing AI agent teams.** Instead of burying agents in a chat sidebar, SimOffice gives them an operational floor: executives, builders, finance, infrastructure, operations, marketing, furniture-based tool stations, runtime status, skill grants, workflows, memory controls, and real backend execution.

This project is built to feel like an actual product, not a toy demo. If a real backend is not connected, SimOffice does not fake agent work. You can still design the office and configure agents offline, but execution requires a connected CrewAI/FastAPI backend or a configured SimAI-compatible backend.

## Why this matters

Most agent apps treat agents as invisible prompts. SimOffice treats agents as operators with location, tools, station access, department context, status, memory scope, approval policy, and work output. The office is not decoration; it is a visual control plane for agentic operations.

## Core features

- **3D agent operations floor** using React Three Fiber and real GLB assets.
- **Command rail UI** for fast agent switching without covering the 3D workspace.
- **Right-side management inspectors** for agents, furniture, skills, runtime, workflows, and memory.
- **Furniture-to-skill model** where stations grant operational capabilities.
- **CrewAI backend bridge** over FastAPI and WebSocket.
- **SimAI-compatible runtime adapter** for external workflow / A2A style agent execution.
- **No fake-output policy**: real agent tasks require a real backend.
- **Premium prefab office** with executive, finance, infrastructure, operations, and marketing departments out of the box.
- **Marketing agent station** for campaign briefs, platform-specific content, analytics framing, and draft-first publishing control.
- **Open source commercial-grade repo stack** with CI, Docker, issue templates, launch kit, contribution docs, and roadmap.

## Quickstart

### 1. Run the client

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### 2. Run the real backend

Open a second terminal:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

Add your model provider keys to `backend/.env` before expecting real agent output.

### 3. Confirm runtime connection

The top bar should show:

```text
CREWAI
```

If it shows backend offline, the UI is still usable for editing and configuration, but agent execution is intentionally blocked.

## Optional SimAI-compatible runtime

Create `client/.env.local`:

```env
VITE_SIM_BASE_URL=http://localhost:3000
VITE_SIM_MODE=compat
```

Restart the client after changing Vite environment variables.

Do not place production API keys in client-side variables. For production, route SimAI calls through a server-side proxy.

## Repository layout

```text
simoffice/
├── backend/              FastAPI + CrewAI runtime bridge
├── client/               Vite + React + React Three Fiber app
├── docs/                 Product, architecture, API, UX, launch, and security docs
├── scripts/              Setup, validation, cleanup, and dev helpers
├── .github/              CI, issue templates, pull request template
├── docker-compose.yml    Local full-stack runtime
├── LICENSE               MIT license
└── README.md             Product-facing entry point
```

## One-command Docker run

```bash
docker compose up --build
```

Client: `http://localhost:5173`  
Backend: `http://localhost:8080/health`

## What to star this for

Star this repo if you want a practical open-source interface pattern for:

- visual AI agent operations,
- human-in-the-loop agent governance,
- station/tool-based agent permissions,
- 3D productivity environments,
- CrewAI and workflow backend orchestration,
- agent teams that feel manageable instead of magical.

## GitHub topics

Use these topics when publishing the repo:

```text
ai-agents agentic-ui crewai react-three-fiber threejs fastapi websocket 3d-dashboard workflow-automation open-source-ai
```

## Status

SimOffice is early but functional. The current priority is hardening real backend execution, making furniture/skill mapping more powerful, and improving the management UI into a polished agent control plane.

## License

MIT. Build with it, fork it, remix it, commercialize responsibly, and contribute improvements back when you can.
