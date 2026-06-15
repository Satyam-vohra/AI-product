"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { motion } from "framer-motion";
import { ProductPart, productParts } from "./data";

type ViewerProps = {
  selectedPart: ProductPart;
  onSelectPart: (part: ProductPart) => void;
  compact?: boolean;
};

const positions: Record<string, [number, number, number]> = {
  battery: [-1.7, -0.7, 0.18],
  motor: [0.95, -0.15, 0.2],
  compressor: [0, 0.4, 0.1],
  fuse: [-0.65, 0.96, 0.28],
  pump: [1.75, -0.72, 0.15],
  display: [-1.35, 1.12, 0.25],
  valve: [1.45, 0.88, 0.22],
};

const colors: Record<string, string> = {
  battery: "#22c55e",
  motor: "#38bdf8",
  compressor: "#f59e0b",
  fuse: "#ef4444",
  pump: "#14b8a6",
  display: "#a78bfa",
  valve: "#f97316",
};

function PartMesh({
  part,
  selected,
  onClick,
}: {
  part: ProductPart;
  selected: boolean;
  onClick: () => void;
}) {
  const position = positions[part.id];
  const color = colors[part.id];

  if (part.id === "motor" || part.id === "pump" || part.id === "valve") {
    return (
      <mesh position={position} onClick={onClick} scale={selected ? 1.12 : 1}>
        <cylinderGeometry args={[0.34, 0.34, 0.72, 40]} />
        <meshStandardMaterial color={color} emissive={selected ? color : "#000000"} emissiveIntensity={selected ? 0.35 : 0.05} roughness={0.35} metalness={0.45} />
      </mesh>
    );
  }

  if (part.id === "compressor") {
    return (
      <mesh position={position} onClick={onClick} scale={selected ? 1.08 : 1}>
        <sphereGeometry args={[0.52, 48, 32]} />
        <meshStandardMaterial color={color} emissive={selected ? color : "#000000"} emissiveIntensity={selected ? 0.28 : 0.04} roughness={0.42} metalness={0.38} />
      </mesh>
    );
  }

  return (
    <mesh position={position} onClick={onClick} scale={selected ? 1.1 : 1}>
      <boxGeometry args={part.id === "display" ? [0.82, 0.46, 0.18] : [0.78, 0.42, 0.3]} />
      <meshStandardMaterial color={color} emissive={selected ? color : "#000000"} emissiveIntensity={selected ? 0.3 : 0.03} roughness={0.4} metalness={0.35} />
    </mesh>
  );
}

function ProductRig({ selectedPart, onSelectPart }: ViewerProps) {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 3]} intensity={1.4} />
      <pointLight position={[-3, 2, 4]} intensity={0.65} color="#67e8f9" />
      <group rotation={[0.12, -0.45, 0]}>
        <mesh position={[0, 0, -0.08]}>
          <boxGeometry args={[4.5, 2.35, 0.18]} />
          <meshStandardMaterial color="#1f2937" roughness={0.55} metalness={0.25} />
        </mesh>
        <mesh position={[0, -1.32, -0.02]}>
          <boxGeometry args={[4.95, 0.16, 0.28]} />
          <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.32, -0.02]}>
          <boxGeometry args={[4.95, 0.16, 0.28]} />
          <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.4} />
        </mesh>
        {productParts.map((part) => (
          <PartMesh
            key={part.id}
            part={part}
            selected={selectedPart.id === part.id}
            onClick={() => onSelectPart(part)}
          />
        ))}
      </group>
      <OrbitControls enablePan={false} minDistance={4.2} maxDistance={7.5} autoRotate autoRotateSpeed={0.65} />
    </>
  );
}

export function ProductViewer3D({ selectedPart, onSelectPart, compact = false }: ViewerProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] ${compact ? "h-[330px]" : "h-[520px]"}`}>
      <Canvas dpr={[1, 1.7]}>
        <PerspectiveCamera makeDefault position={[0, 0.35, 6]} fov={42} />
        <ProductRig selectedPart={selectedPart} onSelectPart={onSelectPart} />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white backdrop-blur">
        {selectedPart.name} selected
      </div>
      <div className="absolute bottom-3 left-3 right-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {productParts.map((part) => {
          const Icon = part.icon;
          const active = selectedPart.id === part.id;
          return (
            <motion.button
              key={part.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectPart(part)}
              className={`flex h-10 items-center justify-center gap-1 rounded-md border px-2 text-[11px] font-medium backdrop-blur transition ${
                active
                  ? "border-cyan-300 bg-cyan-300/18 text-cyan-100"
                  : "border-white/10 bg-black/30 text-white/75 hover:bg-white/10"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">{part.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
