import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Scene3RadarDeflection: React.FC = () => {
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

  // Macro Zoom Callout Springs (appears during zoom frame 60 - 270)
  const macroFacetSpr = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  const macroBouncedSpr = spring({
    frame: frame - 90,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  // Alert & Radar Deflection Cards
  const card1Spr = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const card2Spr = spring({
    frame: frame - 65,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Macro overlay visibility window (frame 60 to 270 in Scene 3)
  const isZoomActive = frame >= 60 && frame < 270;
  const zoomExitOpacity = interpolate(frame, [250, 270], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
            color: "#F59E0B",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          // RADAR DEFLECTION PHYSICS (SNELL'S LAW)
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
          PANTULKAN RADAR <br />
          <span style={{ color: "#34D399" }}>KE RUANG HAMPA!</span>
        </h1>
      </div>

      {/* Dynamic Macro Callouts during Zoom-in Phase (Y: 580px - 880px) */}
      {isZoomActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: zoomExitOpacity,
          }}
        >
          {/* Callout 1: Bidang Miring Bodi Faset */}
          <div
            style={{
              position: "absolute",
              top: "580px",
              left: "60px",
              opacity: Math.max(0, Math.min(1, macroFacetSpr)),
              transform: `scale(${interpolate(macroFacetSpr, [0, 1], [0.85, 1])})`,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#34D399",
                boxShadow: "0 0 16px #34D399",
              }}
            />
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                border: "1.5px solid rgba(52, 211, 153, 0.5)",
                backdropFilter: "blur(10px)",
                padding: "10px 18px",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700 }}>
                // GEOMETRI BODI SILUMAN
              </div>
              <div style={{ fontSize: "17px", fontWeight: 900, color: "#34D399" }}>
                BIDANG MIRING FASET
              </div>
              <div style={{ fontSize: "12px", color: "#E2E8F0", marginTop: "2px" }}>
                Sudut miring meniadakan pantulan tegak lurus (90°)
              </div>
            </div>
          </div>

          {/* Callout 2: Gelombang Terpental ke Ruang Hampa */}
          <div
            style={{
              position: "absolute",
              top: "760px",
              right: "60px",
              opacity: Math.max(0, Math.min(1, macroBouncedSpr)),
              transform: `scale(${interpolate(macroBouncedSpr, [0, 1], [0.85, 1])})`,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                border: "1.5px solid rgba(0, 240, 255, 0.5)",
                backdropFilter: "blur(10px)",
                padding: "10px 18px",
                borderRadius: "12px",
                textAlign: "right",
              }}
            >
              <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700 }}>
                // PANTULAN SPEKULAR
              </div>
              <div style={{ fontSize: "17px", fontWeight: 900, color: "#00F0FF" }}>
                GELOMBANG TERPENTAL ➔
              </div>
              <div style={{ fontSize: "12px", color: "#E2E8F0", marginTop: "2px" }}>
                Dibelokkan menjauh ke angkasa luar
              </div>
            </div>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#00F0FF",
                boxShadow: "0 0 16px #00F0FF",
              }}
            />
          </div>
        </div>
      )}

      {/* Radar Comparison & Deflection HUD (Y: 1360px) */}
      <div
        style={{
          position: "absolute",
          top: "1360px",
          left: "60px",
          right: "60px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Card 1: Pesawat Biasa vs F-117 */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: "1.5px solid rgba(239, 68, 68, 0.4)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "16px 22px",
            opacity: Math.max(0, Math.min(1, card1Spr)),
            transform: `translateY(${interpolate(card1Spr, [0, 1], [15, 0])}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#F87171", fontWeight: 700 }}>
              PESAWAT KONVENSIONAL (BENTUK BULAT)
            </span>
            <span
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                color: "#EF4444",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              GEMA BALIK 100%
            </span>
          </div>
          <div style={{ fontSize: "16px", color: "#E2E8F0", marginTop: "4px" }}>
            Gelombang radar memantul tegak lurus (90°) langsung ke pemancar musuh.
          </div>
        </div>

        {/* Card 2: F-117 Stealth Facet Victory */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: "1.5px solid rgba(52, 211, 153, 0.5)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "16px 22px",
            opacity: Math.max(0, Math.min(1, card2Spr)),
            transform: `translateY(${interpolate(card2Spr, [0, 1], [15, 0])}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#34D399", fontWeight: 700 }}>
              F-117 NIGHTHAWK (BIDANG FASET MIRING)
            </span>
            <span
              style={{
                backgroundColor: "rgba(52, 211, 153, 0.2)",
                color: "#34D399",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              GEMA BALIK 0.00%
            </span>
          </div>
          <div style={{ fontSize: "16px", color: "#FFFFFF", marginTop: "4px", fontWeight: 600 }}>
            Semua sudut siku 90° dihapus; pulsa dibelokkan ke atas & angkasa luar!
          </div>
        </div>
      </div>
    </div>
  );
};
