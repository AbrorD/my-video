import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontMono, fontSans } from "../components/Typography";

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const stampScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 10, stiffness: 160 },
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
        alignItems: "center",
        padding: "130px 64px 260px 64px",
        textAlign: "center",
      }}
    >
      {/* 1. Header Kesimpulan */}
      <div
        style={{
          transform: `translateY(${interpolate(anim, [0, 1], [-30, 0])}px)`,
          opacity: anim,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#18181B",
            color: "#FFFFFF",
            fontFamily: fontMono,
            fontSize: 14,
            fontWeight: 800,
            padding: "6px 16px",
            borderRadius: 9999,
            letterSpacing: "0.08em",
          }}
        >
          🏆 REKAYASA KESELAMATAN
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
          Pilih Stop Kontak <span style={{ color: "#22C55E" }}>Berstandar SNI</span>
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
          Kuningan tebal & pembumian arde menjaga rumahmu tetap aman.
        </p>
      </div>

      {/* 2. Kartu Stempel & Call To Action */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          transform: `scale(${interpolate(stampScale, [0, 1], [0.8, 1])})`,
          opacity: stampScale,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(24, 24, 27, 0.94)",
            color: "#FFFFFF",
            backdropFilter: "blur(12px)",
            borderRadius: 24,
            padding: "24px 36px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "#FACC15",
              color: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            ✓
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: fontMono, fontSize: 13, color: "#FACC15", fontWeight: 700 }}>
              SERTIFIKASI KEAMANAN LISTRIK
            </div>
            <div style={{ fontFamily: fontSans, fontSize: 20, fontWeight: 800 }}>
              SNI IEC 60884-1 Teruji Tahan Panas
            </div>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#FACC15",
            color: "#18181B",
            fontFamily: fontSans,
            fontSize: 18,
            fontWeight: 800,
            padding: "12px 28px",
            borderRadius: 9999,
            boxShadow: "0 8px 24px rgba(250, 204, 21, 0.4)",
          }}
        >
          📌 Simpan & Bagikan ke Temanmu!
        </div>
      </div>
    </div>
  );
};
