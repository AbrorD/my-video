import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SUBTITLES } from "../subtitles";
import { fontSans } from "./Typography";

export const SubtitleBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find current active subtitle
  const activeCue = SUBTITLES.find(
    (cue) => frame >= cue.startFrame && frame <= cue.endFrame
  );

  if (!activeCue) {
    return null;
  }

  const cueProgress = frame - activeCue.startFrame;
  const spr = spring({
    frame: cueProgress,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  const translateY = interpolate(spr, [0, 1], [20, 0]);
  const opacity = interpolate(spr, [0, 0.5, 1], [0, 1, 1]);

  const words = activeCue.text.split(" ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: "130px",
        left: "50px",
        right: "50px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 100,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(24, 24, 27, 0.94)",
          backdropFilter: "blur(12px)",
          border: "1.5px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "26px",
          padding: "16px 32px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          maxWidth: "960px",
          textAlign: "center",
        }}
      >
        {words.map((word, idx) => {
          const isHighlighted = activeCue.highlightWords.some((hw) => {
            const cleanW = word.toLowerCase().replace(/[^a-z0-9]/g, "");
            const cleanHw = hw.toLowerCase().replace(/[^a-z0-9]/g, "");
            return cleanW === cleanHw || word.includes(hw);
          });

          if (isHighlighted) {
            return (
              <span
                key={`${word}-${idx}`}
                style={{
                  backgroundColor: "#FACC15",
                  color: "#000000",
                  fontFamily: fontSans,
                  fontSize: "36px",
                  fontWeight: 800,
                  padding: "4px 14px",
                  borderRadius: "10px",
                  display: "inline-block",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 2px 8px rgba(250, 204, 21, 0.4)",
                  transform: "scale(1.03)",
                }}
              >
                {word}
              </span>
            );
          }

          return (
            <span
              key={`${word}-${idx}`}
              style={{
                color: "#FFFFFF",
                fontFamily: fontSans,
                fontSize: "36px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
