# SimOffice Functional Layout + Editor Pass

This pass changes the default office from a decorative prefab into a functional agent workspace.

## Layout decisions

- Room expanded from 8×8 world units to 14×12 world units, giving 28×24 editable grid cells.
- Default furniture now has a purpose: workstation, meeting node, dashboard, knowledge base, seating/path anchor, or expansion zone.
- Decorative-only objects were removed from the default map.
- The prefab leaves open expansion lanes on the east, south, and central sides so new departments or tools can be added without rebuilding the whole office.
- Agents now have desk/seat anchors matched to their functional zones.

## Functional zones

- Executive / technical command row: CEO, CTO, CIO.
- Command wall: dashboard display, broadcast console, knowledge base.
- Central meeting hub: formal conference table and meeting seats.
- Finance records zone: CFO, accounts, file shelf.
- Operations zone: administrator and scheduler.
- Marketing/content zone: social media, content creator, creative huddle.

## Editor upgrades

- Shared editable item state now lives in BackendBridge atoms, not local-only Room state.
- Apply + Go Live commits edited items into mapAtom so changes persist into live simulation.
- Local layout save/load via localStorage.
- Reset to functional prefab.
- Room envelope resizing controls.
- Layout health summary.
- Select, nudge, rotate, move, clone, delete.
- Assign selected station to an agent.
- Furniture palette reorganized as a functional catalog with labels and categories.

## Current caveats

- Placement collision checks are still simple rectangle checks.
- Agent desk assignment updates the frontend agent state; backend persistence for agent-station mapping is still future work.
- LocalStorage save is browser-local only, not a backend project file save.
