import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();

  // Logo spring entrance
  const logoScale = interpolate(frame, [0, 25], [0.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const logoRotate = interpolate(frame, [0, 45], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse burst ring
  const burstScale = interpolate(frame, [6, 36], [0.6, 2.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const burstOpacity = interpolate(frame, [6, 36], [0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text reveals
  const textTranslateY = interpolate(frame, [12, 32], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const textOpacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button pop
  const btnScale = interpolate(frame, [22, 42], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const btnOpacity = interpolate(frame, [22, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Shockwave Radial Ring */}
      <div
        style={{
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: "50%",
          border: "2px solid #38bdf8",
          scale: burstScale,
          opacity: burstOpacity,
          boxShadow: "0 0 30px #38bdf8",
          pointerEvents: "none",
        }}
      />

      {/* Geometric Modern Logo Symbol */}
      <div
        style={{
          scale: logoScale,
          rotate: `${logoRotate}deg`,
          opacity: logoOpacity,
          marginBottom: 32,
          position: "relative",
          width: 130,
          height: 130,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={130} height={130} viewBox="0 0 100 100" fill="none">
          <polygon
            points="50,5 90,25 90,75 50,95 10,75 10,25"
            stroke="url(#hexGradient)"
            strokeWidth="4"
            fill="rgba(56, 189, 248, 0.08)"
          />
          <polygon
            points="50,20 80,35 80,65 50,80 20,65 20,35"
            stroke="url(#innerHexGradient)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            fill="none"
          />
          <circle cx="50" cy="50" r="14" fill="url(#centerCircle)" />
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="innerHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="centerCircle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Headline */}
      <div
        style={{
          translate: `0px ${textTranslateY}px`,
          opacity: textOpacity,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 90,
            fontWeight: 900,
            letterSpacing: -2,
            background: "linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 10px 40px rgba(0,0,0,0.8)",
            lineHeight: 1.1,
          }}
        >
          BUILT WITH REMOTION
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: "#38bdf8",
            letterSpacing: 2,
            marginTop: 12,
            textShadow: "0 0 20px rgba(56, 189, 248, 0.5)",
          }}
        >
          High Precision Motion Graphics in React
        </div>
      </div>

      {/* CTA Button Badge */}
      <div
        style={{
          scale: btnScale,
          opacity: btnOpacity,
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 36px",
          borderRadius: 9999,
          background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
          color: "#07090e",
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          boxShadow: "0 0 35px rgba(56, 189, 248, 0.4), 0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <span>▶</span>
        <span>Render Anywhere</span>
      </div>
    </AbsoluteFill>
  );
};
