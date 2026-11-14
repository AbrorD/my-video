import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { Background } from "./components/Background";
import { Particles } from "./components/Particles";
import { SceneIntro } from "./components/SceneIntro";
import { SceneShowcase } from "./components/SceneShowcase";
import { SceneOutro } from "./components/SceneOutro";

export const MotionGraphicVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#07090e" }}>
      {/* Persistent Animated Background */}
      <Background />

      {/* Persistent Floating Particles & Sparkles */}
      <Particles />

      {/* Scene 1: Introduction (Frames 0 to 65) */}
      <Sequence durationInFrames={65} name="Scene 1 - Intro">
        <SceneIntro />
      </Sequence>

      {/* Scene 2: Tech Showcase & Metrics (Frames 58 to 125) */}
      <Sequence from={58} durationInFrames={67} name="Scene 2 - Showcase">
        <SceneShowcase />
      </Sequence>

      {/* Scene 3: Outro & Call to Action (Frames 118 to 180) */}
      <Sequence from={118} durationInFrames={62} name="Scene 3 - Outro">
        <SceneOutro />
      </Sequence>
    </AbsoluteFill>
  );
};

export const MyComposition: React.FC = () => {
  return (
    <Composition
      id="MotionGraphicTest"
      component={MotionGraphicVideo}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
