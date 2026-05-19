# SimOffice Control-Plane Pass

This pass moves SimOffice toward a premium agentic operating-system model.
The room is no longer cosmetic. Agents receive abilities through assigned furniture stations, and the click panels act as control surfaces.

## Core logic

1. Agents are CrewAI role objects with explicit runtime governance:
   - model route
   - autonomy mode
   - priority
   - approval mode
   - publish mode
   - memory scope
   - tool budget
   - max tool runs
   - station policy
   - escalation target

2. Furniture is a skill source:
   - workstations grant task terminals and model routing
   - meeting tables run multi-agent meeting chains
   - knowledge shelves expose work logs and retrieval/memory behavior
   - operations screens expose dashboard/status behavior
   - social broadcast consoles expose marketing workflows

3. Editing the room changes backend capability routing:
   - assigning furniture to an agent creates/updates that agent's tool furniture list
   - Apply + Go Live syncs furniture registry IDs to the backend
   - the backend reports furniture grants back to the frontend

4. The social media / marketing agent ability is back as a first-class workflow:
   - Social Media Manager and Content Creator have marketing workflows in the agent panel
   - the Broadcast Console opens a station-level social dashboard
   - actions include campaign calendar, caption pack, reply strategy, and analytics plan
   - publish mode is explicit: draft, schedule, manual-post, or auto-post
   - the system must not claim real posting unless a connector confirms it

## Premium UI direction

The premium UX model is click-to-control:

- Click an agent: configure the agent, model, autonomy, approval, skills, workflows, memory, and log.
- Click furniture: assign it to an agent, inspect its registry/tool mapping, and run station-specific actions.
- Edit mode: arrange functional stations, not decoration.
- Live mode: the office behaves like an operating system where space, roles, and tools stay synchronized.

## Current implementation files

Frontend:
- `client/src/components/AgentControlPanel.jsx`
- `client/src/components/FurniturePanel.jsx`
- `client/src/components/BackendBridge.jsx`
- `client/src/components/UI.jsx`
- `client/src/index.css`

Backend:
- `backend/main.py`

## Next recommended pass

1. Replace capsule avatars with animated GLB avatars.
2. Add a global Control Deck / Mission Control overlay.
3. Add persistent backend config storage instead of in-memory runtime config.
4. Add connector setup screens for Composio/Gmail/Calendar/social APIs.
5. Add approval queues for publish/send/post actions.
6. Add station-level visual status lights in the 3D room.
