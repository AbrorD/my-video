import React from "react";
import { Composition } from "remotion";
import { DURATION_IN_FRAMES, FPS } from "./cues";
import { MainVideo } from "./MainVideo";
import { compositionSchema } from "./schema";
import { MustangShort, MUSTANG_FRAMES } from "./videos/mustang/Mustang";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MustangShort"
        component={MustangShort}
        durationInFrames={MUSTANG_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        schema={compositionSchema}
        defaultProps={{
          backgroundColor: "#080B11",
          audioVolume: 1,
          showSubtitles: true,
          showSafeZone: false,
        }}
      />
    </>
  );
};
