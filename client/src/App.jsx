import { Canvas } from "@react-three/fiber";
import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import { Experience } from "./components/Experience";
import { BackendBridge, modeAtom } from "./components/BackendBridge";
import { UI } from "./components/UI";

function App() {
  const [mode] = useAtom(modeAtom);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <BackendBridge />
      <Canvas shadows camera={{ position:[12,15,13], fov:38 }} style={{ background:"#f0ede8" }}>
        <Experience loaded={loaded && mode !== "onboarding"} />
      </Canvas>
      {loaded && <UI />}
    </>
  );
}

export default App;
