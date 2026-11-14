import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontMono, fontSans, HeaderBadge, InfoPill, MainHeadline } from "../components/Typography";

export const Scene5Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for diagram
  const sprDiagram = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  // Spring for final card
  const sprCard = spring({
    frame: frame - 45,
    fps,
    config: { damping: 13, stiffness: 115 },
  });

  // Streamline flow animation
  const streamOffset = (frame * 3.5) % 40;

  // Green safety pulse
  const safePulse = (Math.sin(frame * 0.12) + 1) / 2;

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
        <HeaderBadge category="SOLUSI TEKNIK & STANDAR PENERBANGAN" delay={2} />
        <MainHeadline
          title="Sudut Bulat: Aliran Tekanan Merata"
          highlightText="Aliran Tekanan Merata"
          highlightColor="#10B981"
          delay={5}
          fontSize={64}
        />
        <div style={{ marginTop: "16px" }}>
          <InfoPill
            text="TEGANGAN TERDISTRIBUSI SEMPURNA"
            bg="rgba(16, 185, 129, 0.12)"
            color="#10B981"
            border="1.5px solid #10B981"
            delay={8}
          />
        </div>
      </div>

      {/* Center Motion Graphic: Laminar Stress Streamlines Gliding Smoothly Around Rounded Window */}
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
            <linearGradient id="safeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="100%" stopColor="#D1FAE5" />
            </linearGradient>

            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#10B981" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Metal plate background */}
          <rect x="50" y="20" width="580" height="350" rx="20" fill="url(#safeGrad)" stroke="#10B981" strokeWidth="2" />

          {/* Smooth, elegant streamlines gliding smoothly past the rounded window */}
          {[55, 90, 125, 265, 300, 335].map((y, idx) => (
            <line
              key={`safe-stream-${idx}`}
              x1="60"
              y1={y}
              x2="620"
              y2={y}
              stroke="#10B981"
              strokeWidth="3"
              strokeDasharray="16 12"
              strokeDashoffset={-streamOffset}
              opacity="0.75"
            />
          ))}

          {/* Curving laminar streamlines hugging the smooth ellipse */}
          <path
            d="M 60 155 C 180 155, 200 95, 340 95 C 480 95, 500 155, 620 155"
            fill="none"
            stroke="#10B981"
            strokeWidth="4"
            strokeDasharray="16 12"
            strokeDashoffset={-streamOffset}
          />
          <path
            d="M 60 235 C 180 235, 200 295, 340 295 C 480 295, 500 235, 620 235"
            fill="none"
            stroke="#10B981"
            strokeWidth="4"
            strokeDasharray="16 12"
            strokeDashoffset={-streamOffset}
          />

          {/* Rounded Oval Airplane Window Frame */}
          <rect
            x="225"
            y="75"
            width="230"
            height="240"
            rx="100"
            fill="#FFFFFF"
            stroke="#1E293B"
            strokeWidth="5"
            filter="url(#glowGreen)"
          />

          {/* Inner Acrylic Glass View */}
          <rect
            x="240"
            y="90"
            width="200"
            height="210"
            rx="85"
            fill="#E0F2FE"
            stroke="#38BDF8"
            strokeWidth="2"
          />

          {/* Breather Bleed Hole at bottom of glass */}
          <circle cx="340" cy="275" r="5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />

          {/* Safe Stress Callout at Center */}
          <text x="340" y="185" textAnchor="middle" fill="#0284C7" fontFamily={fontSans} fontSize="24" fontWeight="800">
            JENDELA BULAT
          </text>
          <text x="340" y="215" textAnchor="middle" fill="#10B981" fontFamily={fontSans} fontSize="18" fontWeight="700">
            Tekanan 100% Merata
          </text>
        </svg>

        {/* Shield Badge */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "50px",
            backgroundColor: "#10B981",
            color: "#FFFFFF",
            fontFamily: fontSans,
            fontSize: "20px",
            fontWeight: 800,
            padding: "8px 20px",
            borderRadius: "14px",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transform: `scale(${1 + safePulse * 0.05})`,
          }}
        >
          <span>✓</span>
          <span>100% BEBAS RETAKAN</span>
        </div>
      </div>

      {/* Final Editorial Conclusion Card */}
      <div
        style={{
          marginTop: "30px",
          width: "100%",
          maxWidth: "880px",
          backgroundColor: "#FFFFFF",
          border: "2px solid #10B981",
          borderRadius: "24px",
          padding: "26px 32px",
          boxShadow: "0 16px 40px rgba(16, 185, 129, 0.12)",
          opacity: interpolate(sprCard, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(sprCard, [0, 1], [25, 0])}px)`,
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            backgroundColor: "rgba(16, 185, 129, 0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fontSans,
            fontSize: "32px",
            color: "#10B981",
          }}
        >
          🛡️
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: fontMono,
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#10B981",
              textTransform: "uppercase",
            }}
          >
            KESIMPULAN ILMIAH & TEKNIK
          </div>
          <div
            style={{
              fontFamily: fontSans,
              fontSize: "26px",
              fontWeight: 800,
              color: "#18181B",
              marginTop: "4px",
              lineHeight: 1.3,
            }}
          >
            Bukan Sekadar Estetika, Melainkan Penyelamat Ratusan Nyawa di Udara!
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
