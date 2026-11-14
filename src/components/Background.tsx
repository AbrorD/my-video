import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Slow ambient drift for glow orbs
  const orb1X = interpolate(frame, [0, 180], [width * 0.25, width * 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const orb1Y = interpolate(frame, [0, 180], [height * 0.3, height * 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const orb2X = interpolate(frame, [0, 180], [width * 0.75, width * 0.65], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const orb2Y = interpolate(frame, [0, 180], [height * 0.65, height * 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Breathing pulse
  const pulseScale = interpolate(
    Math.sin((frame / fps) * Math.PI * 1.5),
    [-1, 1],
    [0.9, 1.15]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#07090e",
        overflow: "hidden",
      }}
    >
      {/* Background Subtle Tech Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.6,
        }}
      />

      {/* Ambient Gradient Glow 1 - Cyan / Sky */}
      <div
        style={{
          position: "absolute",
          left: orb1X,
          top: orb1Y,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.28) 0%, rgba(14, 165, 233, 0) 70%)",
          filter: "blur(90px)",
          translate: "-50% -50%",
          scale: pulseScale,
          pointerEvents: "none",
        }}
      />

      {/* Ambient Gradient Glow 2 - Violet / Indigo */}
      <div
        style={{
          position: "absolute",
          left: orb2X,
          top: orb2Y,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0) 70%)",
          filter: "blur(100px)",
          translate: "-50% -50%",
          scale: 1.1 - (pulseScale - 1),
          pointerEvents: "none",
        }}
      />

      {/* Ambient Gradient Glow 3 - Center Coral Accent */}
      <div
        style={{
          position: "absolute",
          left: width * 0.5,
          top: height * 0.5,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0) 70%)",
          filter: "blur(80px)",
          translate: "-50% -50%",
          pointerEvents: "none",
        }}
      />

      {/* Subtle Vignette Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.75) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
