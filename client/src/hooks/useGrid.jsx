/**
 * SimOffice Grid Hook — coordinate conversion
 * Adapted from r3f-sims-online useGrid.jsx
 */
import { useAtom } from "jotai";
import { mapAtom } from "../components/BackendBridge";
import * as THREE from "three";

export const useGrid = () => {
  const [map] = useAtom(mapAtom);

  const gridDivision = map?.gridDivision || 2;

  const vector3ToGrid = (vector3) => {
    return [
      Math.floor(vector3.x * gridDivision),
      Math.floor(vector3.z * gridDivision),
    ];
  };

  const gridToVector3 = (gridPosition, width = 1, height = 1) => {
    return new THREE.Vector3(
      width / gridDivision / 2 + gridPosition[0] / gridDivision,
      0,
      height / gridDivision / 2 + gridPosition[1] / gridDivision
    );
  };

  return { vector3ToGrid, gridToVector3 };
};
