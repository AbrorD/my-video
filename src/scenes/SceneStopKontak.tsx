import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { StopKontakCanvas } from "../components/StopKontak3D";

export const SceneStopKontak: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Animasi pembukaan Tutup Atas (Mode Bedah) mulai frame 35
  const explodeSpring = spring({
    frame: frame - 35,
    fps,
    config: {
      damping: 15,
      stiffness: 70,
      mass: 0.8,
    },
  });

  const explodeProgress = Math.max(0, Math.min(1, explodeSpring));

  // 2. Rotasi halus kamera/panggung untuk memperlihatkan sudut 3D
  const rotationY = interpolate(
    frame,
    [0, 150],
    [-Math.PI / 4 + 0.1, -Math.PI / 4 + 0.38],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#F6F4EE" }}>
      <StopKontakCanvas
        width="100%"
        height="100%"
        explodeProgress={explodeProgress}
        powerOn={true}
        rotationY={rotationY}
        zoom={58}
        showFloorGrid={true}
        showCalloutCards={true}
      />
    </AbsoluteFill>
  );
};
