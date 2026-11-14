import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { interpolate, Easing } from "remotion";
import { NighthawkModel } from "./NighthawkModel";
import { AirflowStreamlines } from "./AirflowStreamlines";
import { RadarWaveSimulation } from "./RadarWaveSimulation";

export interface NighthawkCanvasProps {
  frame: number;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

const DynamicCameraController: React.FC<{
  frame: number;
}> = ({ frame }) => {
  const { camera, invalidate } = useThree();

  let camPos: [number, number, number] = [4.5, 3.8, 10.5];
  let lookTarget: [number, number, number] = [0, -0.2, 0.2];

  if (frame < 205) {
    // Stage 1: Smooth 3/4 Orbit showcasing full faceted F-117
    const t = interpolate(frame, [0, 205], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateRight: "clamp",
    });
    const x = interpolate(t, [0, 1], [4.5, -2.8]);
    const y = interpolate(t, [0, 1], [3.8, 2.8]);
    const z = interpolate(t, [0, 1], [10.5, 9.8]);
    camPos = [x, y, z];
    lookTarget = [0, -0.2, 0.2];
  } else if (frame < 470) {
    // Stage 2: Wind-tunnel side view for knife-edge chine & airflow
    const t = interpolate(frame, [205, 470], [0, 1], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const x = interpolate(t, [0, 1], [-2.8, -6.5]);
    const y = interpolate(t, [0, 1], [2.8, 1.8]);
    const z = interpolate(t, [0, 1], [9.8, 8.2]);
    camPos = [x, y, z];
    lookTarget = [0, -0.1, 0.0];
  } else if (frame < 840) {
    // Stage 3: Defleksi Gelombang Radar (Macro Zoom ke Bidang Miring & Visualisasi Terpental)
    if (frame < 540) {
      // 470 -> 540: Swoop in from side view into low underbelly view
      const t = interpolate(frame, [470, 540], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const x = interpolate(t, [0, 1], [-6.5, -0.6]);
      const y = interpolate(t, [0, 1], [1.8, -2.4]);
      const z = interpolate(t, [0, 1], [8.2, 5.8]);
      camPos = [x, y, z];
      lookTarget = [
        interpolate(t, [0, 1], [0.0, 0.0]),
        interpolate(t, [0, 1], [-0.1, -0.1]),
        interpolate(t, [0, 1], [0.0, 0.5]),
      ];
    } else if (frame < 730) {
      // 540 -> 730: MACRO CLOSE-UP ZOOM ON TILTED FACETED UNDERBELLY
      const t = interpolate(frame, [540, 730], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      // Dramatic slow macro tracking around the angled underbelly facets & reflection zone
      const x = interpolate(t, [0, 1], [-0.6, 0.8]);
      const y = interpolate(t, [0, 1], [-2.4, -2.0]);
      const z = interpolate(t, [0, 1], [5.8, 4.6]);
      camPos = [x, y, z];
      lookTarget = [0.0, -0.1, 0.5];
    } else {
      // 730 -> 840: Smoothly glide back out to prepare for Stage 4
      const t = interpolate(frame, [730, 840], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const x = interpolate(t, [0, 1], [0.8, 3.2]);
      const y = interpolate(t, [0, 1], [-2.0, 2.8]);
      const z = interpolate(t, [0, 1], [4.6, 8.8]);
      camPos = [x, y, z];
      lookTarget = [
        interpolate(t, [0, 1], [0.0, 0.0]),
        interpolate(t, [0, 1], [-0.1, -0.2]),
        interpolate(t, [0, 1], [0.5, 0.0]),
      ];
    }
  } else {
    // Stage 4: Centered heroic overview for RCS comparison & Outro
    const t = interpolate(frame, [840, 1110], [0, 1], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const x = interpolate(t, [0, 1], [3.2, 0.0]);
    const y = interpolate(t, [0, 1], [2.8, 5.0]);
    const z = interpolate(t, [0, 1], [8.8, 10.8]);
    camPos = [x, y, z];
    lookTarget = [0, -0.2, 0.0];
  }

  useLayoutEffect(() => {
    camera.position.set(camPos[0], camPos[1], camPos[2]);
    camera.lookAt(lookTarget[0], lookTarget[1], lookTarget[2]);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, camPos[0], camPos[1], camPos[2], lookTarget[0], lookTarget[1], lookTarget[2], invalidate]);

  return null;
};

export const NighthawkCanvas: React.FC<NighthawkCanvasProps> = ({
  frame,
  width = 1080,
  height = 1920,
  style,
}) => {
  const airflowOpacity =
    frame < 205
      ? 0.45
      : frame < 470
      ? 1.0
      : frame < 840
      ? 0.2
      : 0.75;

  const radarProgress = interpolate(frame, [470, 510, 800, 840], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const edgeColor = frame >= 470 && frame < 840 ? "#34D399" : "#38BDF8";

  return (
    <div
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    >
      <ThreeCanvas
        width={1080}
        height={1920}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: 38,
          near: 0.1,
          far: 100,
          position: [4.8, 3.8, 11.2],
        }}
        style={{
          width: 1080,
          height: 1920,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <DynamicCameraController frame={frame} />

        {/* Ambient Dark Military Void Light */}
        <ambientLight intensity={0.55} color="#1E293B" />

        {/* Tactical Key Light illuminating upper faceted planes */}
        <directionalLight
          position={[6, 12, 10]}
          intensity={2.8}
          color="#FFFFFF"
          castShadow
        />

        {/* Cyan Rim Light highlighting sharp chine contours */}
        <directionalLight
          position={[-9, 3, 5]}
          intensity={1.8}
          color="#00F0FF"
        />

        {/* Secondary Front Fill Light */}
        <directionalLight
          position={[0, -2, 8]}
          intensity={1.4}
          color="#38BDF8"
        />

        {/* Tactical Underbelly Key Lights during Radar Stage */}
        {radarProgress > 0.05 && (
          <>
            <directionalLight
              position={[0, -8, 5]}
              intensity={4.8 * radarProgress}
              color="#34D399"
            />
            <directionalLight
              position={[5, -5, 3]}
              intensity={3.2 * radarProgress}
              color="#00F0FF"
            />
            <directionalLight
              position={[-5, -5, 3]}
              intensity={2.8 * radarProgress}
              color="#38BDF8"
            />
            <pointLight
              position={[0, -3.5, 2]}
              color="#34D399"
              intensity={4.5 * radarProgress}
              distance={12}
            />
          </>
        )}

        {/* Aircraft Group Offset downwards to sit cleanly in middle viewport */}
        <group position={[0, -0.15, 0]}>
          {/* F-117 Nighthawk Faceted 3D Model from .glb */}
          <NighthawkModel
            frame={frame}
            highlightFacets={true}
            edgeGlowColor={edgeColor}
            wireframeOpacity={0.75}
          />

          {/* Aerodynamic Airflow Streamlines */}
          <AirflowStreamlines
            frame={frame}
            opacity={airflowOpacity}
            speed={frame >= 205 && frame < 470 ? 1.5 : 1.0}
          />

          {/* Planar Radar Wave Simulation */}
          <RadarWaveSimulation
            frame={frame}
            activeProgress={radarProgress}
          />
        </group>
      </ThreeCanvas>
    </div>
  );
};
