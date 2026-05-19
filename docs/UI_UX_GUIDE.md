# UI / UX Guide

## Design intent

SimOffice should feel like a premium control system, not a translucent debug overlay. The 3D scene is the workspace; management UI should appear only when it helps the operator make a decision.

## Current interaction model

- **Top bar**: runtime, office name, time, speed, mode toggles.
- **Command rail**: compact agent switching.
- **Roster drawer**: full searchable team list when needed.
- **Right inspector**: focused agent or furniture management.
- **Runtime dock**: small connection messages without blocking the workspace.
- **Starter console**: collapsed by default; expanded when running guided prefab actions.

## UX rules

1. Never cover the center of the 3D office unless the user explicitly opens a drawer.
2. Prefer right-side inspectors over center overlays.
3. Keep the full roster hidden until requested.
4. Use clear runtime labels: `CREWAI`, `SIMAI`, `BACKEND OFFLINE`.
5. Avoid fake success states.
6. Show blocked actions as blocked, not silently failed.
7. Make furniture capabilities visible in plain language.
8. Keep manual task input near agent context.
9. Put dangerous actions behind approval states.
10. Treat every panel as an operator tool, not decoration.

## Next UI improvements

- Global command palette.
- Keyboard shortcuts.
- Drag-to-assign agent to station.
- Timeline of work products.
- Persistent right inspector route/state.
- Overview dashboard mode.
- Connector permission browser.
- Built-in onboarding tour.
