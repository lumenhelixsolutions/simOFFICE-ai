/**
 * SimOffice Agent Control Panel
 * Premium command surface for role/model/autonomy/tool-routing/social workflows.
 */
import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import {
  agentsAtom, officeAtom, feedAtom, simTimeAtom, selectedAgentAtom, selectedFurnitureAtom, connectedAtom,
  roomItemsAtom, furnitureRegistryAtom, DEPARTMENTS, FURN_TYPES, MODEL_OPTIONS,
  CONTROL_MODES, callLLM, sendCommand, syncAgentsWithSim,
  SIM_TOOL_CATALOG, SIM_MEMORY_TYPES, SIM_EXECUTION_MODES, SIM_BASE_URL, SIM_MODE, getBackendUnavailableMessage,
} from "./BackendBridge";

const TABS = ["Control", "SimAI", "Skills", "Workflows", "Memory", "Log"];

const QUICK_TASKS = {
  ceo:["Summarize company priorities", "Review current team risks", "Create next-step delegation plan"],
  cto:["Review architecture risks", "Draft technical implementation plan", "Check local model routing strategy"],
  cio:["Check infrastructure health", "Draft backup and data policy", "Review tool/API readiness"],
  cfo:["Review AI token budget", "Find cost-saving model routes", "Create weekly finance snapshot"],
  acc:["Audit overdue invoices", "Draft expense report", "Create payment follow-up list"],
  adm:["Create daily office brief", "Organize open tasks", "Prepare team coordination note"],
  sch:["Resolve calendar conflicts", "Create appointment plan", "Prepare reminder schedule"],
  smm:["Draft a 5-post campaign", "Create platform-specific captions", "Prepare engagement reply plan"],
  crt:["Write campaign copy variants", "Research content angles", "Draft a blog/social bundle"],
};

const SOCIAL_PLATFORMS = ["Facebook", "YouTube", "TikTok", "Instagram", "LinkedIn", "X/Twitter"];
const SOCIAL_ACTIONS = [
  { label:"Campaign Calendar", prompt:"Create a one-week social media campaign calendar with platform-specific post ideas, posting cadence, and calls to action." },
  { label:"Caption Pack", prompt:"Draft platform-specific captions for Facebook, YouTube, TikTok, Instagram, LinkedIn, and X/Twitter. Include hooks and hashtags." },
  { label:"Engagement Plan", prompt:"Create a moderation and reply strategy for comments, questions, critics, supporters, and trolls." },
  { label:"Analytics Review", prompt:"Create an analytics review checklist: KPIs, warning signs, best-performing formats, and next experiments." },
];

function formatTime(minutes) {
  const h = Math.floor(minutes / 60), m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function unique(list) { return [...new Set(list.filter(Boolean))]; }

function SettingSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40">
        {options.map(o => <option key={o.value || o.id || o} value={o.value || o.id || o}>{o.label || o}</option>)}
      </select>
    </label>
  );
}

function Pill({ children, tone="gray" }) {
  const cls = tone === "red" ? "border-red-400/25 text-red-300 bg-red-400/[.06]" : tone === "green" ? "border-green-400/20 text-green-300 bg-green-400/[.05]" : "border-white/[.06] text-gray-500 bg-white/[.025]";
  return <span className={`inline-flex px-2 py-1 rounded-full border text-[9px] ${cls}`}>{children}</span>;
}

export function AgentControlPanel() {
  const [selId, setSelId] = useAtom(selectedAgentAtom);
  const [agents, setAgents] = useAtom(agentsAtom);
  const [connected] = useAtom(connectedAtom);
  const [office] = useAtom(officeAtom);
  const [, setFeed] = useAtom(feedAtom);
  const [simTime] = useAtom(simTimeAtom);
  const [items] = useAtom(roomItemsAtom);
  const [registry] = useAtom(furnitureRegistryAtom);
  const [, setSelectedFurniture] = useAtom(selectedFurnitureAtom);
  const [tab, setTab] = useState("Control");
  const [input, setInput] = useState("");
  const [brief, setBrief] = useState(`${office.name} launch / visibility campaign`);
  const [platforms, setPlatforms] = useState(["Facebook", "YouTube", "TikTok", "Instagram"]);

  const agent = agents.find(a => a.id === selId);
  const idx = agents.findIndex(a => a.id === selId);
  const dept = agent ? DEPARTMENTS[agent.dept] : null;

  const assignedItems = useMemo(() => {
    if (!agent) return [];
    return items.filter(Boolean).filter(i => i.assignedAgent === agent.id);
  }, [items, agent?.id]);

  const stationGrants = useMemo(() => unique(assignedItems.flatMap(i => FURN_TYPES[i.name]?.grants || [])), [assignedItems]);
  const registryIds = useMemo(() => unique(assignedItems.map(i => FURN_TYPES[i.name]?.registryId || i.registryId || i.name)), [assignedItems]);
  const registryGrants = useMemo(() => unique(registryIds.flatMap(id => registry?.[id]?.grants || [])), [registryIds, registry]);
  const allGrants = unique([...(agent?.grants || []), ...stationGrants, ...registryGrants]);

  if (!agent) return null;

  const runtimeReady = connected || Boolean(SIM_BASE_URL);
  const runtimeLabel = SIM_BASE_URL ? `SimAI ${SIM_MODE}` : connected ? "CrewAI" : "No backend";

  function patchAgent(patch) {
    const updatedAgent = { ...agent, ...patch };
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ...patch } : a));
    sendCommand("update_agent_config", { agent:agent.id, patch });
    syncAgentsWithSim(office, [updatedAgent]).catch(error => console.warn("[SimOffice] SimAI sync failed", error));
  }

  function changeModel(model) {
    patchAgent({ model });
    sendCommand("change_model", { agent:agent.id, model });
  }

  function syncFurniture() {
    const furniture = registryIds;
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, furniture, grants:allGrants } : a));
    sendCommand("update_furniture", { agent:agent.id, furniture });
  }

  async function runTask(taskText, source="manual") {
    if (!taskText.trim()) return;
    const task = taskText.trim();
    setInput("");

    if (!runtimeReady) {
      const text = getBackendUnavailableMessage(agent.id, task, office.name);
      const entry = { task, text, ts:formatTime(simTime), source:"offline_blocked" };
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, log:[...a.log, entry], output:text, showBubble:true, bubbleText:text, lastTaskSource:source } : a));
      setFeed(prev => [{ agent:agent.id, ...entry }, ...prev.slice(0, 29)]);
      setTimeout(() => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, showBubble:false } : a)), 6000);
      return;
    }

    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, pending:true, status:"think", task, showBubble:true, bubbleText:"...", lastTaskSource:source } : a));
    const liveAgent = { ...agent, furniture:registryIds, grants:allGrants };
    const result = await callLLM(agent.id, task, office.name, { source, furniture:registryIds, agent:liveAgent });
    const entry = { task, text:result, ts:formatTime(simTime), source };
    setAgents(prev => prev.map(a => a.id === agent.id ? {
      ...a, pending:false, status:"work", output:result, showBubble:true, bubbleText:result,
      log:[...a.log, entry], lastTaskSource:source,
    } : a));
    setFeed(prev => [{ agent:agent.id, ...entry }, ...prev.slice(0, 29)]);
    setTimeout(() => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, showBubble:false } : a)), 6000);
  }

  function runSocialAction(action) {
    const prompt = `${action.prompt}\n\nOffice: ${office.name}\nResponsible agent: ${agent.name}, ${agent.role}\nPlatforms: ${platforms.join(", ")}\nCampaign brief: ${brief}\nPublish mode: ${agent.publishMode}. Approval mode: ${agent.approvalMode}. Keep it practical and production-ready.`;
    runTask(prompt, "social_marketing");
  }

  function toggleSkill(skill) {
    const enabled = new Set(agent.enabledSkills || []);
    if (enabled.has(skill)) enabled.delete(skill); else enabled.add(skill);
    patchAgent({ enabledSkills:[...enabled], enabled_skills:[...enabled] });
  }


  function simToolUsage(toolKey) {
    const tool = (agent.tools || []).find(t => t.params?.simToolKey === toolKey || t.title === SIM_TOOL_CATALOG[toolKey]?.label);
    return tool?.usageControl || "none";
  }

  function updateSimTool(toolKey, usageControl) {
    const catalog = SIM_TOOL_CATALOG[toolKey];
    if (!catalog) return;
    const current = (agent.tools || []).filter(t => t.params?.simToolKey !== toolKey && t.title !== catalog.label);
    if (usageControl === "none") {
      patchAgent({ tools:current });
      return;
    }
    const nextTool = {
      type:"custom-tool",
      title:catalog.label,
      usageControl,
      params:{ simToolKey:toolKey, source:"simoffice-agent-panel" },
      schema:{
        function:{
          name:`simoffice_${toolKey}`,
          description:catalog.description,
          parameters:{
            type:"object",
            properties:{
              task:{ type:"string", description:"The task this tool should help complete." },
              context:{ type:"string", description:"Relevant SimOffice context." },
            },
          },
        },
      },
    };
    patchAgent({ tools:[...current, nextTool] });
  }

  return (
    <div className="sim-agent-drawer flex flex-col pointer-events-auto">
      <div className="p-4 border-b border-white/[.07] bg-white/[.015]">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg" style={{ background:agent.color }}>{agent.name[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold text-gray-200 truncate">{agent.name}</div>
              <Pill tone={agent.controlMode === "auto" ? "green" : agent.controlMode === "paused" ? "red" : "gray"}>{CONTROL_MODES[agent.controlMode]?.label || agent.controlMode}</Pill>
            </div>
            <div className="text-[10px] text-gray-600 truncate">{agent.role}</div>
            <div className="text-[9px] mt-1 flex items-center gap-2" style={{ color:dept?.color || "#888" }}><span>{dept?.icon}</span>{dept?.label}<span className="text-gray-700">·</span><span className="text-gray-600">#{idx + 1}</span></div>
          </div>
          <button onClick={() => setSelId(null)} className="text-gray-600 hover:text-red-400 text-xl transition-colors">✕</button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
          <div className="stat-card"><span>Model</span><b>{agent.model}</b></div>
          <div className="stat-card"><span>Stations</span><b>{assignedItems.length}</b></div>
          <div className="stat-card"><span>Skills</span><b>{allGrants.length}</b></div>
        </div>
      </div>

      <div className={`mx-4 mt-3 rounded-xl border px-3 py-2 text-[10px] ${runtimeReady ? "bg-green-400/[.035] border-green-400/15 text-green-200/80" : "bg-red-400/[.05] border-red-400/20 text-red-100/80"}`}>
        <div className="font-semibold">Runtime: {runtimeLabel}</div>
        <div className="text-[9px] opacity-75 mt-0.5">{runtimeReady ? "Tasks will execute through a real backend route." : "Tasks are blocked until CrewAI or SimAI is connected. No demo output will be generated."}</div>
      </div>

      <div className="px-3 pt-3 flex gap-1.5 border-b border-white/[.04]">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-t-lg text-[10px] font-mono tracking-wide transition ${tab === t ? "bg-red-400/[.12] text-red-300 border border-red-400/20 border-b-0" : "text-gray-600 hover:text-gray-400"}`}>{t}</button>)}
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-800 bg-[#070715]">
        {tab === "Control" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <SettingSelect label="Model route" value={agent.model} options={MODEL_OPTIONS} onChange={changeModel} />
              <SettingSelect label="Autonomy" value={agent.controlMode} options={Object.entries(CONTROL_MODES).map(([value, v]) => ({ value, label:v.label }))} onChange={v => patchAgent({ controlMode:v, control_mode:v })} />
              <SettingSelect label="Priority" value={agent.priority || "normal"} options={["low", "normal", "high", "urgent"]} onChange={v => patchAgent({ priority:v })} />
              <SettingSelect label="Approval" value={agent.approvalMode || "review"} options={[{value:"auto",label:"Auto-run"},{value:"review",label:"Review first"},{value:"locked",label:"Locked"}]} onChange={v => patchAgent({ approvalMode:v, approval_mode:v })} />
              <SettingSelect label="Publish mode" value={agent.publishMode || "draft"} options={["draft", "schedule", "manual-post", "auto-post"]} onChange={v => patchAgent({ publishMode:v, publish_mode:v })} />
              <SettingSelect label="Tool budget" value={agent.toolBudget || "balanced"} options={["minimal", "balanced", "aggressive"]} onChange={v => patchAgent({ toolBudget:v, tool_budget:v })} />
            </div>

            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] text-gray-600 uppercase tracking-wide">Manual Command</div>
                <button onClick={() => patchAgent({ active:!agent.active })} className={`text-[10px] px-2 py-1 rounded border ${agent.active ? "border-green-400/20 text-green-300 bg-green-400/[.04]" : "border-red-400/20 text-red-300 bg-red-400/[.04]"}`}>{agent.active ? "ACTIVE" : "INACTIVE"}</button>
              </div>
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && runtimeReady) runTask(input); }}
                  placeholder={`Run a task as ${agent.name}...`}
                  className="flex-1 bg-white/[.04] border border-white/[.08] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-red-400/40" />
                <button onClick={() => runTask(input)} disabled={!runtimeReady || agent.pending} className="px-4 py-2 bg-red-400 hover:bg-red-300 rounded-lg text-white font-mono text-xs transition disabled:opacity-40 disabled:cursor-not-allowed">RUN</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {(QUICK_TASKS[agent.id] || []).map(q => <button key={q} onClick={() => runTask(q, "quick_action")} disabled={!runtimeReady || agent.pending} className="text-left text-[11px] disabled:opacity-40 disabled:cursor-not-allowed text-gray-400 bg-white/[.02] hover:bg-white/[.045] border border-white/[.04] hover:border-red-400/20 rounded-lg px-3 py-2 transition">{q}</button>)}
            </div>
          </div>
        )}

        {tab === "SimAI" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
              <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-3">SimAI Runtime</div>
              <div className="grid grid-cols-2 gap-3">
                <SettingSelect label="Run mode" value={agent.simExecutionMode || "workflow"} options={SIM_EXECUTION_MODES} onChange={v => patchAgent({ simExecutionMode:v })} />
                <SettingSelect label="Memory" value={agent.memoryType || "none"} options={SIM_MEMORY_TYPES} onChange={v => patchAgent({ memoryType:v })} />
                <label className="block">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">Workflow ID</div>
                  <input value={agent.simWorkflowId || ""} onChange={e => patchAgent({ simWorkflowId:e.target.value })}
                    placeholder="Sim workflow UUID"
                    className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40" />
                </label>
                <label className="block">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">A2A Agent ID</div>
                  <input value={agent.simAgentId || agent.id} onChange={e => patchAgent({ simAgentId:e.target.value })}
                    className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40" />
                </label>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <label className="block">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">Temperature</div>
                  <input type="number" step="0.1" min="0" max="2" value={agent.temperature ?? 0.3} onChange={e => patchAgent({ temperature:Number(e.target.value) })}
                    className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40" />
                </label>
                <label className="block">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">Max tokens</div>
                  <input type="number" min="256" value={agent.maxTokens || 8000} onChange={e => patchAgent({ maxTokens:Number(e.target.value) })}
                    className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40" />
                </label>
                <SettingSelect label="Reasoning" value={agent.reasoningEffort || "auto"} options={["auto","low","medium","high"]} onChange={v => patchAgent({ reasoningEffort:v })} />
              </div>
              {(agent.memoryType || "none") !== "none" && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <label className="block col-span-2">
                    <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">Conversation ID</div>
                    <input value={agent.conversationId || ""} onChange={e => patchAgent({ conversationId:e.target.value })}
                      placeholder={`${office.name}:${agent.id}`.replace(/\s+/g, "-").toLowerCase()}
                      className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40" />
                  </label>
                  <label className="block">
                    <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">Window</div>
                    <input value={agent.memoryType === "sliding_window_tokens" ? (agent.slidingWindowTokens || "4000") : (agent.slidingWindowSize || "10")}
                      onChange={e => patchAgent(agent.memoryType === "sliding_window_tokens" ? { slidingWindowTokens:e.target.value } : { slidingWindowSize:e.target.value })}
                      className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40" />
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
              <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">System Prompt</div>
              <textarea value={agent.systemPrompt || ""} onChange={e => patchAgent({ systemPrompt:e.target.value })} rows={6}
                className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-3 py-2 text-gray-300 text-[11px] leading-relaxed outline-none focus:border-red-400/40" />
            </div>

            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
              <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">Tool Gateway</div>
              <div className="space-y-2">
                {Object.entries(SIM_TOOL_CATALOG).map(([key, tool]) => (
                  <div key={key} className="flex items-center gap-2 rounded-lg border border-white/[.04] bg-white/[.015] p-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-300 font-semibold">{tool.label}</div>
                      <div className="text-[9px] text-gray-600 truncate">{tool.description}</div>
                    </div>
                    <select value={simToolUsage(key)} onChange={e => updateSimTool(key, e.target.value)}
                      className="bg-white/[.04] border border-white/[.08] rounded px-2 py-1 text-[10px] text-gray-300 outline-none">
                      <option value="none">None</option>
                      <option value="auto">Auto</option>
                      <option value="force">Required</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
              <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">Response Format JSON Schema</div>
              <textarea value={agent.responseFormat || ""} onChange={e => patchAgent({ responseFormat:e.target.value })} rows={5}
                placeholder='{"schema":{"type":"object","properties":{"answer":{"type":"string"}}}}'
                className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-3 py-2 text-gray-300 text-[11px] leading-relaxed outline-none focus:border-red-400/40 font-mono" />
            </div>
          </div>
        )}

        {tab === "Skills" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[9px] text-gray-600 uppercase tracking-wide">Assigned Furniture / Skill Sources</div>
                <button onClick={syncFurniture} className="text-[10px] text-red-300 border border-red-400/20 rounded px-2 py-1 hover:bg-red-400/10">Sync Tools</button>
              </div>
              {assignedItems.length === 0 && <div className="text-[11px] text-gray-700 italic">No furniture assigned. Use edit mode or click a station and assign this agent.</div>}
              {assignedItems.map((item, i) => {
                const type = FURN_TYPES[item.name] || {};
                return <button key={`${item.name}-${i}`} onClick={() => setSelectedFurniture({ ...item, idx:i, instanceId:`${item.name}-${i}` })} className="w-full text-left mb-2 p-2 rounded-lg bg-white/[.02] border border-white/[.04] hover:border-red-400/20">
                  <div className="text-[11px] text-gray-300 font-semibold">{type.icon} {type.label || item.name}</div>
                  <div className="text-[9px] text-gray-600">{item.zone || type.category || "Unzoned"} · {type.registryId || item.name}</div>
                </button>;
              })}
            </div>
            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
              <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">Capability Grants</div>
              <div className="flex flex-wrap gap-1.5">
                {allGrants.length === 0 ? <span className="text-[11px] text-gray-700 italic">No grants yet.</span> : allGrants.map(g => <button key={g} onClick={() => toggleSkill(g)} className={`px-2 py-1 rounded-full border text-[9px] ${agent.enabledSkills?.includes(g) ? "bg-green-400/[.06] border-green-400/25 text-green-300" : "bg-white/[.02] border-white/[.06] text-gray-500 hover:border-red-400/20"}`}>{g}</button>)}
              </div>
            </div>
            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3 text-[10px] text-gray-500 leading-relaxed">
              Skills are granted by furniture/stations first, then optionally enabled per agent. This keeps the 3D room meaningful: moving a station changes what the agent can do.
            </div>
          </div>
        )}

        {tab === "Workflows" && (
          <div className="space-y-3">
            {(agent.dept === "marketing" || agent.id === "smm" || agent.id === "crt") ? (
              <>
                <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">Social / Marketing Mission</div>
                  <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={3}
                    className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-red-400/40" />
                </div>
                <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">Platforms</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SOCIAL_PLATFORMS.map(p => <button key={p} onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className={`text-[10px] px-2 py-1.5 rounded-lg border ${platforms.includes(p) ? "border-blue-400/25 bg-blue-400/[.06] text-blue-300" : "border-white/[.06] bg-white/[.02] text-gray-600"}`}>{p}</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SOCIAL_ACTIONS.map(action => <button key={action.label} onClick={() => runSocialAction(action)} disabled={!runtimeReady || agent.pending} className="min-h-16 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl bg-red-400/[.06] border border-red-400/15 hover:border-red-400/35 text-left px-3 py-2 transition">
                    <div className="text-[11px] text-red-200 font-semibold">{action.label}</div>
                    <div className="text-[9px] text-gray-600 mt-1">{agent.publishMode === "draft" ? "Creates draft" : `Mode: ${agent.publishMode}`}</div>
                  </button>)}
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-4 text-[11px] text-gray-600 leading-relaxed">
                This agent is not a marketing role. Their workflow controls are driven by station assignment, quick tasks, and meetings.
              </div>
            )}
          </div>
        )}

        {tab === "Memory" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <SettingSelect label="Memory scope" value={agent.memoryScope || "office"} options={["session", "office", "department", "private"]} onChange={v => patchAgent({ memoryScope:v, memory_scope:v })} />
              <SettingSelect label="Station policy" value={agent.stationPolicy || "assigned-first"} options={["assigned-first", "nearest", "manual-only"]} onChange={v => patchAgent({ stationPolicy:v, station_policy:v })} />
              <SettingSelect label="Escalation" value={agent.escalationTarget || "ceo"} options={agents.map(a => ({ value:a.id, label:a.name }))} onChange={v => patchAgent({ escalationTarget:v, escalation_target:v })} />
              <label className="block">
                <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">Max tool runs</div>
                <input type="number" min="0" max="10" value={agent.maxToolRuns || 0} onChange={e => patchAgent({ maxToolRuns:Number(e.target.value), max_tool_runs:Number(e.target.value) })}
                  className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40" />
              </label>
            </div>
            <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3 text-[10px] text-gray-500 leading-relaxed">
              This is the intended governance layer: autonomy, approval, publishing, memory, escalation, tool budget, and station policy are explicit rather than hidden inside prompts.
            </div>
          </div>
        )}

        {tab === "Log" && (
          <div className="space-y-2">
            {agent.log.length === 0 && <div className="text-[11px] text-gray-700 py-8 text-center italic">No outputs yet.</div>}
            {[...agent.log].reverse().map((e, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white/[.018] border border-white/[.04]">
                <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1 flex justify-between"><span>{e.task}</span><span className="font-mono">{e.ts}</span></div>
                <div className="text-[11px] text-gray-400 leading-relaxed">{e.text}</div>
                {e.source && <div className="mt-1 text-[8px] text-gray-700 font-mono">source:{e.source}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
