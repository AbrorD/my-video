import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontMono, fontSans, HeaderBadge, InfoPill, MainHeadline } from "../components/Typography";

export const Scene4Stress: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for diagram
  const sprDiagram = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  // Spring for comparison bar card
  const sprCard = spring({
    frame: frame - 40,
    fps,
    config: { damping: 13, stiffness: 115 },
  });

  // Hotspot pulse
  const hotspotPulse = (Math.sin(frame * 0.2) + 1) / 2;

  // Streamline flow animation
  const streamOffset = (frame * 3) % 40;

  // Bar progress animation
  const redBarWidth = interpolate(frame, [45, 90], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const normalBarWidth = interpolate(frame, [45, 90], [0, 33], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        <HeaderBadge category="KONSENTRASI TEGANGAN (STRESS CONCENTRATION)" delay={2} />
        <MainHeadline
          title="Sudut 90°: Titik Patah Paling Rapuh"
          highlightText="Sudut 90°"
          highlightColor="#EF4444"
          delay={5}
          fontSize={64}
        />
        <div style={{ marginTop: "16px" }}>
          <InfoPill
            text="BEBAN TEKANAN MENUMPUK EKSTREM"
            bg="rgba(239, 68, 68, 0.12)"
            color="#EF4444"
            border="1.5px solid #EF4444"
            delay={8}
          />
        </div>
      </div>

      {/* Center Graphic: Finite Element / Stress Streamlines Flowing Into 90° Corner */}
      <div
        style={{
          marginTop: "40px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          transform: `scale(${interpolate(sprDiagram, [0, 1], [0.88, 1])})`,
          opacity: interpolate(sprDiagram, [0, 1], [0, 1]),
        }}
      >
        <svg width="680" height="390" viewBox="0 0 680 390" fill="none">
          <defs>
            <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#F97316" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Metal plate background */}
          <rect x="50" y="20" width="580" height="350" rx="20" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2.5" />

          {/* Stress Streamlines (Garis Gaya Tegangan) flowing horizontally */}
          {[60, 95, 130, 260, 295, 330].map((y, idx) => (
            <line
              key={`stream-${idx}`}
              x1="60"
              y1={y}
              x2="620"
              y2={y}
              stroke="#38BDF8"
              strokeWidth="3"
              strokeDasharray="16 12"
              strokeDashoffset={-streamOffset}
              opacity="0.65"
            />
          ))}

          {/* Streamlines squeezing around the corner */}
          <path
            d="M 60 160 C 180 160, 200 120, 220 120 L 460 120 C 480 120, 500 160, 620 160"
            fill="none"
            stroke="#EF4444"
            strokeWidth="4"
            strokeDasharray="16 12"
            strokeDashoffset={-streamOffset}
          />
          <path
            d="M 60 230 C 180 230, 200 270, 220 270 L 460 270 C 480 270, 500 230, 620 230"
            fill="none"
            stroke="#EF4444"
            strokeWidth="4"
            strokeDasharray="16 12"
            strokeDashoffset={-streamOffset}
          />

          {/* Center Square Cutout Window (90° Sharp Corners) */}
          <rect
            x="220"
            y="120"
            width="240"
            height="150"
            fill="#FFFFFF"
            stroke="#1E293B"
            strokeWidth="4"
          />

          {/* Extreme Stress Hotspot Radii at all 4 sharp corners */}
          {[
            { cx: 220, cy: 120 },
            { cx: 460, cy: 120 },
            { cx: 220, cy: 270 },
            { cx: 460, cy: 270 },
          ].map((pt, idx) => (
            <g key={`hotspot-${idx}`}>
              <circle
                cx={pt.cx}
                cy={pt.cy}
                r={36 + hotspotPulse * 16}
                fill="url(#hotspotGlow)"
              />
              <circle cx={pt.cx} cy={pt.cy} r="8" fill="#EF4444" />
            </g>
          ))}

          {/* Corner Angle Tag 90° */}
          <path d="M 435 120 L 435 145 L 460 145" fill="none" stroke="#EF4444" strokeWidth="3" />
          <text x="440" y="85" fill="#EF4444" fontFamily={fontSans} fontSize="18" fontWeight="800">
            90° (Titik Patah)
          </text>

          {/* Micro-crack propagating from the top right corner */}
          <path
            d="M 460 120 L 490 100 L 510 112 L 540 85"
            fill="none"
            stroke="#DC2626"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Stress Multiplier Callout */}
          <rect x="250" y="170" width="180" height="50" rx="12" fill="#18181B" />
          <text x="340" y="202" textAnchor="middle" fill="#FFFFFF" fontFamily={fontSans} fontSize="20" fontWeight="800">
            BUKAAN KOTAK
          </text>
        </svg>

        {/* Floating Callout Badge */}
        <div
          style={{
            position: "absolute",
            top: "-15px",
            right: "30px",
            backgroundColor: "#EF4444",
            color: "#FFFFFF",
            fontFamily: fontSans,
            fontSize: "20px",
            fontWeight: 800,
            padding: "8px 20px",
            borderRadius: "14px",
            boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
            transform: `scale(${1 + hotspotPulse * 0.05})`,
          }}
        >
          BEBAN MELEJIT 3× LIPAT!
        </div>
      </div>

      {/* Comparison Bar Card (Directly inspired by frame_06.png in reference video) */}
      <div
        style={{
          marginTop: "30px",
          width: "100%",
          maxWidth: "880px",
          backgroundColor: "#FFFFFF",
          border: "1.5px solid rgba(24, 24, 27, 0.08)",
          borderRadius: "24px",
          padding: "24px 30px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.06)",
          opacity: interpolate(sprCard, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(sprCard, [0, 1], [25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fontMono,
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#71717A",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          PERBANDINGAN KONSENTRASI BEBAN TEGANGAN
        </div>

        {/* Row 1: Sudut Kotak 90° (Red Bar) */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontFamily: fontSans, fontSize: "20px", fontWeight: 700, color: "#18181B" }}>
              Sudut Tajam 90°
            </span>
            <span style={{ fontFamily: fontSans, fontSize: "20px", fontWeight: 800, color: "#EF4444" }}>
              300% (Bahaya Robek!)
            </span>
          </div>
          <div style={{ width: "100%", height: "28px", backgroundColor: "#F4F4F5", borderRadius: "14px", overflow: "hidden" }}>
            <div
              style={{
                width: `${redBarWidth}%`,
                height: "100%",
                backgroundColor: "#EF4444",
                borderRadius: "14px",
              }}
            />
          </div>
        </div>

        {/* Row 2: Area Rata (Normal Bar) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontFamily: fontSans, fontSize: "20px", fontWeight: 700, color: "#18181B" }}>
              Bodi Rata Normal
            </span>
            <span style={{ fontFamily: fontSans, fontSize: "20px", fontWeight: 800, color: "#0284C7" }}>
              100% (Aman)
            </span>
          </div>
          <div style={{ width: "100%", height: "28px", backgroundColor: "#F4F4F5", borderRadius: "14px", overflow: "hidden" }}>
            <div
              style={{
                width: `${normalBarWidth}%`,
                height: "100%",
                backgroundColor: "#0284C7",
                borderRadius: "14px",
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
