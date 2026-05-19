# SimOffice v7.1 Management UI Redesign

This pass replaces the previous translucent overlay layout with a command-shell layout:

- opaque, readable management panels
- left-side agent roster with live metrics
- right-side activity dock that is hidden by default
- right-side inspector drawers for agents and furniture
- compact top command bar with runtime, time, speed, team, activity, and edit controls
- agent/furniture drawers no longer use the pale glass overlay style
- panel spacing and contrast were increased for actual management use

## Build verification

```bash
cd client
npm install
npm run build
```

Build completed successfully. The remaining warnings are non-fatal Vite/Three bundle warnings already present in the project.
