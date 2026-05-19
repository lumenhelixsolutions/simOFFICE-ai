# SimOffice Real Runtime Update

This pass removes the remaining fake/demo output path from SimOffice and makes the UI clearer about whether real agent execution is available.

## What changed

- Agent tasks no longer return canned local demo responses when no backend is connected.
- If neither CrewAI WebSocket nor SimAI is configured, task controls display an explicit backend-required state.
- The top bar now shows `CREWAI`, `SIMAI`, or `BACKEND OFFLINE` instead of implying a demo mode.
- Manual commands, quick actions, meeting tables, terminals, and social marketing station controls are disabled or blocked while offline.
- The simulation can still animate and edit the office offline, but it will not generate fake agent work products.
- Automatic task execution and CEO management review only call a real backend when one is connected.
- CrewAI agent prompts were tightened so backend outputs are professional work products rather than short roleplay-style status lines.

## Runtime options

### CrewAI / FastAPI backend

From the backend folder:

```bash
cd backend
uvicorn main:app --reload --port 8080
```

Then from the client folder:

```bash
cd client
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

### SimAI backend

Set the client environment variables before running or building:

```bash
VITE_SIM_BASE_URL=http://localhost:3000
VITE_SIM_MODE=workflow
VITE_SIM_WORKFLOW_ID=<your-workflow-id>
```

For Windows PowerShell:

```powershell
$env:VITE_SIM_BASE_URL="http://localhost:3000"
$env:VITE_SIM_MODE="workflow"
$env:VITE_SIM_WORKFLOW_ID="<your-workflow-id>"
npm run dev
```

## Security note

`VITE_SIM_API_KEY` should only be used for local testing. Any value beginning with `VITE_` is bundled into browser JavaScript. Production SimAI calls should go through the SimOffice backend so API keys remain server-side.
