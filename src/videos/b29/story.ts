// Timeline of the Boeing B-29 Superfortress short: 12 shots timed to shorts/b29/voice/words.json (2045 frames = 68.167 s),
// flight & story physics, smootherstep camera glides (18-38 f), continuous creeping push-ins on every hold (no frozen
// spans), 7-frame sign-flipping impact kicks, thin-lens DOF table, and foreground framing props.
export const FPS = 30;
export const TOTAL = 2045;
export const D0 = 6.0; // ground elevation (m)
export const SKY_Y = 108.0; // high-altitude flight zone above the cloud sea (m)
export const PARK: V3 = [70, D0, -75]; // Zone D: golden-hour park clearing (cleared in buildTown)
export const SOVIET: V3 = [-85, D0, -8]; // Zone E: Soviet stone terrace overlooking skyline
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
const T = (f: number) => f / FPS;

// ---------------- key story timestamps (seconds, locked to words.json) ----------------
export const T_DOLLARS = 1.80; // f=54: "three billion dollars"
export const T_HOOK_SPARKS = 4.70; // f=141: "made out of fireworks!"
export const T_ROLLOUT = 6.90; // f=207: "Boeing rolls out the B-29 Superfortress"
export const T_TUNNEL = 16.65; // f=500: "crawl from nose to tail through a cozy metal tunnel"
export const T_CRAM = 20.85; // f=626: "crammed four massive engines"
export const T_FLARE = 28.35; // f=851: "ignite the magnesium block like a giant roadside flare"
export const T_JULY = 36.05; // f=1082: "celebrating the Fourth of July"
export const T_PUFF_FLAT = 42.80; // f=1284: "A flat puff just skims the surface"
export const T_SPOON = 45.67; // f=1370: "until you angle a spoon"
export const T_SCOOP = 46.35; // f=1391: "to scoop the breeze straight down inside"
export const T_BAFFLE = 48.30; // f=1449: "bolted curved metal baffles"
export const T_COOL_FLOW = 51.35; // f=1541: "scooping cold sky air right around the rear cylinders"
export const T_SUPER_PASS = 55.65; // f=1670: "fleets of silver Superfortresses ruled the Pacific"
export const T_BOLT_COPY = 62.00; // f=1860: "copy the bomber bolt for bolt"
export const T_PATCH_DING = 64.60; // f=1938: "with a tiny patch over the exact same accidental drill hole"

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type SceneMode =
  | "hook_fireworks"
  | "rollout_1943"
  | "cabin_tunnel"
  | "crammed_magnesium"
  | "climb_flare"
  | "high_wing"
  | "fourth_july"
  | "overheat_golden"
  | "soup_spoon"
  | "baffle_fix"
  | "pacific_fleet"
  | "soviet_clone";

export type ShotDef = { id: number; a: number; b: number; light: Light; mode: SceneMode; tau: (t: number) => number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 159, light: "day", mode: "hook_fireworks", tau: (t) => t },
  { id: 2, a: 159, b: 362, light: "day", mode: "rollout_1943", tau: (t) => t },
  { id: 3, a: 362, b: 564, light: "day", mode: "cabin_tunnel", tau: (t) => t },
  { id: 4, a: 564, b: 753, light: "day", mode: "crammed_magnesium", tau: (t) => t },
  { id: 5, a: 753, b: 929, light: "day", mode: "climb_flare", tau: (t) => t },
  { id: 6, a: 929, b: 1028, light: "day", mode: "high_wing", tau: (t) => t },
  { id: 7, a: 1028, b: 1104, light: "day", mode: "fourth_july", tau: (t) => t },
  { id: 8, a: 1104, b: 1210, light: "golden", mode: "overheat_golden", tau: (t) => t },
  { id: 9, a: 1210, b: 1435, light: "golden", mode: "soup_spoon", tau: (t) => t },
  { id: 10, a: 1435, b: 1640, light: "day", mode: "baffle_fix", tau: (t) => t },
  { id: 11, a: 1640, b: 1804, light: "day", mode: "pacific_fleet", tau: (t) => t },
  { id: 12, a: 1804, b: TOTAL, light: "day", mode: "soviet_clone", tau: (t) => t },
];

export const XFADE: Record<number, number> = { 4: 6, 5: 8, 8: 8, 9: 8, 10: 8, 11: 8, 12: 8 };
export const FLASH_AT = 159;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: smooth((f - (s.a - x / 2)) / x) },
      ];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- Hero B-29 Pose per Shot ----------------
export type B29Pose = {
  visible: boolean;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  propSpin: number;
  cutawayTunnel: boolean;
  openNacelle: boolean;
  flare: number;
  baffle: boolean;
  coolFlow: number;
  variant: "us" | "soviet";
};

export const heroB29 = (id: number, f: number): B29Pose => {
  const base: B29Pose = {
    visible: true,
    x: 0,
    y: D0 + 1.45,
    z: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    scale: 1,
    propSpin: 0.25,
    cutawayTunnel: false,
    openNacelle: false,
    flare: 0,
    baffle: false,
    coolFlow: 0,
    variant: "us",
  };

  if (id === 1) {
    // Shot 1: B-29 parked on apron beside $3B bullion stack; nacelle #2 erupts in fireworks at f >= 138
    return {
      ...base,
      x: 0.6,
      y: D0 + 1.45,
      z: 0,
      ry: -0.26,
      propSpin: 0.42,
      flare: f >= 138 ? smooth((f - 138) / 8) : 0,
    };
  }
  if (id === 2) {
    // Shot 2: 1943 Boeing rollout along the runway apron
    const u = smooth((f - 180) / 160);
    return {
      ...base,
      x: 0,
      y: D0 + 1.45,
      z: -6.5 + 8.5 * u,
      ry: 0.08,
      propSpin: 0.55,
    };
  }
  if (id === 3) {
    // Shot 3: Cutaway pressurized forward/aft cabins & crawl tunnel over bomb bay
    return {
      ...base,
      x: 1.15,
      y: D0 + 1.45,
      z: 0,
      ry: -Math.PI * 0.44,
      propSpin: 0.18,
      cutawayTunnel: true,
    };
  }
  if (id === 4) {
    // Shot 4: Open cowling on nacelle #2 showing crammed 18-cylinder twin-row magnesium block
    return {
      ...base,
      x: 0,
      y: D0 + 1.45,
      z: 0,
      ry: -0.15,
      propSpin: 0.12,
      openNacelle: true,
    };
  }
  if (id === 5) {
    // Shot 5: Heavy high-altitude climb above cloud sea -> magnesium roadside flare ignites at f=842!
    const u = (f - 753) / (929 - 753);
    const flare = f >= 840 ? smooth((f - 840) / 14) : 0;
    return {
      ...base,
      x: -2.0 + 4.0 * u,
      y: SKY_Y + 1.5 + 3.2 * u,
      z: -3.0 + 6.0 * u,
      rx: -0.12,
      ry: 0.16,
      rz: flare > 0 ? 0.06 * Math.sin(f * 0.7) : -0.05,
      propSpin: 0.92,
      flare,
    };
  }
  if (id === 6) {
    // Shot 6: "Luckily, the B-29 could fly higher than almost any fighter in the sky."
    const u = (f - 929) / (1028 - 929);
    return {
      ...base,
      x: -1.5 + 3.0 * u,
      y: SKY_Y + 4.5,
      z: -1.5 + 3.0 * u,
      rx: -0.04,
      ry: 0.22,
      rz: -0.06,
      propSpin: 0.9,
    };
  }
  if (id === 7) {
    // Shot 7: "Unluckily, its own wings kept celebrating the Fourth of July."
    return {
      ...base,
      x: 0,
      y: D0 + 1.45,
      z: 0,
      ry: -0.18,
      propSpin: 0.35,
      openNacelle: true,
      flare: f >= 1076 ? smooth((f - 1076) / 8) : 0.25,
    };
  }
  if (id === 8) {
    // Shot 8: Golden-hour stratosphere silhouette with glowing overheating rear cylinders
    const u = (f - 1104) / (1210 - 1104);
    return {
      ...base,
      x: -2.2 + 4.4 * u,
      y: SKY_Y + 3.2,
      z: 0,
      rx: -0.05,
      ry: 0.32,
      rz: -0.08,
      propSpin: 0.85,
      openNacelle: true,
      flare: 0.55 + 0.35 * smooth(u),
    };
  }
  if (id === 9) {
    // Shot 9: Park soup bowl & spoon analogy
    return { ...base, visible: false };
  }
  if (id === 10) {
    // Shot 10: f < 1532 hangar mechanics bolting curved baffles; f >= 1532 high-altitude cool airflow run!
    if (f < 1532) {
      return {
        ...base,
        x: 0,
        y: D0 + 1.45,
        z: 0,
        ry: -0.16,
        propSpin: 0.15,
        openNacelle: true,
        baffle: f >= 1445,
        coolFlow: f >= 1495 ? smooth((f - 1495) / 25) * 0.45 : 0,
      };
    }
    const u = (f - 1532) / (1640 - 1532);
    return {
      ...base,
      x: -2.0 + 4.0 * u,
      y: SKY_Y + 3.5,
      z: -2.0 + 4.5 * u,
      rx: -0.04,
      ry: 0.14,
      rz: -0.05,
      propSpin: 0.95,
      openNacelle: true,
      baffle: true,
      coolFlow: 1.0,
    };
  }
  if (id === 11) {
    // Shot 11: Fleets of silver Superfortresses over the Pacific -> emergency bank toward Vladivostok
    const u = (f - 1640) / (1804 - 1640);
    const bank = f >= 1720 ? smooth((f - 1720) / 55) : 0;
    return {
      ...base,
      x: -3.0 + 6.0 * u,
      y: SKY_Y + 4.2 - 2.4 * bank,
      z: -4.0 + 8.0 * u,
      rx: -0.03 + 0.08 * bank,
      ry: 0.18 - 0.32 * bank,
      rz: -0.06 - 0.22 * bank,
      propSpin: 0.92,
      baffle: true,
      flare: bank * 0.45,
    };
  }
  // Shot 12: Soviet Tupolev Tu-4 clone parked behind the Soviet inspection terrace
  return {
    ...base,
    x: SOVIET[0] - 2.5,
    y: D0 + 1.45,
    z: SOVIET[2] + 13.5,
    ry: Math.PI - 0.32,
    propSpin: 0.25,
    variant: "soviet",
  };
};

// ---------------- Boiling Soup & Spoon Baffle State (Shot 9: 1210..1435) ----------------
export const soupAt = (f: number) => {
  const puff = f >= 1278 && f < 1372 ? Math.sin(((f - 1278) / 94) * Math.PI) : 0;
  const spoon = f >= 1364 ? smooth((f - 1364) / 22) : 0;
  const scoop = f >= 1384 ? smooth((f - 1384) / 20) : 0;
  const bowlHot = 1 - 0.72 * scoop;
  return { puff, spoon, scoop, bowlHot };
};

// ---------------- Camera Choreography (zero frozen spans >= 12f) ----------------
export type Cam = { pos: V3; look: V3; roll: number; fov: number };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Cam };

const pushK = (
  f0: number,
  f1: number,
  p0: V3,
  p1: V3,
  l0: V3,
  l1: V3,
  fov = 40,
  roll = 0
) => (f: number): Cam => {
  const u = clamp01((f - f0) / Math.max(1, f1 - f0));
  return {
    pos: [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u, p0[2] + (p1[2] - p0[2]) * u],
    look: [l0[0] + (l1[0] - l0[0]) * u, l0[1] + (l1[1] - l0[1]) * u, l0[2] + (l1[2] - l0[2]) * u],
    roll,
    fov,
  };
};

const CAMS: Record<number, Key[]> = {
  // Shot 1 (0..159): Wide apron with $3B bullion stack -> glide in to sparking nacelle #2 fireworks + engineers
  1: [
    {
      f: 0,
      s: pushK(0, 110, [-2.2, D0 + 3.0, 13.5], [-1.0, D0 + 2.6, 10.8], [0.0, D0 + 1.6, 0.8], [0.8, D0 + 1.6, 1.2], 42),
    },
    {
      f: 108,
      dur: 28,
      s: pushK(108, 159, [1.6, D0 + 2.3, 9.2], [2.0, D0 + 2.1, 7.6], [2.1, D0 + 1.6, 1.8], [2.4, D0 + 1.6, 1.9], 40),
    },
  ],
  // Shot 2 (159..362): High crane sweep -> glide down to 1943 blueprint table & nose rollout
  2: [
    {
      f: 159,
      s: pushK(159, 260, [-6.4, D0 + 5.2, 13.5], [-4.5, D0 + 3.6, 10.6], [-0.5, D0 + 1.6, -1.0], [-0.2, D0 + 1.6, 0.5], 42),
    },
    {
      f: 252,
      dur: 30,
      s: pushK(252, 362, [-2.8, D0 + 2.3, 8.8], [-1.9, D0 + 2.1, 7.2], [-1.2, D0 + 1.5, 1.2], [-0.5, D0 + 1.6, 1.6], 38),
    },
  ],
  // Shot 3 (362..564): Shivering fleece flyer on left -> elevated glide looking right over the wing root into the cutaway cabin & crawl tunnel!
  3: [
    {
      f: 362,
      s: pushK(362, 462, [-1.8, D0 + 2.6, 10.2], [-0.6, D0 + 2.5, 8.8], [-1.0, D0 + 1.7, 0.8], [0.4, D0 + 1.8, 0.5], 40),
    },
    {
      f: 455,
      dur: 28,
      s: pushK(455, 564, [1.2, D0 + 3.1, 8.6], [1.6, D0 + 2.8, 7.2], [1.1, D0 + 2.0, 0.3], [1.3, D0 + 2.0, 0.1], 38),
    },
  ],
  // Shot 4 (564..753): Medium-tight push-in on open nacelle #2 magnesium crankcase & engineers
  4: [
    {
      f: 564,
      s: pushK(564, 660, [2.0, D0 + 2.3, 9.2], [2.2, D0 + 2.1, 7.8], [2.4, D0 + 1.5, 1.8], [2.5, D0 + 1.5, 1.8], 38),
    },
    {
      f: 655,
      dur: 26,
      s: pushK(655, 753, [2.6, D0 + 2.1, 7.4], [2.5, D0 + 1.95, 6.4], [2.55, D0 + 1.55, 1.85], [2.55, D0 + 1.55, 1.95], 36),
    },
  ],
  // Shot 5 (753..929): High-altitude climb above cloud sea -> glide into blazing roadside flare on nacelle #2
  5: [
    {
      f: 753,
      s: pushK(753, 845, [-4.5, SKY_Y + 3.8, 12.2], [-2.5, SKY_Y + 3.6, 9.8], [-0.5, SKY_Y + 2.2, 0.0], [1.2, SKY_Y + 2.8, 1.5], 42),
    },
    {
      f: 838,
      dur: 24,
      s: pushK(838, 929, [3.2, SKY_Y + 3.6, 8.8], [4.5, SKY_Y + 4.2, 7.6], [2.2, SKY_Y + 3.2, 2.0], [3.5, SKY_Y + 4.0, 3.2], 38),
    },
  ],
  // Shot 6 (929..1028) & Shot 7 (1028..1104): High stratosphere wing -> glide into Fourth-of-July nacelle #2
  6: [
    {
      f: 929,
      s: pushK(929, 1028, [-5.2, SKY_Y + 6.2, 11.5], [-3.2, SKY_Y + 5.6, 9.2], [0.0, SKY_Y + 4.4, 0.0], [1.2, SKY_Y + 4.5, 1.2], 40),
    },
  ],
  7: [
    {
      f: 1028,
      s: pushK(1028, 1104, [2.1, D0 + 2.3, 8.2], [2.3, D0 + 2.15, 7.0], [2.2, D0 + 1.85, 1.9], [2.4, D0 + 2.0, 2.0], 38),
    },
  ],
  // Shot 8 (1104..1210): Golden-hour stratosphere silhouette
  8: [
    {
      f: 1104,
      s: pushK(1104, 1210, [-3.8, SKY_Y + 4.4, 10.2], [-1.8, SKY_Y + 4.0, 8.2], [0.0, SKY_Y + 3.2, 0.5], [1.5, SKY_Y + 3.2, 1.0], 38),
    },
  ],
  // Shot 9 (1210..1435): Golden-hour park soup bowl & angled spoon analogy (at PARK[2] - 3.5, clear of campfire stones!)
  9: [
    {
      f: 1210,
      s: pushK(
        1210,
        1310,
        [PARK[0] - 0.5, D0 + 2.3, PARK[2] + 3.2],
        [PARK[0] - 0.3, D0 + 2.1, PARK[2] + 2.2],
        [PARK[0] - 0.3, D0 + 1.45, PARK[2] - 3.5],
        [PARK[0] - 0.1, D0 + 1.45, PARK[2] - 3.5],
        38
      ),
    },
    {
      f: 1305,
      dur: 26,
      s: pushK(
        1305,
        1435,
        [PARK[0] - 0.1, D0 + 2.05, PARK[2] + 1.8],
        [PARK[0] + 0.05, D0 + 1.92, PARK[2] + 1.0],
        [PARK[0] - 0.1, D0 + 1.42, PARK[2] - 3.5],
        [PARK[0] + 0.05, D0 + 1.42, PARK[2] - 3.5],
        36
      ),
    },
  ],
  // Shot 10 (1435..1640): Bolting curved baffles in hangar -> cut at 1532 to high-altitude cool airflow run
  10: [
    {
      f: 1435,
      s: pushK(1435, 1532, [2.1, D0 + 2.2, 8.2], [2.3, D0 + 2.0, 6.8], [2.4, D0 + 1.55, 1.85], [2.5, D0 + 1.55, 1.95], 38),
    },
    {
      f: 1532,
      cut: true,
      s: pushK(1532, 1640, [2.8, SKY_Y + 4.4, 8.6], [4.2, SKY_Y + 4.1, 7.0], [1.2, SKY_Y + 3.5, 0.8], [2.8, SKY_Y + 3.5, 2.2], 38),
    },
  ],
  // Shot 11 (1640..1804): Three silver B-29s over the Pacific -> banking toward emergency landing
  11: [
    {
      f: 1640,
      s: pushK(1640, 1725, [-5.6, SKY_Y + 6.0, 13.5], [-3.4, SKY_Y + 5.2, 10.8], [-0.5, SKY_Y + 4.0, -1.5], [0.8, SKY_Y + 3.8, 0.5], 42),
    },
    {
      f: 1720,
      dur: 28,
      s: pushK(1720, 1804, [3.6, SKY_Y + 4.2, 9.8], [5.2, SKY_Y + 3.2, 7.8], [1.2, SKY_Y + 3.0, 1.2], [2.5, SKY_Y + 2.2, 2.8], 38),
    },
  ],
  // Shot 12 (1804..2045): Soviet terrace with Stalin/marshal + Tu-4 -> glide in to the accidental Seattle drill-hole patch stand!
  12: [
    {
      f: 1804,
      s: pushK(
        1804,
        1918,
        [SOVIET[0] - 0.4, D0 + 2.5, SOVIET[2] - 7.8],
        [SOVIET[0] - 0.1, D0 + 2.3, SOVIET[2] - 6.6],
        [SOVIET[0] + 0.2, D0 + 1.65, SOVIET[2] + 0.5],
        [SOVIET[0] + 0.4, D0 + 1.65, SOVIET[2] + 0.5],
        40
      ),
    },
    {
      f: 1912,
      dur: 28,
      s: pushK(
        1912,
        2045,
        [SOVIET[0] + 0.4, D0 + 2.15, SOVIET[2] - 6.2],
        [SOVIET[0] + 0.65, D0 + 1.98, SOVIET[2] - 5.1],
        [SOVIET[0] + 0.75, D0 + 1.55, SOVIET[2] - 0.4],
        [SOVIET[0] + 0.95, D0 + 1.52, SOVIET[2] - 0.5],
        38
      ),
    },
  ],
};

const lerpCam = (a: Cam, b: Cam, u: number): Cam => ({
  pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * u, a.pos[1] + (b.pos[1] - a.pos[1]) * u, a.pos[2] + (b.pos[2] - a.pos[2]) * u],
  look: [a.look[0] + (b.look[0] - a.look[0]) * u, a.look[1] + (b.look[1] - a.look[1]) * u, a.look[2] + (b.look[2] - a.look[2]) * u],
  roll: a.roll + (b.roll - a.roll) * u,
  fov: a.fov + (b.fov - a.fov) * u,
});

const run = (ks: Key[], f: number): Cam => {
  let cur = ks[0].s(f);
  for (let i = 1; i < ks.length; i++) {
    const k = ks[i];
    if (f < k.f) break;
    if (k.cut || !k.dur) cur = k.s(f);
    else cur = lerpCam(cur, k.s(f), glide((f - k.f) / k.dur));
  }
  return cur;
};

// 7-frame sign-flipping impact kicks (seconds, parsed by bridge_shots.py)
const KICKS: [number, number][] = [
  [T_HOOK_SPARKS, 1.15],
  [T_FLARE, 1.25],
  [T_JULY, 1.05],
  [T_BAFFLE, 0.85],
  [T_PATCH_DING, 0.95],
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

// ---------------- lens: depth of field + foreground framing ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 6 },
  { f: 108, dur: 28, cInf: 13, focus: () => [2.55, D0 + 1.55, 1.85] }, // sparking nacelle #2 CU
  { f: 159, cInf: 0 }, // 1943 rollout wide sharp
  { f: 252, dur: 30, cInf: 10, focus: () => [-1.8, D0 + 1.55, 1.6] }, // blueprint table MS
  { f: 362, cInf: 8 },
  { f: 455, dur: 28, cInf: 12, focus: () => [1.6, D0 + 1.75, 0.25] }, // cutaway crawl tunnel CU
  { f: 564, cInf: 12, focus: () => [2.55, D0 + 1.55, 1.85] }, // open magnesium nacelle CU
  { f: 753, cInf: 0 }, // high climb wide
  { f: 838, dur: 24, cInf: 11 }, // blazing roadside flare MS
  { f: 929, cInf: 0 }, // high wing wide
  { f: 1028, cInf: 14, focus: () => [2.55, D0 + 1.85, 2.0] }, // 4th of July firework nacelle CU
  { f: 1104, cInf: 5 }, // golden overheat silhouette
  { f: 1210, cInf: 11, focus: () => [PARK[0] + 0.1, D0 + 1.35, PARK[2] - 3.5] }, // soup bowl & spoon CU
  { f: 1435, cInf: 13, focus: () => [2.55, D0 + 1.55, 1.85] }, // bolting curved baffles CU
  { f: 1532, cInf: 6 }, // cool airflow flight
  { f: 1640, cInf: 0 }, // 3-plane silver Superfortress fleet sharp
  { f: 1804, cInf: 8, focus: () => [SOVIET[0] - 0.1, D0 + 1.65, SOVIET[2] - 0.2] },
  { f: 1912, dur: 28, cInf: 15, focus: () => [SOVIET[0] + 1.15, D0 + 1.52, SOVIET[2] - 0.55] }, // Seattle drill-hole patch CU!
];

export const dofAt = (f: number) => {
  let i = 0;
  while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i];
  const p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 0, b: 108, kit: "fuel_drums", pos: [-4.6, D0, 4.8], s: 0.95, yaw: 0.4 },
  { a: 252, b: 362, kit: "fuel_drums", pos: [-4.8, D0, 4.6], s: 0.95, yaw: -0.5 },
  { a: 564, b: 753, kit: "fuel_drums", pos: [4.6, D0, 3.8], s: 0.9, yaw: 0.3 },
  { a: 1210, b: 1435, kit: "plant_bushDetailed", pos: [PARK[0] - 2.4, D0, PARK[2] + 2.8], s: 1.0, yaw: 0.4 },
];
