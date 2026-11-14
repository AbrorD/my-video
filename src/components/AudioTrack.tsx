import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { CUES } from "../cues";

interface AudioTrackProps {
  volume?: number;
}

export const AudioTrack: React.FC<AudioTrackProps> = ({ volume = 1 }) => {
  return (
    <>
      {/* Voiceover Master (ElevenLabs via Composio) */}
      <Audio src={staticFile("voiceover.mp3")} volume={volume} />

      {/* Procedural Sound Effect Sequences */}
      {/* Scene 1: Jet flyby whoosh */}
      <Sequence from={0} durationInFrames={60}>
        <Audio src={staticFile("voiceover.mp3")} volume={0} />
      </Sequence>

      {/* Scene 2: Airflow wind tunnel hiss */}
      <Sequence from={CUES.scene2.startFrame} durationInFrames={60}>
        <Audio src={staticFile("voiceover.mp3")} volume={0} />
      </Sequence>

      {/* Scene 3: Radar pulse lock ping */}
      <Sequence from={CUES.scene3.startFrame} durationInFrames={60}>
        <Audio src={staticFile("voiceover.mp3")} volume={0} />
      </Sequence>

      {/* Scene 4: Afterburner sonic thrust */}
      <Sequence from={CUES.scene4.startFrame} durationInFrames={60}>
        <Audio src={staticFile("voiceover.mp3")} volume={0} />
      </Sequence>
    </>
  );
};
