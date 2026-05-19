/**
 * SimOffice UI — Polished onboarding, panels, controls, and functional layout editor.
 */
import { atom, useAtom } from "jotai";
import { useState } from "react";
import {
  modeAtom, officeAtom, speedAtom, simTimeAtom, simDayAtom,
  agentsAtom, feedAtom, connectedAtom, selectedAgentAtom, selectedFurnitureAtom,
  DEPARTMENTS, AGENT_DEFS, FURN_TYPES, DEFAULT_MAP, mapAtom, roomItemsAtom,
  editorSelectedItemAtom, editorNoticeAtom, callLLM, sendCommand, SIM_BASE_URL, SIM_MODE, OFFICE_PRESETS,
} from "./BackendBridge";
import { FurniturePanel } from "./FurniturePanel";
import { AgentControlPanel } from "./AgentControlPanel";

export const buildModeAtom = atom(false);
export const shopModeAtom = atom(false);
export const draggedItemAtom = atom(null);
export const draggedItemRotationAtom = atom(0);

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const STORAGE_KEY = "simoffice.functionalLayout.v1";

// ═══════════════════════════════════════════════════════════════
//  ONBOARDING
// ═══════════════════════════════════════════════════════════════
const OB = [
  { msg:"Welcome to SimOffice 👋\nWhat kind of office are you building?", opts:["Agentic Command Center", "Tech Startup", "Marketing Agency", "Law Firm", "Design Studio", "Generic Office"], key:"type" },
  { msg:"What should we call it?", opts:null, key:"name", ph:'e.g. "Nexus HQ" or "The War Room"' },
  { msg:"How large is your team?", opts:["Solo", "2–5", "6–15", "15+"], key:"size" },
  { msg:"What's the primary focus?", opts:["Product dev", "Client work", "Research", "Operations"], key:"focus" },
];

function Onboarding() {
  const [, setMode] = useAtom(modeAtom);
  const [office, setOffice] = useAtom(officeAtom);
  const [, setAgents] = useAtom(agentsAtom);
  const [step, setStep] = useState(0);
  const [msgs, setMsgs] = useState([{ from:"bot", text:OB[0].msg }]);
  const [input, setInput] = useState("");
  const [fading, setFading] = useState(false);

  function answer(text) {
    const s = OB[step];
    const next = { ...office, [s.key]:text };
    setOffice(next);
    setMsgs(p => [...p, { from:"user", text }]);
    if (step + 1 < OB.length) {
      setTimeout(() => { setMsgs(p => [...p, { from:"bot", text:OB[step + 1].msg }]); setStep(step + 1); }, 400);
    } else {
      setTimeout(() => {
        configureAgents(next, setAgents);
        setMsgs(p => [...p, { from:"bot", text:`"${next.name}" is set up! Entering your office now...` }]);
        setTimeout(() => { setFading(true); setTimeout(() => setMode("live"), 800); }, 1500);
      }, 400);
    }
  }

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-[#06061a] to-[#14102c] flex flex-col items-center justify-center z-[200] transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="mb-16 text-center">
        <h1 className="font-mono text-8xl font-black tracking-wider" style={{ color:"#ff6b6b", textShadow:"0 0 80px rgba(255,107,107,.3),0 4px 0 #801a1a" }}>SimOffice</h1>
        <p className="text-[10px] text-gray-700 tracking-[14px] uppercase mt-2">Premium Agentic Operations Floor</p>
      </div>
      <div className="w-[540px] bg-white/[.015] border border-white/[.05] rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
        <div className="h-[200px] overflow-y-auto flex flex-col gap-3 mb-5 pr-1 scrollbar-thin scrollbar-thumb-gray-800">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line ${
              m.from === "bot"
                ? "self-start bg-red-400/[.05] border border-red-400/[.12] text-gray-300 rounded-bl-sm"
                : "self-end bg-white/[.06] text-gray-400 rounded-br-sm"}`}>
              {m.text}
            </div>
          ))}
        </div>
        {OB[step]?.opts && (
          <div className="flex flex-wrap gap-2 mb-4">
            {OB[step].opts.map(o => (
              <button key={o} onClick={() => answer(o)}
                className="px-4 py-2 border border-red-400/25 rounded-full text-red-400 text-[12px] hover:bg-red-400/10 hover:border-red-400/40 transition-all duration-200">{o}</button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && input.trim()) { answer(input.trim()); setInput(""); } }}
            placeholder={OB[step]?.ph || "Type your answer..."}
            className="flex-1 bg-white/[.03] border border-white/[.07] rounded-xl px-5 py-3 text-white text-sm outline-none focus:border-red-400/30 transition-colors placeholder:text-gray-700" />
          <button onClick={() => { if (input.trim()) { answer(input.trim()); setInput(""); } }}
            className="px-6 py-3 bg-red-400 hover:bg-red-300 rounded-xl text-white font-bold text-sm transition-colors">→</button>
        </div>
      </div>
    </div>
  );
}

function configureAgents(office, setAgents) {
  const preset = OFFICE_PRESETS[office.type] || OFFICE_PRESETS["Agentic Command Center"];
  const activeSet = new Set(preset.activeAgents || []);

  setAgents(prev => prev.map(a => {
    let on = activeSet.has(a.id);
    if ((office.size === "6–15" || office.size === "15+") && ["cfo", "cio", "sch"].includes(a.id)) on = true;
    if (office.size === "15+") on = true;
    if (office.focus === "Product dev" && ["cto", "cio", "crt"].includes(a.id)) on = true;
    if (office.focus === "Client work" && ["sch", "acc"].includes(a.id)) on = true;
    if (office.focus === "Operations" && ["adm", "sch", "cio", "cfo"].includes(a.id)) on = true;
    return {
      ...a,
      active:on,
      priority:a.id === "ceo" ? "high" : a.priority,
      taskTimer:200 + AGENT_DEFS.findIndex(d => d.id === a.id) * 300,
    };
  }));
}


// ═══════════════════════════════════════════════════════════════
//  AGENT DETAIL
// ═══════════════════════════════════════════════════════════════
function AgentDetail() {
  const [selId, setSelId] = useAtom(selectedAgentAtom);
  const [agents, setAgents] = useAtom(agentsAtom);
  const [office] = useAtom(officeAtom);
  const [input, setInput] = useState("");
  const agent = agents.find(a => a.id === selId);
  if (!agent) return null;
  const dept = DEPARTMENTS[agent.dept];

  async function sendTask() {
    if (!input.trim()) return;
    const task = input.trim(); setInput("");
    setAgents(p => p.map(a => a.id === selId ? { ...a, pending:true, status:"think", showBubble:true, bubbleText:"..." } : a));
    const result = await callLLM(selId, task, office.name, { source:"manual", agent });
    setAgents(p => p.map(a => a.id === selId ? { ...a, pending:false, status:"work", output:result, showBubble:true, bubbleText:result, log:[...a.log, { task, text:result, ts:"now" }] } : a));
    setTimeout(() => setAgents(p => p.map(a => a.id === selId ? { ...a, showBubble:false } : a)), 6000);
  }

  return (
    <div className="absolute top-12 left-[11.5rem] w-[300px] bottom-0 bg-[#0a0a1c]/98 border-x border-white/[.04] flex flex-col z-[60] pointer-events-auto backdrop-blur-xl">
      <div className="p-4 border-b border-white/[.04] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background:agent.color }}>{agent.name[0]}</div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-200">{agent.name}</div>
          <div className="text-[10px] text-gray-600">{agent.role}</div>
          <div className="text-[9px] mt-0.5" style={{ color:dept?.color || "#888" }}>{dept?.icon} {dept?.label}</div>
        </div>
        <button onClick={() => setSelId(null)} className="text-gray-600 hover:text-red-400 text-xl transition-colors">✕</button>
      </div>
      <div className="px-4 py-2 text-[11px] text-gray-500 border-b border-white/[.04] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background:agent.status === "work" ? "#40a868" : agent.status === "think" ? "#ff6b6b" : "#e0a040" }} />
        {agent.status === "think" ? "Thinking..." : agent.task}
      </div>
      <div className="px-4 py-2 text-[9px] text-gray-700 border-b border-white/[.04]">
        <span className="text-gray-600">Model:</span> {agent.model} · <span className="text-gray-600">Goal:</span> {agent.goal}
      </div>
      <div className="px-4 pt-3 pb-1 font-mono text-[10px] text-red-400 tracking-wider">OUTPUT LOG</div>
      <div className="flex-1 overflow-y-auto px-4 pb-2 scrollbar-thin scrollbar-thumb-gray-800">
        {agent.log.length === 0 && <div className="text-[11px] text-gray-700 py-8 text-center italic">No outputs yet.<br />Assign a task below or wait for auto-assignment.</div>}
        {[...agent.log].reverse().map((e, i) => (
          <div key={i} className="mb-2 p-2.5 rounded-lg bg-white/[.015] border border-white/[.03]">
            <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-1 flex justify-between">{e.task}<span className="font-mono">{e.ts}</span></div>
            <div className="text-[11px] text-gray-400 leading-relaxed">{e.text}</div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/[.04] flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendTask(); }}
          placeholder={`Task for ${agent.name}...`}
          className="flex-1 bg-white/[.03] border border-white/[.06] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-red-400/30 transition-colors" />
        <button onClick={sendTask} className="px-4 py-2 bg-red-400 hover:bg-red-300 rounded-lg text-white font-mono text-sm transition-colors">GO</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  FUNCTIONAL LAYOUT EDITOR
// ═══════════════════════════════════════════════════════════════
function EditorPanel() {
  const [items, setItems] = useAtom(roomItemsAtom);
  const [map, setMap] = useAtom(mapAtom);
  const [selectedIdx, setSelectedIdx] = useAtom(editorSelectedItemAtom);
  const [notice, setNotice] = useAtom(editorNoticeAtom);
  const [draggedItem, setDraggedItem] = useAtom(draggedItemAtom);
  const [, setDragRot] = useAtom(draggedItemRotationAtom);
  const [selectedFurniture, setSelectedFurniture] = useAtom(selectedFurnitureAtom);
  const [showTeam, setShowTeam] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [agents, setAgents] = useAtom(agentsAtom);

  const selected = Number.isInteger(selectedIdx) ? items[selectedIdx] : null;
  const type = selected ? FURN_TYPES[selected.name] : null;
  const gridMax = [map.size[0] * map.gridDivision, map.size[1] * map.gridDivision];

  function cleanList(list = items) {
    return list.filter(Boolean).filter(i => !i.tmp).map(i => ({ ...i, tmp:undefined }));
  }

  function commitLayout(message = "Layout applied. Live mode will use this edited map.") {
    const cleaned = cleanList();
    const next = { ...map, items:cleaned };
    setItems(cleaned);
    setMap(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
    setNotice(message);
    return next;
  }

  function resetPrefab() {
    const next = { ...DEFAULT_MAP, items:DEFAULT_MAP.items.map(i => ({ ...i })) };
    setMap(next);
    setItems(next.items);
    setSelectedIdx(null);
    setDraggedItem(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    setNotice("Reset to the functional prefab: command row, central meeting hub, finance, ops, marketing, records, and expansion zones.");
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { setNotice("No saved local layout found yet."); return; }
      const parsed = JSON.parse(raw);
      if (!parsed?.items || !parsed?.size || !parsed?.gridDivision) throw new Error("Invalid saved layout");
      setMap(parsed);
      setItems(parsed.items);
      setSelectedIdx(null);
      setDraggedItem(null);
      setNotice("Loaded the saved local layout.");
    } catch (e) {
      setNotice(`Could not load saved layout: ${e.message}`);
    }
  }

  function updateSelected(mutator, message) {
    if (!selected) return;
    setItems(prev => prev.map((item, idx) => idx === selectedIdx ? mutator(item) : item));
    if (message) setNotice(message);
  }

  function rotateSelected() {
    if (!selected) return;
    updateSelected(item => ({ ...item, rotation:((item.rotation || 0) + 1) % 4 }), "Rotated selected furniture 90° clockwise.");
  }

  function nudge(dx, dy) {
    if (!selected) return;
    updateSelected(item => {
      const w = (item.rotation === 1 || item.rotation === 3) ? item.size[1] : item.size[0];
      const h = (item.rotation === 1 || item.rotation === 3) ? item.size[0] : item.size[1];
      return {
        ...item,
        gridPosition:[
          clamp(item.gridPosition[0] + dx, 0, gridMax[0] - w),
          clamp(item.gridPosition[1] + dy, 0, gridMax[1] - h),
        ],
      };
    }, `Nudged selected furniture by ${dx}, ${dy}.`);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy = { ...selected, gridPosition:[Math.min(selected.gridPosition[0] + 1, gridMax[0] - selected.size[0]), Math.min(selected.gridPosition[1] + 1, gridMax[1] - selected.size[1])], assignedAgent:undefined };
    setItems(prev => [...prev, copy]);
    setSelectedIdx(items.length);
    setNotice("Duplicated selected furniture. Assign it to an agent or move it into an expansion zone.");
  }

  function deleteSelected() {
    if (!selected) return;
    setItems(prev => prev.filter((_, idx) => idx !== selectedIdx));
    setSelectedIdx(null);
    setSelectedFurniture(null);
    setDraggedItem(null);
    setNotice("Deleted selected furniture from the editable layout.");
  }

  function startMove() {
    if (!selected) return;
    setDraggedItem(selectedIdx);
    setDragRot(selected.rotation || 0);
    setNotice("Move mode active. Hover over the floor grid and click a valid open cell to drop the selected furniture.");
  }

  function assignAgent(agentId) {
    if (!selected) return;
    updateSelected(item => ({ ...item, assignedAgent:agentId || undefined }), agentId ? `Assigned this station to ${AGENT_DEFS.find(a => a.id === agentId)?.name || agentId}.` : "Cleared station assignment.");
    if (agentId && selected.gridPosition) {
      const anchor = [selected.gridPosition[0] + Math.floor((selected.size?.[0] || 1) / 2), selected.gridPosition[1] + (selected.size?.[1] || 1)];
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, desk:anchor, position:a.active ? a.position : anchor } : a));
    }
  }

  function resize(dx, dz) {
    const cleaned = cleanList();
    const nextSize = [clamp(map.size[0] + dx, 8, 24), clamp(map.size[1] + dz, 8, 24)];
    const next = { ...map, size:nextSize, items:cleaned };
    setMap(next);
    setItems(cleaned);
    setNotice(`Room size set to ${nextSize[0]} × ${nextSize[1]} world units (${nextSize[0] * map.gridDivision} × ${nextSize[1] * map.gridDivision} grid cells).`);
  }

  const summary = summarizeLayout(items);

  return (
    <div className="absolute top-12 left-0 w-[19.5rem] bottom-0 bg-[#070718]/95 border-r border-white/[.05] backdrop-blur-xl pointer-events-auto z-[70] p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
      <div className="font-mono text-[10px] text-red-400 tracking-widest mb-2">FUNCTIONAL LAYOUT EDITOR</div>
      <div className="text-[10px] text-gray-600 leading-relaxed mb-3">The prefab now leaves open expansion lanes. Keep default furniture purposeful: workstation, meeting, records, dashboard, zone, or seating anchor.</div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={() => commitLayout()} className="editor-btn bg-red-500/20 text-red-300 border-red-400/25">Apply Layout</button>
        <button onClick={loadSaved} className="editor-btn">Load Saved</button>
        <button onClick={resetPrefab} className="editor-btn">Reset Prefab</button>
        <button onClick={() => setNotice("Use Furniture to add a functional node, click an existing item to select it, then Apply Layout before going live.")} className="editor-btn">Help</button>
      </div>

      <div className="rounded-xl bg-white/[.02] border border-white/[.05] p-3 mb-3">
        <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">Room Envelope</div>
        <div className="flex justify-between text-[11px] mb-2"><span className="text-gray-600">World size</span><span className="text-gray-400 font-mono">{map.size[0]} × {map.size[1]}</span></div>
        <div className="flex justify-between text-[11px] mb-2"><span className="text-gray-600">Grid cells</span><span className="text-gray-400 font-mono">{gridMax[0]} × {gridMax[1]}</span></div>
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={() => resize(1, 0)} className="mini-btn">W+</button>
          <button onClick={() => resize(-1, 0)} className="mini-btn">W−</button>
          <button onClick={() => resize(0, 1)} className="mini-btn">D+</button>
          <button onClick={() => resize(0, -1)} className="mini-btn">D−</button>
        </div>
      </div>

      <div className="rounded-xl bg-white/[.02] border border-white/[.05] p-3 mb-3">
        <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">Layout Health</div>
        {summary.map(row => <div key={row[0]} className="flex justify-between text-[11px] py-1 border-b border-white/[.025]"><span className="text-gray-600">{row[0]}</span><span className="text-gray-400 font-mono">{row[1]}</span></div>)}
      </div>

      <div className="rounded-xl bg-white/[.02] border border-white/[.05] p-3 mb-3">
        <div className="text-[9px] text-gray-600 uppercase tracking-wide mb-2">Selected Item</div>
        {selected ? (
          <>
            <div className="flex items-start gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center text-lg">{type?.icon || "📦"}</div>
              <div>
                <div className="text-sm font-bold text-gray-300">{type?.label || selected.name}</div>
                <div className="text-[9px] text-gray-600">{selected.zone || type?.category || "Unzoned"}</div>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 leading-relaxed mb-2">{type?.purpose || "No function assigned yet."}</div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2">
              <div className="stat-chip">x {selected.gridPosition?.[0]}</div>
              <div className="stat-chip">z {selected.gridPosition?.[1]}</div>
              <div className="stat-chip">size {selected.size?.join("×")}</div>
              <div className="stat-chip">rot {selected.rotation || 0}</div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button onClick={() => nudge(0, -1)} className="mini-btn col-start-2">↑</button>
              <button onClick={() => nudge(-1, 0)} className="mini-btn">←</button>
              <button onClick={startMove} className={`mini-btn ${draggedItem === selectedIdx ? "text-amber-300 border-amber-300/40" : ""}`}>Move</button>
              <button onClick={() => nudge(1, 0)} className="mini-btn">→</button>
              <button onClick={rotateSelected} className="mini-btn">Rotate</button>
              <button onClick={() => nudge(0, 1)} className="mini-btn">↓</button>
              <button onClick={duplicateSelected} className="mini-btn">Clone</button>
            </div>
            <label className="block text-[9px] text-gray-600 uppercase tracking-wide mb-1">Assigned Agent</label>
            <select value={selected.assignedAgent || ""} onChange={e => assignAgent(e.target.value)}
              className="w-full bg-white/[.04] border border-white/[.08] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none mb-2">
              <option value="">Unassigned</option>
              {AGENT_DEFS.map(a => <option key={a.id} value={a.id}>{a.name} — {a.role}</option>)}
            </select>
            <button onClick={deleteSelected} className="w-full py-2 rounded-lg bg-red-950/40 border border-red-500/20 text-red-300 text-xs hover:bg-red-900/40 transition">Delete Selected</button>
          </>
        ) : (
          <div className="text-[11px] text-gray-600 py-3 text-center">Click furniture in edit mode, or open Furniture to place a new functional node.</div>
        )}
      </div>

      <div className="rounded-xl bg-red-400/[.035] border border-red-400/[.08] p-3 text-[10px] text-gray-500 leading-relaxed">{notice}</div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  PREMIUM OUT-OF-BOX COMMAND PANEL
// ═══════════════════════════════════════════════════════════════
function PremiumLaunchPanel({ runtimeReady, runtimeLabel }) {
  const [office] = useAtom(officeAtom);
  const [agents, setAgents] = useAtom(agentsAtom);
  const [, setFeed] = useAtom(feedAtom);
  const [simTime] = useAtom(simTimeAtom);
  const [, setSelAgent] = useAtom(selectedAgentAtom);
  const [, setSelFurn] = useAtom(selectedFurnitureAtom);
  const [collapsed, setCollapsed] = useState(true);

  const preset = OFFICE_PRESETS[office.type] || OFFICE_PRESETS["Agentic Command Center"];
  const active = agents.filter(a => a.active);

  async function runPresetTask(task) {
    const agent = agents.find(a => a.id === task.agent) || active[0];
    if (!agent || !runtimeReady) return;
    setSelAgent(agent.id);
    setSelFurn(null);
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, pending:true, status:"think", task:task.label, showBubble:true, bubbleText:"..." } : a));
    const prompt = `${task.prompt}

Office preset: ${preset.label}
Office: ${office.name}
Starter brief: ${preset.starterBrief}
Return a professional work product with sections, owners, risks, and next actions.`;
    const result = await callLLM(agent.id, prompt, office.name, { source:"premium_starter", agent });
    const entry = { agent:agent.id, task:task.label, text:result, ts:formatTimeLocal(simTime), source:"premium_starter" };
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, pending:false, status:"work", output:result, showBubble:true, bubbleText:result, log:[...a.log, entry] } : a));
    setFeed(prev => [entry, ...prev.slice(0, 29)]);
    setTimeout(() => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, showBubble:false } : a)), 6000);
  }

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)} className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto rounded-full border border-red-400/20 bg-[#0a0a1c]/90 px-4 py-2 text-[10px] text-red-200 shadow-2xl shadow-black/40 backdrop-blur-xl">
        ✦ Premium Starter Console
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[36rem] max-w-[calc(100vw-34rem)] pointer-events-auto rounded-2xl border border-white/[.08] bg-[#070715]/96 p-3 shadow-2xl shadow-black/60">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/[.08] text-lg">✦</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-black text-gray-200">{preset.label}</div>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] ${runtimeReady ? "border-green-400/20 bg-green-400/[.05] text-green-300" : "border-red-400/20 bg-red-400/[.05] text-red-200"}`}>{runtimeLabel}</span>
          </div>
          <div className="mt-1 text-[10px] leading-relaxed text-gray-500">{preset.tagline} {preset.starterBrief}</div>
        </div>
        <button onClick={() => setCollapsed(true)} className="rounded-lg border border-white/[.06] px-2 py-1 text-[10px] text-gray-600 hover:text-gray-300">Hide</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(preset.starterTasks || []).slice(0,4).map(task => {
          const agent = agents.find(a => a.id === task.agent);
          return (
            <button key={task.label} onClick={() => runPresetTask(task)} disabled={!runtimeReady || !agent?.active || agent?.pending}
              className="min-h-12 rounded-xl border border-red-400/15 bg-red-400/[.055] px-3 py-2 text-left transition hover:border-red-400/35 disabled:cursor-not-allowed disabled:opacity-35">
              <div className="text-[11px] font-semibold text-red-100">{task.label}</div>
              <div className="mt-1 text-[9px] text-gray-600">{agent ? `${agent.name} · ${agent.role}` : task.agent}</div>
            </button>
          );
        })}
      </div>
      {!runtimeReady && <div className="mt-2 rounded-lg border border-red-400/15 bg-red-400/[.04] px-3 py-2 text-[10px] text-red-100/75">Starter buttons are real backend actions. Connect CrewAI or configure SimAI to run them.</div>}
    </div>
  );
}

function formatTimeLocal(mins) {
  const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN UI — Command-shell management pass
// ═══════════════════════════════════════════════════════════════
function AgentStatusDot({ status }) {
  const color = status === "work" ? "#34d399" : status === "think" ? "#fb7185" : status === "meet" ? "#f59e0b" : "#60a5fa";
  return <span className="sim-status-dot" style={{ background:color }} />;
}

function AgentRail({ agents, selAgent, setSelAgent, setSelectedFurniture, openRoster }) {
  const active = agents.filter(a => a.active);
  return (
    <aside className="sim-agent-rail pointer-events-auto">
      <button className="sim-rail-menu" onClick={openRoster} title="Open full roster">☰</button>
      <div className="sim-rail-list">
        {active.map(a => (
          <button key={a.id} title={`${a.name} — ${a.role}`} onClick={() => { setSelectedFurniture(null); setSelAgent(a.id); }} className={`sim-rail-avatar ${selAgent === a.id ? "selected" : ""}`}>
            <span style={{ background:a.color }}>{a.name[0]}</span>
            <AgentStatusDot status={a.status} />
          </button>
        ))}
      </div>
    </aside>
  );
}

function TeamDock({ agents, selAgent, setSelAgent, setSelectedFurniture, onClose }) {
  const [query, setQuery] = useState("");
  const active = agents.filter(a => a.active);
  const filtered = active.filter(a => `${a.name} ${a.role} ${a.dept} ${a.model}`.toLowerCase().includes(query.toLowerCase()));
  const working = active.filter(a => a.status === "work").length;
  const thinking = active.filter(a => a.status === "think").length;

  function chooseAgent(id) {
    setSelectedFurniture(null);
    setSelAgent(id);
    onClose?.();
  }

  return (
    <aside className="sim-team-dock sim-floating-roster pointer-events-auto">
      <div className="sim-panel-heading">
        <div>
          <div className="sim-eyebrow">Command</div>
          <div className="sim-panel-title">Agent Roster</div>
        </div>
        <button className="sim-icon-close" onClick={onClose}>×</button>
      </div>

      <div className="sim-team-metrics">
        <div><b>{active.length}</b><span>agents</span></div>
        <div><b>{working}</b><span>ready</span></div>
        <div><b>{thinking}</b><span>thinking</span></div>
      </div>

      <input className="sim-search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agents, roles, models…" />

      <div className="sim-team-list">
        {Object.entries(DEPARTMENTS).map(([dept, info]) => {
          const da = filtered.filter(a => a.dept === dept);
          if (da.length === 0) return null;
          return (
            <section key={dept} className="sim-team-section">
              <div className="sim-dept-label" style={{ color:info.color }}><span>{info.icon}</span>{info.label}</div>
              {da.map(a => (
                <button key={a.id} onClick={() => chooseAgent(a.id)} className={`sim-agent-card ${selAgent === a.id ? "selected" : ""}`}>
                  <span className="sim-avatar" style={{ background:a.color }}>{a.name[0]}</span>
                  <span className="sim-agent-card-body">
                    <span className="sim-agent-name-row"><b>{a.name}</b><AgentStatusDot status={a.status} /></span>
                    <span className="sim-agent-role">{a.role}</span>
                    <span className="sim-agent-task">{a.model} · {a.status === "think" ? "Thinking…" : a.task}</span>
                  </span>
                </button>
              ))}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function ActivityDock({ feed }) {
  return (
    <aside className="sim-activity-dock pointer-events-auto">
      <div className="sim-panel-heading compact">
        <div>
          <div className="sim-eyebrow">Activity</div>
          <div className="sim-panel-title">Latest Work</div>
        </div>
        <div className="sim-count-pill">{feed.length}</div>
      </div>
      <div className="sim-feed-list">
        {feed.slice(0, 8).map((e, i) => {
          const ag = AGENT_DEFS.find(a => a.id === e.agent);
          return (
            <article key={i} className="sim-feed-card" style={{ borderLeftColor:ag?.color || "#94a3b8" }}>
              <div className="sim-feed-meta"><b>{ag?.name || e.agent}</b><span>{e.ts}</span></div>
              <div className="sim-feed-task">{e.task}</div>
              <p>{e.text}</p>
            </article>
          );
        })}
        {feed.length === 0 && (
          <div className="sim-empty-state">
            <b>No outputs yet</b>
            <span>Press play or run a command to start the office.</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function RuntimeNotice({ runtimeReady, runtimeLabel }) {
  if (runtimeReady) return null;
  return (
    <div className="sim-runtime-notice pointer-events-auto">
      <div>
        <b>Backend offline</b>
        <span>UI and layout editing are live. Agent execution needs FastAPI on :8080 or VITE_SIM_BASE_URL.</span>
      </div>
      <button onClick={() => location.reload()}>Retry</button>
    </div>
  );
}

export const UI = () => {
  const [mode] = useAtom(modeAtom);
  const [buildMode, setBuildMode] = useAtom(buildModeAtom);
  const [shopMode, setShopMode] = useAtom(shopModeAtom);
  const [draggedItem, setDraggedItem] = useAtom(draggedItemAtom);
  const [, setDragRot] = useAtom(draggedItemRotationAtom);
  const [agents] = useAtom(agentsAtom);
  const [speed, setSpeed] = useAtom(speedAtom);
  const [simTime] = useAtom(simTimeAtom);
  const [simDay] = useAtom(simDayAtom);
  const [connected] = useAtom(connectedAtom);
  const [feed] = useAtom(feedAtom);
  const [selAgent, setSelAgent] = useAtom(selectedAgentAtom);
  const [office] = useAtom(officeAtom);
  const [map, setMap] = useAtom(mapAtom);
  const [items, setItems] = useAtom(roomItemsAtom);
  const [, setSelectedEditIdx] = useAtom(editorSelectedItemAtom);
  const [, setNotice] = useAtom(editorNoticeAtom);
  const [selectedFurniture, setSelectedFurniture] = useAtom(selectedFurnitureAtom);
  const [showRoster, setShowRoster] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  if (mode === "onboarding") return <Onboarding />;

  const h = Math.floor(simTime / 60), m = Math.floor(simTime % 60);
  const ts = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const isLive = !buildMode && !shopMode;
  const runtimeReady = connected || Boolean(SIM_BASE_URL);
  const runtimeLabel = SIM_BASE_URL ? `SIMAI ${SIM_MODE.toUpperCase()}` : connected ? "CREWAI" : "OFFLINE";
  const activeAgents = agents.filter(a => a.active);
  const totalOutputs = activeAgents.reduce((sum, a) => sum + (a.log?.length || 0), 0);

  function applyAndGoLive() {
    const cleaned = items.filter(Boolean).filter(i => !i.tmp).map(i => ({ ...i, tmp:undefined }));
    const next = { ...map, items:cleaned };
    setItems(cleaned);
    setMap(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}

    agents.forEach(agent => {
      const furniture = [...new Set(cleaned
        .filter(item => item.assignedAgent === agent.id)
        .map(item => FURN_TYPES[item.name]?.registryId || item.registryId || item.name)
        .filter(Boolean))];
      if (furniture.length > 0) sendCommand("update_furniture", { agent:agent.id, furniture });
    });

    setSelectedEditIdx(null);
    setSelectedFurniture(null);
    setDraggedItem(null);
    setShopMode(false);
    setBuildMode(false);
    setSpeed(1);
    setNotice("Layout applied, furniture skills synced, and live simulation resumed.");
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 sim-shell">
      <div className="sim-topbar pointer-events-auto">
        <div className="sim-brand-block">
          <span className="sim-logo">SimOffice</span>
          <span className="sim-office-name">{office.name}</span>
          <span className={`sim-runtime-pill ${runtimeReady ? "ready" : "offline"}`}>{runtimeReady ? `● ${runtimeLabel}` : "⚠ OFFLINE"}</span>
          {isLive && <span className="sim-time-pill">{DAYS[simDay]} {ts}</span>}
          {buildMode && <span className="sim-edit-pill">EDITING {map.size[0] * map.gridDivision}×{map.size[1] * map.gridDivision}</span>}
        </div>

        {isLive && (
          <div className="sim-kpi-strip">
            <span><b>{activeAgents.length}</b> agents</span>
            <span><b>{totalOutputs}</b> outputs</span>
            <span><b>{feed.length}</b> feed</span>
          </div>
        )}

        <div className="sim-control-block">
          {isLive && (
            <div className="sim-toggle-group">
              <button onClick={() => setShowRoster(v => !v)} className={showRoster ? "on" : ""}>Roster</button>
              <button onClick={() => setShowActivity(v => !v)} className={showActivity ? "on" : ""}>Activity</button>
            </div>
          )}
          {buildMode ? (
            <>
              <button onClick={() => setShopMode(!shopMode)} className="sim-ghost-btn">{shopMode ? "Close" : "Furniture"}</button>
              {draggedItem !== null && <button onClick={() => setDragRot(p => (p + 1) % 4)} className="sim-ghost-btn">Rotate</button>}
              <button onClick={applyAndGoLive} className="sim-primary-btn">Apply + Go Live</button>
            </>
          ) : (
            <>
              <div className="sim-speed-group">
                {[{ s:0, l:"⏸" }, { s:1, l:"1×" }, { s:2, l:"2×" }, { s:4, l:"4×" }].map(({ s, l }) => (
                  <button key={s} onClick={() => setSpeed(s)} className={speed === s ? "on" : ""}>{l}</button>
                ))}
              </div>
              <button onClick={() => { setBuildMode(true); setSpeed(0); setShopMode(false); setSelectedFurniture(null); setNotice("Edit mode: select furniture, add functional nodes, expand the room, then Apply + Go Live."); }} className="sim-ghost-btn">Edit Layout</button>
            </>
          )}
        </div>
      </div>

      {isLive && <RuntimeNotice runtimeReady={runtimeReady} runtimeLabel={runtimeLabel} />}
      {isLive && <PremiumLaunchPanel runtimeReady={runtimeReady} runtimeLabel={runtimeLabel} />}
      {buildMode && <EditorPanel />}

      {isLive && <AgentRail agents={agents} selAgent={selAgent} setSelAgent={setSelAgent} setSelectedFurniture={setSelectedFurniture} openRoster={() => setShowRoster(true)} />}
      {isLive && showRoster && <TeamDock agents={agents} selAgent={selAgent} setSelAgent={setSelAgent} setSelectedFurniture={setSelectedFurniture} onClose={() => setShowRoster(false)} />}

      {isLive && selAgent && <AgentControlPanel />}
      {isLive && <FurniturePanel />}

      {isLive && showActivity && !selAgent && !selectedFurniture && <ActivityDock feed={feed} />}
      {isLive && !showActivity && !selAgent && !selectedFurniture && <button onClick={() => setShowActivity(true)} className="sim-restore-right pointer-events-auto">Feed</button>}
    </div>
  );
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function summarizeLayout(items) {
  const clean = items.filter(Boolean).filter(i => !i.tmp);
  const countBy = (predicate) => clean.filter(predicate).length;
  const stations = countBy(i => FURN_TYPES[i.name]?.uiType === "terminal");
  const meetings = countBy(i => FURN_TYPES[i.name]?.uiType === "meeting");
  const records = countBy(i => FURN_TYPES[i.name]?.uiType === "files");
  const dashboards = countBy(i => FURN_TYPES[i.name]?.uiType === "display");
  const zones = countBy(i => FURN_TYPES[i.name]?.uiType === "zone");
  const assigned = countBy(i => !!i.assignedAgent);
  return [
    ["Total functional items", clean.length],
    ["Workstations", stations],
    ["Assigned stations/seats", assigned],
    ["Meeting nodes", meetings],
    ["Knowledge nodes", records],
    ["Dashboard nodes", dashboards],
    ["Expansion zones", zones],
  ];
}
