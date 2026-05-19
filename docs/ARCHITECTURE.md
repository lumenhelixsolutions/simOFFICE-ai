# Architecture

## System overview

SimOffice has three layers:

1. **3D Client**: Vite, React, Jotai, React Three Fiber, Drei, and Three.js.
2. **Runtime Backend**: FastAPI WebSocket server that bridges UI commands to CrewAI agents.
3. **Optional External Runtime**: SimAI-compatible REST/A2A workflow execution through configurable client runtime settings.

## Client layer

The client owns the visual operating model:

- 3D office scene.
- Agent avatars.
- Furniture placement and station selection.
- Command rail and management drawers.
- Agent inspectors.
- Furniture/skill panels.
- Runtime status display.
- Local layout state.

The client does not fabricate agent outputs. When no backend is connected, task buttons should either be disabled or display a clear backend-required message.

## Backend layer

The backend exposes:

- `GET /health` for runtime status.
- `GET /furniture` for the station/tool registry.
- `WS /ws` for real-time agent commands and events.

WebSocket commands include:

- `run_task`
- `run_meeting`
- `change_model`
- `update_agent_config`
- `run_social_action`
- `get_log`
- `update_furniture`
- `get_furniture_info`
- `ping`

The backend maintains in-memory state for models, logs, furniture grants, and governance controls. Production deployments should replace this with persistent storage.

## Agent layer

Each agent has:

- Identity.
- Department.
- Role.
- Goal.
- Backstory.
- Default model.
- Status.
- Work log.
- Furniture/tool context.
- Governance controls.

## Furniture-to-skill layer

Furniture should map to real capabilities. Examples:

- AI workstation → task console, research, prompt history.
- Conference table → multi-agent meeting, decision record.
- Operations dashboard → KPI view, routing, reporting.
- Broadcast console → social marketing, campaign analytics.
- Knowledge shelf → file retrieval, memory, reference materials.

This design keeps the 3D office meaningful. Furniture is not decoration; it is a visual permission and workflow model.

## Runtime modes

### CrewAI mode

The client connects to `ws://localhost:8080/ws` and receives initialization data from FastAPI.

### SimAI-compatible mode

The client can send tasks to a configured `VITE_SIM_BASE_URL`. Production systems should proxy these calls through the backend.

### Offline editing mode

The office remains editable, but agent execution is blocked. This is intentional.

## Production hardening path

- Server-side secret management.
- User auth and workspaces.
- Database persistence.
- Audit logs.
- Role-based access control.
- Connector permission scopes.
- Background job queue.
- Streaming agent output.
- Deployment-specific CORS policy.
