/**
 * SimOffice FurniturePanel — functional station controls.
 * Furniture is treated as a skill/tool node, not decoration.
 */
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import {
  selectedFurnitureAtom, selectedAgentAtom, agentsAtom, officeAtom, feedAtom, connectedAtom,
  simTimeAtom, FURN_TYPES, LAYOUT_ANCHORS, callLLM, sendCommand, SIM_BASE_URL, getBackendUnavailableMessage,
  roomItemsAtom, mapAtom, furnitureRegistryAtom, STATION_STARTER_ACTIONS,
} from "./BackendBridge";

function formatTime(mins) {
  const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function unique(list) { return [...new Set(list.filter(Boolean))]; }
function registryIdFor(item) { return FURN_TYPES[item?.name]?.registryId || item?.registryId || item?.name; }

function StationSetup({ furn, type }) {
  const [agents, setAgents] = useAtom(agentsAtom);
  const [selected, setSelected] = useAtom(selectedFurnitureAtom);
  const [, setSelectedAgent] = useAtom(selectedAgentAtom);
  const [items, setItems] = useAtom(roomItemsAtom);
  const [map, setMap] = useAtom(mapAtom);
  const [registry] = useAtom(furnitureRegistryAtom);
  const registryId = registryIdFor(furn);
  const info = registry?.[registryId];

  function collectFurnitureFor(agentId, list) {
    return unique(list.filter(Boolean).filter(i => i.assignedAgent === agentId).map(registryIdFor));
  }

  function assign(agentId) {
    const nextAgent = agentId || undefined;
    const update = item => item ? { ...item, assignedAgent:nextAgent } : item;
    const updatedItems = items.map((item, idx) => idx === furn.idx ? update(item) : item);
    const updatedMapItems = (map.items || []).map((item, idx) => idx === furn.idx ? update(item) : item);

    setItems(updatedItems);
    setMap({ ...map, items:updatedMapItems });
    setSelected({ ...selected, assignedAgent:nextAgent });

    if (nextAgent) {
      const furniture = collectFurnitureFor(nextAgent, updatedMapItems.length ? updatedMapItems : updatedItems);
      const grants = unique(furniture.flatMap(fid => registry?.[fid]?.grants || []));
      setAgents(prev => prev.map(a => a.id === nextAgent ? { ...a, furniture, grants } : a));
      sendCommand("update_furniture", { agent:nextAgent, furniture });
    }
  }

  return (
    <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] text-gray-600 uppercase tracking-wide">Station Setup</div>
        <button onClick={() => furn.assignedAgent && setSelectedAgent(furn.assignedAgent)} className="text-[9px] text-red-300 border border-red-400/20 rounded px-2 py-1 disabled:opacity-30" disabled={!furn.assignedAgent}>Open Agent</button>
      </div>
      <label className="block mb-2">
        <div className="text-[9px] text-gray-700 mb-1">Assigned agent</div>
        <select value={furn.assignedAgent || ""} onChange={e => assign(e.target.value)}
          className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-red-400/40">
          <option value="">Unassigned / nearest active agent</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.role}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2">
        <div className="stat-chip">registry {registryId}</div>
        <div className="stat-chip">ui {type.uiType}</div>
        <div className="stat-chip">grid {furn.gridPosition?.join(",")}</div>
        <div className="stat-chip">size {furn.size?.join("×")}</div>
      </div>
      {info && <div className="text-[10px] text-gray-600 leading-relaxed">Backend: {info.label} · {info.tool_count || 0} tool(s) · {info.requirements_met ? "ready" : "missing keys"}</div>}
    </div>
  );
}


function PremiumStationActions({ furn, agent, runtimeReady, onRun }) {
  const actions = STATION_STARTER_ACTIONS[furn?.name] || [];
  if (!actions.length) return null;
  return (
    <div className="rounded-xl bg-white/[.018] border border-white/[.05] p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] text-gray-600 uppercase tracking-wide">Premium Starter Actions</div>
        <div className="text-[9px] text-gray-700">{agent ? agent.name : "No agent"}</div>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {actions.map(action => (
          <button key={action.label} disabled={!runtimeReady || !agent || agent.pending} onClick={() => onRun(action)}
            className="rounded-lg border border-red-400/12 bg-red-400/[.045] px-3 py-2 text-left transition hover:border-red-400/30 disabled:cursor-not-allowed disabled:opacity-35">
            <div className="text-[11px] font-semibold text-red-100">{action.label}</div>
            <div className="mt-0.5 text-[9px] text-gray-600">Runs through this station’s skill pack</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MEETING PANEL ─────────────────────────────────────────────
function MeetingPanel({ furn }) {
  const [agents, setAgents] = useAtom(agentsAtom);
  const [connected] = useAtom(connectedAtom);
  const [office] = useAtom(officeAtom);
  const [, setFeed] = useAtom(feedAtom);
  const [simTime] = useAtom(simTimeAtom);
  const [topic, setTopic] = useState("Team sync — status updates");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const active = agents.filter(a => a.active);
  const runtimeReady = connected || Boolean(SIM_BASE_URL);

  async function startMeeting() {
    if (active.length < 2 || running || !runtimeReady) return;
    setRunning(true);
    setResults([]);
    const meetingPoint = getFurnitureAnchor(furn, LAYOUT_ANCHORS.meeting);
    setAgents(prev => prev.map(a => a.active ? { ...a, task:`Meeting: ${topic}`, status:"meet", path:[meetingPoint], pathIdx:0 } : a));

    for (const a of active) {
      setAgents(prev => prev.map(x => x.id === a.id ? { ...x, status:"think", showBubble:true, bubbleText:"..." } : x));
      const result = await callLLM(a.id, `Team meeting on "${topic}". Give your brief status update and one next action.`, office.name, { source:"meeting", furniture:[registryIdFor(furn)], agent:{ ...a, furniture:[registryIdFor(furn)] } });
      const entry = { agent:a.id, task:`Meeting: ${topic}`, text:result, ts:formatTime(simTime), source:"meeting" };
      setResults(prev => [...prev, { name:a.name, color:a.color, text:result }]);
      setAgents(prev => prev.map(x => x.id === a.id ? { ...x, status:"meet", showBubble:true, bubbleText:result, log:[...x.log, entry] } : x));
      setFeed(prev => [entry, ...prev.slice(0, 29)]);
    }

    const summary = results.map(r => `${r.name}: ${r.text}`).join(" | ");
    const ceo = active.find(a => a.id === "ceo");
    if (ceo) {
      const followUp = await callLLM("ceo", `Meeting on "${topic}" ended. Synthesize decisions, owner assignments, and next action from: ${summary || "team updates complete"}.`, office.name, { source:"meeting_followup", agent:ceo });
      setResults(prev => [...prev, { name:"CEO Follow-up", color:"#ff6b6b", text:followUp }]);
      setFeed(prev => [{ agent:"ceo", task:"Meeting follow-up", text:followUp, ts:formatTime(simTime), source:"meeting" }, ...prev.slice(0, 29)]);
    }

    setTimeout(() => setAgents(prev => prev.map(a => a.active ? { ...a, status:"work", task:"Post-meeting work", path:[a.desk], pathIdx:0 } : a)), 3000);
    setRunning(false);
  }

  return (
    <div>
      <div className="text-[10px] text-gray-500 mb-2">{active.length} agents active {active.length < 2 && "(need 2+)"} {!runtimeReady && " · backend offline"}</div>
      <input value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-white/[.04] border border-white/[.08] rounded px-3 py-2 text-white text-xs outline-none mb-2 focus:border-red-400/40" placeholder="Meeting topic..." />
      <button onClick={startMeeting} disabled={active.length < 2 || running || !runtimeReady} className="w-full py-2.5 rounded bg-red-400 text-white font-mono text-sm tracking-wide disabled:opacity-30 hover:bg-red-300 transition">{running ? "MEETING IN PROGRESS..." : "START MEETING"}</button>
      {results.length > 0 && <div className="mt-3 space-y-2"><div className="text-[9px] text-gray-600 uppercase tracking-wide">Meeting Results</div>{results.map((r, i) => <div key={i} className="p-2 rounded bg-white/[.02] border border-white/[.04]" style={{ borderLeftColor:r.color, borderLeftWidth:3 }}><div className="text-[10px] font-semibold text-gray-400 mb-1">{r.name}</div><div className="text-[11px] text-gray-500 leading-relaxed">{r.text}</div></div>)}</div>}
      <div className="mt-3 p-2 rounded bg-white/[.015] border border-white/[.04]"><div className="text-[9px] text-red-400 font-semibold mb-1 tracking-wide">EVENT CHAIN</div><div className="text-[9px] text-gray-600">Meeting → each agent speaks → CEO follow-up → delegated records.</div></div>
    </div>
  );
}

// ── TERMINAL PANEL ────────────────────────────────────────────
function TerminalPanel({ furn }) {
  const [agents, setAgents] = useAtom(agentsAtom);
  const [connected] = useAtom(connectedAtom);
  const [office] = useAtom(officeAtom);
  const [, setFeed] = useAtom(feedAtom);
  const [simTime] = useAtom(simTimeAtom);
  const [cmd, setCmd] = useState("");
  const runtimeReady = connected || Boolean(SIM_BASE_URL);
  const assigned = agents.find(a => a.active && furn.assignedAgent && a.id === furn.assignedAgent);
  const agent = assigned || agents.filter(a => a.active && a.desk).sort((a, b) => distance(a.desk, furn.gridPosition) - distance(b.desk, furn.gridPosition))[0];

  async function runStationTask(task, label = task) {
    if (!task?.trim() || !agent) return;
    const work = task.trim();
    if (!runtimeReady) {
      const text = getBackendUnavailableMessage(agent.id, work, office.name);
      const entry = { agent:agent.id, task:label, text, ts:formatTime(simTime), source:"offline_blocked" };
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, output:text, showBubble:true, bubbleText:text, log:[...a.log, entry] } : a));
      setFeed(prev => [entry, ...prev.slice(0, 29)]);
      setTimeout(() => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, showBubble:false } : a)), 6000);
      return;
    }
    const stationPrompt = `${work}

Station: ${FURN_TYPES[furn.name]?.label || furn.name}
Station purpose: ${FURN_TYPES[furn.name]?.purpose || "Functional work node"}
Return a premium, practical work product with clear sections, owners, risks, and next actions.`;
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, pending:true, status:"think", task:label, showBubble:true, bubbleText:"..." } : a));
    const result = await callLLM(agent.id, stationPrompt, office.name, { source:"station_premium_action", furniture:[registryIdFor(furn)], agent:{ ...agent, furniture:[registryIdFor(furn)] } });
    const entry = { agent:agent.id, task:label, text:result, ts:formatTime(simTime), source:"station_premium_action" };
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, pending:false, status:"work", output:result, showBubble:true, bubbleText:result, log:[...a.log, entry] } : a));
    setFeed(prev => [entry, ...prev.slice(0, 29)]);
    setTimeout(() => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, showBubble:false } : a)), 6000);
  }

  async function sendCmd() {
    if (!cmd.trim()) return;
    const task = cmd.trim();
    setCmd("");
    return runStationTask(task, task);
  }

  return (
    <div>
      {agent ? <>
        <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded" style={{ background:agent.color }} /><span className="text-xs text-gray-300 font-semibold">{agent.name}</span><span className="text-[9px] text-gray-600">{agent.role}</span></div>
        <div className="text-[10px] text-gray-500 mb-2">Current: {agent.task}</div>{!runtimeReady && <div className="mb-2 rounded bg-red-400/[.06] border border-red-400/20 px-2 py-1.5 text-[10px] text-red-200">Backend offline. This station will not generate demo output.</div>}
        <PremiumStationActions furn={furn} agent={agent} runtimeReady={runtimeReady} onRun={(action) => runStationTask(action.prompt, action.label)} />
        <div className="flex gap-1.5"><input value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && runtimeReady) sendCmd(); }} placeholder={`Command for ${agent.name}...`} className="flex-1 bg-white/[.04] border border-white/[.08] rounded px-2 py-2 text-white text-xs outline-none focus:border-red-400/40" /><button onClick={sendCmd} disabled={!runtimeReady || agent.pending} className="px-3 py-2 bg-red-400 rounded text-white font-mono text-xs disabled:opacity-40 disabled:cursor-not-allowed">GO</button></div>
      </> : <div className="text-[11px] text-gray-600 py-4 text-center">No active agent assigned near this workstation.</div>}
    </div>
  );
}

// ── SOCIAL MARKETING PANEL ────────────────────────────────────
function SocialMarketingPanel({ furn }) {
  const [agents, setAgents] = useAtom(agentsAtom);
  const [connected] = useAtom(connectedAtom);
  const [office] = useAtom(officeAtom);
  const [, setFeed] = useAtom(feedAtom);
  const [simTime] = useAtom(simTimeAtom);
  const [brief, setBrief] = useState(`${office.name} visibility campaign`);
  const [platforms, setPlatforms] = useState(["Facebook", "YouTube", "TikTok", "Instagram"]);
  const runtimeReady = connected || Boolean(SIM_BASE_URL);
  const agent = agents.find(a => a.active && furn.assignedAgent && a.id === furn.assignedAgent) || agents.find(a => a.active && a.id === "smm") || agents.find(a => a.active && a.dept === "marketing");
  const actions = [
    ["Draft Campaign", "Create a premium one-week campaign plan with platform-specific posts, hooks, CTAs, and schedule."],
    ["Caption Variants", "Draft three caption variants for each platform: direct, clever, and emotionally resonant."],
    ["Reply Strategy", "Create a comment/reply playbook for supporters, skeptics, trolls, leads, and collaborators."],
    ["Analytics Plan", "Define KPIs, dashboards, review cadence, experiments, and thresholds for changing strategy."],
  ];

  function togglePlatform(p) { setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]); }
  async function run(label, prompt) {
    if (!agent || !runtimeReady) return;
    const task = `${prompt}\n\nOffice: ${office.name}\nBrief: ${brief}\nPlatforms: ${platforms.join(", ")}\nUse the station as a social marketing command console. Return practical, ready-to-use output.`;
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, pending:true, status:"think", task:label, showBubble:true, bubbleText:"..." } : a));
    const result = await callLLM(agent.id, task, office.name, { source:"social_station", furniture:[registryIdFor(furn)], agent:{ ...agent, furniture:[registryIdFor(furn)] } });
    const entry = { agent:agent.id, task:label, text:result, ts:formatTime(simTime), source:"social_station" };
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, pending:false, status:"work", output:result, showBubble:true, bubbleText:result, log:[...a.log, entry] } : a));
    setFeed(prev => [entry, ...prev.slice(0, 29)]);
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] text-gray-500">Controller: {agent ? `${agent.name} · ${agent.role}` : "Assign or activate a marketing agent"}{!runtimeReady && " · backend offline"}</div>
      <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={3} className="w-full bg-white/[.04] border border-white/[.08] rounded px-3 py-2 text-white text-xs outline-none focus:border-red-400/40" />
      <div className="grid grid-cols-2 gap-1.5">
        {["Facebook", "YouTube", "TikTok", "Instagram", "LinkedIn", "X/Twitter"].map(p => <button key={p} onClick={() => togglePlatform(p)} className={`text-[10px] px-2 py-1.5 rounded-lg border ${platforms.includes(p) ? "border-blue-400/25 bg-blue-400/[.06] text-blue-300" : "border-white/[.06] bg-white/[.02] text-gray-600"}`}>{p}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(([label, prompt]) => <button key={label} disabled={!agent || !runtimeReady} onClick={() => run(label, prompt)} className="rounded-xl bg-red-400/[.06] border border-red-400/15 hover:border-red-400/35 text-left px-3 py-2 transition disabled:opacity-30"><div className="text-[11px] text-red-200 font-semibold">{label}</div><div className="text-[9px] text-gray-600 mt-1">Draft/review first</div></button>)}
      </div>
    </div>
  );
}

function FilesPanel() {
  const [agents] = useAtom(agentsAtom);
  const docs = agents.filter(a => a.active && a.log.length > 0).flatMap(a => a.log.map(l => ({ ...l, agentName:a.name, color:a.color })));
  return <div><div className="text-[10px] text-gray-500 mb-2">{docs.length} documents filed</div>{docs.length > 0 ? <div className="max-h-64 overflow-y-auto space-y-1.5">{docs.slice(-10).reverse().map((d, i) => <div key={i} className="p-2 rounded bg-white/[.02] border border-white/[.04]" style={{ borderLeftColor:d.color, borderLeftWidth:2 }}><div className="text-[9px] text-gray-600 mb-1">{d.agentName} — {d.task} <span className="float-right font-mono">{d.ts}</span></div><div className="text-[10px] text-gray-500">{d.text}</div></div>)}</div> : <div className="text-[11px] text-gray-600 py-4 text-center">No documents yet. Agents file work as they complete tasks.</div>}</div>;
}

function DisplayPanel() {
  const [agents] = useAtom(agentsAtom);
  const active = agents.filter(a => a.active);
  const totalTasks = active.reduce((s, a) => s + a.log.length, 0);
  const marketingTasks = active.filter(a => a.dept === "marketing").reduce((s, a) => s + a.log.filter(l => String(l.source || "").includes("social")).length, 0);
  return <div className="space-y-2"><div className="text-[9px] text-gray-600 uppercase tracking-wide">Office Dashboard</div>{[["Active Agents", active.length], ["Tasks Completed", totalTasks], ["Marketing Runs", marketingTasks], ["Status", active.every(a => a.status === "work") ? "All Working" : "Mixed"]].map(([label, val]) => <div key={label} className="flex justify-between py-1.5 border-b border-white/[.03] text-[11px]"><span className="text-gray-600">{label}</span><span className="text-gray-400 font-semibold">{val}</span></div>)}</div>;
}

function PassiveFunctionPanel({ furn }) {
  const type = FURN_TYPES[furn.name];
  return <div className="space-y-2"><div className="text-[9px] text-gray-600 uppercase tracking-wide">Functional Support Item</div><div className="text-[11px] text-gray-500 leading-relaxed">This item supports layout logic: movement, seating, expansion, department zoning, or future skill assignment.</div><div className="rounded bg-white/[.02] border border-white/[.04] p-2 text-[10px] text-gray-500"><div><span className="text-gray-600">Grid:</span> {furn.gridPosition?.join(", ")}</div><div><span className="text-gray-600">Size:</span> {furn.size?.join(" × ")}</div><div><span className="text-gray-600">Category:</span> {type?.category || "Support"}</div>{furn.assignedAgent && <div><span className="text-gray-600">Assigned:</span> {furn.assignedAgent}</div>}</div></div>;
}

function getFurnitureAnchor(furn, fallback) {
  if (!furn?.gridPosition || !furn?.size) return fallback;
  return [furn.gridPosition[0] + Math.floor(furn.size[0] / 2), furn.gridPosition[1] + Math.floor(furn.size[1] / 2)];
}
function distance(a, b) { if (!a || !b) return Number.POSITIVE_INFINITY; return Math.hypot(a[0] - b[0], a[1] - b[1]); }

export const FurniturePanel = () => {
  const [selected, setSelected] = useAtom(selectedFurnitureAtom);
  if (!selected) return null;
  const type = FURN_TYPES[selected.name] || { icon:"📦", label:selected.name, grants:[], uiType:"none" };
  let Panel = null;
  if (type.uiType === "meeting") Panel = MeetingPanel;
  else if (type.uiType === "terminal") Panel = TerminalPanel;
  else if (type.uiType === "files") Panel = FilesPanel;
  else if (type.uiType === "display") Panel = DisplayPanel;
  else if (type.uiType === "social") Panel = SocialMarketingPanel;
  else if (type.uiType === "seat" || type.uiType === "zone") Panel = PassiveFunctionPanel;

  return (
    <div className="sim-furniture-drawer flex flex-col pointer-events-auto overflow-hidden">
      <div className="p-3 border-b border-white/[.04] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-400/10 flex items-center justify-center text-lg">{type.icon}</div>
        <div className="flex-1 min-w-0"><div className="text-sm font-bold text-gray-200 truncate">{type.label}</div><div className="text-[10px] text-gray-600 truncate">{type.grants.join(" · ") || "No special capabilities"}</div>{selected.zone && <div className="text-[9px] text-gray-700">Zone: {selected.zone}</div>}</div>
        <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-red-400 text-lg">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-800">
        {type.purpose && <div className="mb-3 p-2 rounded bg-white/[.018] border border-white/[.04] text-[10px] text-gray-500 leading-relaxed">{type.purpose}</div>}
        <StationSetup furn={selected} type={type} />
        {Panel ? <Panel furn={selected} /> : <div className="text-[11px] text-gray-600 py-4 text-center">{type.grants.length > 0 ? `This ${type.label.toLowerCase()} provides: ${type.grants.join(", ")}.` : "No interactive actions available for this item."}</div>}
      </div>
    </div>
  );
};
