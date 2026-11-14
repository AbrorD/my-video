import React from "react";
import { useCurrentFrame } from "remotion";
import { NighthawkCanvas } from "./Nighthawk3D";

export const MainObject: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1080,
        height: 1920,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <NighthawkCanvas frame={frame} width={1080} height={1920} />
    </div>
  );
};
