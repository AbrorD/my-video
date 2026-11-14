import React, { useMemo } from "react";
import * as THREE from "three";

interface AirflowProps {
  frame: number;
  opacity?: number;
  speed?: number;
}

export const AirflowStreamlines: React.FC<AirflowProps> = ({
  frame,
  opacity = 1,
  speed = 1.0,
}) => {
  // Define aerodynamic streamlines along F-117 faceted contours
  const streamlinePaths = useMemo(() => {
    return [
      // 1. Centerline over nose & canopy & spine
      [
        [0, -0.05, 5.0],
        [0, 0.02, 3.6],
        [0, 0.38, 2.0],
        [0, 0.35, 0.5],
        [0, 0.15, -1.8],
        [0, 0.08, -4.5],
      ],
      // 2 & 3. Canopy shoulders (Left & Right)
      [
        [-0.15, -0.02, 4.2],
        [-0.32, 0.18, 2.5],
        [-0.45, 0.32, 1.2],
        [-0.48, 0.22, 0.0],
        [-0.40, 0.12, -2.5],
        [-0.35, 0.05, -4.5],
      ],
      [
        [0.15, -0.02, 4.2],
        [0.32, 0.18, 2.5],
        [0.45, 0.32, 1.2],
        [0.48, 0.22, 0.0],
        [0.40, 0.12, -2.5],
        [0.35, 0.05, -4.5],
      ],
      // 4 & 5. Chine Knife-Edges (Left & Right 67.5° delta sweep)
      [
        [-0.2, -0.06, 4.0],
        [-0.65, -0.05, 2.4],
        [-1.35, -0.06, 0.6],
        [-2.05, -0.08, -1.0],
        [-2.34, -0.10, -2.2],
        [-2.40, -0.12, -4.2],
      ],
      [
        [0.2, -0.06, 4.0],
        [0.65, -0.05, 2.4],
        [1.35, -0.06, 0.6],
        [2.05, -0.08, -1.0],
        [2.34, -0.10, -2.2],
        [2.40, -0.12, -4.2],
      ],
      // 6 & 7. Mid-wing surface wash
      [
        [-0.5, 0.02, 3.2],
        [-1.1, 0.04, 1.4],
        [-1.6, 0.02, -0.4],
        [-1.9, -0.04, -2.0],
        [-2.0, -0.08, -4.0],
      ],
      [
        [0.5, 0.02, 3.2],
        [1.1, 0.04, 1.4],
        [1.6, 0.02, -0.4],
        [1.9, -0.04, -2.0],
        [2.0, -0.08, -4.0],
      ],
    ];
  }, []);

  // Generate smooth 3D CatmullRom splines
  const curves = useMemo(() => {
    return streamlinePaths.map((pts) => {
      const v3s = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      return new THREE.CatmullRomCurve3(v3s);
    });
  }, [streamlinePaths]);

  // Generate moving laser-like streak line segments (NO giant spherical blobs!)
  const streakObjects = useMemo(() => {
    if (opacity <= 0.01) return [];

    const lines: THREE.Line[] = [];
    const streaksPerCurve = 3;
    const streakLength = 0.18; // 18% of curve length

    curves.forEach((curve, curveIdx) => {
      for (let i = 0; i < streaksPerCurve; i++) {
        // Continuous flow position [0..1]
        const headT =
          ((frame * speed * 0.02) + (i / streaksPerCurve) + curveIdx * 0.14) % 1;
        const tailT = Math.max(0, headT - streakLength);

        // Sample 8 points along the streak for smooth curvature
        const subPts: THREE.Vector3[] = [];
        const steps = 7;
        for (let s = 0; s <= steps; s++) {
          const t = tailT + ((headT - tailT) * s) / steps;
          subPts.push(curve.getPoint(Math.max(0, Math.min(1, t))));
        }

        const geo = new THREE.BufferGeometry().setFromPoints(subPts);
        const streakAlpha = Math.sin(headT * Math.PI) * opacity;

        const mat = new THREE.LineBasicMaterial({
          color: curveIdx >= 3 && curveIdx <= 4 ? 0x00f0ff : 0x7dd3fc,
          transparent: true,
          opacity: Math.max(0, Math.min(1, streakAlpha * 0.85)),
          linewidth: 1.5,
        });

        lines.push(new THREE.Line(geo, mat));
      }
    });

    return lines;
  }, [curves, frame, speed, opacity]);

  // Subtle static faint guide traces
  const guideLines = useMemo(() => {
    if (opacity <= 0.01) return [];

    return curves.map((curve, idx) => {
      const points = curve.getPoints(40);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: opacity * 0.15,
      });
      return new THREE.Line(geo, mat);
    });
  }, [curves, opacity]);

  if (opacity <= 0.01) return null;

  return (
    <group>
      {/* Subtle guide traces */}
      {guideLines.map((gl, idx) => (
        <primitive key={`guide-${idx}`} object={gl} />
      ))}

      {/* Sleek dynamic flowing streak lines */}
      {streakObjects.map((streak, idx) => (
        <primitive key={`streak-${idx}`} object={streak} />
      ))}
    </group>
  );
};
