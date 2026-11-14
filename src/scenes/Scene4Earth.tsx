import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontMono, fontSans } from "../components/Typography";

export const Scene4Earth: React.FC = () => {
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
      {/* 1. Header Jalur Arde */}
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
            backgroundColor: "#16A34A",
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
          🛡️ PROTEKSI KEJUT LISTRIK
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
          Dua Klip <span style={{ color: "#16A34A" }}>Arde Pembumian</span>
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
          Membuang arus bocor seketika ke bumi sebelum menyengat manusia.
        </p>
      </div>

      {/* 2. Kartu Rute Kabel Tiga Inti */}
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
          justifyContent: "space-between",
          alignItems: "center",
          opacity: spring({ frame: frame - 15, fps, config: { damping: 12 } }),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ fontFamily: fontSans, fontSize: 17, fontWeight: 700 }}>
              Kabel Inti Tiga Fleksibel SNI
            </div>
            <div style={{ fontFamily: fontMono, fontSize: 13, color: "#A1A1AA" }}>
              Fasa (Cokelat) • Netral (Biru) • Arde (Kuning-Hijau)
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#22C55E",
            color: "#000000",
            fontFamily: fontMono,
            fontSize: 14,
            fontWeight: 800,
            padding: "8px 16px",
            borderRadius: 9999,
          }}
        >
          SAFE 100%
        </div>
      </div>
    </div>
  );
};
