import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadPlusJakartaSans } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const jakartaData = loadPlusJakartaSans("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

const monoData = loadJetBrainsMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const fontSans = jakartaData.fontFamily;
export const fontMono = monoData.fontFamily;

// Legacy alias for compatibility
export const fontKarla = fontSans;
export const fontPlayfair = fontSans;

interface HeaderBadgeProps {
  category: string;
  delay?: number;
}

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({ category, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 140 },
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "8px",
        opacity: interpolate(spr, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(spr, [0, 1], [15, 0])}px)`,
      }}
    >
      <span
        style={{
          fontFamily: fontMono,
          fontSize: "20px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "#71717A",
          textTransform: "uppercase",
        }}
      >
        {category}
      </span>
    </div>
  );
};

interface MainHeadlineProps {
  title: string;
  highlightText?: string;
  highlightColor?: string;
  delay?: number;
  fontSize?: number;
}

export const MainHeadline: React.FC<MainHeadlineProps> = ({
  title,
  highlightText,
  highlightColor = "#EA580C",
  delay = 3,
  fontSize = 62,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame: frame - delay,
    fps,
    config: { damping: 13, stiffness: 120 },
  });

  const parts = highlightText ? title.split(highlightText) : [title];

  return (
    <div
      style={{
        marginTop: "12px",
        fontFamily: fontSans,
        fontSize: `${fontSize}px`,
        fontWeight: 800,
        lineHeight: 1.15,
        color: "#18181B",
        letterSpacing: "-0.025em",
        opacity: interpolate(spr, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(spr, [0, 1], [25, 0])}px)`,
      }}
    >
      {parts[0]}
      {highlightText && (
        <span style={{ color: highlightColor }}>{highlightText}</span>
      )}
      {parts[1] && parts[1]}
    </div>
  );
};

interface InfoPillProps {
  text: string;
  color?: string;
  bg?: string;
  border?: string;
  delay?: number;
}

export const InfoPill: React.FC<InfoPillProps> = ({
  text,
  color = "#FFFFFF",
  bg = "#0284C7",
  border = "none",
  delay = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 130 },
  });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 20px",
        borderRadius: "999px",
        backgroundColor: bg,
        border,
        color,
        fontFamily: fontSans,
        fontSize: "19px",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        opacity: interpolate(spr, [0, 1], [0, 1]),
        transform: `scale(${interpolate(spr, [0, 1], [0.85, 1])})`,
      }}
    >
      {text}
    </div>
  );
};
