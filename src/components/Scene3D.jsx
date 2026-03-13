import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { currentSunForDate } from "../utils/solar";

function Ground({ targetArea }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[targetArea.x, 0.05, -targetArea.y]}>
        <planeGeometry args={[targetArea.width, targetArea.depth]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.35} />
      </mesh>
    </>
  );
}

function Buildings({ buildings, selectedId }) {
  return buildings.map((building) => (
    <mesh
      key={building.id}
      castShadow
      receiveShadow
      position={[building.x, building.height / 2, -building.y]}
    >
      <boxGeometry args={[building.width, building.height, building.depth]} />
      <meshStandardMaterial
        color={building.id === selectedId ? "#f8fafc" : building.source === "public_data" ? "#22c55e" : "#f59e0b"}
      />
    </mesh>
  ));
}

function SunLight({ date, latitude, timeValue }) {
  const sun = currentSunForDate(date, latitude, timeValue);
  const altitude = Math.max(8, sun.altitude) * (Math.PI / 180);
  const azimuth = (sun.azimuth * Math.PI) / 180;
  const radius = 120;
  const x = Math.sin(azimuth) * Math.cos(altitude) * radius;
  const y = Math.sin(altitude) * radius;
  const z = Math.cos(azimuth) * Math.cos(altitude) * radius;

  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight
        castShadow
        intensity={1.5}
        position={[x, y, z]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={350}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
    </>
  );
}

export function Scene3D({ buildings, targetArea, selectedId, date, latitude, timeValue }) {
  return (
    <section className="panel scene-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">3D 시각화</p>
          <h3>React Three Fiber 실시간 장면</h3>
        </div>
      </div>
      <div className="scene-shell">
        <Canvas camera={{ position: [68, 74, 84], fov: 45 }} shadows dpr={[1, 2]}>
          <color attach="background" args={["#090b12"]} />
          <Suspense fallback={null}>
            <SunLight date={date} latitude={latitude} timeValue={timeValue} />
            <Ground targetArea={targetArea} />
            <Buildings buildings={buildings} selectedId={selectedId} />
            <OrbitControls maxPolarAngle={Math.PI / 2.1} minDistance={45} maxDistance={220} />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}
