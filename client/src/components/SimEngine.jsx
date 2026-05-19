/**
 * SimOffice SimEngine — Runs the simulation: task timers, agent logic, CEO monitoring
 */
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { agentsAtom, speedAtom, simTimeAtom, simDayAtom, officeAtom, feedAtom, modeAtom, connectedAtom, AGENT_TASKS, LAYOUT_ANCHORS, callLLM, SIM_BASE_URL } from "./BackendBridge";

export const SimEngine = () => {
  const [agents, setAgents] = useAtom(agentsAtom);
  const [speed] = useAtom(speedAtom);
  const [simTime, setSimTime] = useAtom(simTimeAtom);
  const [simDay, setSimDay] = useAtom(simDayAtom);
  const [office] = useAtom(officeAtom);
  const [, setFeed] = useAtom(feedAtom);
  const [connected] = useAtom(connectedAtom);
  const [mode] = useAtom(modeAtom);
  const ceoTimer = useRef(600);
  const runtimeReady = connected || Boolean(SIM_BASE_URL);

  useEffect(() => {
    if (mode !== "live" || speed === 0) return;

    const interval = setInterval(() => {
      // Advance clock
      setSimTime(prev => {
        let next = prev + speed * 0.2;
        if (next >= 1020) { setSimDay(d => (d + 1) % 5); return 540; }
        return next;
      });

      // Agent task logic
      setAgents(prev => prev.map(a => {
        if (!a.active || a.pending) return a;
        const next = { ...a, taskTimer: a.taskTimer - speed * 2 };

        // Move along path
        if (next.path.length > 0 && next.pathIdx < next.path.length) {
          const wp = next.path[next.pathIdx];
          const dx = wp[0] - next.position[0], dy = wp[1] - next.position[1];
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 0.5) {
            next.position = [...wp];
            next.pathIdx++;
            if (next.pathIdx >= next.path.length) { next.path = []; next.pathIdx = 0; }
          } else {
            const spd = speed * 0.3;
            next.position = [next.position[0] + (dx/dist)*spd, next.position[1] + (dy/dist)*spd];
            next.face = dx > 0 ? 1 : -1;
          }
        }

        // Assign new task when timer expires
        if (next.taskTimer <= 0) {
          next.taskTimer = 400 + Math.random() * 600;
          const pool = AGENT_TASKS[a.id] || [{ t: "Working", s: "work" }];
          const task = pool[next.taskIdx % pool.length];
          next.taskIdx++;
          next.task = task.t;
          next.status = task.s;
          // Move to desk for work tasks
          if (task.s === "work") {
            next.path = [a.desk]; next.pathIdx = 0;
          } else if (task.s === "meet") {
            next.path = [LAYOUT_ANCHORS.meeting]; next.pathIdx = 0; // functional meeting area
          } else if (task.target && LAYOUT_ANCHORS[task.target]) {
            next.path = [LAYOUT_ANCHORS[task.target]]; next.pathIdx = 0;
          } else {
            next.path = [[Math.floor(Math.random()*24)+2, Math.floor(Math.random()*18)+2]]; next.pathIdx = 0;
          }

          // Fire real backend call only when a runtime is connected. No demo output is generated offline.
          if (!a.pending && runtimeReady) {
            const agentId = a.id;
            const taskName = task.t;
            setTimeout(async () => {
              setAgents(p => p.map(x => x.id === agentId ? { ...x, pending: true, status: "think", showBubble: true, bubbleText: "..." } : x));
              const result = await callLLM(agentId, taskName, office.name, { source:"auto", agent:a });
              setAgents(p => p.map(x => x.id === agentId ? {
                ...x, pending: false, status: task.s, output: result, showBubble: true, bubbleText: result,
                log: [...x.log, { task: taskName, text: result, ts: formatTime(simTime) }],
              } : x));
              setFeed(prev => [{ agent: agentId, task: taskName, text: result, ts: formatTime(simTime) }, ...prev.slice(0, 29)]);
              // Hide bubble after 6 seconds
              setTimeout(() => {
                setAgents(p => p.map(x => x.id === agentId ? { ...x, showBubble: false } : x));
              }, 6000);
            }, 100);
          }
        }
        return next;
      }));

      // CEO monitoring loop: only runs through a real backend. No local canned
      // management observations are generated while offline.
      ceoTimer.current -= speed * 2;
      if (runtimeReady && ceoTimer.current <= 0) {
        ceoTimer.current = 900;
        const snapshot = agents.filter(a => a.active).map(a => ({
          id:a.id, name:a.name, task:a.task, status:a.status, last:a.log?.[a.log.length - 1]?.text || ""
        }));
        const ceo = agents.find(a => a.id === "ceo" && a.active && !a.pending);
        if (ceo && snapshot.some(a => a.id !== "ceo" && a.last)) {
          setTimeout(async () => {
            setAgents(prev => prev.map(a => a.id === "ceo" ? { ...a, pending:true, status:"think", task:"Management review", showBubble:true, bubbleText:"..." } : a));
            const result = await callLLM("ceo", `Review this live team snapshot and return decisions, risks, and next actions: ${JSON.stringify(snapshot)}`, office.name, { source:"management_review", agent:ceo });
            const entry = { task:"Management review", text:result, ts:formatTime(simTime), source:"management_review" };
            setAgents(prev => prev.map(a => a.id === "ceo" ? { ...a, pending:false, status:"work", output:result, showBubble:true, bubbleText:result, log:[...a.log, entry] } : a));
            setFeed(prev => [{ agent:"ceo", ...entry }, ...prev.slice(0, 29)]);
          }, 100);
        }
      }
    }, 50); // 20fps sim tick

    return () => clearInterval(interval);
  }, [mode, speed, simTime, runtimeReady]);

  return null;
};

function formatTime(mins) {
  const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
