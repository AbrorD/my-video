export interface SubtitleCue {
  text: string;
  startFrame: number;
  endFrame: number;
  highlightWords: string[];
}

export const SUBTITLES: SubtitleCue[] = [
  // Scene 1: Hook
  {
    text: "Pernah lihat pesawat",
    startFrame: 0,
    endFrame: 40,
    highlightWords: ["pesawat"],
  },
  {
    text: "dengan bentuk patah-patah begini?",
    startFrame: 40,
    endFrame: 90,
    highlightWords: ["patah-patah"],
  },
  {
    text: "Ini Lockheed F-117 Nighthawk!",
    startFrame: 100,
    endFrame: 195,
    highlightWords: ["Lockheed", "F-117", "Nighthawk"],
  },

  // Scene 2: Aerodinamika & Airflow
  {
    text: "Bentuk bersudut tajam ini",
    startFrame: 215,
    endFrame: 265,
    highlightWords: ["bersudut", "tajam"],
  },
  {
    text: "membelah udara secara ekstrem.",
    startFrame: 265,
    endFrame: 325,
    highlightWords: ["membelah", "ekstrem"],
  },
  {
    text: "Tapi rahasia terbesarnya...",
    startFrame: 338,
    endFrame: 395,
    highlightWords: ["rahasia"],
  },
  {
    text: "ada pada cara ia menghadapi radar musuh.",
    startFrame: 395,
    endFrame: 462,
    highlightWords: ["radar", "musuh"],
  },

  // Scene 3: Radar Wave Deflection
  {
    text: "Saat gelombang radar datang,",
    startFrame: 480,
    endFrame: 540,
    highlightWords: ["gelombang", "radar"],
  },
  {
    text: "pesawat biasa memantulkannya lurus kembali ke pemancar.",
    startFrame: 540,
    endFrame: 642,
    highlightWords: ["lurus", "kembali"],
  },
  {
    text: "Tapi pada F-117...",
    startFrame: 655,
    endFrame: 695,
    highlightWords: ["F-117"],
  },
  {
    text: "setiap bidang miring membelokkan gelombang",
    startFrame: 695,
    endFrame: 760,
    highlightWords: ["bidang", "miring"],
  },
  {
    text: "radar ke ruang hampa!",
    startFrame: 760,
    endFrame: 832,
    highlightWords: ["ruang", "hampa"],
  },

  // Scene 4: RCS & Outro
  {
    text: "Hasilnya? Di layar radar musuh,",
    startFrame: 845,
    endFrame: 900,
    highlightWords: ["layar", "radar"],
  },
  {
    text: "monster ini cuma tampak sekecil burung kecil.",
    startFrame: 900,
    endFrame: 1018,
    highlightWords: ["burung", "kecil"],
  },
  {
    text: "Simpan dan bagikan rahasia ini!",
    startFrame: 1032,
    endFrame: 1095,
    highlightWords: ["Simpan", "bagikan"],
  },
];
