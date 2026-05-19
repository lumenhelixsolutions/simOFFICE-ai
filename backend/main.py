"""
SimOffice — FastAPI Backend Server
Bridges the isometric frontend to CrewAI agent orchestration via WebSocket.

Usage:
    cd backend
    uvicorn main:app --reload --port 8080

Christopher Gordon Phillips · LumenHelix Solutions
"""

import os
import json
import asyncio
import traceback
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from crew import (
    run_agent_task, run_meeting, AGENT_CONFIGS, MODEL_MAP,
    get_all_furniture_info, check_requirements, get_registry_info,
)

# ── App setup ──────────────────────────────────────────────────
app = FastAPI(title="SimOffice Backend", version="0.7.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the frontend from parent directory
FRONTEND_DIR = Path(__file__).parent.parent
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.get("/")
async def serve_frontend():
    return FileResponse(str(FRONTEND_DIR / "index.html"))


# ── Agent state ────────────────────────────────────────────────
# Default models are derived directly from CrewAI definitions so the
# frontend and backend cannot drift when agents are added.
agent_models = {
    aid: cfg.get("default_model", "claude-sonnet")
    for aid, cfg in AGENT_CONFIGS.items()
}

agent_logs: dict[str, list] = {aid: [] for aid in AGENT_CONFIGS}

# Track which furniture types are near each agent's desk. These defaults
# are intentionally lightweight; the frontend can update them as layout
# changes are made.
agent_furniture: dict[str, list[str]] = {
    "ceo": ["desk"],
    "cto": ["desk", "srv"],
    "cfo": ["desk", "ledger"],
    "acc": ["desk", "billing"],
    "cio": ["desk", "srv"],
    "adm": ["desk", "cab", "prn"],
    "sch": ["desk", "calendar"],
    "smm": ["desk", "social"],
    "crt": ["desk", "content", "social"],
}

# Runtime governance/config state. The frontend can change these via
# update_agent_config; they are intentionally explicit so autonomy,
# approval, publishing, memory, and tool budget do not hide inside prompts.
agent_controls: dict[str, dict] = {
    aid: {
        "active": False,
        "control_mode": "auto",
        "priority": "normal",
        "approval_mode": "review",
        "publish_mode": "draft",
        "memory_scope": "office",
        "tool_budget": "balanced",
        "max_tool_runs": 2,
        "station_policy": "assigned-first",
        "enabled_skills": [],
        "disabled_skills": [],
        "escalation_target": "ceo",
    }
    for aid in AGENT_CONFIGS
}

# ── Connected WebSocket clients ────────────────────────────────
clients: set[WebSocket] = set()


async def broadcast(msg: dict):
    """Send a message to all connected frontend clients."""
    data = json.dumps(msg)
    disconnected = set()
    for ws in clients:
        try:
            await ws.send_text(data)
        except Exception:
            disconnected.add(ws)
    clients -= disconnected


# ── WebSocket endpoint ─────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)

    # Send initial state
    await ws.send_text(json.dumps({
        "type": "init",
        "agents": {
            aid: {
                "role": cfg.get("role"),
                "goal": cfg.get("goal"),
                "backstory": cfg.get("backstory"),
                "department": cfg.get("department"),
                "model": agent_models.get(aid, cfg.get("default_model", "claude-sonnet")),
                "log": agent_logs[aid][-10:],
                "furniture": agent_furniture.get(aid, []),
                **agent_controls.get(aid, {}),
            }
            for aid, cfg in AGENT_CONFIGS.items()
        },
        "furniture_registry": get_all_furniture_info(),
    }))

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            await handle_message(msg, ws)
    except WebSocketDisconnect:
        clients.discard(ws)
    except Exception as e:
        print(f"WebSocket error: {e}")
        traceback.print_exc()
        clients.discard(ws)


async def handle_message(msg: dict, ws: WebSocket):
    """Process incoming commands from the frontend."""
    cmd = msg.get("cmd")

    if cmd == "run_task":
        agent_id = msg["agent"]
        task_name = msg["task"]
        request_id = msg.get("request_id")
        source = msg.get("source", "manual")
        model = agent_models.get(agent_id)
        furniture = msg.get("furniture") or agent_furniture.get(agent_id, [])
        controls = agent_controls.get(agent_id, {})

        if controls.get("control_mode") == "paused":
            result = "[Paused] This agent is paused. Switch autonomy to Manual or Auto before running tasks."
            entry = {"task": task_name, "text": result, "ts": datetime.now().strftime("%H:%M"), "model": model, "source": source}
            await ws.send_text(json.dumps({"type": "task_result", "agent": agent_id, "task": task_name, "text": result, "ts": entry["ts"], "model": model, "source": source, "request_id": request_id}))
            return

        governed_task = (
            f"Runtime controls: autonomy={controls.get('control_mode')}, "
            f"approval={controls.get('approval_mode')}, publish_mode={controls.get('publish_mode')}, "
            f"memory_scope={controls.get('memory_scope')}, tool_budget={controls.get('tool_budget')}, "
            f"max_tool_runs={controls.get('max_tool_runs')}.\n"
            f"Available station furniture: {', '.join(furniture) if furniture else 'none'}.\n"
            f"User task: {task_name}"
        )

        await broadcast({"type": "agent_status", "agent": agent_id, "status": "thinking", "task": task_name})

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_agent_task, agent_id, governed_task, model, furniture)

        entry = {"task": task_name, "text": result, "ts": datetime.now().strftime("%H:%M"), "model": model, "source": source}
        agent_logs[agent_id].append(entry)

        await broadcast({
            "type": "task_result", "agent": agent_id, "task": task_name, "text": result,
            "ts": entry["ts"], "model": model, "source": source, "request_id": request_id,
        })

    elif cmd == "run_meeting":
        agent_ids = msg["agents"]
        topic = msg["topic"]

        await broadcast({
            "type": "meeting_start",
            "agents": agent_ids,
            "topic": topic,
        })

        loop = asyncio.get_event_loop()
        overrides = {aid: agent_models.get(aid) for aid in agent_ids}
        result = await loop.run_in_executor(
            None, run_meeting, agent_ids, topic, overrides
        )

        await broadcast({
            "type": "meeting_result",
            "agents": agent_ids,
            "topic": topic,
            "text": result,
            "ts": datetime.now().strftime("%H:%M"),
        })

    elif cmd == "change_model":
        agent_id = msg["agent"]
        new_model = msg["model"]
        if new_model in MODEL_MAP:
            agent_models[agent_id] = new_model
            await broadcast({
                "type": "model_changed",
                "agent": agent_id,
                "model": new_model,
            })

    elif cmd == "update_agent_config":
        agent_id = msg.get("agent")
        patch = msg.get("patch", {})
        if agent_id in agent_controls:
            # Accept both camelCase and snake_case from the UI, normalize key fields.
            aliases = {
                "controlMode": "control_mode",
                "approvalMode": "approval_mode",
                "publishMode": "publish_mode",
                "memoryScope": "memory_scope",
                "toolBudget": "tool_budget",
                "maxToolRuns": "max_tool_runs",
                "stationPolicy": "station_policy",
                "enabledSkills": "enabled_skills",
                "disabledSkills": "disabled_skills",
                "escalationTarget": "escalation_target",
            }
            normalized = {}
            for key, value in patch.items():
                normalized[aliases.get(key, key)] = value
            allowed = set(agent_controls[agent_id].keys())
            clean = {k: v for k, v in normalized.items() if k in allowed}
            agent_controls[agent_id].update(clean)
            await broadcast({"type": "agent_config_updated", "agent": agent_id, "patch": clean})

    elif cmd == "run_social_action":
        agent_id = msg.get("agent", "smm")
        action = msg.get("action", "Social action")
        brief = msg.get("brief", "")
        platforms = msg.get("platforms", [])
        publish_mode = msg.get("publish_mode", agent_controls.get(agent_id, {}).get("publish_mode", "draft"))
        model = agent_models.get(agent_id)
        furniture = list(set(agent_furniture.get(agent_id, []) + ["social", "content", "analytics"]))
        task_name = f"{action}: {brief}"
        prompt = (
            f"Social/marketing station action: {action}. Brief: {brief}. "
            f"Platforms: {', '.join(platforms)}. Publish mode: {publish_mode}. "
            "Return a practical marketing deliverable. Do not claim that you actually posted online unless an external connector confirms it."
        )
        await broadcast({"type": "agent_status", "agent": agent_id, "status": "thinking", "task": action})
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_agent_task, agent_id, prompt, model, furniture)
        entry = {"task": task_name, "text": result, "ts": datetime.now().strftime("%H:%M"), "model": model, "source": "social_station"}
        agent_logs.setdefault(agent_id, []).append(entry)
        await broadcast({"type": "task_result", "agent": agent_id, "task": task_name, "text": result, "ts": entry["ts"], "model": model, "source": "social_station"})

    elif cmd == "get_log":
        agent_id = msg["agent"]
        log = agent_logs.get(agent_id, [])
        await ws.send_text(json.dumps({
            "type": "agent_log",
            "agent": agent_id,
            "log": log[-20:],
        }))

    elif cmd == "set_keys":
        # Set API keys as environment variables
        if msg.get("anthropic"):
            os.environ["ANTHROPIC_API_KEY"] = msg["anthropic"]
        if msg.get("openai"):
            os.environ["OPENAI_API_KEY"] = msg["openai"]
        await ws.send_text(json.dumps({"type": "keys_set", "ok": True}))

    elif cmd == "ping":
        await ws.send_text(json.dumps({"type": "pong"}))

    elif cmd == "update_furniture":
        # Frontend reports which furniture is near each agent
        agent_id = msg["agent"]
        furn_list = msg["furniture"]  # list of furniture type IDs
        agent_furniture[agent_id] = furn_list
        # Report back what tools the agent now has
        info = {fid: get_registry_info(fid) for fid in furn_list}
        grants = []
        for fid in furn_list:
            grants.extend(get_registry_info(fid).get("grants", []))
        await broadcast({
            "type": "agent_tools_updated",
            "agent": agent_id,
            "furniture": furn_list,
            "grants": list(set(grants)),
        })

    elif cmd == "get_furniture_info":
        furn_id = msg.get("furniture_id")
        if furn_id:
            info = get_registry_info(furn_id)
            reqs = check_requirements(furn_id)
            await ws.send_text(json.dumps({
                "type": "furniture_info",
                "id": furn_id,
                **info,
                "requirements_met": reqs["met"],
                "requirements_detail": reqs["details"],
            }))
        else:
            await ws.send_text(json.dumps({
                "type": "furniture_registry",
                "registry": get_all_furniture_info(),
            }))


# ── Health check ───────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "agents": list(AGENT_CONFIGS.keys()),
        "models": agent_models,
        "agent_furniture": agent_furniture,
        "agent_controls": agent_controls,
        "has_anthropic_key": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "has_openai_key": bool(os.environ.get("OPENAI_API_KEY")),
    }


@app.get("/furniture")
async def furniture_registry():
    """Return the full furniture → tool mapping for the frontend."""
    return get_all_furniture_info()


# ── Run directly ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("\n  SimOffice Backend v0.7.2")
    print("  ─────────────────────")
    print("  Frontend: http://localhost:8080")
    print("  WebSocket: ws://localhost:8080/ws")
    print("  Health: http://localhost:8080/health\n")
    uvicorn.run(app, host="0.0.0.0", port=8080)
