import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { MainObject } from "./components/MainObject";
import { SubtitleBar } from "./components/SubtitleBar";
import { SystemOverlay } from "./components/SystemOverlay";
import { CUES } from "./cues";
import { CompositionSchema } from "./schema";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Airflow } from "./scenes/Scene2Airflow";
import { Scene3RadarDeflection } from "./scenes/Scene3RadarDeflection";
import { Scene4RCSOutro } from "./scenes/Scene4RCSOutro";

export const MainVideo: React.FC<CompositionSchema> = ({
  backgroundColor = "#080B11",
  audioVolume = 1,
  showSubtitles = true,
  showSafeZone = false,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle continuous slow tactical zoom
  const camScale = interpolate(frame, [0, durationInFrames], [1.0, 1.04], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      {/* 1. Master Audio Track (ElevenLabs Voiceover via Composio) */}
      <Audio src={staticFile("voiceover.mp3")} volume={audioVolume} />

      {/* 2. Panggung Utama Kamera Rig */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${camScale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Layer A: Tactical Dark Background */}
        <BackgroundLayer backgroundColor={backgroundColor} />

        {/* Layer B: 3D Lockheed F-117 Nighthawk (Continuity across all scenes) */}
        <MainObject />

        {/* Layer C: Scene-specific HUD Overlays (Rendered above 3D Canvas with zIndex: 5) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          {/* Adegan 1: Hook (0 - 205 frame) */}
          <Sequence
            from={CUES.scene1.startFrame}
            durationInFrames={CUES.scene1.durationInFrames}
            name="Scene 1: Hook & Misteri"
          >
            <Scene1Hook />
          </Sequence>

          {/* Adegan 2: Aerodinamika & Aliran Udara (205 - 470 frame) */}
          <Sequence
            from={CUES.scene2.startFrame}
            durationInFrames={CUES.scene2.durationInFrames}
            name="Scene 2: Aerodinamika & Airflow"
          >
            <Scene2Airflow />
          </Sequence>

          {/* Adegan 3: Defleksi Gelombang Radar (470 - 840 frame) */}
          <Sequence
            from={CUES.scene3.startFrame}
            durationInFrames={CUES.scene3.durationInFrames}
            name="Scene 3: Defleksi Gelombang Radar"
          >
            <Scene3RadarDeflection />
          </Sequence>

          {/* Adegan 4: RCS Burung Kecil & Outro CTA (840 - 1110 frame) */}
          <Sequence
            from={CUES.scene4.startFrame}
            durationInFrames={CUES.scene4.durationInFrames}
            name="Scene 4: RCS Burung Kecil & CTA"
          >
            <Scene4RCSOutro />
          </Sequence>
        </div>
      </div>

      {/* 3. Subtitle Bar Karaoke dengan Highlight Khas */}
      {showSubtitles && <SubtitleBar />}

      {/* 4. Sistem Header, Progress Bar & Safe-Zone */}
      <SystemOverlay showSafeZone={showSafeZone} />
    </AbsoluteFill>
  );
};
