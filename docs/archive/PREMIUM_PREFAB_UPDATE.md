# Premium Prefab / Out-of-the-Box Feature Pass

This pass upgrades SimOffice from a sparse prototype floor into a usable premium starter office.

## What changed

### 1. New default office profile

The default office is now `Agentic Command Center`, not a generic two-person office. It activates the full operating team out of the box:

- CEO
- CTO
- CIO
- CFO
- Accounts/Billing
- Office Admin
- Scheduler
- Social Media Manager
- Content Creator

The older office types are still available, but the first-run experience now points users toward a complete agentic operations floor.

### 2. Premium office presets

`BackendBridge.jsx` now exports `OFFICE_PRESETS`. Each preset defines:

- label
- tagline
- active agents
- focus
- size
- starter brief
- starter tasks

The UI uses these presets during onboarding and for the premium starter console.

### 3. Premium starter console

Live mode now includes a collapsible bottom-center command panel. It exposes starter actions tied to the selected office preset, such as:

- Executive Brief
- System Readiness
- Launch Campaign
- Cost Guardrails
- Sprint Kickoff
- Campaign Sprint
- Creative Brief

These are real backend actions. They do not generate fake/demo output. They only run when CrewAI or SimAI is configured.

### 4. More complete prefab layout

The default map now includes additional premium functional nodes:

- KPI wall / operations dashboard
- office memory wall
- quick-reference shelf
- rapid-response hot desk
- creative QA hot desk
- west/east/south expansion pods
- broadcast-control console
- central collaboration hub

These still reuse the existing GLB furniture assets, but their metadata makes them function as agentic stations rather than decoration.

### 5. Station starter actions

`STATION_STARTER_ACTIONS` maps each functional station type to ready-to-run work products.

Examples:

- AI Workstation: operating brief, research sprint, decision memo
- Admin Workstation: admin runbook, approval queue, task routing
- Conference Table: executive standup, risk review, launch review
- Knowledge Base: knowledge audit, file work product
- Social Broadcast Console: launch campaign, caption studio, engagement playbook

The terminal station panel now shows those starter actions automatically.

## Validation

The frontend production build passes with:

```bash
cd client
node node_modules/vite/bin/vite.js build
```

The normal Vite warnings remain:

- Jotai `use client` directive ignored
- Three BVH `BatchedMesh` warning
- large chunk warning

These are non-fatal and existed before this pass.
