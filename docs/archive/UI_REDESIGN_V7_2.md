# SimOffice v7.2 — Command Rail UI Redesign

This pass moves SimOffice closer to a professional operations console instead of a translucent game overlay.

## What changed

- Replaced the default full-height left roster with a compact always-available agent rail.
- Added a full roster drawer that opens only when needed.
- Added search inside the roster so agents can be found by name, role, department, or model.
- Agent selection now clears furniture selection, reducing panel conflicts.
- Agent and furniture inspectors remain on the right as focused management drawers.
- Backend-offline notice is now a small bottom-right toast instead of a large banner competing with the workspace.
- Increased drawer width and contrast for real management work.
- Reduced default chrome so the 3D office stays visible and usable.

## Interaction model

1. Use the left rail for fast agent switching.
2. Click the top rail menu or the Roster button to open the detailed roster.
3. Click an agent to open the right inspector.
4. Open Activity only when reviewing completed work.
5. Keep the Premium Starter Console collapsed until launching preset workflows.

## Validation

Frontend build passed with:

```bash
cd client
npm install
npm run build
```

The same non-fatal Vite/Three warnings remain.
