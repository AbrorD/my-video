import React, { useMemo } from "react";
import * as THREE from "three";

interface RadarWaveSimulationProps {
  frame: number;
  activeProgress?: number; // 0 to 1
}

// 3D Solid Cylinder Beam helper (eliminates 1px WebGL linewidth limitations)
const CylinderBeam: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  radius?: number;
  opacity?: number;
}> = ({ start, end, color, radius = 0.022, opacity = 0.9 }) => {
  const dir = useMemo(() => end.clone().sub(start), [start, end]);
  const len = dir.length();
  const mid = useMemo(() => start.clone().add(dir.clone().multiplyScalar(0.5)), [start, dir]);

  const quaternion = useMemo(() => {
    const v1 = new THREE.Vector3(0, 1, 0);
    const v2 = dir.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(v1, v2);
  }, [dir]);

  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
};

export const RadarWaveSimulation: React.FC<RadarWaveSimulationProps> = ({
  frame,
  activeProgress = 1,
}) => {
  if (activeProgress <= 0.01) return null;

  // Ground Radar Emitter (below & slightly in front)
  const emitterPos = useMemo(() => new THREE.Vector3(0.0, -3.8, 3.2), []);

  // Primary Facet Impact Points on F-117 Underbelly
  // 1. Starboard underbelly facet
  const impactR = useMemo(() => new THREE.Vector3(0.65, -0.28, 1.1), []);
  // 2. Port underbelly facet
  const impactL = useMemo(() => new THREE.Vector3(-0.65, -0.28, 1.1), []);
  // 3. Central chine facet
  const impactC = useMemo(() => new THREE.Vector3(0.0, -0.22, 1.7), []);

  // Deflection directions (bouncing sharply into empty space)
  const reflDirR = useMemo(() => new THREE.Vector3(4.2, 2.4, -1.2).normalize(), []);
  const reflDirL = useMemo(() => new THREE.Vector3(-4.2, 2.4, -1.2).normalize(), []);
  const reflDirC = useMemo(() => new THREE.Vector3(0.0, 4.5, 0.6).normalize(), []);

  // Beam end points
  const maxReflDist = 5.5;
  const endR = useMemo(() => impactR.clone().add(reflDirR.clone().multiplyScalar(maxReflDist)), [impactR, reflDirR]);
  const endL = useMemo(() => impactL.clone().add(reflDirL.clone().multiplyScalar(maxReflDist)), [impactL, reflDirL]);
  const endC = useMemo(() => impactC.clone().add(reflDirC.clone().multiplyScalar(maxReflDist)), [impactC, reflDirC]);

  // 1. Incoming Wavefronts (Gelombang Radar Datang)
  const numIncomingWaves = 6;
  const incPhase = (frame * 0.045) % 1;

  const incomingWaveLines = useMemo(() => {
    const list: THREE.Line[] = [];

    for (let i = 0; i < numIncomingWaves; i++) {
      const prog = (incPhase + i / numIncomingWaves) % 1;
      const center = emitterPos.clone().lerp(new THREE.Vector3(0.0, -0.25, 1.2), prog);

      const width = 1.6 + prog * 3.6;
      const steps = 32;
      const pts: THREE.Vector3[] = [];

      for (let s = 0; s <= steps; s++) {
        const u = -0.5 + s / steps;
        const ripple = Math.sin(u * Math.PI * 6 + frame * 0.3) * 0.08 * (1 - prog * 0.3);
        const x = u * width;
        const y = center.y + ripple;
        const z = center.z - Math.abs(u) * 0.35;
        pts.push(new THREE.Vector3(x, y, z));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const alpha = Math.sin(prog * Math.PI) * 0.95 * activeProgress;
      const isLeading = prog > 0.82;
      const mat = new THREE.LineBasicMaterial({
        color: isLeading ? 0x00f0ff : 0x38bdf8,
        transparent: true,
        opacity: Math.max(0, Math.min(1, alpha)),
        linewidth: isLeading ? 2.8 : 1.8,
      });

      list.push(new THREE.Line(geo, mat));
    }

    return list;
  }, [incPhase, frame, emitterPos, activeProgress]);

  // 2. Impact Rings on Faceted Underbelly
  const impactRings = useMemo(() => {
    const list: THREE.Line[] = [];
    const targets = [impactR, impactL, impactC];

    for (let i = 0; i < numIncomingWaves; i++) {
      const prog = (incPhase + i / numIncomingWaves) % 1;
      if (prog > 0.7) {
        const impT = (prog - 0.7) / 0.3;
        const radius = 0.06 + impT * 0.8;
        const alpha = Math.pow(1 - impT, 1.5) * 0.95 * activeProgress;

        targets.forEach((pos) => {
          const pts: THREE.Vector3[] = [];
          const segs = 24;
          for (let s = 0; s <= segs; s++) {
            const theta = (s / segs) * Math.PI * 2;
            pts.push(
              new THREE.Vector3(
                pos.x + Math.cos(theta) * radius,
                pos.y + Math.sin(theta) * radius * 0.5,
                pos.z + Math.sin(theta) * radius * 0.4
              )
            );
          }
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const mat = new THREE.LineBasicMaterial({
            color: 0x34d399,
            transparent: true,
            opacity: Math.max(0, Math.min(1, alpha)),
            linewidth: 2.5,
          });
          list.push(new THREE.Line(geo, mat));
        });
      }
    }

    return list;
  }, [incPhase, impactR, impactL, impactC, activeProgress]);

  // 3. Deflected Bounced Waves (Gelombang Terpental Menjauh ke Ruang Hampa)
  const numReflWaves = 6;
  const reflPhase = (incPhase + 0.3) % 1;

  const reflectedWaveLines = useMemo(() => {
    const list: THREE.Line[] = [];

    const reflectionBeams = [
      { origin: impactR, dir: reflDirR, color: 0x34d399 },
      { origin: impactL, dir: reflDirL, color: 0x34d399 },
      { origin: impactC, dir: reflDirC, color: 0x00f0ff },
    ];

    reflectionBeams.forEach((beam) => {
      const perp = new THREE.Vector3(-beam.dir.y, beam.dir.x, 0.4).normalize();

      for (let i = 0; i < numReflWaves; i++) {
        const prog = (reflPhase + i / numReflWaves) % 1;
        const center = beam.origin.clone().add(beam.dir.clone().multiplyScalar(prog * maxReflDist));

        const width = 0.5 + prog * 1.8;
        const steps = 20;
        const pts: THREE.Vector3[] = [];

        for (let s = 0; s <= steps; s++) {
          const u = -0.5 + s / steps;
          const bow = (1 - (u * 2) ** 2) * 0.14;
          const pt = center
            .clone()
            .add(perp.clone().multiplyScalar(u * width))
            .add(beam.dir.clone().multiplyScalar(-bow));
          pts.push(pt);
        }

        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const alpha = Math.sin(prog * Math.PI) * Math.pow(1 - prog * 0.22, 1.2) * activeProgress;
        const mat = new THREE.LineBasicMaterial({
          color: beam.color,
          transparent: true,
          opacity: Math.max(0, Math.min(1, alpha)),
          linewidth: 2.8,
        });
        list.push(new THREE.Line(geo, mat));
      }
    });

    return list;
  }, [reflPhase, impactR, impactL, impactC, reflDirR, reflDirL, reflDirC, maxReflDist, activeProgress]);

  // 4. Null Echo Indicator line
  const nullEchoLine = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.0, -0.35, 1.2),
      emitterPos,
    ]);
    const mat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 0.2,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.65 * activeProgress,
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    return line;
  }, [emitterPos, activeProgress]);

  return (
    <group>
      {/* A. Incoming Radar Waves (Cyan) */}
      {incomingWaveLines.map((line, idx) => (
        <primitive key={`inc-wave-${idx}`} object={line} />
      ))}

      {/* Incident Solid Center Beam from Emitter to Underbelly */}
      <CylinderBeam
        start={emitterPos}
        end={impactC}
        color="#38BDF8"
        radius={0.024}
        opacity={0.65 * activeProgress}
      />

      {/* B. Impact Contact Rings & Sparks on Facets */}
      {impactRings.map((line, idx) => (
        <primitive key={`imp-ring-${idx}`} object={line} />
      ))}

      {[impactR, impactL, impactC].map((pos, idx) => (
        <group key={`focal-${idx}`} position={pos}>
          <mesh>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.95 * activeProgress} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshBasicMaterial color="#34D399" transparent opacity={0.45 * activeProgress} />
          </mesh>
          <pointLight color="#34D399" intensity={3.5 * activeProgress} distance={2.5} />
        </group>
      ))}

      {/* C. Deflected Bounced Waves (Gelombang Terpental Menjauh) */}
      {reflectedWaveLines.map((line, idx) => (
        <primitive key={`refl-wave-${idx}`} object={line} />
      ))}

      {/* Solid Reflected Laser Beams (Thick 3D Cylinders shooting away) */}
      <CylinderBeam
        start={impactR}
        end={endR}
        color="#34D399"
        radius={0.032}
        opacity={0.9 * activeProgress}
      />
      <CylinderBeam
        start={impactL}
        end={endL}
        color="#34D399"
        radius={0.032}
        opacity={0.9 * activeProgress}
      />
      <CylinderBeam
        start={impactC}
        end={endC}
        color="#00F0FF"
        radius={0.032}
        opacity={0.9 * activeProgress}
      />

      {/* Traveling Energy Pulse Spheres along Reflected Beams */}
      {[
        { origin: impactR, dir: reflDirR, color: "#34D399" },
        { origin: impactL, dir: reflDirL, color: "#34D399" },
        { origin: impactC, dir: reflDirC, color: "#00F0FF" },
      ].map((beam, idx) => (
        <mesh
          key={`spark-${idx}`}
          position={beam.origin
            .clone()
            .add(beam.dir.clone().multiplyScalar(((reflPhase * 1.5 + idx * 0.3) % 1) * maxReflDist))}
        >
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color={beam.color} transparent opacity={0.95 * activeProgress} />
        </mesh>
      ))}

      {/* D. Null Return Indicator (Zero Backscatter to Radar) */}
      {nullEchoLine && <primitive object={nullEchoLine} />}

      {/* Ground Radar Dish Beacon */}
      <mesh position={emitterPos}>
        <cylinderGeometry args={[0.2, 0.08, 0.28, 14]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>
      <pointLight
        position={emitterPos}
        color="#00F0FF"
        intensity={3.2 * activeProgress}
        distance={4.5}
      />
    </group>
  );
};
