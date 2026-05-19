import { AccumulativeShadows, Grid, RandomizedLight, useCursor } from "@react-three/drei";
import { useAtom } from "jotai";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useGrid } from "../hooks/useGrid";
import { AgentAvatar } from "./AgentAvatar";
import { Item } from "./Item";
import { FurniturePalette } from "./FurniturePalette";
import {
  agentsAtom,
  mapAtom,
  roomItemsAtom,
  selectedAgentAtom,
  selectedFurnitureAtom,
  editorSelectedItemAtom,
  editorNoticeAtom,
  FURN_TYPES,
} from "./BackendBridge";
import { buildModeAtom, draggedItemAtom, draggedItemRotationAtom, shopModeAtom } from "./UI";

export const Room = () => {
  const [buildMode] = useAtom(buildModeAtom);
  const [shopMode, setShopMode] = useAtom(shopModeAtom);
  const [agents] = useAtom(agentsAtom);
  const [map] = useAtom(mapAtom);
  const [items, setItems] = useAtom(roomItemsAtom);
  const [selectedEditIdx, setSelectedEditIdx] = useAtom(editorSelectedItemAtom);
  const [, setEditorNotice] = useAtom(editorNoticeAtom);
  const [onFloor, setOnFloor] = useState(false);
  const [, setSelFurn] = useAtom(selectedFurnitureAtom);
  const [, setSelAgent] = useAtom(selectedAgentAtom);
  useCursor(onFloor);
  const { vector3ToGrid } = useGrid();

  useEffect(() => {
    if (map?.items) setItems(map.items.map((item) => ({ ...item })));
  }, [map, setItems]);

  const [draggedItem, setDraggedItem] = useAtom(draggedItemAtom);
  const [draggedItemRotation, setDraggedItemRotation] = useAtom(draggedItemRotationAtom);
  const [dragPosition, setDragPosition] = useState([0, 0]);
  const [canDrop, setCanDrop] = useState(false);

  useEffect(() => {
    if (draggedItem === null) setItems(prev => prev.filter(i => !i.tmp));
  }, [draggedItem, setItems]);

  useEffect(() => {
    if (draggedItem === null || !map) return;
    const item = items[draggedItem];
    if (!item) return;
    const w = (draggedItemRotation === 1 || draggedItemRotation === 3) ? item.size[1] : item.size[0];
    const h = (draggedItemRotation === 1 || draggedItemRotation === 3) ? item.size[0] : item.size[1];
    let ok = true;
    if (dragPosition[0] < 0 || dragPosition[0] + w > map.size[0] * map.gridDivision) ok = false;
    if (dragPosition[1] < 0 || dragPosition[1] + h > map.size[1] * map.gridDivision) ok = false;
    if (!item.walkable && !item.wall) items.forEach((o, idx) => {
      if (idx === draggedItem || o.walkable || o.wall || o.tmp) return;
      const ow = (o.rotation === 1 || o.rotation === 3) ? o.size[1] : o.size[0];
      const oh = (o.rotation === 1 || o.rotation === 3) ? o.size[0] : o.size[1];
      if (dragPosition[0] < o.gridPosition[0] + ow && dragPosition[0] + w > o.gridPosition[0] &&
          dragPosition[1] < o.gridPosition[1] + oh && dragPosition[1] + h > o.gridPosition[1]) ok = false;
    });
    setCanDrop(ok);
  }, [dragPosition, draggedItem, items, draggedItemRotation, map]);

  const onPlaneClicked = (e) => {
    if (buildMode && draggedItem !== null && canDrop) {
      const drop = vector3ToGrid(e.point);
      setItems(prev => {
        const n = [...prev];
        if (!n[draggedItem]) return prev;
        n[draggedItem] = { ...n[draggedItem], tmp: false, gridPosition: drop, rotation: draggedItemRotation };
        return n;
      });
      setSelectedEditIdx(draggedItem);
      setDraggedItem(null);
      setEditorNotice(`Placed ${FURN_TYPES[itemSafe(items[draggedItem])]?.label || items[draggedItem]?.name || "item"} at ${drop.join(", ")}. Remember to Apply Layout before going live.`);
    } else if (!buildMode) {
      setSelAgent(null);
      setSelFurn(null);
    }
  };

  const onItemSelected = (item) => {
    const idx = items.length;
    setShopMode(false);
    setItems(prev => [...prev, { ...item, gridPosition:[0,0], tmp:true }]);
    setSelectedEditIdx(idx);
    setDraggedItem(idx);
    setDraggedItemRotation(item.rotation || 0);
    setDragPosition([0, 0]);
    setEditorNotice(`Adding ${FURN_TYPES[item.name]?.label || item.label || item.name}. Move over the grid, then click an open cell to place it.`);
  };

  const shadows = useMemo(() => (
    <AccumulativeShadows temporal frames={42} alphaTest={0.85} scale={34} position={[0,0,0]} color="pink">
      <RandomizedLight amount={4} radius={11} intensity={0.38} ambient={0.25} position={[15,5,-20]} />
      <RandomizedLight amount={4} radius={7} intensity={0.25} ambient={0.55} position={[-5,5,-20]} />
    </AccumulativeShadows>
  ), []);

  if (!map) return null;

  const renderedItems = buildMode ? items : map.items;

  return (
    <>
      {shopMode && <FurniturePalette onItemSelected={onItemSelected} />}
      {!buildMode && !shopMode && shadows}

      {/* Items */}
      {!shopMode && renderedItems.map((item, idx) => (
        <Item key={`${item.name}-${idx}-${item.gridPosition?.join("-")}-${item.rotation || 0}`} item={item}
          selected={buildMode && selectedEditIdx === idx}
          onClick={() => {
            if (buildMode) {
              setSelectedEditIdx(idx);
              setSelFurn({ ...item, idx, instanceId: `${item.name}-${idx}`, editMode:true });
              setSelAgent(null);
              setEditorNotice(`Selected ${FURN_TYPES[item.name]?.label || item.name}. Use the editor panel to move, rotate, duplicate, assign, or delete it.`);
            } else {
              // Live mode: open furniture panel and close the agent detail panel.
              setSelAgent(null);
              setSelFurn({ ...item, idx, instanceId: `${item.name}-${idx}` });
            }
          }}
          isDragging={draggedItem === idx} dragPosition={dragPosition}
          dragRotation={draggedItemRotation} canDrop={canDrop} />
      ))}

      {!shopMode && (
        <mesh rotation-x={-Math.PI / 2} position-y={-0.002}
          onClick={onPlaneClicked}
          onPointerEnter={() => setOnFloor(true)} onPointerLeave={() => setOnFloor(false)}
          onPointerMove={e => {
            if (!buildMode) return;
            const p = vector3ToGrid(e.point);
            if (!dragPosition || p[0] !== dragPosition[0] || p[1] !== dragPosition[1]) setDragPosition(p);
          }}
          position-x={map.size[0] / 2} position-z={map.size[1] / 2} receiveShadow>
          <planeGeometry args={map.size} />
          <meshStandardMaterial color="#e8e4dc" />
        </mesh>
      )}

      {(buildMode || shopMode) && <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />}

      {!buildMode && !shopMode && agents.filter(a => a.active).map(a => (
        <Suspense key={a.id}><AgentAvatar agent={a} /></Suspense>
      ))}
    </>
  );
};

function itemSafe(item) {
  return item?.name || "";
}
