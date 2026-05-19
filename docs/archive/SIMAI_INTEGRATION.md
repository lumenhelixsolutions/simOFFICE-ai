# SimOffice × SimAI Integration Notes

This build strips the useful SimAI concepts into SimOffice without copying the full SimAI UI.

## What was integrated

SimOffice now has a SimAI adapter in `client/src/components/BackendBridge.jsx`.

Supported runtime modes:

- `workflow` — sends agent tasks to `/api/workflows/{workflowId}/execute`.
- `a2a` — sends JSON-RPC `message/send` calls to `/api/a2a/serve/{agentId}`.
- `compat` — legacy/fallback shape for experimental `/api/a2a/agents/{agentId}/run` style adapters.

The adapter builds Sim-style agent inputs from the selected SimOffice agent:

- model
- messages
- system prompt
- user prompt
- temperature
- max output tokens
- response format JSON schema
- tools
- skills
- memory type
- conversation ID
- sliding window controls
- reasoning effort
- verbosity
- thinking level
- SimOffice station/governance metadata

## Environment variables

Set these when running the Vite frontend:

```bash
VITE_SIM_BASE_URL=http://localhost:3000
VITE_SIM_MODE=workflow
VITE_SIM_WORKFLOW_ID=<your-sim-workflow-id>
VITE_SIM_API_KEY=<optional-api-key>
VITE_SIM_SYNC_A2A_METADATA=false
```

For production, do not expose real API keys in the browser bundle. Proxy Sim calls through the SimOffice backend and keep secrets server-side.

## Agent panel additions

`client/src/components/AgentControlPanel.jsx` now includes a `SimAI` tab with controls for:

- run mode
- workflow ID
- A2A agent ID
- memory mode
- conversation ID
- sliding window size/tokens
- system prompt
- temperature
- max tokens
- reasoning effort
- response format schema
- tool gateway controls

Tool gateway modes:

- `None` disables the tool.
- `Auto` makes the tool available to the model.
- `Required` maps to Sim's forced tool-use intent.

## Furniture-to-tool bridge

Furniture is still the visual control plane. Assigned stations contribute capability context to the SimAI request. For example:

- workstation → model/task terminal context
- knowledge base → data/source memory context
- dashboard → analytics context
- social console → social marketing context
- conference table → multi-agent meeting context

## Validation

The client was built successfully with:

```bash
cd client
npm install
npm run build
```

The remaining warnings are non-fatal: Vite bundle size and the existing Three/Drei peer-version warning.
