# SimOffice Product Brief

## One-liner

SimOffice is a 3D command center for managing AI agent teams, tools, skills, workflows, memory, and human approval policies.

## Positioning

SimOffice sits between agent frameworks and humans. Frameworks such as CrewAI, workflow engines, and A2A runtimes can execute tasks, but they usually lack a spatial management interface. SimOffice makes the operational structure visible.

The product metaphor is simple: agents work in an office; furniture grants capabilities; departments shape responsibility; the command rail lets a human operator manage everything.

## Target users

- Developers building agentic workflows.
- Founders and operators who want a visual AI operations room.
- Researchers exploring human-in-the-loop AI control systems.
- Agencies managing marketing, content, client delivery, research, and reporting workflows.
- Open-source builders who want an extensible agent UI shell.

## Differentiators

1. **Spatial agent governance**: agents are not just prompts; they have location, department, station access, skills, and runtime state.
2. **No fake output**: backend execution is explicit. Offline mode supports editing, not pretend work.
3. **Furniture as permissions**: tool access can be visualized as a workstation, dashboard, table, broadcast console, or knowledge shelf.
4. **Commercial UX direction**: command rails, inspectors, runtime docks, and prefab operational flows are designed for daily use.
5. **Open-source extensibility**: the repo is designed for forks, integrations, and contribution.

## Product principles

- Function first, language later.
- Real backend or clear offline state.
- Human approval for risky actions.
- Station changes should change capability.
- Every agent configuration should be inspectable.
- UI should reduce ambiguity, not increase it.

## Current maturity

SimOffice is a strong alpha/prototype moving toward beta. The visual interaction model, real backend blocking, CrewAI integration, and premium prefab layout are present. Production hardening should focus on auth, secrets, persistence, team collaboration, and connector permissions.
