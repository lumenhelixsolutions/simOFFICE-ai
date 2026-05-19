# API Reference

## HTTP endpoints

### `GET /health`

Returns backend runtime state.

Useful fields:

- `status`
- `agents`
- `models`
- `agent_furniture`
- `agent_controls`
- `has_anthropic_key`
- `has_openai_key`

### `GET /furniture`

Returns the furniture registry used by the client to understand station capabilities.

## WebSocket endpoint

### `WS /ws`

Primary real-time bridge between the client and backend.

## Client-to-backend commands

### `run_task`

Runs a task against one agent.

```json
{
  "cmd": "run_task",
  "agent": "ceo",
  "task": "Create an executive operating brief",
  "source": "manual"
}
```

### `run_meeting`

Runs a multi-agent meeting.

```json
{
  "cmd": "run_meeting",
  "agents": ["ceo", "cto", "cfo"],
  "topic": "Launch readiness review"
}
```

### `update_agent_config`

Updates governance controls for one agent.

```json
{
  "cmd": "update_agent_config",
  "agent": "smm",
  "patch": {
    "approvalMode": "review",
    "publishMode": "draft",
    "toolBudget": "balanced"
  }
}
```

### `run_social_action`

Runs a marketing station action.

```json
{
  "cmd": "run_social_action",
  "agent": "smm",
  "action": "Launch Campaign",
  "brief": "Announce the open-source SimOffice release",
  "platforms": ["YouTube", "TikTok", "Instagram"],
  "publish_mode": "draft"
}
```

### `update_furniture`

Updates the furniture/tool context for an agent.

```json
{
  "cmd": "update_furniture",
  "agent": "cto",
  "furniture": ["deskComputer", "televisionModern"]
}
```

## Backend-to-client events

- `init`
- `task_result`
- `meeting_result`
- `agent_status`
- `agent_tools_updated`
- `agent_config_updated`
- `model_changed`
- `furniture_info`
- `furniture_registry`
