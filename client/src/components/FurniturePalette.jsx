import { Html, useCursor, useGLTF } from "@react-three/drei";
import { useMemo, useState } from "react";
import { SkeletonUtils } from "three-stdlib";
import { FURN_TYPES } from "./BackendBridge";

const CATALOG = [
  { name:"deskComputer", size:[3,2] },
  { name:"desk", size:[3,2] },
  { name:"laptop", size:[1,1] },
  { name:"table", size:[6,3] },
  { name:"tableCoffee", size:[4,2] },
  { name:"televisionModern", size:[4,2], rotation:2 },
  { name:"radio", size:[1,1], rotation:2 },
  { name:"bookcaseClosedWide", size:[3,1], rotation:2 },
  { name:"bookcaseOpenLow", size:[2,1] },
  { name:"chair", size:[1,1], rotation:2 },
  { name:"chairCushion", size:[1,1], rotation:2 },
  { name:"chairModernCushion", size:[1,1], rotation:2 },
  { name:"loungeChair", size:[2,2], rotation:2 },
  { name:"rugRectangle", size:[8,4], walkable:true },
  { name:"rugRound", size:[4,4], walkable:true },
  { name:"rugSquare", size:[4,4], walkable:true },
].map(item => ({ ...item, ...FURN_TYPES[item.name] }));

const PaletteItem = ({ item, onSelect }) => {
  const { scene } = useGLTF(`/models/items/${item.name}.glb`);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const [hover, setHover] = useState(false);
  useCursor(hover);

  return (
    <group
      onClick={(e) => { e.stopPropagation(); onSelect(item); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
      scale={0.48}
    >
      <primitive object={clone} />
      <mesh position={[0,0.55,0]}>
        <boxGeometry args={[1.8,1.1,1.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 1.45, 0]} center>
        <div className={`pointer-events-none w-32 text-center rounded-lg border px-2 py-1 backdrop-blur-md ${hover ? "bg-red-950/80 border-red-400/40" : "bg-black/70 border-white/10"}`}>
          <div className="text-[10px] font-bold text-gray-200">{item.icon} {item.label}</div>
          <div className="text-[8px] text-gray-500 uppercase tracking-wide">{item.category}</div>
        </div>
      </Html>
    </group>
  );
};

export const FurniturePalette = ({ onItemSelected }) => {
  const groups = CATALOG.reduce((acc, item) => {
    const key = item.category || "Other";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  let row = 0;
  return (
    <group position={[-2, 0, -1]}>
      {Object.entries(groups).map(([category, items]) => {
        const startRow = row;
        row += 1;
        return (
          <group key={category} position={[0, 0, startRow * 2.8]}>
            <Html position={[-1.8, 1.65, 0]} center>
              <div className="pointer-events-none text-[10px] text-red-300 font-mono tracking-widest bg-black/70 border border-red-400/20 rounded px-2 py-1">{category.toUpperCase()}</div>
            </Html>
            {items.map((item, col) => {
              const zRow = Math.floor(col / 5);
              const xCol = col % 5;
              row = Math.max(row, startRow + zRow + 1);
              return (
                <group key={item.name} position={[xCol * 2.8, 0, zRow * 2.8]}>
                  <PaletteItem item={item} onSelect={() => onItemSelected(item)} />
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

CATALOG.forEach(item => useGLTF.preload(`/models/items/${item.name}.glb`));
