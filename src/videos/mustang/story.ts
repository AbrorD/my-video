// Timeline of the P-51 Mustang short: 13 shots timed to shorts/mustang/voice/words.json (2043 frames = 68.100 s),
// flight & story physics, smootherstep camera glides (18-38 f), continuous creeping push-ins on every hold (no frozen
// spans), 7-frame sign-flipping impact kicks, thin-lens DOF table, and foreground framing props.
export const FPS = 30;
export const TOTAL = 2043;
export const D0 = 6.0; // ground elevation (m)
export const SKY_Y = 108.0; // high-altitude combat zone above the cloud sea (m)
export const PASTURE: V3 = [82, D0, 12]; // Zone B: muddy French road + cow pasture
export const PARK: V3 = [70, D0, -75]; // Zone D: golden-hour campfire clearing (cleared in buildTown)
export const HANGAR: V3 = [-16, D0, 0]; // Zone A: California / RAF Duxford hangar apron
export const BERLIN: V3 = [-85, D0, -8]; // Zone E: Berlin stone terrace overlooking grand European skyline
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const glide = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};

// ---------------- key story timestamps (seconds, locked to words.json) ----------------
export const T_FLYBY = 12.85; // f=385: Mustang screams past the hangar
export const T_HATS = 14.18; // f=425: hats blow off generals' heads into the bushes
export const T_COUGH = 20.02; // f=601: Allison starts coughing like an old lawnmower
export const T_BOLT = 37.35; // f=1120: Ronnie Harker shouts "Bolt!"
export const T_DROP_ENG = 38.98; // f=1169: Merlin V12 drops into Mustang nose
export const T_PUFF1 = 45.82; // f=1375: "One lazy puff just makes smoke"
export const T_GULP1 = 47.32; // f=1420: squeeze 1
export const T_GULP2 = 47.85; // f=1435: squeeze 2
export const T_ROAR = 48.92; // f=1468: "and the fire roars!"
export const T_JET = 56.88; // f=1706: "into a tiny jet push"
export const T_BERLIN_PASS = 63.08; // f=1892: Mustangs scream over Berlin

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type SceneMode =
  | "hook_pasture"
  | "rollout_1940"
  | "low_pass_hats"
  | "climb_cough"
  | "bf109_and_mud"
  | "slick_body"
  | "sparrow_lungs"
  | "harker_merlin"
  | "thin_air_golden"
  | "campfire_bellows"
  | "merlin_jet_scoop"
  | "bomber_escort"
  | "berlin_payoff";

export type ShotDef = { id: number; a: number; b: number; light: Light; mode: SceneMode; tau: (t: number) => number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 138, light: "day", mode: "hook_pasture", tau: (t) => t },
  { id: 2, a: 138, b: 351, light: "day", mode: "rollout_1940", tau: (t) => t },
  { id: 3, a: 351, b: 474, light: "day", mode: "low_pass_hats", tau: (t) => t },
  { id: 4, a: 474, b: 638, light: "day", mode: "climb_cough", tau: (t) => t },
  { id: 5, a: 638, b: 829, light: "day", mode: "bf109_and_mud", tau: (t) => t },
  { id: 6, a: 829, b: 906, light: "day", mode: "slick_body", tau: (t) => t },
  { id: 7, a: 906, b: 955, light: "day", mode: "sparrow_lungs", tau: (t) => t },
  { id: 8, a: 955, b: 1208, light: "day", mode: "harker_merlin", tau: (t) => t },
  { id: 9, a: 1208, b: 1289, light: "golden", mode: "thin_air_golden", tau: (t) => t },
  { id: 10, a: 1289, b: 1492, light: "golden", mode: "campfire_bellows", tau: (t) => t },
  { id: 11, a: 1492, b: 1722, light: "golden", mode: "merlin_jet_scoop", tau: (t) => t },
  { id: 12, a: 1722, b: 1861, light: "day", mode: "bomber_escort", tau: (t) => t },
  { id: 13, a: 1861, b: TOTAL, light: "day", mode: "berlin_payoff", tau: (t) => t },
];

/** crossfades (frames) at major place/time changes; 4-frame white flash right after the hook */
export const XFADE: Record<number, number> = { 4: 6, 8: 8, 9: 8, 10: 8, 11: 8, 12: 8, 13: 8 };
export const FLASH_AT = 138;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) },
      ];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- deterministic aircraft & prop trajectories ----------------
export type PlanePose = {
  pos: V3;
  yaw: number;
  pitch: number;
  roll: number;
  propSpin: number;
  variant: "allison" | "merlin";
  reconCam?: boolean;
  openNose?: boolean;
  jetGlow?: number;
  cough?: number;
  dropTanks?: boolean;
};

export const heroMustang = (id: number, f: number): PlanePose | null => {
  const t = f / FPS;
  // Shot 1: low recon pass over French pasture -> steep sputtering pull-up after f=98
  if (id === 1) {
    const uClimb = smooth((f - 96) / 42);
    const z = PASTURE[2] - 22 + t * 9.5;
    const y = D0 + 3.6 + uClimb * 5.2 + 0.14 * Math.sin(t * 7);
    const cough = f >= 102 ? 1 : 0;
    return {
      pos: [PASTURE[0] - 2.2, y, z],
      yaw: 0,
      pitch: -uClimb * 0.34 + (cough ? 0.04 * Math.sin(f * 1.9) : 0),
      roll: 0.08 * Math.sin(t * 3) + (cough ? 0.07 * Math.cos(f * 1.5) : 0),
      propSpin: f * (cough ? 0.35 : 0.95),
      variant: "allison",
      reconCam: true,
      cough,
    };
  }
  // Shot 2: gleaming NA-73X prototype rolled out onto California tarmac apron (nose pointing +z toward camera)
  if (id === 2) {
    const rollOut = easeOut((f - 145) / 115);
    return {
      pos: [-1.5, D0 + 1.48, -11 + rollOut * 10.5],
      yaw: 0.28,
      pitch: -0.11, // taildragger ground attitude (nose up!)
      roll: 0,
      propSpin: 0.4,
      variant: "allison",
    };
  }
  // Shot 3: screaming low pass right down the runway past the generals at x = 6.2, z = 4..10
  if (id === 3) {
    const dt = t - T_FLYBY;
    return {
      pos: [0.5, D0 + 2.9, 6 + dt * 36],
      yaw: 0,
      pitch: 0.02,
      roll: -0.22 * smooth((t - 12.2) / 1.8),
      propSpin: f * 1.45,
      variant: "allison",
    };
  }
  // Shot 4: high-altitude steep climb -> coughing lawnmower shudder from f=596
  if (id === 4) {
    const u = (f - 474) / (638 - 474);
    const cough = smooth((f - 592) / 18);
    const z = -18 + u * 26 - cough * 3.5;
    const y = SKY_Y - 4 + u * 9 - cough * 2.2 + cough * 0.18 * Math.sin(f * 2.1);
    return {
      pos: [0, y, z],
      yaw: 0.08,
      pitch: -0.28 * (1 - 0.5 * cough) + cough * 0.06 * Math.sin(f * 1.7),
      roll: cough * 0.12 * Math.sin(f * 1.3),
      propSpin: f * (1.1 - 0.72 * cough),
      variant: "allison",
      cough,
    };
  }
  // Shot 5: f < 700 high sky getting passed by Bf 109s; f >= 700 low over muddy French road with strapped camera
  if (id === 5) {
    if (f < 700) {
      const u = (f - 638) / 62;
      return {
        pos: [-2.2, SKY_Y - 1.5 + 0.15 * Math.sin(f * 1.8), -6 + u * 10],
        yaw: 0.05,
        pitch: -0.06,
        roll: 0.08 * Math.sin(f * 1.1),
        propSpin: f * 0.42,
        variant: "allison",
        cough: 0.8,
      };
    }
    const u = (f - 700) / 129;
    return {
      pos: [PASTURE[0] - 1.5, D0 + 3.1 + 0.12 * Math.sin(f * 0.4), PASTURE[2] - 14 + u * 26],
      yaw: 0.04,
      pitch: 0.03,
      roll: -0.1,
      propSpin: f * 0.95,
      variant: "allison",
      reconCam: true,
    };
  }
  // Shots 6 & 7: parked on apron for laminar wing beauty glide -> open cowling sparrow gag
  if (id === 6 || id === 7) {
    return {
      pos: [0, D0 + 1.48, 0],
      yaw: 0.25,
      pitch: -0.11,
      roll: 0,
      propSpin: 0.2,
      variant: "allison",
      openNose: id === 7,
    };
  }
  // Shot 8: RAF Duxford hangar swap — open nose receives the Merlin V12 at f=1169!
  if (id === 8) {
    const swapped = f >= 1172;
    const bounce = f >= 1169 && f < 1188 ? -0.16 * Math.sin(((f - 1169) / 19) * Math.PI) : 0;
    return {
      pos: [-3.5, D0 + 1.48 + bounce, -2],
      yaw: 0.18,
      pitch: -0.11 + bounce * 0.2,
      roll: 0,
      propSpin: swapped ? (f - 1172) * 0.8 : 0,
      variant: swapped ? "merlin" : "allison",
      openNose: !swapped && f >= 1095,
    };
  }
  // Shot 9: golden-hour high-altitude silhouette in thin air
  if (id === 9) {
    const u = (f - 1208) / 81;
    return {
      pos: [0, SKY_Y + 2, -10 + u * 18],
      yaw: 0.12,
      pitch: -0.08,
      roll: -0.12,
      propSpin: f * 0.75,
      variant: "merlin",
    };
  }
  // Shot 11: Merlin two-stage supercharger + Meredith Effect belly-scoop jet push!
  if (id === 11) {
    const u = (f - 1492) / (1722 - 1492);
    const jet = smooth((f - 1632) / 28);
    const surge = smooth((f - 1700) / 20) * 6.5;
    return {
      pos: [0, SKY_Y + 3 + 0.1 * Math.sin(f * 0.25), -16 + u * 34 + surge],
      yaw: 0.04,
      pitch: -0.04,
      roll: -0.14 + 0.08 * jet,
      propSpin: f * 1.55,
      variant: "merlin",
      jetGlow: jet,
      dropTanks: true,
    };
  }
  // Shot 12: 440 mph escorting B-17 bombers to Berlin
  if (id === 12) {
    const u = (f - 1722) / (1861 - 1722);
    return {
      pos: [4.2, SKY_Y + 3.4, -22 + u * 52],
      yaw: 0,
      pitch: -0.03,
      roll: -0.24 * Math.sin(u * Math.PI),
      propSpin: f * 1.65,
      variant: "merlin",
      jetGlow: 0.75,
      dropTanks: true,
    };
  }
  // Shot 13: silver Mustangs roaring victoriously over Berlin terrace!
  if (id === 13) {
    const dt = t - T_BERLIN_PASS;
    return {
      pos: [BERLIN[0] - 2.0 + dt * 24, D0 + 8.8 + Math.max(0, dt) * 1.6, BERLIN[2] + 15 + dt * 8],
      yaw: 1.25,
      pitch: -0.09,
      roll: -0.32,
      propSpin: f * 1.6,
      variant: "merlin",
      dropTanks: true,
    };
  }
  return null;
};

// ---------------- campfire bellows state (Shot 10) ----------------
export const campfireAt = (f: number) => {
  const t = f / FPS;
  const puff1 = Math.exp(-(((t - T_PUFF1) / 0.18) ** 2));
  const gulp1 = Math.exp(-(((t - T_GULP1) / 0.14) ** 2));
  const gulp2 = Math.exp(-(((t - T_GULP2) / 0.14) ** 2));
  const squeeze = clamp01(0.55 * puff1 + 0.95 * gulp1 + 1.0 * gulp2);
  const smoke = t >= T_PUFF1 && t < T_GULP2 ? clamp01((t - T_PUFF1) / 1.2) : 0;
  const roar = smooth((t - (T_ROAR - 0.12)) / 0.22);
  return { squeeze, smoke, roar };
};

// ---------------- camera grammar ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;

/** push-in factor since f0: subject grows ~rate per frame; `punch` raises it on emphasis words */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 34) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) {
    for (let i = 0; i < Math.min(x, n); i++) {
      s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
    }
  }
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => ({
  pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k],
  look,
  ...rest,
});
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot => ({
  pos,
  look,
  fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k),
  ...rest,
});

// ---- per-shot framings (every hold creeps via pushK -> zero static holds) ----
// Shot 1 (Hook): low Mustang + cows in pasture -> cow + low Mustang on "pictures of cows" -> tilt up as engine coughs
const S1a = (f: number) => {
  const m = heroMustang(1, f)!;
  return dolly([PASTURE[0] + 7.6, D0 + 2.4, PASTURE[2] + 16.5], [PASTURE[0] + 0.4, D0 + 2.2, m.pos[2] + 4], pushK(f, 0, 0.0022), { fov: 44 });
};
const S1b = (f: number) => dolly([PASTURE[0] + 5.2, D0 + 1.65, PASTURE[2] + 11.4], [PASTURE[0] + 1.5, D0 + 1.75, PASTURE[2] + 3.2], pushK(f, 56, 0.0022, 0.005, 28), { fov: 42, roll: -0.04 });
const S1c = (f: number) => {
  const m = heroMustang(1, f)!;
  return dolly([PASTURE[0] + 7.4, m.pos[1] + 0.9, m.pos[2] + 11.2], [m.pos[0], m.pos[1] + 0.25, m.pos[2] + 1.2], pushK(f, 96, 0.0026), { fov: 42, roll: 0.045 });
};

// Shot 2 (1940 California hangar rollout in 102 days): aerial establishing -> blueprint table -> proud Mustang 3/4 front
const S2a = (f: number) => zoom([18.5, D0 + 11.5, 26], [-4.5, D0 + 2.8, -2], 44, pushK(f, 134, 0.002));
const S2b = (f: number) => dolly([8.6, D0 + 2.35, 12.6], [0.2, D0 + 1.65, 0.2], pushK(f, 215, 0.0022, 0.005, 32), { fov: 42, roll: -0.03 });
const S2c = (f: number) => dolly([-6.8, D0 + 2.05, 10.6], [-1.0, D0 + 1.55, 0.4], pushK(f, 282, 0.0022, 0.0055, 35), { fov: 41, roll: 0.035 });

// Shot 3 (Low pass blows every general's hat into the bushes)
const S3a = (f: number) => {
  const m = heroMustang(3, f)!;
  const lz = Math.max(-4, Math.min(7.2, m.pos[2] + 2.5));
  return dolly([10.8, D0 + 2.15, 16.8], [3.2, D0 + 1.85, lz], pushK(f, 351, 0.0022), { fov: 44 });
};
const S3b = (f: number) => dolly([3.2, D0 + 1.85, 13.8], [6.8, D0 + 1.55, 6.9], pushK(f, 412, 0.0024, 0.0055, 30), { fov: 42, roll: 0.045 });

// Shot 4 (Five miles up -> Allison engine starts coughing like an old lawnmower)
const S4a = (f: number) => {
  const m = heroMustang(4, f)!;
  return dolly([12.2, m.pos[1] + 2.3, m.pos[2] + 11.5], [m.pos[0], m.pos[1] + 0.3, m.pos[2] + 0.8], pushK(f, 470, 0.0022), { fov: 43 });
};
const S4b = (f: number) => {
  const m = heroMustang(4, f)!;
  return dolly([8.2, m.pos[1] + 1.35, m.pos[2] + 9.2], [m.pos[0], m.pos[1] + 0.25, m.pos[2] + 1.1], pushK(f, 578, 0.0022, 0.005, 32), { fov: 42, roll: -0.045 });
};

// Shot 5: German Bf 109s wave overhead -> hard cut at f=700 to muddy French road photo-recon
const S5a = (f: number) => {
  const m = heroMustang(5, f)!;
  return dolly([12.6, SKY_Y + 3.2, m.pos[2] + 15.2], [0.8, SKY_Y + 0.8, m.pos[2] + 0.8], pushK(f, 638, 0.0022), { fov: 45, roll: 0.035 });
};
const S5b = (f: number) => {
  const m = heroMustang(5, f)!;
  return dolly([PASTURE[0] + 7.2, D0 + 2.3, m.pos[2] + 10.5], [PASTURE[0] - 0.5, D0 + 1.9, m.pos[2] + 1.0], pushK(f, 700, 0.0022), { fov: 42, roll: -0.03 });
};
const S5c = (f: number) => dolly([PASTURE[0] + 5.8, D0 + 1.75, PASTURE[2] + 14.4], [PASTURE[0] + 0.9, D0 + 1.85, PASTURE[2] + 4.8], pushK(f, 768, 0.0022, 0.005, 28), { fov: 42, roll: 0.035 });

// Shots 6 & 7: "Luckily, slickest body..." -> smooth glide + roll to "Unluckily, lungs of a sparrow"
const S6a = (f: number) => dolly([9.4, D0 + 2.45, 9.6], [0, D0 + 1.55, 0.3], pushK(f, 829, 0.0024), { fov: 42, roll: -0.03 });
const S7a = (f: number) => dolly([3.9, D0 + 2.80, 6.3], [0.58, D0 + 2.58, 2.40], pushK(f, 902, 0.0024, 0.0055, 26), { fov: 39, roll: 0.045 });

// Shot 8: RAF Duxford April 1942 — Ronnie Harker climbs out -> shouts "Bolt!" -> Merlin V12 drops into nose
const S8a = (f: number) => dolly([5.4, D0 + 2.2, 8.2], [-2.2, D0 + 1.7, -0.8], pushK(f, 950, 0.0022), { fov: 42 });
const S8b = (f: number) => dolly([2.8, D0 + 1.85, 5.2], [-1.5, D0 + 1.72, 0.4], pushK(f, 1072, 0.0022, 0.0055, 30), { fov: 39, roll: -0.035 });
const S8c = (f: number) => dolly([4.8, D0 + 2.35, 7.6], [-2.4, D0 + 1.82, 0.2], pushK(f, 1146, 0.0022, 0.005, 28), { fov: 42, roll: 0.035 });

// Shot 9: Golden hour high sky ("You see, five miles up, the air is too thin...")
const S9a = (f: number) => {
  const m = heroMustang(9, f)!;
  return zoom([12.5, SKY_Y + 3.6, m.pos[2] + 11.5], [m.pos[0], m.pos[1], m.pos[2] + 0.8], 40, pushK(f, 1204, 0.0022));
};

// Shot 10: Golden hour campfire + bellows ("One lazy puff just makes smoke... squeeze two big gulps... fire roars!")
const S10a = (f: number) => dolly([PARK[0] + 1.2, D0 + 1.8, PARK[2] - 7.8], [PARK[0] + 0.45, D0 + 1.25, PARK[2]], pushK(f, 1285, 0.0018), { fov: 41 });
const S10b = (f: number) => dolly([PARK[0] - 1.2, D0 + 1.6, PARK[2] - 6.2], [PARK[0] + 0.55, D0 + 1.18, PARK[2]], pushK(f, 1362, 0.002), { fov: 39, roll: -0.03 });
const S10c = (f: number) => dolly([PARK[0] - 1.5, D0 + 1.85, PARK[2] - 7.8], [PARK[0] + 0.58, D0 + 1.35, PARK[2]], pushK(f, 1418, 0.0018, 0.005, 32), { fov: 42, roll: 0.04 });

// Shot 11: Merlin two-stage supercharger -> glide under Mustang's belly scoop ("into a tiny jet push!")
const S11a = (f: number) => {
  const m = heroMustang(11, f)!;
  return dolly([7.8, m.pos[1] + 1.35, m.pos[2] + 8.4], [m.pos[0], m.pos[1] + 0.15, m.pos[2] + 1.2], pushK(f, 1488, 0.0022), { fov: 41 });
};
const S11b = (f: number) => {
  const m = heroMustang(11, f)!;
  return dolly([8.2, m.pos[1] - 1.45, m.pos[2] - 8.6], [m.pos[0], m.pos[1] - 0.55, m.pos[2] - 2.1], pushK(f, 1612, 0.002, 0.0045, 34), { fov: 42, roll: -0.045 });
};

// Shot 12: 440 mph escorting B-17 Flying Fortresses all the way to Berlin
const S12a = (f: number) => {
  const m = heroMustang(12, f)!;
  return dolly([18.5, SKY_Y + 6.2, m.pos[2] + 18.2], [-1.2, SKY_Y + 1.6, m.pos[2] - 0.8], pushK(f, 1718, 0.002, 0.005, 30), { fov: 46, roll: 0.035 });
};
const S12b = (f: number) => {
  const m = heroMustang(12, f)!;
  return dolly([12.2, SKY_Y + 3.2, m.pos[2] + 13.5], [1.6, SKY_Y + 2.6, m.pos[2] + 1.0], pushK(f, 1785, 0.0022), { fov: 43, roll: -0.04 });
};

// Shot 13: Berlin terrace — Göring drops binoculars in shock -> smooth crane/glide to the framed cow recon photo!
const S13a = (f: number) => dolly([BERLIN[0] + 2.4, D0 + 2.25, BERLIN[2] - 7.4], [BERLIN[0] - 0.3, D0 + 2.35, BERLIN[2] + 2.5], pushK(f, 1856, 0.0022), { fov: 43 });
const S13b = (f: number) => dolly([BERLIN[0] - 1.5, D0 + 2.25, BERLIN[2] - 5.0], [BERLIN[0] - 0.5, D0 + 2.05, BERLIN[2] - 0.2], pushK(f, 1922, 0.002, 0.0055, 30), { fov: 38, roll: 0.04 });
const S13c = (f: number) => dolly([BERLIN[0] + 1.85, D0 + 1.95, BERLIN[2] - 3.4], [BERLIN[0] + 1.65, D0 + 1.56, BERLIN[2] - 0.48], pushK(f, 1978, 0.0026), { fov: 36, roll: -0.02 });

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 56, dur: 26, s: S1b },
    { f: 96, dur: 28, s: S1c },
  ],
  2: [
    { f: 134, s: S2a },
    { f: 215, dur: 28, s: S2b },
    { f: 282, dur: 26, s: S2c },
  ],
  3: [
    { f: 351, s: S3a },
    { f: 412, dur: 22, s: S3b },
  ],
  4: [
    { f: 470, s: S4a },
    { f: 578, dur: 24, s: S4b },
  ],
  5: [
    { f: 638, s: S5a },
    { f: 700, cut: true, s: S5b },
    { f: 768, dur: 24, s: S5c },
  ],
  6: [
    { f: 829, s: S6a },
    { f: 902, dur: 20, s: S7a }, // seamless glide across 6 -> 7 ("Luckily ... / Unluckily ...")
  ],
  8: [
    { f: 950, s: S8a },
    { f: 1072, dur: 26, s: S8b },
    { f: 1146, cut: true, s: S8c },
  ],
  9: [{ f: 1204, s: S9a }],
  10: [
    { f: 1285, s: S10a },
    { f: 1362, dur: 24, s: S10b },
    { f: 1418, dur: 26, s: S10c },
  ],
  11: [
    { f: 1488, s: S11a },
    { f: 1612, dur: 28, s: S11b },
  ],
  12: [
    { f: 1718, s: S12a },
    { f: 1785, dur: 28, s: S12b },
  ],
  13: [
    { f: 1856, s: S13a },
    { f: 1922, dur: 24, s: S13b },
    { f: 1978, dur: 28, s: S13c },
  ],
};
CAMS[7] = CAMS[6];

// 7-frame sign-flipping impact shakes on physical hits (no handheld float)
const KICKS: [number, number][] = [
  [T_FLYBY, 1.0],
  [T_HATS, 0.7],
  [T_BOLT, 0.85],
  [T_DROP_ENG, 1.35],
  [T_ROAR, 1.3],
  [T_JET, 1.1],
  [T_BERLIN_PASS, 0.95],
];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f);
  const a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d);
  const h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return {
    ...c,
    look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m],
    roll: c.roll + a * 0.004,
  };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field + foreground framing ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 10 },
  { f: 56, dur: 26, cInf: 14, focus: () => [PASTURE[0] + 2.2, D0 + 1.2, PASTURE[2] + 3.5] }, // cow CU
  { f: 96, dur: 28, cInf: 6 },
  { f: 138, cInf: 0 }, // 1940 hangar aerial sharp
  { f: 282, dur: 26, cInf: 10, focus: () => [-1.0, D0 + 1.55, 0.4] }, // prototype MS
  { f: 351, cInf: 0 }, // low flyby wide
  { f: 412, dur: 22, cInf: 12, focus: () => [6.4, D0 + 1.55, 6.9] }, // generals' hats flying!
  { f: 474, cInf: 0 }, // high climb wide
  { f: 578, dur: 24, cInf: 11 }, // coughing nose MS
  { f: 638, cInf: 0 }, // Bf 109s overhead + muddy road wide
  { f: 768, dur: 24, cInf: 13, focus: () => [PASTURE[0] + 1.6, D0 + 1.2, PASTURE[2] + 5.2] }, // muddy cow CU
  { f: 829, cInf: 11, focus: () => [0, D0 + 1.55, 0.3] }, // slick laminar wing
  { f: 902, dur: 20, cInf: 15, focus: () => [0.62, D0 + 2.76, 2.40] }, // sparrow on nose CU
  { f: 955, cInf: 8 },
  { f: 1072, dur: 26, cInf: 13, focus: () => [-1.1, D0 + 1.65, 0.4] }, // Ronnie Harker MS
  { f: 1146, cInf: 9 }, // Merlin V12 drop
  { f: 1208, cInf: 5 }, // golden thin air
  { f: 1289, cInf: 9, focus: () => [PARK[0] + 0.55, D0 + 1.2, PARK[2]] }, // campfire bellows
  { f: 1492, cInf: 0 }, // golden high-speed run
  { f: 1612, dur: 28, cInf: 11 }, // Meredith belly scoop CU
  { f: 1722, cInf: 0 }, // B-17 bomber formation sharp
  { f: 1861, cInf: 7, focus: () => [BERLIN[0] - 0.5, D0 + 1.9, BERLIN[2] - 0.2] },
  { f: 1922, dur: 24, cInf: 13, focus: () => [BERLIN[0] - 0.5, D0 + 2.0, BERLIN[2] - 0.2] }, // Goring shocked MS
  { f: 1978, dur: 28, cInf: 15, focus: () => [BERLIN[0] + 1.65, D0 + 1.56, BERLIN[2] - 0.48] }, // cow photo CU!
];
export const dofAt = (f: number) => {
  let i = 0;
  while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i];
  const p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing props (visible in ~1/3 of shots, placed at 0.35-0.5x focus distance, clear of faces & >2.2 m from lens) */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 56, b: 96, kit: "plant_bushDetailed", pos: [PASTURE[0] + 5.3, D0, PASTURE[2] + 7.2], s: 1.0, yaw: 0.5 },
  { a: 282, b: 351, kit: "fuel_drums", pos: [-4.2, D0, 4.8], s: 0.95, yaw: 0.4 },
  { a: 955, b: 1146, kit: "fuel_drums", pos: [3.6, D0, 3.8], s: 0.95, yaw: -0.6 },
  { a: 1289, b: 1492, kit: "plant_bushDetailed", pos: [PARK[0] - 2.6, D0, PARK[2] - 4.2], s: 1.05, yaw: 0.4 },
];
