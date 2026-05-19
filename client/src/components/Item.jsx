import { useCursor, useGLTF } from "@react-three/drei";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { SkeletonUtils } from "three-stdlib";
import { useGrid } from "../hooks/useGrid";
import { mapAtom } from "./BackendBridge";
import { buildModeAtom } from "./UI";

/**
 * Item
 *
 * Important interaction note:
 * GLB furniture meshes are visually detailed but not always friendly raycast targets.
 * The transparent hitbox below gives every furniture item a reliable click/hover area.
 */
export const Item = ({ item, onClick, isDragging, dragPosition, canDrop, dragRotation, selected=false }) => {
  const { name, gridPosition, size, rotation: itemRotation } = item;
  const rotation = isDragging ? dragRotation : itemRotation;
  const { gridToVector3 } = useGrid();
  const [map] = useAtom(mapAtom);
  const { scene } = useGLTF(`/models/items/${name}.glb`);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const width = rotation === 1 || rotation === 3 ? size[1] : size[0];
  const height = rotation === 1 || rotation === 3 ? size[0] : size[1];
  const [hover, setHover] = useState(false);
  const [buildMode] = useAtom(buildModeAtom);

  useCursor(hover);

  useEffect(() => {
    clone.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.raycast = c.raycast; // keep meshes raycastable while the hitbox handles most clicks
      }
    });
  }, [clone]);

  if (!map) return null;

  const worldWidth = Math.max(width / map.gridDivision, 0.45);
  const worldHeight = Math.max(height / map.gridDivision, 0.45);
  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(item, e);
  };
  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHover(true);
  };
  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHover(false);
  };

  return (
    <group
      name={`furniture-${name}`}
      position={gridToVector3(isDragging ? dragPosition || gridPosition : gridPosition, width, height)}
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive object={clone} rotation-y={((rotation || 0) * Math.PI) / 2} />

      {/* Reliable furniture click target. It is transparent, but still raycastable. */}
      <mesh
        name={`hitbox-${name}`}
        position={[0, 0.35, 0]}
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[worldWidth, 0.7, worldHeight]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {(selected || (!buildMode && hover)) && (
        <mesh position={[0, 0.04, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[worldWidth, worldHeight]} />
          <meshBasicMaterial color={selected ? "#fbbf24" : "#ff6b6b"} opacity={selected ? 0.2 : 0.12} transparent depthWrite={false} />
        </mesh>
      )}

      {isDragging && (
        <mesh>
          <boxGeometry args={[worldWidth, 0.2, worldHeight]} />
          <meshBasicMaterial color={canDrop ? "green" : "red"} opacity={0.3} transparent />
        </mesh>
      )}
    </group>
  );
};
