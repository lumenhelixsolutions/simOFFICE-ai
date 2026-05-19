# SimOffice UI Management Pass

This pass focuses on making the live office easier to manage without removing the functional agent-control features.

## Changes

- Moved the selected agent inspector to the right edge of the screen instead of covering the center of the 3D office.
- Moved furniture/station settings to the same right-side inspector zone.
- Hid the activity feed while an agent or furniture item is selected, preventing competing right-side panels.
- Added top-bar toggles for Team and Activity panels.
- Added compact floating buttons to bring Team or Activity back when hidden.
- Made the Premium Starter Console collapsed by default so it does not cover the room on first load.
- Reduced the offline backend warning into a smaller runtime dock with a Retry button.
- Increased panel opacity and contrast so controls are readable without washing out the 3D scene.
- Slightly widened the team rail so names and roles are easier to scan.

## Intended management flow

1. Use the Team rail to pick an agent.
2. The right-side inspector opens for that agent.
3. Use Control, SimAI, Skills, Workflows, Memory, and Log tabs from one consistent place.
4. Click furniture/stations to use the same right-side inspector zone for station setup.
5. Use Activity only when no inspector is open, keeping the screen uncluttered.
6. Open the Premium Starter Console only when launching preset actions.

## Runtime behavior

This pass does not reintroduce demo output. Agent work still requires either the local CrewAI/FastAPI backend or a configured SimAI backend.
