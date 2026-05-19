"""
SimOffice — CrewAI Crew with Furniture Plugin Architecture
Each furniture item maps to CrewAI tools. Placing furniture near an
agent's desk grants that agent access to corresponding capabilities.

Christopher Gordon Phillips · LumenHelix Solutions
"""

import os
from typing import Optional
from crewai import Agent, Task, Crew, Process

# ── Model routing ──────────────────────────────────────────────
MODEL_MAP = {
    "claude-sonnet": "anthropic/claude-sonnet-4-6",
    "claude-opus":   "anthropic/claude-opus-4-6",
    "gpt-4o":        "openai/gpt-4o-mini",
    "llama-local":   "ollama/llama3.2",
    "mistral-local": "ollama/mistral",
}

# ── Furniture → CrewAI Tool Registry ───────────────────────────
# Each furniture type maps to CrewAI tools it provides.
# When furniture is placed near an agent's desk, the agent gets
# these tools added to their capabilities.
#
# Structure:
#   furniture_id → {
#     label: human name,
#     tools: list of tool specs (class_name, module, kwargs),
#     requires: list of env vars or config needed,
#     grants: human-readable list of what the agent can do,
#     ui_type: what kind of panel to render on click,
#   }

FURNITURE_REGISTRY = {
    "desk": {
        "label": "Workstation",
        "tools": [
            {"class": "SerperDevTool", "module": "crewai_tools", "kwargs": {}},
            {"class": "WebsiteSearchTool", "module": "crewai_tools", "kwargs": {}},
        ],
        "requires": ["SERPER_API_KEY"],
        "grants": ["Web search", "Website analysis", "Research"],
        "ui_type": "terminal",
    },
    "srv": {
        "label": "Server Rack",
        "tools": [
            {"class": "CodeInterpreterTool", "module": "crewai_tools", "kwargs": {}},
        ],
        "requires": [],
        "grants": ["Code execution", "Data processing", "System diagnostics"],
        "ui_type": "server_panel",
    },
    "cab": {
        "label": "Filing Cabinet",
        "tools": [
            {"class": "FileReadTool", "module": "crewai_tools", "kwargs": {}},
            {"class": "DirectoryReadTool", "module": "crewai_tools",
             "kwargs": {"directory": "./workspace"}},
        ],
        "requires": [],
        "grants": ["File reading", "Directory browsing", "Document retrieval"],
        "ui_type": "file_browser",
    },
    "prn": {
        "label": "Printer",
        "tools": [
            {"class": "FileReadTool", "module": "crewai_tools", "kwargs": {}},
        ],
        "requires": [],
        "grants": ["Report generation", "Document output"],
        "ui_type": "report_gen",
    },
    "tbl": {
        "label": "Conference Table",
        "tools": [],  # No tools — triggers multi-agent crew
        "requires": [],
        "grants": ["Multi-agent meetings", "Collaborative decisions"],
        "ui_type": "meeting",
    },
    "chair": {
        "label": "Chair",
        "tools": [],
        "requires": [],
        "grants": [],
        "ui_type": "none",
    },
    "plnt": {
        "label": "Plant",
        "tools": [],
        "requires": [],
        "grants": ["Office morale"],
        "ui_type": "none",
    },
}

# Additional furniture types that can be added to the palette
EXTENDED_REGISTRY = {
    # ── Marketing & Social Media ───────────────────────────────
    "social": {
        "label": "Social Media Station",
        "tools": [],  # Uses Composio at runtime
        "composio_apps": ["facebook", "youtube", "tiktok", "instagram"],
        "requires": ["COMPOSIO_API_KEY"],
        "grants": ["Post to social platforms", "Monitor engagement",
                    "Reply to comments", "Schedule content"],
        "ui_type": "social_dashboard",
        "department": "marketing",
    },
    "content": {
        "label": "Content Desk",
        "tools": [
            {"class": "SerperDevTool", "module": "crewai_tools", "kwargs": {}},
            {"class": "ScrapeWebsiteTool", "module": "crewai_tools", "kwargs": {}},
        ],
        "requires": ["SERPER_API_KEY"],
        "grants": ["Content research", "Competitor analysis", "Trend discovery"],
        "ui_type": "content_editor",
        "department": "marketing",
    },
    "analytics": {
        "label": "Analytics Screen",
        "tools": [
            {"class": "WebsiteSearchTool", "module": "crewai_tools", "kwargs": {}},
            {"class": "CSVSearchTool", "module": "crewai_tools", "kwargs": {}},
        ],
        "requires": [],
        "grants": ["Performance metrics", "Engagement analytics", "ROI tracking"],
        "ui_type": "analytics_dashboard",
        "department": "marketing",
    },
    # ── Finance & Billing ──────────────────────────────────────
    "billing": {
        "label": "Billing Terminal",
        "tools": [],  # Uses Composio at runtime
        "composio_apps": ["quickbooks", "stripe", "paypal"],
        "requires": ["COMPOSIO_API_KEY"],
        "grants": ["Invoice management", "Payment processing",
                    "Bill tracking", "Financial reconciliation"],
        "ui_type": "billing_panel",
        "department": "finance",
    },
    "ledger": {
        "label": "Accounts Ledger",
        "tools": [
            {"class": "FileReadTool", "module": "crewai_tools", "kwargs": {}},
            {"class": "CSVSearchTool", "module": "crewai_tools", "kwargs": {}},
        ],
        "requires": [],
        "grants": ["Transaction records", "Expense tracking", "Budget analysis"],
        "ui_type": "ledger_panel",
        "department": "finance",
    },
    # ── Operations & Scheduling ────────────────────────────────
    "calendar": {
        "label": "Calendar Station",
        "tools": [],  # Uses Composio at runtime
        "composio_apps": ["googlecalendar", "outlook", "calendly"],
        "requires": ["COMPOSIO_API_KEY"],
        "grants": ["Appointment setting", "Calendar management",
                    "Scheduling", "Reminder dispatch"],
        "ui_type": "calendar_panel",
        "department": "operations",
    },
    "reception": {
        "label": "Reception Desk",
        "tools": [
            {"class": "SerperDevTool", "module": "crewai_tools", "kwargs": {}},
            {"class": "FileReadTool", "module": "crewai_tools", "kwargs": {}},
        ],
        "requires": [],
        "grants": ["Visitor management", "Contact lookup", "Information desk"],
        "ui_type": "reception_panel",
        "department": "operations",
    },
    # ── General / Communication ────────────────────────────────
    "phone": {
        "label": "Phone",
        "tools": [],
        "composio_apps": ["twilio", "slack"],
        "requires": ["COMPOSIO_API_KEY"],
        "grants": ["Voice communication", "External calls", "Message dispatch"],
        "ui_type": "comm_panel",
        "department": "general",
    },
    "mail": {
        "label": "Mailbox",
        "tools": [],
        "composio_apps": ["gmail", "outlook"],
        "requires": ["COMPOSIO_API_KEY"],
        "grants": ["Email send/receive", "Notification dispatch"],
        "ui_type": "email_panel",
        "department": "general",
    },
    "board": {
        "label": "Whiteboard",
        "tools": [],
        "requires": ["OPENAI_API_KEY"],
        "grants": ["Visual ideation", "Diagram generation", "Shared planning"],
        "ui_type": "canvas",
        "department": "general",
    },
    "screen": {
        "label": "Display Monitor",
        "tools": [
            {"class": "WebsiteSearchTool", "module": "crewai_tools", "kwargs": {}},
            {"class": "YoutubeVideoSearchTool", "module": "crewai_tools", "kwargs": {}},
        ],
        "requires": [],
        "grants": ["Web monitoring", "Video analysis", "Dashboard display"],
        "ui_type": "display",
        "department": "general",
    },
}


def get_registry_info(furniture_id: str) -> dict:
    """Get the registry entry for a furniture type."""
    return (FURNITURE_REGISTRY.get(furniture_id)
            or EXTENDED_REGISTRY.get(furniture_id)
            or {"label": "Unknown", "tools": [], "requires": [],
                "grants": [], "ui_type": "none"})


def check_requirements(furniture_id: str) -> dict:
    """Check which requirements are met for a furniture type."""
    info = get_registry_info(furniture_id)
    status = {}
    for req in info["requires"]:
        status[req] = bool(os.environ.get(req))
    return {"met": all(status.values()) if status else True, "details": status}


# ── Tool instantiation ────────────────────────────────────────

def _load_tools(tool_specs: list) -> list:
    """Dynamically load CrewAI tools from specs. Returns empty list on import failure."""
    tools = []
    for spec in tool_specs:
        try:
            module = __import__(spec["module"], fromlist=[spec["class"]])
            cls = getattr(module, spec["class"])
            tool = cls(**spec.get("kwargs", {}))
            tools.append(tool)
        except (ImportError, AttributeError, Exception) as e:
            print(f"[SimOffice] Tool load skipped: {spec['class']} — {e}")
    return tools


def get_tools_for_agent(agent_id: str, nearby_furniture: list[str]) -> list:
    """
    Given an agent ID and the furniture types near their desk,
    return a list of instantiated CrewAI tools.
    """
    tools = []
    seen = set()
    for furn_id in nearby_furniture:
        info = get_registry_info(furn_id)
        for spec in info["tools"]:
            key = spec["class"]
            if key not in seen:
                seen.add(key)
                tools.extend(_load_tools([spec]))
    return tools


# ── Agent definitions ──────────────────────────────────────────

AGENT_CONFIGS = {
    # ── Executive ──────────────────────────────────────────────
    "ceo": {
        "role": "Chief Executive Officer",
        "goal": "Drive strategic direction, align the team, and make decisive calls",
        "backstory": (
            "You are Alex Chen, CEO. Direct, decisive, results-focused. "
            "When given a task, return a concise professional work product with clear decisions, assumptions, risks, and next actions."
        ),
        "default_model": "claude-sonnet",
        "department": "executive",
    },
    "cto": {
        "role": "Chief Technology Officer",
        "goal": "Ensure technical excellence and sound architecture decisions",
        "backstory": (
            "You are Marcus Webb, CTO. Technical, analytical, precise. "
            "Name concrete technologies, architectural tradeoffs, risks, and implementation steps."
        ),
        "default_model": "claude-opus",
        "department": "executive",
    },
    # ── Finance ────────────────────────────────────────────────
    "cfo": {
        "role": "Chief Financial Officer",
        "goal": "Track AI model costs, optimize token spend, manage budget",
        "backstory": (
            "You are Priya Singh, CFO. Track every dollar of AI cost. "
            "Give specific numbers, budget assumptions, recommendations, and risk flags."
        ),
        "default_model": "gpt-4o",
        "department": "finance",
    },
    "acc": {
        "role": "Accounts & Billing Agent",
        "goal": "Track invoices, schedule payments, manage expense reports, flag overdue bills",
        "backstory": (
            "You are Dana Kim, Accounts Agent. You manage invoices, bills, and payments "
            "with precision. You flag overdue items, summarize obligations, and report practical next steps to the CFO."
        ),
        "default_model": "gpt-4o",
        "department": "finance",
    },
    # ── Infrastructure ─────────────────────────────────────────
    "cio": {
        "role": "Chief Information Officer",
        "goal": "Maintain system reliability and manage data infrastructure",
        "backstory": (
            "You are James Torres, CIO. Monitor servers, pipelines, infra. "
            "Report in specific metrics, dependencies, risks, and recovery steps."
        ),
        "default_model": "llama-local",
        "department": "infrastructure",
    },
    # ── Operations ─────────────────────────────────────────────
    "adm": {
        "role": "Office Administrator",
        "goal": "Keep the team organized and administrative tasks flowing",
        "backstory": (
            "You are Sam Riley, Admin. Handle scheduling, filing, coordination. "
            "Provide practical coordination updates, blockers, owners, and deadlines."
        ),
        "default_model": "mistral-local",
        "department": "operations",
    },
    "sch": {
        "role": "Scheduler & Calendar Manager",
        "goal": "Manage appointments, calendar events, scheduling conflicts, and reminders",
        "backstory": (
            "You are Robin Park, Scheduler. You manage the team's calendar — "
            "setting appointments, resolving conflicts, sending reminders. "
            "Be precise, organized, and explicit about conflicts, reminders, and next calendar actions."
        ),
        "default_model": "mistral-local",
        "department": "operations",
    },
    # ── Marketing & Social Media ───────────────────────────────
    "smm": {
        "role": "Social Media Manager",
        "goal": "Manage social media presence, post content, monitor engagement, reply to comments",
        "backstory": (
            "You are Jordan Lee, Social Media Manager. You manage Facebook, YouTube, "
            "TikTok, and Instagram. You create posting schedules, monitor comments, "
            "track engagement, and prepare safe reply strategies. Draft outputs unless a real publishing connector confirms posting."
        ),
        "default_model": "claude-sonnet",
        "department": "marketing",
    },
    "crt": {
        "role": "Content Creator",
        "goal": "Write social media posts, blog content, ad copy, and marketing materials",
        "backstory": (
            "You are Maya Torres, Content Creator. You write engaging social media posts, "
            "blog articles, ad copy, and marketing content. You research trends, write "
            "multiple variants, optimize for each platform, and mark drafts versus publish-ready materials clearly."
        ),
        "default_model": "gpt-4o",
        "department": "marketing",
    },
}

# ── Department definitions ─────────────────────────────────────
DEPARTMENTS = {
    "executive": {
        "label": "Executive",
        "agents": ["ceo", "cto"],
        "color": "#d04848",
    },
    "finance": {
        "label": "Finance & Billing",
        "agents": ["cfo", "acc"],
        "color": "#30a860",
    },
    "infrastructure": {
        "label": "Infrastructure",
        "agents": ["cio"],
        "color": "#9048c8",
    },
    "operations": {
        "label": "Operations",
        "agents": ["adm", "sch"],
        "color": "#c88838",
    },
    "marketing": {
        "label": "Marketing & Social Media",
        "agents": ["smm", "crt"],
        "color": "#4090e0",
    },
}

# ── Agent + task execution ─────────────────────────────────────

def create_agent(
    agent_id: str,
    model_override: str = None,
    nearby_furniture: list[str] = None,
) -> Agent:
    """Create a CrewAI Agent with tools determined by nearby furniture."""
    config = AGENT_CONFIGS.get(agent_id)
    if not config:
        raise ValueError(f"Unknown agent: {agent_id}")

    model_key = model_override or config["default_model"]
    llm_model = MODEL_MAP.get(model_key, MODEL_MAP["claude-sonnet"])

    # Load tools based on furniture
    tools = []
    if nearby_furniture:
        tools = get_tools_for_agent(agent_id, nearby_furniture)

    return Agent(
        role=config["role"],
        goal=config["goal"],
        backstory=config["backstory"],
        llm=llm_model,
        tools=tools,
        verbose=False,
        allow_delegation=False,
        max_iter=2 if tools else 1,  # More iterations if agent has tools
    )


def run_agent_task(
    agent_id: str,
    task_description: str,
    model_override: str = None,
    nearby_furniture: list[str] = None,
) -> str:
    """Run a single agent task through CrewAI."""
    try:
        agent = create_agent(agent_id, model_override, nearby_furniture)
        task = Task(
            description=task_description,
            expected_output="A useful professional work product: concise, specific, actionable, and honest about assumptions. Do not pretend to use unavailable external tools.",
            agent=agent,
        )
        crew = Crew(
            agents=[agent],
            tasks=[task],
            process=Process.sequential,
            verbose=False,
        )
        result = crew.kickoff()
        return str(result).strip()
    except Exception as e:
        return f"[Agent error: {str(e)[:120]}]"


def run_meeting(
    agent_ids: list[str],
    topic: str,
    model_overrides: dict = None,
    furniture_map: dict = None,
) -> list[dict]:
    """
    Run a multi-agent meeting. Returns a list of {agent_id, response} dicts.
    Each agent responds individually to maintain per-agent output tracking.
    """
    results = []
    for aid in agent_ids:
        override = (model_overrides or {}).get(aid)
        furniture = (furniture_map or {}).get(aid, [])
        try:
            agent = create_agent(aid, override, furniture)
            task = Task(
                description=(
                    f"You're in a team meeting about: {topic}. "
                    "Give your brief perspective based on your role. 2-3 sentences max."
                ),
                expected_output="A concise meeting contribution with status, risks, and one next action.",
                agent=agent,
            )
            crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
            result = str(crew.kickoff()).strip()
            results.append({"agent": aid, "text": result})
        except Exception as e:
            results.append({"agent": aid, "text": f"[Error: {str(e)[:80]}]"})
    return results


# ── Registry query endpoints (called by main.py) ──────────────

def get_all_furniture_info() -> dict:
    """Return the full registry for the frontend to render."""
    combined = {**FURNITURE_REGISTRY, **EXTENDED_REGISTRY}
    result = {}
    for fid, info in combined.items():
        reqs = check_requirements(fid)
        result[fid] = {
            "label": info["label"],
            "grants": info["grants"],
            "requires": info["requires"],
            "requirements_met": reqs["met"],
            "requirements_detail": reqs["details"],
            "ui_type": info["ui_type"],
            "tool_count": len(info["tools"]),
            "department": info.get("department", "general"),
            "composio_apps": info.get("composio_apps", []),
        }
    return result


def get_all_agents_info() -> dict:
    """Return the full agent roster for the frontend."""
    result = {}
    for aid, config in AGENT_CONFIGS.items():
        result[aid] = {
            "role": config["role"],
            "backstory": config["backstory"],
            "default_model": config["default_model"],
            "department": config.get("department", "general"),
        }
    return result


def get_departments_info() -> dict:
    """Return department structure for the frontend."""
    return DEPARTMENTS
