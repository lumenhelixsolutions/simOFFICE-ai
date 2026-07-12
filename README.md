# simOFFICE-ai

<p align="center">
  <a href="https://lumenhelix.com">
    <img src="docs/assets/lumenhelix-logo.svg" alt="LumenHelix Solutions" width="180">
  </a>
</p>

<h3 align="center">3D command center for managing AI agent teams and tool-enabled office stations</h3>

<p align="center">
  <a href="https://lumenhelixsolutions.github.io/simOFFICE-ai/">
    <img src="https://img.shields.io/badge/Launch_Page-simOFFICE-ai-00D4FF?style=flat-square&logo=githubpages&logoColor=white" alt="Launch Page">
  </a>
  <a href="https://lumenhelix.com">
    <img src="https://img.shields.io/badge/Built_by-LumenHelix-7C3AED?style=flat-square" alt="Built by LumenHelix">
  </a>
  <img src="https://img.shields.io/badge/license-MIT-8A95A8?style=flat-square" alt="License">
</p>

---

**simOFFICE-ai** is part of the [LumenHelix Solutions](https://lumenhelix.com) portfolio — applied symbolic dynamics & reversible computation for deterministic, traceable AI systems.

SimOffice is a 3D command center for AI agent teams built by LumenHelix. Instead of burying agents in a chat sidebar, it gives them an operational floor with departments, furniture-based tool stations, runtime status, skill grants, workflows, and memory controls. A FastAPI + CrewAI backend provides real execution; the React + Vite + React Three Fiber client renders the control plane.

## Why this exists

- **Make agents manageable.** Visual location and station access turn invisible prompts into inspectable operations.
- **No fake output.** If the backend is offline, the UI is still editable but agent execution is intentionally blocked.
- **Run locally or containerized.** Native dev mode or docker compose up --build for the full stack.

## Quick start

Install and run simOFFICE-ai in under two minutes.

### macOS / Linux

```bash
# Clone
git clone https://github.com/lumenhelixsolutions/simOFFICE-ai.git
cd simOFFICE-ai

# Install & run
# Backend (terminal 1)
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8080

# Client (terminal 2)
cd client
npm install
npm run dev
```

### Windows (PowerShell)

```powershell
# Clone
git clone https://github.com/lumenhelixsolutions/simOFFICE-ai.git
Set-Location simOFFICE-ai

# Install & run
# Backend (terminal 1)
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8080

# Client (terminal 2)
cd client
npm install
npm run dev
```

### Windows (Git Bash / WSL)

```bash
git clone https://github.com/lumenhelixsolutions/simOFFICE-ai.git
cd simOFFICE-ai
# Backend (terminal 1)
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8080

# Client (terminal 2)
cd client
npm install
npm run dev
```

> **Device note:** simOFFICE-ai is tested on Windows 11, macOS Sonoma, Ubuntu 22.04/24.04, and modern mobile browsers.

## Full documentation

Visit the launch page for architecture, API reference, and deployment guides:  
**https://lumenhelixsolutions.github.io/simOFFICE-ai/**

## Features

| Feature | What it gives you |
|---------|-------------------|
| 3D operations floor | React Three Fiber workspace with executive, finance, infrastructure, operations, and marketing departments. |
| Furniture-to-skill model | Office stations grant operational capabilities to agents, making permissions visible and explicit. |
| Real backend execution | CrewAI/FastAPI bridge runs actual agent tasks; the UI does not fake output when disconnected. |
| Command rail and inspectors | Fast agent switching without blocking the 3D view, plus right-side inspectors for agents, skills, runtime, and memory. |

## Architecture at a glance

```
simOFFICE-ai/
├── backend/   FastAPI + CrewAI runtime bridge
├── client/    Vite + React + React Three Fiber 3D UI
├── docs/      Product, architecture, API, UX, and security docs
└── scripts/   Setup, validation, cleanup, and dev helpers
```

## Development

```bash
# Full stack with Docker
docker compose up --build

# Or native dev:
# Terminal 1: cd backend && python -m venv .venv && .venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8080
# Terminal 2: cd client && npm install && npm run dev
```

## Roadmap

- [ ] Harden real backend execution and furniture/skill mapping
- [ ] Polished management UI and agent control plane
- [ ] SimAI-compatible runtime adapter for external workflow agents

## Support & consulting

Need deterministic AI systems with full traceability? LumenHelix builds reversible computation kernels, governance layers, and end-to-end AI integrations.

- **Website:** https://lumenhelix.com
- **Services:** AI diagnostics, B.Y.O. support packages, governance audits
- **Research:** TEN² kernel, R.U.B.I.C. boundary discipline, C.O.R.E. constraint lens

## License

Released under the MIT License.

---

<p align="center">
  <sub>Engineered by <a href="https://lumenhelix.com">LumenHelix Solutions</a> — Applied Symbolic Dynamics & Reversible Computation.</sub>
</p>
