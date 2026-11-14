import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for Title
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });

  const titleTranslateY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Entrance for Callouts
  const callout1Spring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 13, stiffness: 120 },
  });
  const callout2Spring = spring({
    frame: frame - 80,
    fps,
    config: { damping: 13, stiffness: 120 },
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'JetBrains Mono', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Main Kinetic Headline in Safe Zone Top (Y: 230px) */}
      <div
        style={{
          position: "absolute",
          top: "230px",
          left: "60px",
          right: "60px",
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontSize: "14px",
            fontWeight: 800,
            color: "#00F0FF",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          // SKUNK WORKS SECRET PROJECT
        </div>

        <h1
          style={{
            fontSize: "72px",
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#FFFFFF",
            margin: 0,
            textShadow: "0 4px 30px rgba(0, 240, 255, 0.25)",
            letterSpacing: "-0.02em",
          }}
        >
          KENAPA BENTUKNYA <br />
          <span
            style={{
              color: "#38BDF8",
              background: "linear-gradient(90deg, #38BDF8, #34D399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            PATAH-PATAH?
          </span>
        </h1>
      </div>

      {/* Target Callout 1: Faceted Cockpit Canopy */}
      {frame >= 45 && (
        <div
          style={{
            position: "absolute",
            top: "860px",
            right: "50px",
            opacity: Math.max(0, Math.min(1, callout1Spring)),
            transform: `scale(${interpolate(callout1Spring, [0, 1], [0.85, 1])})`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.88)",
              border: "1px solid rgba(0, 240, 255, 0.4)",
              backdropFilter: "blur(8px)",
              padding: "8px 16px",
              borderRadius: "10px",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>KOKPIT STEALTH</div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
              FASET PIRAMIDA
            </div>
          </div>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#00F0FF",
              boxShadow: "0 0 14px #00F0FF",
            }}
          />
        </div>
      )}

      {/* Target Callout 2: 67.5° Delta Sweep Chine */}
      {frame >= 80 && (
        <div
          style={{
            position: "absolute",
            top: "1280px",
            left: "50px",
            opacity: Math.max(0, Math.min(1, callout2Spring)),
            transform: `scale(${interpolate(callout2Spring, [0, 1], [0.85, 1])})`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#34D399",
              boxShadow: "0 0 14px #34D399",
            }}
          />
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.88)",
              border: "1px solid rgba(52, 211, 153, 0.4)",
              backdropFilter: "blur(8px)",
              padding: "8px 16px",
              borderRadius: "10px",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>SAYAP DELTA TAJAM</div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#34D399" }}>
              SWEEP 67.5°
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
