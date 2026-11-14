import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontMono, fontSans, HeaderBadge, InfoPill, MainHeadline } from "../components/Typography";

export const Scene2History: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for main square window
  const sprWindow = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  // Spring for investigation card
  const sprCard = spring({
    frame: frame - 70,
    fps,
    config: { damping: 13, stiffness: 115 },
  });

  // Crack animation progresses over frames 140 to 220
  const crackProgress = interpolate(frame, [120, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Danger pulse
  const dangerPulse = (Math.sin(frame * 0.15) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        padding: "160px 70px 0 70px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top Header */}
      <div style={{ width: "100%", textAlign: "left" }}>
        <HeaderBadge category="SEJARAH KELAM PENERBANGAN • 1950-AN" delay={2} />
        <MainHeadline
          title="de Havilland Comet: Jendela Kotak Pertama"
          highlightText="Jendela Kotak"
          highlightColor="#DC2626"
          delay={5}
          fontSize={64}
        />
        <div style={{ marginTop: "16px" }}>
          <InfoPill
            text="TRAGEDI 1954 • INVESTIGASI RESMI"
            bg="rgba(220, 38, 38, 0.12)"
            color="#DC2626"
            border="1.5px solid #DC2626"
            delay={8}
          />
        </div>
      </div>

      {/* Center Motion Graphic: Square Window with Sharp 90° Corners & Cracks */}
      <div
        style={{
          marginTop: "45px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          transform: `scale(${interpolate(sprWindow, [0, 1], [0.85, 1])})`,
          opacity: interpolate(sprWindow, [0, 1], [0, 1]),
        }}
      >
        <svg width="680" height="420" viewBox="0 0 680 420" fill="none">
          <defs>
            {/* Retro 1950s aluminum fuselage */}
            <linearGradient id="retroFuselage" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Vintage Sky */}
            <linearGradient id="retroSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            <filter id="shadowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="12" stdDeviation="20" floodColor="#DC2626" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Fuselage Panel */}
          <rect
            x="60"
            y="20"
            width="560"
            height="380"
            rx="24"
            fill="url(#retroFuselage)"
            stroke="#94A3B8"
            strokeWidth="3"
          />

          {/* Fuselage Stamp: Comet Jet 1952 */}
          <text
            x="90"
            y="65"
            fontFamily={fontMono}
            fontSize="16"
            fontWeight="700"
            fill="#64748B"
            letterSpacing="2"
          >
            COMET-1 • BRITISH OVERSEAS AIRWAYS
          </text>

          {/* Square Window Frame (Notice sharp 90-degree corners!) */}
          <rect
            x="210"
            y="90"
            width="260"
            height="260"
            rx="4"
            fill="#1E293B"
            stroke={frame > 120 ? "#DC2626" : "#475569"}
            strokeWidth={frame > 120 ? 4 : 2}
            filter={frame > 120 ? "url(#shadowRed)" : undefined}
          />

          {/* Square Glass Pane */}
          <rect
            x="224"
            y="104"
            width="232"
            height="232"
            rx="2"
            fill="url(#retroSky)"
          />

          {/* Passenger silhouette inside square window */}
          <ellipse cx="340" cy="270" rx="42" ry="48" fill="rgba(15, 23, 42, 0.45)" />
          <circle cx="340" cy="190" r="28" fill="rgba(15, 23, 42, 0.45)" />

          {/* 90° Corner Angle Indicator at Top-Right Corner */}
          <g transform="translate(470, 90)">
            <path
              d="M -30 0 L -30 30 L 0 30"
              fill="none"
              stroke="#DC2626"
              strokeWidth="4"
            />
            <rect x="-24" y="6" width="18" height="18" fill="rgba(220, 38, 38, 0.2)" stroke="#DC2626" strokeWidth="2" />
            <text
              x="12"
              y="22"
              fontFamily={fontSans}
              fontSize="24"
              fontWeight="800"
              fill="#DC2626"
            >
              90°
            </text>
          </g>

          {/* Red Warning Target Rings at the 4 Sharp Corners */}
          {[
            { cx: 210, cy: 90 },
            { cx: 470, cy: 90 },
            { cx: 210, cy: 350 },
            { cx: 470, cy: 350 },
          ].map((corner, idx) => (
            <g key={`corner-glow-${idx}`}>
              <circle
                cx={corner.cx}
                cy={corner.cy}
                r={16 + dangerPulse * 10}
                fill="none"
                stroke="#DC2626"
                strokeWidth="2.5"
                opacity={0.6 + dangerPulse * 0.4}
              />
              <circle cx={corner.cx} cy={corner.cy} r="6" fill="#DC2626" />
            </g>
          ))}

          {/* Animated Fatal Crack Line Shooting Out from Top Corner */}
          {crackProgress > 0 && (
            <g>
              <path
                d="M 470 90 L 505 75 L 525 85 L 555 58 L 585 64 L 610 35"
                fill="none"
                stroke="#DC2626"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="200"
                strokeDashoffset={(1 - crackProgress) * 200}
              />
              <path
                d="M 525 85 L 545 110 L 575 105"
                fill="none"
                stroke="#DC2626"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset={(1 - crackProgress) * 100}
              />
            </g>
          )}
        </svg>

        {/* Warning Badge: Retakan Logam */}
        {frame > 130 && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "40px",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontFamily: fontSans,
              fontSize: "18px",
              fontWeight: 800,
              padding: "8px 18px",
              borderRadius: "12px",
              boxShadow: "0 8px 20px rgba(220, 38, 38, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transform: `scale(${1 + dangerPulse * 0.05})`,
            }}
          >
            <span>⚠️</span>
            <span>RETAKAN LOGAM DI SUDUT</span>
          </div>
        )}
      </div>

      {/* Historical Investigation Card (Matching Reference Video Card Style) */}
      <div
        style={{
          marginTop: "30px",
          width: "100%",
          maxWidth: "880px",
          backgroundColor: "#FFFFFF",
          border: "1.5px solid rgba(220, 38, 38, 0.2)",
          borderRadius: "24px",
          padding: "24px 28px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.06)",
          opacity: interpolate(sprCard, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(sprCard, [0, 1], [25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fontMono,
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#DC2626",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          TEMUAN RESMI PENYELIDIKAN FARNBOROUGH (1954)
        </div>

        {/* Row 1 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 18px",
            backgroundColor: "#F8FAFC",
            borderRadius: "14px",
            marginBottom: "10px",
          }}
        >
          <span style={{ fontFamily: fontSans, fontSize: "22px", fontWeight: 700, color: "#18181B" }}>
            Bentuk Jendela
          </span>
          <span style={{ fontFamily: fontSans, fontSize: "22px", fontWeight: 800, color: "#DC2626" }}>
            Kotak Siku (90°)
          </span>
        </div>

        {/* Row 2 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 18px",
            backgroundColor: "#FEF2F2",
            borderRadius: "14px",
          }}
        >
          <span style={{ fontFamily: fontSans, fontSize: "22px", fontWeight: 700, color: "#18181B" }}>
            Pemicu Ledakan Kabin
          </span>
          <span style={{ fontFamily: fontSans, fontSize: "22px", fontWeight: 800, color: "#DC2626" }}>
            Kelelahan Logam di Sudut
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
