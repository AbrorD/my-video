import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontMono, fontSans } from "../components/Typography";

export const Scene3Clips: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Animasi pengisian grip meter
  const gripPercent = interpolate(frame, [15, 60], [20, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
      {/* 1. Header Penjepit Pegas */}
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
            backgroundColor: "#D97706",
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
          ⚡ MEKANISME CENGKERAM
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
          Pegas Daun <span style={{ color: "#2563EB" }}>Ganda Elastis</span>
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
          Sepasang plat kuningan menjepit kedua sisi pin steker secara presisi.
        </p>
      </div>

      {/* 2. Kartu Meteran Cengkeraman Anti-Arcing */}
      <div
        style={{
          backgroundColor: "rgba(24, 24, 27, 0.94)",
          color: "#FFFFFF",
          backdropFilter: "blur(12px)",
          borderRadius: 20,
          padding: "20px 28px",
          boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          opacity: spring({ frame: frame - 15, fps, config: { damping: 12 } }),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: fontMono, fontSize: 13, color: "#FACC15", fontWeight: 700 }}>
            KEKUATAN JEPITAN PIN (ANTI-KENDOR)
          </span>
          <span style={{ fontFamily: fontMono, fontSize: 15, fontWeight: 800, color: "#22C55E" }}>
            {Math.round(gripPercent)}% MAKSIMAL
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: 12,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 9999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${gripPercent}%`,
              height: "100%",
              backgroundColor: "#22C55E",
              boxShadow: "0 0 10px #22C55E",
            }}
          />
        </div>

        <div style={{ fontFamily: fontSans, fontSize: 14, color: "#A1A1AA" }}>
          Kerapatan kontak mencegah celah udara pemicu loncatan bunga api (*arcing*).
        </div>
      </div>
    </div>
  );
};
