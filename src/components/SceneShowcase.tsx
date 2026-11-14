import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

export const SceneShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance
  const cardScale = interpolate(frame, [0, 22], [0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const cardOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animated Circular Gauge (0 to 100%)
  const gaugeProgress = interpolate(frame, [10, 45], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const circleRadius = 55;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (gaugeProgress / 100) * circumference;

  // Staggered animated bars
  const bar1 = interpolate(frame, [12, 35], [0, 94], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const bar2 = interpolate(frame, [16, 39], [0, 88], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const bar3 = interpolate(frame, [20, 43], [0, 99], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Staggered pills pop in
  const pill1Scale = interpolate(frame, [16, 30], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const pill1Opacity = interpolate(frame, [16, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pill2Scale = interpolate(frame, [20, 34], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const pill2Opacity = interpolate(frame, [20, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pill3Scale = interpolate(frame, [24, 38], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const pill3Opacity = interpolate(frame, [24, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scene Exit (frame 54 to 67)
  const exitOpacity = interpolate(frame, [54, 67], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(frame, [54, 67], [1, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    output: "perceptual-scale",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: exitOpacity,
        scale: exitScale,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Central Glassmorphism Card */}
      <div
        style={{
          width: 980,
          background: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(24px)",
          borderRadius: 28,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          padding: "44px 56px",
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.12)",
          scale: cardScale,
          opacity: cardOpacity,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top Glow Accent Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent)",
            boxShadow: "0 0 15px #38bdf8",
          }}
        />

        {/* Card Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: 22,
            marginBottom: 34,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#34d399",
                boxShadow: "0 0 12px #34d399",
              }}
            />
            <span
              style={{
                color: "#e2e8f0",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Motion Performance Engine
            </span>
          </div>
          <div
            style={{
              color: "#38bdf8",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 1.5,
              background: "rgba(56, 189, 248, 0.12)",
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid rgba(56, 189, 248, 0.3)",
            }}
          >
            60 FPS • ULTRA-HD
          </div>
        </div>

        {/* Card Body: Metric Bars & Circular Gauge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 40,
            marginBottom: 36,
          }}
        >
          {/* Animated Metrics List */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Metric 1 */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                <span>Rendering Fluidity</span>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>{Math.round(bar1)}%</span>
              </div>
              <div
                style={{
                  height: 10,
                  backgroundColor: "rgba(255, 255, 255, 0.07)",
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${bar1}%`,
                    background: "linear-gradient(90deg, #38bdf8, #818cf8)",
                    borderRadius: 5,
                    boxShadow: "0 0 10px #38bdf8",
                  }}
                />
              </div>
            </div>

            {/* Metric 2 */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                <span>Frame Synchronization</span>
                <span style={{ color: "#a855f7", fontWeight: 700 }}>{Math.round(bar2)}%</span>
              </div>
              <div
                style={{
                  height: 10,
                  backgroundColor: "rgba(255, 255, 255, 0.07)",
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${bar2}%`,
                    background: "linear-gradient(90deg, #818cf8, #c084fc)",
                    borderRadius: 5,
                    boxShadow: "0 0 10px #a855f7",
                  }}
                />
              </div>
            </div>

            {/* Metric 3 */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                <span>Vector Precision</span>
                <span style={{ color: "#34d399", fontWeight: 700 }}>{Math.round(bar3)}%</span>
              </div>
              <div
                style={{
                  height: 10,
                  backgroundColor: "rgba(255, 255, 255, 0.07)",
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${bar3}%`,
                    background: "linear-gradient(90deg, #34d399, #38bdf8)",
                    borderRadius: 5,
                    boxShadow: "0 0 10px #34d399",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Circular Gauge Center */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              width: 170,
              height: 170,
            }}
          >
            <svg width={160} height={160} style={{ rotate: "-90deg" }}>
              <circle
                cx={80}
                cy={80}
                r={circleRadius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={10}
                fill="none"
              />
              <circle
                cx={80}
                cy={80}
                r={circleRadius}
                stroke="url(#gaugeGradient)"
                strokeWidth={10}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: -1,
                }}
              >
                {Math.round(gaugeProgress)}%
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#94a3b8",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                LOADED
              </span>
            </div>
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              flex: 1,
              padding: "12px 18px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              scale: pill1Scale,
              opacity: pill1Opacity,
            }}
          >
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
              Dynamic Keyframes
            </span>
          </div>

          <div
            style={{
              flex: 1,
              padding: "12px 18px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              scale: pill2Scale,
              opacity: pill2Opacity,
            }}
          >
            <span style={{ fontSize: 20 }}>🎯</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
              Frame Accuracy
            </span>
          </div>

          <div
            style={{
              flex: 1,
              padding: "12px 18px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              scale: pill3Scale,
              opacity: pill3Opacity,
            }}
          >
            <span style={{ fontSize: 20 }}>⚛</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
              React Components
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
