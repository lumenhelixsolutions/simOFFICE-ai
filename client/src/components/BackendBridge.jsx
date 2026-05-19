/**
 * SimOffice — State + CrewAI Role Sync + LLM Client
 * Functional office layout + editor-ready state.
 *
 * Design rule: furniture is not decoration. Each default item either unlocks
 * an agent capability, marks a work zone, or supports agent movement/seating.
 */
import { atom, useAtom } from "jotai";
import { useEffect } from "react";


// ── SIMAI / SIM STUDIO INTEGRATION ────────────────────────────
// These Vite env vars let SimOffice use a self-hosted or cloud Sim backend.
// For production, route these calls through your own backend proxy so secrets
// are not exposed to the browser bundle.
export const SIM_BASE_URL = (import.meta.env.VITE_SIM_BASE_URL || "").replace(/\/$/, "");
export const SIM_API_KEY = import.meta.env.VITE_SIM_API_KEY || "";
export const SIM_MODE = import.meta.env.VITE_SIM_MODE || "workflow"; // workflow | a2a | compat
export const SIM_WORKFLOW_ID = import.meta.env.VITE_SIM_WORKFLOW_ID || "";
export const SIM_SYNC_A2A_METADATA = import.meta.env.VITE_SIM_SYNC_A2A_METADATA === "true";

export const simConnectedAtom = atom(Boolean(SIM_BASE_URL));
export const simStatusAtom = atom({
  mode: SIM_MODE,
  baseUrl: SIM_BASE_URL,
  workflowId: SIM_WORKFLOW_ID,
  lastError: "",
  lastSync: null,
});

export const taskBackendReadyAtom = atom((get) => Boolean(get(connectedAtom) || SIM_BASE_URL));

export function runtimeBackendLabel(isCrewConnected = false) {
  if (SIM_BASE_URL) return `SimAI ${SIM_MODE}`;
  if (isCrewConnected) return "CrewAI";
  return "Backend required";
}

export const SIM_TOOL_CATALOG = {
  communication:{ label:"Communication", description:"Email/chat/social draft workflows.", type:"communication", defaultUsage:"auto" },
  data_sources:{ label:"Data Sources", description:"Documents, tables, vector stores, and structured data.", type:"data", defaultUsage:"auto" },
  web_services:{ label:"Web Services", description:"Search, scraping, browser and retrieval workflows.", type:"web", defaultUsage:"auto" },
  development:{ label:"Development", description:"GitHub, issues, CI, code review, release checks.", type:"dev", defaultUsage:"auto" },
  ai_services:{ label:"AI Services", description:"Model routing and AI media/service blocks.", type:"ai", defaultUsage:"auto" },
  social_marketing:{ label:"Social Marketing", description:"Campaign, caption, publishing and analytics workflows.", type:"social", defaultUsage:"auto" },
};

export const SIM_MEMORY_TYPES = ["none", "conversation", "sliding_window", "sliding_window_tokens"];
export const SIM_EXECUTION_MODES = ["workflow", "a2a", "compat"];

// ── ATOMS ─────────────────────────────────────────────────────
export const modeAtom = atom("onboarding");
export const officeAtom = atom({ name:"SimOffice Command Center", type:"Agentic Command Center", size:"15+", focus:"Operations" });
export const speedAtom = atom(0);
export const simTimeAtom = atom(540);
export const simDayAtom = atom(0);
export const feedAtom = atom([]);
export const connectedAtom = atom(false);
export const selectedAgentAtom = atom(null);
export const selectedFurnitureAtom = atom(null);
export const furnitureRegistryAtom = atom({});


export const OFFICE_PRESETS = {
  "Agentic Command Center":{
    label:"Agentic Command Center",
    tagline:"Full-stack AI operations floor with every role active out of the box.",
    activeAgents:["ceo","cto","cio","cfo","acc","adm","sch","smm","crt"],
    focus:"Operations",
    size:"15+",
    starterBrief:"Run the full company from a command row, meeting hub, records wall, marketing console, and operations dashboard.",
    starterTasks:[
      { label:"Executive Brief", agent:"ceo", prompt:"Create a premium executive operating brief for this office: priorities, risks, owners, and next actions." },
      { label:"System Readiness", agent:"cio", prompt:"Audit backend, data, API, model routing, and monitoring readiness. Return red/yellow/green status and fixes." },
      { label:"Launch Campaign", agent:"smm", prompt:"Create a polished launch campaign plan with platform-specific deliverables, schedule, approval path, and analytics." },
      { label:"Cost Guardrails", agent:"cfo", prompt:"Create a cost-control policy for AI usage, model routing, review thresholds, and weekly budget reporting." },
    ],
  },
  "Tech Startup":{
    label:"Tech Startup",
    tagline:"Product, engineering, infra, admin, and launch support.",
    activeAgents:["ceo","cto","cio","adm","smm","crt"],
    focus:"Product dev",
    size:"6–15",
    starterBrief:"Ship product while keeping infrastructure, messaging, and operating rhythm visible.",
    starterTasks:[
      { label:"Sprint Kickoff", agent:"cto", prompt:"Create a sprint kickoff plan with architecture tasks, risks, acceptance criteria, and owners." },
      { label:"Product Launch", agent:"crt", prompt:"Draft product launch copy, content themes, and a short landing-page outline." },
    ],
  },
  "Marketing Agency":{
    label:"Marketing Agency",
    tagline:"Campaign production studio with approval and analytics loops.",
    activeAgents:["ceo","adm","sch","smm","crt","cfo"],
    focus:"Client work",
    size:"6–15",
    starterBrief:"Plan, draft, approve, schedule, and measure multi-platform campaigns.",
    starterTasks:[
      { label:"Campaign Sprint", agent:"smm", prompt:"Create a client campaign sprint plan with deliverables, review gates, platform mix, and reporting cadence." },
      { label:"Creative Concepts", agent:"crt", prompt:"Generate three campaign creative concepts with hooks, visual direction, captions, and CTAs." },
    ],
  },
  "Law Firm":{
    label:"Law Firm",
    tagline:"Client intake, scheduling, records, billing, and research coordination.",
    activeAgents:["ceo","cfo","acc","adm","sch"],
    focus:"Client work",
    size:"6–15",
    starterBrief:"Keep intake, scheduling, records, billing, and task delegation orderly.",
    starterTasks:[
      { label:"Client Intake SOP", agent:"adm", prompt:"Draft a professional client intake workflow with routing, records, scheduling, billing, and follow-up steps." },
      { label:"Billing Review", agent:"acc", prompt:"Create a billing review checklist for invoices, payment follow-ups, and overdue tracking." },
    ],
  },
  "Design Studio":{
    label:"Design Studio",
    tagline:"Creative production floor with review, content, marketing, and technical support.",
    activeAgents:["ceo","cto","adm","smm","crt"],
    focus:"Research",
    size:"6–15",
    starterBrief:"Move from concept to campaign through huddles, review nodes, and publishing preparation.",
    starterTasks:[
      { label:"Creative Brief", agent:"crt", prompt:"Create a design-studio creative brief with audience, mood, deliverables, constraints, and review process." },
      { label:"Visibility Plan", agent:"smm", prompt:"Create a visibility plan for showing design work across social platforms and portfolio channels." },
    ],
  },
  "Generic Office":{
    label:"Generic Office",
    tagline:"General-purpose AI office with admin, executive, and optional departments.",
    activeAgents:["ceo","adm","sch","cfo"],
    focus:"Operations",
    size:"2–5",
    starterBrief:"A flexible operating floor for general administration and coordination.",
    starterTasks:[
      { label:"Daily Office Plan", agent:"adm", prompt:"Create today’s operating plan: priorities, meetings, blockers, owners, and next steps." },
    ],
  },
};

export const MODEL_OPTIONS = [
  { id:"claude-sonnet", label:"Claude Sonnet", lane:"cloud" },
  { id:"claude-opus", label:"Claude Opus", lane:"cloud" },
  { id:"gpt-4o", label:"GPT-4o Mini", lane:"cloud" },
  { id:"llama-local", label:"Llama Local", lane:"local" },
  { id:"mistral-local", label:"Mistral Local", lane:"local" },
];

export const CONTROL_MODES = {
  auto:{ label:"Auto", description:"Agent receives scheduled work from the simulation." },
  manual:{ label:"Manual", description:"Agent only runs tasks you assign." },
  paused:{ label:"Paused", description:"Agent stops movement and automatic work." },
};

// Editor/layout atoms live here so Room and UI can share them without circular imports.
export const roomItemsAtom = atom([]);
export const editorSelectedItemAtom = atom(null);
export const editorNoticeAtom = atom("Functional layout: every default item is tied to a tool, skill, workspace, or movement anchor.");

// Shared anchors for movement logic. Coordinates are grid cells, not world units.
export const LAYOUT_ANCHORS = {
  meeting:[13,10],
  dashboard:[22,3],
  knowledge:[3,21],
  expansionNW:[2,7],
  expansionE:[23,8],
  expansionS:[13,21],
};

// ── DEPARTMENTS ───────────────────────────────────────────────
export const DEPARTMENTS = {
  executive:     { label:"Executive",      color:"#d04848", icon:"👔" },
  finance:       { label:"Finance",        color:"#30a860", icon:"💰" },
  infrastructure:{ label:"Infrastructure", color:"#9048c8", icon:"🖧" },
  operations:    { label:"Operations",     color:"#c88838", icon:"📋" },
  marketing:     { label:"Marketing",      color:"#4090e0", icon:"📱" },
};

// ── PREFAB AGENT DEFINITIONS (CrewAI-aligned) ─────────────────
// desk = the agent's standing/work anchor near their workstation chair.
export const AGENT_DEFS = [
  { id:"ceo",name:"Alex Chen",   role:"Chief Executive Officer",  dept:"executive",      color:"#d04848",model:"claude-sonnet",desk:[3,4],
    goal:"Drive strategic direction and align the team",
    backstory:"Direct, decisive, results-focused. Under 50 words." },
  { id:"cto",name:"Marcus Webb", role:"Chief Technology Officer", dept:"executive",      color:"#4858d0",model:"claude-opus",  desk:[9,4],
    goal:"Ensure technical excellence and architecture decisions",
    backstory:"Technical, analytical, precise. Names real technologies." },
  { id:"cio",name:"James Torres",role:"Chief Information Officer", dept:"infrastructure", color:"#9048c8",model:"llama-local",  desk:[15,4],
    goal:"Maintain systems, manage data infrastructure",
    backstory:"Monitors servers and pipelines. Reports in metrics." },
  { id:"cfo",name:"Priya Singh", role:"Chief Financial Officer",  dept:"finance",        color:"#30a860",model:"gpt-4o",       desk:[3,16],
    goal:"Track AI costs, optimize spend, manage budget",
    backstory:"Tracks every dollar. Specific numbers and recommendations." },
  { id:"acc",name:"Dana Kim",    role:"Accounts & Billing",       dept:"finance",        color:"#40b870",model:"gpt-4o",       desk:[8,16],
    goal:"Track invoices, schedule payments, manage expenses",
    backstory:"Precise with invoices and payments. Flags overdue items." },
  { id:"adm",name:"Sam Riley",   role:"Office Administrator",     dept:"operations",     color:"#c88838",model:"mistral-local",desk:[14,17],
    goal:"Keep the team organized, tasks flowing",
    backstory:"Handles scheduling, filing, coordination." },
  { id:"sch",name:"Robin Park",  role:"Scheduler",                dept:"operations",     color:"#d0a040",model:"mistral-local",desk:[19,17],
    goal:"Manage calendar, appointments, resolve conflicts",
    backstory:"Precise, organized. Manages the team calendar." },
  { id:"smm",name:"Jordan Lee",  role:"Social Media Manager",     dept:"marketing",      color:"#4090e0",model:"claude-sonnet",desk:[24,15],
    goal:"Manage social presence, post content, monitor engagement",
    backstory:"Manages FB, YouTube, TikTok, Instagram. Tracks engagement." },
  { id:"crt",name:"Maya Torres", role:"Content Creator",          dept:"marketing",      color:"#50a0f0",model:"gpt-4o",       desk:[24,20],
    goal:"Write posts, research trends, create marketing materials",
    backstory:"Writes engaging copy. Researches trends. A/B tests." },
];

export const AGENT_TASKS = {
  ceo:[{t:"Strategic planning",s:"work"},{t:"All-hands meeting",s:"meet"},{t:"Reviewing dashboard",s:"move",target:"dashboard"},{t:"1:1 with CTO",s:"move"}],
  cto:[{t:"Architecture review",s:"work"},{t:"Sprint planning",s:"meet"},{t:"Server check",s:"move",target:"dashboard"},{t:"Code review",s:"work"}],
  cfo:[{t:"Budget analysis",s:"work"},{t:"Token cost review",s:"work"},{t:"Filing reports",s:"move",target:"knowledge"},{t:"Finance sync",s:"meet"}],
  acc:[{t:"Invoice tracking",s:"work"},{t:"Payment scheduling",s:"work"},{t:"Expense audit",s:"move",target:"knowledge"},{t:"Report to CFO",s:"move"}],
  cio:[{t:"System monitoring",s:"work"},{t:"Infrastructure dashboard",s:"move",target:"dashboard"},{t:"Pipeline check",s:"work"},{t:"IT strategy",s:"meet"}],
  adm:[{t:"Scheduling",s:"work"},{t:"Filing documents",s:"move",target:"knowledge"},{t:"Calendar mgmt",s:"work"},{t:"Coordination",s:"meet"}],
  sch:[{t:"Set appointments",s:"work"},{t:"Resolve conflicts",s:"work"},{t:"Daily briefing",s:"meet"},{t:"Weekly planning",s:"work"}],
  smm:[{t:"Schedule posts",s:"work"},{t:"Monitor engagement",s:"work"},{t:"Reply to comments",s:"work"},{t:"Analytics review",s:"move",target:"dashboard"}],
  crt:[{t:"Write social post",s:"work"},{t:"Research trends",s:"work"},{t:"Creative huddle",s:"meet"},{t:"Content review",s:"meet"}],
};

export const DEFAULT_AGENT_RUNTIME = {
  controlMode:"auto",
  priority:"normal",
  target:"desk",
  approvalMode:"review",
  publishMode:"draft",
  memoryScope:"office",
  toolBudget:"balanced",
  maxToolRuns:2,
  stationPolicy:"assigned-first",
  enabledSkills:[],
  disabledSkills:[],
  escalationTarget:"ceo",
  simExecutionMode:SIM_MODE,
  simWorkflowId:"",
  simAgentId:"",
  systemPrompt:"",
  temperature:0.3,
  maxTokens:8000,
  responseFormat:"",
  memoryType:"none",
  conversationId:"",
  slidingWindowSize:"10",
  slidingWindowTokens:"4000",
  reasoningEffort:"auto",
  verbosity:"auto",
  thinkingLevel:"none",
  tools:[],
  skills:[],
};

function defaultSystemPrompt(agent) {
  return `You are ${agent.name}, the ${agent.role} for this SimOffice.\n\nRole goal: ${agent.goal || "Complete assigned work with professional judgment."}\nBackstory/style: ${agent.backstory || "Be clear, specific, practical, and accountable."}\n\nOperate as a professional agent. Respect approval mode, publishing mode, tool budget, memory scope, and station assignments. Return useful work product, not roleplay filler.`;
}

export const agentsAtom = atom(AGENT_DEFS.map((a,i) => ({
  ...a,
  ...DEFAULT_AGENT_RUNTIME,
  active:false,
  position:[...a.desk], path:[], pathIdx:0,
  task:"Idle", status:"work", taskIdx:0, taskTimer:300+i*250,
  systemPrompt:defaultSystemPrompt(a),
  simAgentId:a.id,
  pending:false, lastLLM:0, output:"", log:[], face:1, bubbleText:"", showBubble:false,
  furniture:[], grants:[], lastTaskSource:"system",
})));

// ── FURNITURE TYPES ───────────────────────────────────────────
export const FURN_TYPES = {
  deskComputer:{ icon:"🖥",label:"AI Workstation", category:"Workstations", uiType:"terminal", registryId:"desk", skillPack:"research_command",
    grants:["LLM task console","Research/web tool","Agent command queue","Prompt/run history"],
    purpose:"Primary work node. Assign it to an agent to give that role a command surface, model router, task queue, and work history." },
  desk:{ icon:"⌨️",label:"Admin Workstation", category:"Workstations", uiType:"terminal", registryId:"desk", skillPack:"office_ops",
    grants:["Workspace","Task routing","Local commands","Approval queue"],
    purpose:"Lower-overhead desk node for admin, scheduling, finance, or support roles. It can route work without implying a high-cost cloud model." },
  laptop:{ icon:"💻",label:"Portable Terminal", category:"Workstations", uiType:"terminal", registryId:"desk", skillPack:"mobile_ops",
    grants:["Mobile computing","Temporary agent station","Field notes"],
    purpose:"Portable one-cell command node for future hot desks, field agents, contractors, or temporary campaign work." },
  table:{ icon:"🪑",label:"Conference Table", category:"Collaboration", uiType:"meeting", registryId:"tbl", skillPack:"crew_meeting",
    grants:["Multi-agent meetings","CEO follow-up","Delegation chain","Decision record"],
    purpose:"Formal meeting tool. Starts a structured round-robin status chain across active agents and writes a decision record." },
  tableCoffee:{ icon:"☕",label:"Creative Huddle Table", category:"Collaboration", uiType:"meeting", registryId:"tbl", skillPack:"creative_review",
    grants:["Informal discussion","Creative review","Campaign sync","Concept critique"],
    purpose:"Small collaboration node for ideation, content review, campaign planning, and fast creative critique." },
  televisionModern:{icon:"📺",label:"Operations Dashboard", category:"Dashboards", uiType:"display", registryId:"analytics", skillPack:"metrics_dashboard",
    grants:["Office metrics","Agent status","Presentations","Campaign analytics","Cost view"],
    purpose:"Shared visibility surface for tasks, status, budget, system health, campaign metrics, and future KPI widgets." },
  bookcaseClosedWide:{icon:"📚",label:"Knowledge Base", category:"Knowledge", uiType:"files", registryId:"cab", skillPack:"memory_records",
    grants:["File storage","Retrieval","Work logs","Reference memory"],
    purpose:"Persistent record store. Completed agent work appears here as office documentation and retrieval memory." },
  bookcaseOpenLow:{icon:"🗂",label:"Open File Shelf", category:"Knowledge", uiType:"files", registryId:"cab", skillPack:"department_records",
    grants:["Open records","Shared references","Department memory"],
    purpose:"Secondary file/retrieval node for department-local records and shared campaign references." },
  radio:{ icon:"📡",label:"Social Broadcast Console", category:"Marketing", uiType:"social", registryId:"social", skillPack:"social_marketing",
    grants:["Social campaign planning","Post drafting","Platform scheduling","Engagement reply plan","Analytics review"],
    purpose:"Marketing control surface. Assign it to the Social Media Manager or Content Creator to draft, schedule, review, and route social media work." },
  chair:{ icon:"🪑",label:"Task Chair", category:"Support", uiType:"seat",
    grants:["Agent seat","Path anchor"],
    purpose:"Functional seating anchor for agent placement and workstation readability." },
  chairCushion:{ icon:"🪑",label:"Executive Chair", category:"Support", uiType:"seat",
    grants:["Agent seat","Executive station anchor"],
    purpose:"Executive seating anchor tied to command workstations." },
  chairModernCushion:{ icon:"🪑",label:"Meeting Chair", category:"Support", uiType:"seat",
    grants:["Meeting seat","Collaboration anchor"],
    purpose:"Meeting/collaboration seating anchor, useful for future attendance logic." },
  loungeChair:{ icon:"🛋",label:"Focus Chair", category:"Support", uiType:"seat",
    grants:["Focus work","Informal review"],
    purpose:"Optional deep-work or informal review node; useful for later morale/focus mechanics." },
  rugRectangle:{ icon:"▭",label:"Expansion Zone", category:"Zones", uiType:"zone",
    grants:["Walkable planning zone","Future department space"],
    purpose:"Walkable zone marker for expansion and safe movement. It should never block agents." },
  rugRound:{ icon:"○",label:"Huddle Zone", category:"Zones", uiType:"zone",
    grants:["Walkable huddle zone"],
    purpose:"Walkable marker for informal collaboration areas." },
  rugSquare:{ icon:"□",label:"Department Zone", category:"Zones", uiType:"zone",
    grants:["Walkable department marker"],
    purpose:"Walkable marker for a department footprint or future expansion pod." },
};

export const STATION_STARTER_ACTIONS = {
  deskComputer:[
    { label:"Operating Brief", prompt:"Create a concise operating brief for this station: objective, current status, risks, required tools, and next actions." },
    { label:"Research Sprint", prompt:"Run a research sprint plan: questions, sources/tools to use, expected deliverables, and validation checklist." },
    { label:"Decision Memo", prompt:"Draft a decision memo with context, options, recommendation, risks, and owner assignments." },
  ],
  desk:[
    { label:"Admin Runbook", prompt:"Create an admin runbook for the selected office function: steps, owners, checks, escalation, and recordkeeping." },
    { label:"Approval Queue", prompt:"Create a review-and-approval queue with priority, decision needed, deadline, owner, and next action." },
    { label:"Task Routing", prompt:"Route open work into an ordered action list with responsible agent, dependency, and expected output." },
  ],
  laptop:[
    { label:"Rapid Response", prompt:"Create a rapid-response plan for an urgent issue: triage, facts needed, responsible agent, message, and resolution path." },
    { label:"Field Notes", prompt:"Create structured field notes and extract follow-up tasks, risks, and records to file." },
  ],
  table:[
    { label:"Executive Standup", prompt:"Run an executive standup agenda: status, decisions needed, blockers, owner commitments, and follow-up record." },
    { label:"Risk Review", prompt:"Run a risk review meeting: identify top risks, severity, mitigation, owner, and review cadence." },
    { label:"Launch Review", prompt:"Run a launch-readiness review: product, infrastructure, finance, marketing, operations, and final checklist." },
  ],
  tableCoffee:[
    { label:"Creative Critique", prompt:"Run a creative critique: strongest idea, weak points, audience fit, revisions, and next draft instructions." },
    { label:"Content Huddle", prompt:"Run a content huddle: themes, channels, deliverables, schedule, and review owner." },
  ],
  televisionModern:[
    { label:"Dashboard Spec", prompt:"Define a premium dashboard spec: KPIs, data sources, refresh cadence, alert thresholds, and decision uses." },
    { label:"Weekly Metrics", prompt:"Create a weekly metrics review with trend, exceptions, causes, and next actions." },
  ],
  bookcaseClosedWide:[
    { label:"Knowledge Audit", prompt:"Audit office knowledge records: what should be stored, retrieval tags, gaps, stale records, and maintenance cadence." },
    { label:"File Work Product", prompt:"Convert recent agent work into a clean, searchable record with title, summary, tags, decisions, and next steps." },
  ],
  bookcaseOpenLow:[
    { label:"Department Notes", prompt:"Create a department memory note: active decisions, open loops, references, and next review date." },
  ],
  radio:[
    { label:"Launch Campaign", prompt:"Create a full launch campaign: audience, promise, platform plan, captions, content calendar, approval path, and KPIs." },
    { label:"Caption Studio", prompt:"Create caption variants for each selected platform with hooks, tone options, CTAs, and hashtag suggestions." },
    { label:"Engagement Playbook", prompt:"Create a comment/reply playbook for questions, supporters, skeptics, trolls, prospects, and collaborators." },
  ],
};

// ── DEFAULT MAP ───────────────────────────────────────────────
// 14 × 12 world units at gridDivision 2 = 28 × 24 editable cells.
// The empty east/south space is intentional expansion capacity.
export const DEFAULT_MAP = {
  size:[14,12], gridDivision:2,
  items:[
    // Executive / technical command row
    {name:"deskComputer",size:[3,2],gridPosition:[2,2],rotation:0,assignedAgent:"ceo",zone:"Executive Command"},
    {name:"chairCushion",size:[1,1],gridPosition:[3,4],rotation:0,assignedAgent:"ceo",zone:"Executive Command"},
    {name:"deskComputer",size:[3,2],gridPosition:[8,2],rotation:0,assignedAgent:"cto",zone:"Technical Command"},
    {name:"chairCushion",size:[1,1],gridPosition:[9,4],rotation:0,assignedAgent:"cto",zone:"Technical Command"},
    {name:"deskComputer",size:[3,2],gridPosition:[14,2],rotation:0,assignedAgent:"cio",zone:"Infrastructure"},
    {name:"chair",size:[1,1],gridPosition:[15,4],rotation:0,assignedAgent:"cio",zone:"Infrastructure"},

    // Shared visibility / knowledge wall
    {name:"televisionModern",size:[4,2],gridPosition:[21,1],rotation:2,zone:"Command Wall",premiumNode:"kpi-wall"},
    {name:"radio",size:[1,1],gridPosition:[26,2],rotation:2,assignedAgent:"smm",zone:"Marketing Broadcast",premiumNode:"broadcast-control"},
    {name:"bookcaseClosedWide",size:[3,1],gridPosition:[21,4],rotation:2,zone:"Knowledge Wall",premiumNode:"office-memory"},
    {name:"bookcaseOpenLow",size:[2,1],gridPosition:[25,4],rotation:2,zone:"Reference Shelf",premiumNode:"quick-reference"},
    {name:"laptop",size:[1,1],gridPosition:[20,5],rotation:2,zone:"Rapid Response Hot Desk",premiumNode:"incident-console"},

    // Central meeting hub with deliberate circulation lanes around it
    {name:"rugRectangle",size:[10,6],gridPosition:[8,7],rotation:0,walkable:true,zone:"Central Expansion / Collaboration"},
    {name:"table",size:[6,3],gridPosition:[10,8],rotation:0,zone:"Central Meeting"},
    {name:"chairModernCushion",size:[1,1],gridPosition:[9,8],rotation:1,zone:"Central Meeting"},
    {name:"chairModernCushion",size:[1,1],gridPosition:[9,10],rotation:1,zone:"Central Meeting"},
    {name:"chairModernCushion",size:[1,1],gridPosition:[16,8],rotation:3,zone:"Central Meeting"},
    {name:"chairModernCushion",size:[1,1],gridPosition:[16,10],rotation:3,zone:"Central Meeting"},
    {name:"chairModernCushion",size:[1,1],gridPosition:[12,7],rotation:0,zone:"Central Meeting"},
    {name:"chairModernCushion",size:[1,1],gridPosition:[13,12],rotation:2,zone:"Central Meeting"},

    // Finance + records zone
    {name:"deskComputer",size:[3,2],gridPosition:[2,14],rotation:0,assignedAgent:"cfo",zone:"Finance"},
    {name:"chair",size:[1,1],gridPosition:[3,16],rotation:0,assignedAgent:"cfo",zone:"Finance"},
    {name:"desk",size:[3,2],gridPosition:[7,14],rotation:0,assignedAgent:"acc",zone:"Finance"},
    {name:"chair",size:[1,1],gridPosition:[8,16],rotation:0,assignedAgent:"acc",zone:"Finance"},
    {name:"bookcaseOpenLow",size:[2,1],gridPosition:[2,20],rotation:0,zone:"Finance Records"},

    // Operations zone
    {name:"desk",size:[3,2],gridPosition:[13,15],rotation:0,assignedAgent:"adm",zone:"Operations"},
    {name:"chair",size:[1,1],gridPosition:[14,17],rotation:0,assignedAgent:"adm",zone:"Operations"},
    {name:"desk",size:[3,2],gridPosition:[18,15],rotation:0,assignedAgent:"sch",zone:"Operations"},
    {name:"chair",size:[1,1],gridPosition:[19,17],rotation:0,assignedAgent:"sch",zone:"Operations"},

    // Marketing/content zone on the east side, leaving room for more agents below and above
    {name:"deskComputer",size:[3,2],gridPosition:[23,13],rotation:0,assignedAgent:"smm",zone:"Marketing"},
    {name:"chair",size:[1,1],gridPosition:[24,15],rotation:0,assignedAgent:"smm",zone:"Marketing"},
    {name:"deskComputer",size:[3,2],gridPosition:[23,18],rotation:0,assignedAgent:"crt",zone:"Content Studio"},
    {name:"chair",size:[1,1],gridPosition:[24,20],rotation:0,assignedAgent:"crt",zone:"Content Studio"},
    {name:"tableCoffee",size:[4,2],gridPosition:[16,20],rotation:0,zone:"Creative Huddle",premiumNode:"creative-review"},
    {name:"loungeChair",size:[2,2],gridPosition:[20,20],rotation:3,zone:"Creative Huddle"},

    // Premium out-of-box expansion and planning zones
    {name:"rugSquare",size:[4,4],gridPosition:[0,6],rotation:0,walkable:true,zone:"Future Department Pod",premiumNode:"expansion-west"},
    {name:"rugRound",size:[4,4],gridPosition:[20,7],rotation:0,walkable:true,zone:"Rapid Collaboration Pod",premiumNode:"expansion-east"},
    {name:"rugRectangle",size:[7,4],gridPosition:[0,18],rotation:0,walkable:true,zone:"Records / Intake Expansion",premiumNode:"expansion-southwest"},
    {name:"laptop",size:[1,1],gridPosition:[21,17],rotation:0,zone:"Creative QA Hot Desk",premiumNode:"qa-console"},
  ],
};
export const mapAtom = atom(DEFAULT_MAP);


// ── SIMAI ADAPTER ─────────────────────────────────────────────
function simHeaders(extra = {}) {
  return {
    "Content-Type":"application/json",
    ...(SIM_API_KEY ? { "x-api-key":SIM_API_KEY, "X-API-Key":SIM_API_KEY } : {}),
    ...extra,
  };
}

function safeJsonParse(value) {
  if (!value || typeof value !== "string") return value;
  try { return JSON.parse(value); } catch (_) { return value; }
}

function usageForTool(tool) {
  return tool?.usageControl || tool?.usage || tool?.mode || "auto";
}

export function furnitureToSimTools(furniture = [], grants = []) {
  const set = new Map();
  const lower = [...furniture, ...grants].map(x => String(x || "").toLowerCase());
  const add = (id, usageControl="auto") => {
    const catalog = SIM_TOOL_CATALOG[id];
    if (!catalog || set.has(id)) return;
    set.set(id, {
      type:"custom-tool",
      title:catalog.label,
      usageControl,
      schema:{
        function:{
          name:id.replace(/[^a-zA-Z0-9_]/g, "_"),
          description:catalog.description,
          parameters:{ type:"object", properties:{ instruction:{ type:"string" } }, required:["instruction"] },
        },
      },
      params:{ source:"simoffice_furniture" },
    });
  };
  if (lower.some(v => v.includes("research") || v.includes("web") || v.includes("search"))) add("web_services");
  if (lower.some(v => v.includes("file") || v.includes("record") || v.includes("memory") || v.includes("knowledge"))) add("data_sources");
  if (lower.some(v => v.includes("github") || v.includes("code") || v.includes("dev") || v.includes("server"))) add("development");
  if (lower.some(v => v.includes("social") || v.includes("campaign") || v.includes("caption") || v.includes("publishing") || v.includes("marketing"))) add("social_marketing");
  if (lower.some(v => v.includes("email") || v.includes("calendar") || v.includes("slack") || v.includes("communication"))) add("communication");
  if (lower.some(v => v.includes("model") || v.includes("ai") || v.includes("llm"))) add("ai_services");
  return [...set.values()];
}

export function buildSimAgentInputs(agent, task, officeName, options = {}) {
  const systemPrompt = agent.systemPrompt || defaultSystemPrompt(agent);
  const stationTools = furnitureToSimTools(options.furniture || agent.furniture || [], agent.grants || []);
  const explicitTools = Array.isArray(agent.tools) ? agent.tools : [];
  const tools = [...explicitTools, ...stationTools].filter(t => usageForTool(t) !== "none");
  const responseFormat = safeJsonParse(agent.responseFormat);
  const memoryType = agent.memoryType || (agent.memoryScope && agent.memoryScope !== "session" ? "conversation" : "none");
  const conversationId = agent.conversationId || `${officeName || "office"}:${agent.id}`.replace(/\s+/g, "-").toLowerCase();
  return {
    model:agent.model,
    messages:[
      { role:"system", content:systemPrompt },
      { role:"user", content:String(task || "") },
    ],
    systemPrompt,
    userPrompt:String(task || ""),
    temperature:String(agent.temperature ?? 0.3),
    maxTokens:String(agent.maxTokens || 8000),
    ...(responseFormat ? { responseFormat } : {}),
    tools,
    skills:Array.isArray(agent.skills) ? agent.skills : [],
    memoryType,
    ...(memoryType !== "none" ? { conversationId } : {}),
    ...(memoryType === "sliding_window" ? { slidingWindowSize:String(agent.slidingWindowSize || 10) } : {}),
    ...(memoryType === "sliding_window_tokens" ? { slidingWindowTokens:String(agent.slidingWindowTokens || 4000) } : {}),
    ...(agent.reasoningEffort && agent.reasoningEffort !== "auto" ? { reasoningEffort:agent.reasoningEffort } : {}),
    ...(agent.verbosity && agent.verbosity !== "auto" ? { verbosity:agent.verbosity } : {}),
    ...(agent.thinkingLevel && agent.thinkingLevel !== "none" ? { thinkingLevel:agent.thinkingLevel } : {}),
    simoffice:{
      agentId:agent.id,
      role:agent.role,
      officeName,
      source:options.source || "manual",
      furniture:options.furniture || agent.furniture || [],
      governance:{
        controlMode:agent.controlMode,
        approvalMode:agent.approvalMode,
        publishMode:agent.publishMode,
        toolBudget:agent.toolBudget,
        maxToolRuns:agent.maxToolRuns,
      },
    },
  };
}

function extractA2AText(data) {
  const result = data?.result || data;
  const history = result?.history || result?.messages || [];
  const lastAgent = [...history].reverse().find(m => m.role === "agent" || m.role === "assistant");
  const parts = lastAgent?.parts || result?.status?.message?.parts || result?.parts || [];
  const text = parts.filter(p => p.kind === "text" || p.type === "text").map(p => p.text || p.content).filter(Boolean).join("\n");
  return text || result?.output?.content || result?.content || result?.text || data?.content || data?.text || "Task completed.";
}

function normalizeAgent(agentOrId) {
  if (agentOrId && typeof agentOrId === "object") return agentOrId;
  const base = AGENT_DEFS.find(a => a.id === agentOrId) || { id:agentOrId, name:agentOrId, role:"Agent", model:"gpt-4o" };
  return { ...DEFAULT_AGENT_RUNTIME, ...base, systemPrompt:defaultSystemPrompt(base), simAgentId:base.id };
}

async function runSimWorkflowTask(agent, task, officeName, options = {}) {
  const workflowId = agent.simWorkflowId || options.workflowId || SIM_WORKFLOW_ID;
  if (!SIM_BASE_URL || !workflowId) throw new Error("Sim workflow mode needs VITE_SIM_BASE_URL and a workflow ID.");
  const body = {
    input:buildSimAgentInputs(agent, task, officeName, options),
    triggerType:"api",
    stream:false,
  };
  const res = await fetch(`${SIM_BASE_URL}/api/workflows/${workflowId}/execute`, {
    method:"POST",
    headers:simHeaders(),
    body:JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) throw new Error(data?.error || `Sim workflow request failed (${res.status})`);
  return data?.output?.content || data?.output?.text || (typeof data?.output === "string" ? data.output : JSON.stringify(data?.output || data));
}

async function runSimA2ATask(agent, task, officeName, options = {}) {
  const agentId = agent.simAgentId || options.simAgentId || agent.id;
  if (!SIM_BASE_URL || !agentId) throw new Error("Sim A2A mode needs VITE_SIM_BASE_URL and a Sim agent ID.");
  const requestId = `${agent.id}-${Date.now()}`;
  const payload = {
    jsonrpc:"2.0",
    id:requestId,
    method:"message/send",
    params:{
      message:{
        kind:"message",
        messageId:requestId,
        role:"user",
        parts:[{ kind:"text", text:String(task || "") }],
        metadata:{ simoffice:buildSimAgentInputs(agent, task, officeName, options) },
      },
    },
  };
  const res = await fetch(`${SIM_BASE_URL}/api/a2a/serve/${agentId}`, {
    method:"POST",
    headers:simHeaders(),
    body:JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(data?.error?.message || `Sim A2A request failed (${res.status})`);
  return extractA2AText(data);
}

async function runSimCompatTask(agent, task, officeName, options = {}) {
  const agentId = agent.simAgentId || options.simAgentId || agent.id;
  const res = await fetch(`${SIM_BASE_URL}/api/a2a/agents/${agentId}/run`, {
    method:"POST",
    headers:simHeaders(),
    body:JSON.stringify({ prompt:task, input:buildSimAgentInputs(agent, task, officeName, options) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Sim compat request failed (${res.status})`);
  return data?.content || data?.result || data?.text || JSON.stringify(data);
}

export async function runSimTask(agentOrId, task, officeName, options = {}) {
  const agent = normalizeAgent(agentOrId);
  const mode = options.simMode || agent.simExecutionMode || SIM_MODE;
  if (!SIM_BASE_URL) throw new Error("VITE_SIM_BASE_URL is not configured.");
  if (mode === "a2a") return runSimA2ATask(agent, task, officeName, options);
  if (mode === "compat") return runSimCompatTask(agent, task, officeName, options);
  return runSimWorkflowTask(agent, task, officeName, options);
}

export async function syncAgentsWithSim(office, agents = []) {
  if (!SIM_BASE_URL || !SIM_SYNC_A2A_METADATA) return { skipped:true };
  const results = [];
  for (const agent of agents.filter(Boolean)) {
    const agentId = agent.simAgentId || agent.id;
    const body = {
      name:agent.name,
      description:`${agent.role} — ${agent.goal || "SimOffice role"}`,
      version:"1.0.0",
      capabilities:{ streaming:false, pushNotifications:false, stateTransitionHistory:true },
      skillTags:[agent.dept, ...(agent.enabledSkills || []).slice(0, 6)].filter(Boolean),
    };
    try {
      const res = await fetch(`${SIM_BASE_URL}/api/a2a/agents/${agentId}`, {
        method:"PUT",
        headers:simHeaders(),
        body:JSON.stringify(body),
      });
      results.push({ agent:agent.id, ok:res.ok, status:res.status });
    } catch (error) {
      results.push({ agent:agent.id, ok:false, error:error.message });
    }
  }
  return { skipped:false, results };
}

// ── TASK EXECUTION ─────────────────────────────────────────────
export function getBackendUnavailableMessage(agentId, task, officeName) {
  const agent = AGENT_DEFS.find(a => a.id === agentId);
  const label = agent ? `${agent.name} (${agent.role})` : agentId;
  return `[Backend required] ${label} cannot run “${task}” until a real backend is connected. Start the FastAPI/CrewAI backend on port 8080 or set VITE_SIM_BASE_URL for a SimAI backend. No demo response was generated.`;
}

export function getTaskErrorMessage(agentId, task, error, runtime = "backend") {
  const message = error?.message || String(error || "Unknown error");
  const agent = AGENT_DEFS.find(a => a.id === agentId);
  const label = agent ? agent.name : agentId;
  return `[${runtime} error] ${label} could not complete “${task}”: ${message}`;
}

export async function callLLM(id, task, officeName, options = {}) {
  const agentForSim = options.agent || normalizeAgent(id);
  const hasSimTarget = Boolean(
    SIM_BASE_URL && (
      agentForSim?.simWorkflowId ||
      options.workflowId ||
      SIM_WORKFLOW_ID ||
      agentForSim?.simAgentId ||
      options.simAgentId ||
      SIM_MODE === "compat"
    )
  );

  if (hasSimTarget) {
    try {
      return await runSimTask(agentForSim, task, officeName, options);
    } catch (error) {
      console.warn("[SimOffice] SimAI task failed", error);
      return getTaskErrorMessage(id, task, error, "SimAI");
    }
  }

  if (wsRef && wsRef.readyState === 1) {
    return new Promise(res => {
      const requestId = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const t = setTimeout(() => {
        pending.delete(requestId);
        pendingByAgent.delete(id);
        res(`[Timeout] ${id} did not receive a backend result for “${task}” within ${(options.timeoutMs || 15000) / 1000}s.`);
      }, options.timeoutMs || 15000);
      const record = { resolve:res, timeout:t, agent:id };
      pending.set(requestId, record);
      pendingByAgent.set(id, record);
      wsRef.send(JSON.stringify({
        cmd:"run_task",
        request_id:requestId,
        agent:id,
        task,
        source:options.source || "manual",
        furniture:options.furniture || undefined,
      }));
    });
  }

  return getBackendUnavailableMessage(id, task, officeName);
}

// ── WEBSOCKET ─────────────────────────────────────────────────
let wsRef = null;
const pending = new Map();
const pendingByAgent = new Map();

export function sendCommand(cmd, data = {}) {
  if (wsRef && wsRef.readyState === 1) {
    wsRef.send(JSON.stringify({ cmd, ...data }));
    return true;
  }
  return false;
}

function normalizeStatus(status) {
  if (status === "thinking") return "think";
  if (status === "meeting") return "meet";
  return status || "work";
}

function mergeAgentFromBackend(localAgent, remote) {
  if (!remote) return localAgent;
  return {
    ...localAgent,
    role:remote.role || localAgent.role,
    goal:remote.goal || localAgent.goal,
    backstory:remote.backstory || localAgent.backstory,
    model:remote.model || localAgent.model,
    dept:remote.department || localAgent.dept,
    log:remote.log?.length ? remote.log : localAgent.log,
    furniture:remote.furniture || localAgent.furniture || [],
    grants:remote.grants || localAgent.grants || [],
    controlMode:remote.control_mode || remote.controlMode || localAgent.controlMode || "auto",
    priority:remote.priority || localAgent.priority || "normal",
    approvalMode:remote.approval_mode || remote.approvalMode || localAgent.approvalMode || "review",
    publishMode:remote.publish_mode || remote.publishMode || localAgent.publishMode || "draft",
    memoryScope:remote.memory_scope || remote.memoryScope || localAgent.memoryScope || "office",
    toolBudget:remote.tool_budget || remote.toolBudget || localAgent.toolBudget || "balanced",
    maxToolRuns:remote.max_tool_runs || remote.maxToolRuns || localAgent.maxToolRuns || 2,
    stationPolicy:remote.station_policy || remote.stationPolicy || localAgent.stationPolicy || "assigned-first",
    enabledSkills:remote.enabled_skills || remote.enabledSkills || localAgent.enabledSkills || [],
    disabledSkills:remote.disabled_skills || remote.disabledSkills || localAgent.disabledSkills || [],
    escalationTarget:remote.escalation_target || remote.escalationTarget || localAgent.escalationTarget || "ceo",
    active:typeof remote.active === "boolean" ? remote.active : localAgent.active,
  };
}

export const BackendBridge = () => {
  const [, setCon] = useAtom(connectedAtom);
  const [, setFeed] = useAtom(feedAtom);
  const [, setAg] = useAtom(agentsAtom);
  const [, setRegistry] = useAtom(furnitureRegistryAtom);

  useEffect(() => {
    let reconnectTimer = null;
    function connect() {
      try {
        wsRef = new WebSocket(`ws://${location.hostname || "localhost"}:8080/ws`);
        wsRef.onopen = () => { setCon(true); console.log("[SimOffice] CrewAI backend connected"); };
        wsRef.onclose = () => {
          setCon(false);
          wsRef = null;
          reconnectTimer = setTimeout(connect, 5000);
        };
        wsRef.onerror = () => { setCon(false); };
        wsRef.onmessage = e => {
          const msg = JSON.parse(e.data);

          if (msg.type === "init") {
            if (msg.furniture_registry) setRegistry(msg.furniture_registry);
            if (msg.agents) {
              console.log("[SimOffice] Syncing CrewAI roles:", Object.keys(msg.agents));
              setAg(prev => prev.map(a => mergeAgentFromBackend(a, msg.agents[a.id])));
            }
          }

          if (msg.type === "task_result") {
            const p = msg.request_id ? pending.get(msg.request_id) : pendingByAgent.get(msg.agent);
            if (p) {
              clearTimeout(p.timeout);
              p.resolve(msg.text);
              if (msg.request_id) pending.delete(msg.request_id);
              pendingByAgent.delete(msg.agent);
            }
            setFeed(prev => [{ agent:msg.agent, task:msg.task, text:msg.text, ts:msg.ts, model:msg.model, source:msg.source }, ...prev.slice(0, 29)]);
          }

          if (msg.type === "agent_status") {
            setAg(prev => prev.map(a => a.id === msg.agent ? { ...a, status:normalizeStatus(msg.status), task:msg.task || a.task } : a));
          }

          if (msg.type === "model_changed") {
            setAg(prev => prev.map(a => a.id === msg.agent ? { ...a, model:msg.model } : a));
          }

          if (msg.type === "agent_config_updated") {
            const patch = msg.patch || {};
            setAg(prev => prev.map(a => a.id === msg.agent ? {
              ...a, ...patch,
              controlMode:patch.control_mode || patch.controlMode || a.controlMode,
              approvalMode:patch.approval_mode || patch.approvalMode || a.approvalMode,
              publishMode:patch.publish_mode || patch.publishMode || a.publishMode,
              memoryScope:patch.memory_scope || patch.memoryScope || a.memoryScope,
              toolBudget:patch.tool_budget || patch.toolBudget || a.toolBudget,
              maxToolRuns:patch.max_tool_runs || patch.maxToolRuns || a.maxToolRuns,
              stationPolicy:patch.station_policy || patch.stationPolicy || a.stationPolicy,
              enabledSkills:patch.enabled_skills || patch.enabledSkills || a.enabledSkills,
              disabledSkills:patch.disabled_skills || patch.disabledSkills || a.disabledSkills,
              escalationTarget:patch.escalation_target || patch.escalationTarget || a.escalationTarget,
            } : a));
          }

          if (msg.type === "agent_tools_updated") {
            setAg(prev => prev.map(a => a.id === msg.agent ? { ...a, furniture:msg.furniture || [], grants:msg.grants || [] } : a));
          }
        };
      } catch (e) {
        console.warn("[SimOffice] Backend connection failed", e);
      }
    }
    connect();
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef) wsRef.close();
    };
  }, []);
  return null;
};
