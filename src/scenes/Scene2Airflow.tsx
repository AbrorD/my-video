import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Scene2Airflow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const spr = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const translateY = interpolate(spr, [0, 1], [30, 0]);
  const opacity = interpolate(spr, [0, 1], [0, 1]);

  // Telemetry items stagger
  const item1Spr = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const item2Spr = spring({
    frame: frame - 55,
    fps,
    config: { damping: 14, stiffness: 120 },
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
      {/* Top Headline in Safe Zone (Y: 260px) */}
      <div
        style={{
          position: "absolute",
          top: "260px",
          left: "60px",
          right: "60px",
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#38BDF8",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          // WIND TUNNEL & AIRFLOW TEST
        </div>

        <h1
          style={{
            fontSize: "68px",
            fontWeight: 900,
            lineHeight: 1.08,
            color: "#FFFFFF",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          MEMBELAH UDARA <br />
          <span style={{ color: "#00F0FF" }}>SECARA EKSTREM</span>
        </h1>
      </div>

      {/* Wind Tunnel Telemetry Card (Y: 1150px) */}
      <div
        style={{
          position: "absolute",
          top: "1150px",
          left: "60px",
          right: "60px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Metric 1: Chine Knife-Edge Airflow */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "16px 24px",
            opacity: Math.max(0, Math.min(1, item1Spr)),
            transform: `translateY(${interpolate(item1Spr, [0, 1], [15, 0])}px)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>PROFIL AERODINAMIKA</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>
              Pisau Chine Memecah Arus Hambatan
            </div>
          </div>
          <span
            style={{
              backgroundColor: "rgba(56, 189, 248, 0.15)",
              color: "#38BDF8",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            MACH 0.92
          </span>
        </div>

        {/* Metric 2: Instability Managed by Fly-By-Wire */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "16px 24px",
            opacity: Math.max(0, Math.min(1, item2Spr)),
            transform: `translateY(${interpolate(item2Spr, [0, 1], [15, 0])}px)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>KONTROL KESEIMBANGAN</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>
              Komputer Kendali Fly-By-Wire Otomatis
            </div>
          </div>
          <span
            style={{
              backgroundColor: "rgba(52, 211, 153, 0.15)",
              color: "#34D399",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            QUAD-REDUNDANT
          </span>
        </div>
      </div>
    </div>
  );
};
