import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const PARTICLE_COUNT = 24;

// Precomputed deterministic pseudo-random seeds
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const rndX = (seed / 233280);
  const rndY = (((seed * 9301 + 49297) % 233280) / 233280);
  const size = 3 + (i % 5) * 2;
  const speed = 0.5 + (i % 4) * 0.4;
  const color = i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#a855f7" : "#34d399";

  return {
    baseX: rndX * 100, // percentage 0-100%
    baseY: rndY * 100,
    size,
    speed,
    color,
    isSquare: i % 4 === 0,
    isCross: i % 7 === 0,
  };
});

export const Particles: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {PARTICLES.map((p, idx) => {
        // Vertical drift upwards
        const offsetY = ((p.baseY - (frame * p.speed * 0.4)) % 100 + 100) % 100;
        const driftX = p.baseX + Math.sin((frame * 0.03) + idx) * 3;
        
        // Gentle sparkle opacity
        const opacity = interpolate(
          Math.sin((frame * 0.08) + idx * 2),
          [-1, 1],
          [0.15, 0.75]
        );

        const rotation = (frame * (p.speed * 1.5)) % 360;

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${driftX}%`,
              top: `${offsetY}%`,
              width: p.size,
              height: p.size,
              opacity,
              backgroundColor: p.isCross ? "transparent" : p.color,
              borderRadius: p.isSquare ? "2px" : "50%",
              rotate: `${rotation}deg`,
              boxShadow: `0 0 12px ${p.color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {p.isCross && (
              <span
                style={{
                  color: p.color,
                  fontSize: p.size * 2,
                  lineHeight: 1,
                  fontWeight: 900,
                  textShadow: `0 0 8px ${p.color}`,
                }}
              >
                +
              </span>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
