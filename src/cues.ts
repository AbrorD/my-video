export const FPS = 30;
export const DURATION_IN_FRAMES = 1110; // 37.0 detik (cocok persis durasi voiceover.mp3 36.73s)

export const secToFrames = (seconds: number) => Math.round(seconds * FPS);

export const CUES = {
  // Rentang adegan
  scene1: {
    startFrame: 0,
    endFrame: 205,
    durationInFrames: 205,
    title: "Misteri Bentuk Patah-Patah",
    keywordFrame: 120, // "F-117 NIGHTHAWK"
  },
  scene2: {
    startFrame: 205,
    endFrame: 470,
    durationInFrames: 265,
    title: "Aerodinamika & Aliran Udara",
    windTunnelStartFrame: 220,
    keywordFrame: 270, // "EKSTREM"
  },
  scene3: {
    startFrame: 470,
    endFrame: 840,
    durationInFrames: 370,
    title: "Defleksi Gelombang Radar",
    radarWaveHitFrame: 530,
    facetDeflectFrame: 660,
    keywordFrame: 720, // "RUANG HAMPA"
  },
  scene4: {
    startFrame: 840,
    endFrame: 1110,
    durationInFrames: 270,
    title: "RCS Burung Kecil & Outro",
    rcsDisplayFrame: 870,
    afterburnerEscapeFrame: 970,
    keywordFrame: 910, // "BURUNG KECIL"
  },
} as const;
