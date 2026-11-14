import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance spring / bezier (0 to 1.2s)
  const badgeScale = interpolate(frame, [5, 25], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const badgeOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Concentric circle scale and rotation
  const ringScale = interpolate(frame, [0, 45], [0.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const ringRotate = interpolate(frame, [0, 65], [0, 45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Kinetic Title: Word 1 ("KINETIC")
  const word1TranslateY = interpolate(frame, [12, 32], [70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const word1Opacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Kinetic Title: Word 2 ("MOTION")
  const word2TranslateY = interpolate(frame, [18, 38], [70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const word2Opacity = interpolate(frame, [18, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subTranslateY = interpolate(frame, [25, 45], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const subOpacity = interpolate(frame, [25, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subLetterSpacing = interpolate(frame, [25, 55], [10, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Accent Lines Expanding
  const lineWidth = interpolate(frame, [22, 50], [0, 420], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Scene Exit Transition (Frames 52 to 65)
  const sceneExitOpacity = interpolate(frame, [52, 65], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.3, 0, 0.8, 0.15),
  });
  const sceneExitScale = interpolate(frame, [52, 65], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    output: "perceptual-scale",
  });

  return (
    <AbsoluteFill
      style={{
        opacity: sceneExitOpacity,
        scale: sceneExitScale,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Geometric Decorative Rings */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          border: "2px dashed rgba(56, 189, 248, 0.2)",
          scale: ringScale,
          rotate: `${ringRotate}deg`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 850,
          height: 850,
          borderRadius: "50%",
          border: "1px solid rgba(139, 92, 246, 0.15)",
          scale: ringScale * 0.95,
          rotate: `-${ringRotate * 0.7}deg`,
          pointerEvents: "none",
        }}
      />

      {/* Pill Badge */}
      <div
        style={{
          opacity: badgeOpacity,
          scale: badgeScale,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 24px",
          borderRadius: 9999,
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(56, 189, 248, 0.4)",
          backdropFilter: "blur(12px)",
          marginBottom: 30,
          boxShadow: "0 0 25px rgba(56, 189, 248, 0.25)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#38bdf8",
            boxShadow: "0 0 10px #38bdf8",
          }}
        />
        <span
          style={{
            color: "#e0f2fe",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Remotion Motion Graphic
        </span>
      </div>

      {/* Main Kinetic Title */}
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "10px 20px",
        }}
      >
        <div
          style={{
            translate: `0px ${word1TranslateY}px`,
            opacity: word1Opacity,
            fontSize: 104,
            fontWeight: 900,
            letterSpacing: -2,
            color: "#ffffff",
            textShadow: "0 4px 30px rgba(0, 0, 0, 0.8)",
          }}
        >
          KINETIC
        </div>
        <div
          style={{
            translate: `0px ${word2TranslateY}px`,
            opacity: word2Opacity,
            fontSize: 104,
            fontWeight: 900,
            letterSpacing: -2,
            background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 35px rgba(129, 140, 248, 0.4))",
          }}
        >
          MOTION
        </div>
      </div>

      {/* Animated Accent Laser Line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 15,
          marginBottom: 25,
          position: "relative",
        }}
      >
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: "linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent)",
            borderRadius: 2,
            boxShadow: "0 0 16px #38bdf8",
          }}
        />
      </div>

      {/* Subtitle */}
      <div
        style={{
          translate: `0px ${subTranslateY}px`,
          opacity: subOpacity,
          color: "#94a3b8",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: subLetterSpacing,
          textTransform: "uppercase",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        Dynamic Video Driven by Code & React
      </div>
    </AbsoluteFill>
  );
};
