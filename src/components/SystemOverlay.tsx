import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CUES } from "../cues";

interface SystemOverlayProps {
  showSafeZone?: boolean;
}

export const SystemOverlay: React.FC<SystemOverlayProps> = ({
  showSafeZone = false,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Progress Bar (0 to 100%)
  const progressPercent = interpolate(
    frame,
    [0, durationInFrames],
    [0, 100],
    { extrapolateRight: "clamp" }
  );

  // Active Chapter Title based on CUES
  let currentChapter = "01 · MISTERI BENTUK PATAH-PATAH";
  let statusBadge = "STEALTH PROFILE: ACTIVE";
  let badgeColor = "#22C55E";

  if (frame >= CUES.scene4.startFrame) {
    currentChapter = "04 · RADAR CROSS SECTION (RCS)";
    statusBadge = "TARGET ECHO: 0.001 m² (NULL)";
    badgeColor = "#38BDF8";
  } else if (frame >= CUES.scene3.startFrame) {
    currentChapter = "03 · DEFLEKSI GELOMBANG RADAR";
    statusBadge = "DEFLECTION: SPECULAR (120°)";
    badgeColor = "#F59E0B";
  } else if (frame >= CUES.scene2.startFrame) {
    currentChapter = "02 · AERODINAMIKA & ALIRAN UDARA";
    statusBadge = "AIRFLOW: MACH 0.92 STABLE";
    badgeColor = "#38BDF8";
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
        fontFamily: "'JetBrains Mono', 'Plus Jakarta Sans', monospace",
      }}
    >
      {/* 1. Top Cyber Progress Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: "#00F0FF",
            boxShadow: "0 0 14px rgba(0, 240, 255, 0.9)",
          }}
        />
      </div>

      {/* 2. Top Header Taktis */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left Badge: F-117 Stealth Tactical Callout */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            backdropFilter: "blur(10px)",
            color: "#F8FAFC",
            padding: "8px 18px",
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.08em",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: badgeColor,
              display: "inline-block",
              boxShadow: `0 0 10px ${badgeColor}`,
            }}
          />
          F-117A NIGHTHAWK • 3D EXPLAINER
        </div>

        {/* Right Badge: Dynamic Chapter & Status */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#94A3B8",
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            padding: "7px 16px",
            borderRadius: 10,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          {currentChapter}
        </div>
      </div>

      {/* 3. Bottom Status Bar Info */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 60,
          display: "flex",
          gap: 16,
          fontSize: 12,
          color: "rgba(148, 163, 184, 0.7)",
          letterSpacing: "0.05em",
        }}
      >
        <span>STATUS: [{statusBadge}]</span>
        <span>•</span>
        <span>RCS BAND: X-BAND (10GHz)</span>
      </div>

      {/* 4. Safe-Zone Overlay */}
      {showSafeZone && (
        <div
          style={{
            position: "absolute",
            top: 250,
            bottom: 420,
            left: 80,
            right: 80,
            border: "2px dashed rgba(239, 68, 68, 0.4)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 12,
            color: "rgba(239, 68, 68, 0.6)",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          <span>▲ SAFE ZONE ATAS (250px)</span>
          <span>▼ SAFE ZONE BAWAH (420px)</span>
        </div>
      )}
    </div>
  );
};
