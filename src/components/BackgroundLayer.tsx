import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

interface BackgroundLayerProps {
  backgroundColor?: string;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  backgroundColor = "#080B11",
}) => {
  const frame = useCurrentFrame();

  // Subtle tactical grid sweep
  const sweepAngle = (frame * 1.2) % 360;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      {/* 1. Deep Vignette Radial Glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: "1200px",
          height: "1200px",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(8, 11, 17, 0) 75%)",
          pointerEvents: "none",
        }}
      />

      {/* 2. Tactical Radar Coordinate Grid Lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          opacity: 0.7,
        }}
      />

      {/* 3. Subtle Rotating Radar Sweep Crosshair in Background */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          width: "900px",
          height: "900px",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "1px dashed rgba(56, 189, 248, 0.08)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "150px",
            borderRadius: "50%",
            border: "1px solid rgba(56, 189, 248, 0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "300px",
            borderRadius: "50%",
            border: "1px solid rgba(56, 189, 248, 0.05)",
          }}
        />
        {/* Sweep cone */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            transform: `rotate(${sweepAngle}deg)`,
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 320deg, rgba(56, 189, 248, 0.07) 360deg)",
          }}
        />
      </div>

      {/* 4. Subtle Military Film Noise / Texture */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.035,
          pointerEvents: "none",
        }}
      >
        <filter id="tacticalNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#tacticalNoise)" />
      </svg>
    </AbsoluteFill>
  );
};
