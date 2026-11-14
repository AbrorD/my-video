import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontMono, fontSans } from "../components/Typography";

export const Scene2Dissect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "130px 64px 260px 64px",
      }}
    >
      {/* 1. Header Pengenalan Mode Bedah */}
      <div
        style={{
          transform: `translateY(${interpolate(anim, [0, 1], [-30, 0])}px)`,
          opacity: anim,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            fontFamily: fontMono,
            fontSize: 14,
            fontWeight: 800,
            padding: "6px 14px",
            borderRadius: 8,
            width: "fit-content",
            letterSpacing: "0.08em",
          }}
        >
          🔬 MODE BEDAH 3D CSG
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: fontSans,
            fontSize: 56,
            fontWeight: 800,
            color: "#18181B",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
          }}
        >
          Tiga Rel <span style={{ color: "#D49B28" }}>Kuningan Murni</span>
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: fontSans,
            fontSize: 22,
            color: "#52525B",
            fontWeight: 600,
          }}
        >
          Tutup polikarbonat terangkat: mengekspos busbar konduktor 250V.
        </p>
      </div>

      {/* 2. Kartu Rincian 3 Rel Konduktor */}
      <div
        style={{
          display: "flex",
          gap: 16,
          opacity: spring({ frame: frame - 20, fps, config: { damping: 12 } }),
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(24, 24, 27, 0.94)",
            color: "#FFFFFF",
            backdropFilter: "blur(12px)",
            borderRadius: 18,
            padding: "18px 24px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontFamily: fontMono, fontSize: 12, color: "#FACC15", fontWeight: 700 }}>
              PADUAN KUNINGAN H62
            </div>
            <div style={{ fontFamily: fontSans, fontSize: 16, fontWeight: 700 }}>
              Konduktivitas Tinggi & Anti Korosi
            </div>
          </div>
          <div
            style={{
              fontFamily: fontMono,
              fontSize: 18,
              fontWeight: 800,
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "6px 12px",
              borderRadius: 8,
              color: "#38BDF8",
            }}
          >
            3 BUSBARS
          </div>
        </div>
      </div>
    </div>
  );
};
