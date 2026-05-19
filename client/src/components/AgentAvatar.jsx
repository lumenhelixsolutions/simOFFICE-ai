import { Html } from "@react-three/drei";
import { useAtom } from "jotai";
import { useRef } from "react";
import { useGrid } from "../hooks/useGrid";
import { motion } from "framer-motion-3d";
import { selectedAgentAtom } from "./BackendBridge";

export function AgentAvatar({ agent }) {
  const group = useRef();
  const { gridToVector3 } = useGrid();
  const [selAgent, setSelAgent] = useAtom(selectedAgentAtom);
  const pos = gridToVector3(agent.position);
  const isSelected = selAgent === agent.id;
  const statusColor = agent.status==="work"?"#40a868":agent.status==="think"?"#ff6b6b":agent.status==="meet"?"#e0a040":"#4090e0";

  return (
    <group ref={group} position={[pos.x, 0, pos.z]} name={`agent-${agent.id}`}
      onClick={(e) => { e.stopPropagation(); setSelAgent(agent.id); }}>
      {/* Speech bubble */}
      {agent.showBubble && (
        <Html position-y={2.4} center>
          <div className="w-48 pointer-events-none">
            <p className="text-center text-[10px] break-words p-2 px-3 rounded-lg bg-gray-900/95 text-gray-300 border border-gray-700 backdrop-blur-sm">
              {agent.bubbleText}
            </p>
          </div>
        </Html>
      )}
      {/* Name + status */}
      <Html position-y={2} center>
        <div className="pointer-events-none text-center whitespace-nowrap">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-black/70 text-white">{agent.name}</span>
          <span className="inline-block w-2 h-2 rounded-full ml-1" style={{background:statusColor}} />
        </div>
      </Html>
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation-x={-Math.PI/2} position-y={0.02}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color="#ff6b6b" opacity={0.6} transparent />
        </mesh>
      )}
      {/* Body */}
      <motion.group initial={{y:3,scale:0}} animate={{y:0,scale:1}} transition={{delay:0.3,mass:3,stiffness:200,damping:30}}>
        <mesh position={[0,0.7,0]} castShadow>
          <capsuleGeometry args={[0.2,0.6,8,16]} />
          <meshStandardMaterial color={agent.color} />
        </mesh>
        <mesh position={[0,1.4,0]} castShadow>
          <sphereGeometry args={[0.2,16,16]} />
          <meshStandardMaterial color="#f0c890" />
        </mesh>
        <mesh position={[0.25,1.7,0]}>
          <sphereGeometry args={[0.06,8,8]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>
      </motion.group>
    </group>
  );
}
