import { OrbitControls } from "@react-three/drei";
import { Room } from "./Room";
import { SimEngine } from "./SimEngine";

export const Experience = ({ loaded }) => (
  <>
    <SimEngine />
    <ambientLight intensity={0.6} />
    <directionalLight position={[10,15,-5]} intensity={0.8} castShadow
      shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      shadow-camera-far={50} shadow-camera-left={-18} shadow-camera-right={18}
      shadow-camera-top={18} shadow-camera-bottom={-18} />
    <directionalLight position={[-5,8,10]} intensity={0.3} />
    <OrbitControls enablePan enableZoom enableRotate
      minDistance={6} maxDistance={35}
      minPolarAngle={Math.PI/6} maxPolarAngle={Math.PI/3}
      target={[7,0,6]} />
    {loaded && <Room />}
  </>
);
