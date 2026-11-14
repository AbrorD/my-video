import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Scene4RCSOutro: React.FC = () => {
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

  // RCS Comparison Card spring
  const rcsSpr = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  // CTA Card spring
  const ctaSpr = spring({
    frame: frame - 60,
    fps,
    config: { damping: 12, stiffness: 130 },
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
          // RADAR CROSS SECTION (RCS)
        </div>

        <h1
          style={{
            fontSize: "66px",
            fontWeight: 900,
            lineHeight: 1.08,
            color: "#FFFFFF",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          HANYA SEBESAR <br />
          <span style={{ color: "#FACC15" }}>BURUNG KECIL!</span>
        </h1>
      </div>

      {/* RCS Comparison Display Card (Y: 1080px) */}
      <div
        style={{
          position: "absolute",
          top: "1080px",
          left: "60px",
          right: "60px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          opacity: Math.max(0, Math.min(1, rcsSpr)),
          transform: `translateY(${interpolate(rcsSpr, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.92)",
            border: "1.5px solid rgba(56, 189, 248, 0.35)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "20px 24px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 700 }}>
              PERBANDINGAN GEMA RADAR (RCS):
            </div>
            <div
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                color: "#38BDF8",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              5.000x LEBIH KECIL
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", color: "#EF4444", fontWeight: 700 }}>
                PESAWAT BIASA
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#FFFFFF" }}>
                5.0 <span style={{ fontSize: "18px", color: "#94A3B8" }}>m²</span>
              </div>
            </div>

            <div style={{ fontSize: "28px", color: "#475569" }}>➔</div>

            <div>
              <div style={{ fontSize: "13px", color: "#34D399", fontWeight: 700 }}>
                F-117 NIGHTHAWK
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#34D399" }}>
                0.001 <span style={{ fontSize: "18px", color: "#94A3B8" }}>m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Button */}
        {frame >= 60 && (
          <div
            style={{
              backgroundColor: "rgba(250, 204, 21, 0.95)",
              color: "#0F172A",
              borderRadius: "16px",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              fontWeight: 800,
              fontSize: "20px",
              boxShadow: "0 8px 24px rgba(250, 204, 21, 0.35)",
              opacity: Math.max(0, Math.min(1, ctaSpr)),
              transform: `scale(${interpolate(ctaSpr, [0, 1], [0.92, 1])})`,
            }}
          >
            <span>✈️ SIMPAN & BAGIKAN RAHASIA INI!</span>
          </div>
        )}
      </div>
    </div>
  );
};
