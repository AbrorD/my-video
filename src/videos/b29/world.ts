// Complete 3D + 2D Boeing B-29 Superfortress world ("B29Short"):
// Reuses the calibrated 5-stop sky, camera-relative two-tone sun, town/airfield builder, and 2D character rig
// from ../mustang/, adding the B-29 Superfortress, cutaway pressurized crawl-tunnel, magnesium nacelle flare,
// 4th-of-July rocket, golden-hour boiling soup & angled spoon analogy, curved baffle fix, and Soviet Tu-4 drill-hole patch!
import * as THREE from "three";
import { Batch, boxGeo, V, lam, buildTown, house, Kit, Ray, kitClone } from "../mustang/build";
import { ctex, stoneHD, grassHD, cloudHD } from "../mustang/paint";
import {
  Pen,
  INK,
  bodyFront,
  bodySide,
  ENGINEER,
  MECHANIC,
  GENERAL,
  HARKER,
  CAMPER,
  GORING,
  fxBurst,
  fxPuff,
  fxStars,
  fxShadow,
  fxContact,
  fxSmokeCough,
  fxFireRoar,
  Outfit,
  FrontOpts,
  SideOpts,
} from "../mustang/toon";
import { LIGHTS, LOOK, LightPreset } from "../mustang/lights";
import { TONE, CHAR, twoTone, untone } from "../mustang/shade";
import { NOINK } from "../mustang/ink";
import { Pool, Actor, Fx, CamInfo, Stage } from "../mustang/cast";
import {
  FPS,
  D0,
  SKY_Y,
  SHOTS,
  PARK,
  SOVIET,
  camAt,
  heroB29,
  soupAt,
  B29Pose,
  smooth,
  clamp01,
  FOREGROUND,
  ShotDef,
} from "./story";
import { createB29, createWingPatchStand, makeProceduralKit, B29Rig } from "./b29_craft";

let kitVal: Kit | null = null;
export const getKit = (): Kit => {
  if (!kitVal) kitVal = makeProceduralKit();
  return kitVal;
};

const discTex = () =>
  ctex("b29_sunDisc", 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });

const haloTex = () =>
  ctex("b29_sunHalo", 256, 256, (g) => {
    const im = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const u = Math.hypot(x - 127.5, y - 127.5) / 128;
        const a =
          (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) *
          (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
        const i = (y * 256 + x) * 4;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = 255;
        im.data[i + 3] = Math.round(255 * Math.min(1, a));
      }
    }
    g.putImageData(im, 0, 0);
  });

/** Clean top-down 4-engine Boeing B-29 Superfortress blueprint (zero text!) */
const b29BlueprintTex = () =>
  ctex("b29_blueprintHD", 512, 360, (g) => {
    g.fillStyle = "#1f4e8c";
    g.fillRect(0, 0, 512, 360);
    g.strokeStyle = "rgba(255,255,255,0.22)";
    g.lineWidth = 2;
    for (let x = 32; x < 512; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 360);
      g.stroke();
    }
    for (let y = 32; y < 360; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }
    g.strokeStyle = "#f2f6ff";
    g.lineWidth = 5;
    g.strokeRect(18, 18, 476, 324);
    // Long B-29 fuselage + high-aspect-ratio wings + 4 nacelles
    g.beginPath();
    g.roundRect(240, 38, 32, 284, 16);
    g.moveTo(28, 152);
    g.lineTo(484, 152);
    g.lineTo(484, 188);
    g.lineTo(28, 188);
    g.closePath();
    g.moveTo(176, 294);
    g.lineTo(336, 294);
    g.lineTo(336, 314);
    g.lineTo(176, 314);
    g.closePath();
    g.stroke();
    for (const nx of [95, 168, 344, 417]) {
      g.beginPath();
      g.roundRect(nx - 14, 124, 28, 72, 8);
      g.stroke();
    }
  });

/** Custom 2D canvas prop: Festive 4th of July Red-White-Blue Firework Rocket (260 x 340 canvas, Shot 7) */
const fxJulyRocket = (p: Pen) => {
  // Stick
  p.line([[130, 210], [130, 320]], "#b88448", 12);
  // Rocket body
  p.poly([[94, 100], [166, 100], [166, 224], [94, 224]], "#f7f4ec", 10);
  p.poly([[94, 100], [166, 100], [166, 144], [94, 144]], "#234088", 8);
  p.poly([[94, 168], [166, 168], [166, 192], [94, 192]], "#d62e2e", 8);
  // Nose cone
  p.poly([[82, 102], [178, 102], [130, 28]], "#d62e2e", 10);
  p.dot(114, 122, 6, "#ffffff");
  p.dot(146, 122, 6, "#ffffff");
};

/** Custom 2D canvas prop: Steaming Bowl of Boiling Soup (340 x 240 canvas, Shot 9) */
const fxSoupBowl = (p: Pen) => {
  // Red ceramic bowl + golden soup surface
  p.ell(170, 142, 112, 58, "#c8382e", 11, 0, 180);
  p.poly([[116, 192], [224, 192], [216, 214], [124, 214]], "#9e261e", 9);
  p.ell(170, 140, 112, 26, "#f2a224", 10);
  p.ell(170, 140, 88, 16, "#ffd24c", 0);
};

/** Custom 2D canvas prop: Gleaming Silver Spoon Baffle (320 x 240 canvas, Shot 9) */
const fxSpoonBaffle = (p: Pen) => {
  p.line([[45, 48], [185, 132]], "#d8e2ee", 18);
  p.ell(215, 152, 54, 30, "#eaf2fc", 10, 0, 360, 28);
  p.ell(212, 154, 36, 18, "#aec2da", 0, 0, 360, 28);
};

/** Custom 2D canvas prop: Breeze / Airflow Stream Ribbon (340 x 160 canvas, Shot 9) */
const fxAirRibbon = (p: Pen, col: string) => {
  p.line([[35, 62], [120, 46], [215, 78], [305, 62]], col, 12);
  p.line([[55, 104], [145, 88], [235, 118], [315, 102]], col, 10);
};

const SUN_SHOT: Record<number, { az?: number; el?: number }> = {
  2: { az: -55, el: 34 },
  8: { az: -125, el: 9 },
  9: { az: 8, el: 8 },
};

const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) {
    for (let f = s.a - 8; f < s.b + 8; f += 3) {
      const c = camAt(s.id, Math.max(0, f));
      const o = V(...c.pos);
      const look = V(...c.look);
      const fw = look.clone().sub(o);
      const len = fw.length();
      fw.normalize();
      const rt = fw.clone().cross(V(0, 1, 0)).normalize();
      const up = rt.clone().cross(fw);
      const ty = Math.tan((c.fov * Math.PI) / 360);
      const tx = ty * (9 / 16);
      for (const [sx, sy] of [
        [0, 0],
        [-0.6, 0],
        [0.6, 0],
        [0, 0.6],
        [0, -0.4],
      ]) {
        out.push({
          o,
          d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty),
          len,
          core: sx === 0 && sy === 0,
        });
      }
    }
  }
  return out;
};

function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, dy = 0) {
  const y = D0 + dy;
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3)
  );
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}

const applyB29Pose = (rig: B29Rig, p: B29Pose, f: number) => {
  rig.root.visible = p.visible;
  if (!p.visible) return;
  rig.root.position.set(p.x, p.y, p.z);
  rig.root.rotation.order = "YXZ";
  rig.root.rotation.set(p.rx, p.ry, p.rz);
  rig.root.scale.setScalar(p.scale);

  for (let i = 0; i < 4; i++) {
    rig.props[i].rotation.z = f * p.propSpin + i * 0.78;
    rig.discs[i].visible = p.propSpin > 0.2;
  }

  const gear = rig.root.getObjectByName("landingGear");
  if (gear) gear.visible = p.y < D0 + 2.4;

  rig.cutawayTunnel.visible = p.cutawayTunnel;
  if (p.cutawayTunnel) {
    const scootU = clamp01((f - 455) / 90);
    rig.tunnelCrew.position.set(0.88, 0.68 + Math.sin(f * 0.45) * 0.03, 1.45 - 2.75 * scootU);
  }

  rig.closedCowl2.visible = !p.openNacelle;
  rig.openNacelle.visible = p.openNacelle || p.flare > 0.05;
  rig.baffleGroup.visible = p.baffle;
  if (p.baffle && f >= 1435 && f < 1532) {
    const boltU = clamp01((f - 1448) / 28);
    rig.baffleGroup.position.set(2.55, 0.08 + (1 - boltU) * 0.45, 1.75 + (1 - boltU) * 0.55);
  } else {
    rig.baffleGroup.position.set(2.55, 0.08, 1.75);
  }

  if (p.flare > 0.01) {
    rig.rearCylMat.color.setRGB(0.6 + 1.8 * p.flare, 0.45 + 0.35 * p.flare, 0.25);
  } else if (p.coolFlow > 0.01) {
    rig.rearCylMat.color.setRGB(0.42, 0.85 + 0.35 * p.coolFlow, 1.25 + 0.4 * p.coolFlow);
  } else {
    rig.rearCylMat.color.setRGB(0.55, 0.58, 0.64);
  }

  rig.flareCone.visible = p.flare > 0.02;
  rig.flareMat.opacity = p.flare * (0.76 + 0.22 * Math.sin(f * 0.95));
  rig.flareCone.scale.set(1 + 0.14 * Math.sin(f * 0.7), 1 + 0.14 * Math.cos(f * 0.8), 0.85 + 0.35 * p.flare);

  rig.coolCone.visible = p.coolFlow > 0.02;
  rig.coolMat.opacity = p.coolFlow * (0.68 + 0.18 * Math.sin(f * 0.75));
  rig.coolCone.scale.set(1 + 0.08 * Math.sin(f * 0.6), 1, 0.85 + 0.25 * p.coolFlow);
};

// ---------------- 2D Cast Helpers ----------------
const hh = (i: number, s = 0) => {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const q = (v: number, n = 60) => Math.round(v * n) / n;
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number) => {
  const f = Math.round(t * FPS);
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};

const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
type Who = { i: number; o: Outfit; okey: string };
const tmp = new THREE.Vector3();

const person = (
  cam: CamInfo,
  who: Who,
  x: number,
  y: number,
  z: number,
  view: { side: boolean; mirror: boolean },
  fo: FrontOpts,
  so: SideOpts = {},
  scale = 1
): Stage["places"][number] => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror;
  const sun = cam.sun ?? new THREE.Vector3(0.5, 0.75, -0.4).normalize();
  const sx = sun.dot(cam.right) * (mirror ? -1 : 1);
  const sy = -sun.y;
  const light = Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
  const seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed };
  const s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key,
    x,
    y,
    z,
    scale,
    mirror,
    geo: "body",
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

const CONTACT: Record<"day" | "golden", [number, number, number]> = {
  day: [0.2, 0.21, 0.33],
  golden: [0.24, 0.2, 0.33],
};
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => {
  const c = clamp01(v);
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};
const hexOf = (c: [number, number, number], k: number) =>
  "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");

const blob = (out: Stage, lightName: "day" | "golden", sun: THREE.Vector3, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(sun.x, sun.z) || 1;
  const ox = -sun.x / hl;
  const oz = -sun.z / hl;
  const rot = Math.atan2(-ox, -oz);
  if (lightName === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, sun.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc;
    const h = len + 0.55 * sc;
    const c = 0.3 * h;
    const tc = hexOf(TAIL, k);
    out.fx.push({
      key: `blob|shadow|${tc}`,
      cw: 128,
      ch: 256,
      draw: (p) => fxShadow(p, tc),
      x: x + ox * c,
      y: y + 0.02,
      z: z + oz * c,
      w: 0.72 * sc,
      h,
      flat: true,
      rot,
    });
  }
  const cc = hexOf(CONTACT[lightName], k);
  out.fx.push({
    key: `blob|contact|${cc}`,
    cw: 128,
    ch: 128,
    draw: (p) => fxContact(p, cc),
    x: x + ox * 0.03 * sc,
    y: y + 0.024,
    z: z + oz * 0.03 * sc,
    w: 0.56 * sc,
    h: 0.44 * sc,
    flat: true,
    rot,
  });
};

const FLEECE_CREW: Outfit = {
  jacket: "#6b859e",
  pants: "#4c6278",
  boots: INK,
  hat: "flight_helm",
  cap: "#4a5d70",
  skin: "#cde4f7",
};

const STALIN_MARSHAL: Outfit = {
  ...GORING,
  moustache: "#2c221e",
};

const stageB29 = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  const t = f / FPS;
  const sun = cam.sun ?? new THREE.Vector3(0.5, 0.75, -0.4).normalize();
  const pose = heroB29(id, f);

  // Magnesium flare smoke & fire billows whenever nacelle #2 is burning
  if (pose.visible && pose.flare > 0.08) {
    for (let k = 0; k < 4; k++) {
      const age = (t * 2.8 + k * 0.25) % 1;
      const sz = (0.85 + 1.25 * age) * pose.flare;
      out.fx.push({
        key: `b29smoke|${q(age, 18)}`,
        cw: 360,
        ch: 360,
        draw: (p) => fxSmokeCough(p, q(age, 18)),
        x: pose.x + 2.55 + 0.15 * Math.sin(age * 6 + k),
        y: pose.y + 0.25 + age * 0.55,
        z: pose.z + 1.4 - age * 4.4,
        w: sz,
        h: sz,
        rot: age * 1.4 * (k % 2 ? 1 : -1),
      });
    }
    const fu = q((t * 3.2) % 1, 16);
    out.fx.push({
      key: `b29roar|${fu}|${q(pose.flare, 12)}`,
      cw: 520,
      ch: 640,
      draw: (p) => fxFireRoar(p, fu, q(pose.flare, 12), 0.2),
      x: pose.x + 2.55,
      y: pose.y + 0.35,
      z: pose.z + 2.15,
      w: 1.35 * pose.flare,
      h: 1.55 * pose.flare,
    });
  }

  // ---- Shot 1: $3 Billion Bullion Stack + Nacelle #2 Fireworks Hook ----
  if (id === 1) {
    const boom = f >= 136;
    out.places.push(
      person(cam, { i: 11, o: ENGINEER, okey: "eng1" }, -1.85, D0, 2.35, { side: false, mirror: false }, {
        mode: "stand",
        expr: boom ? "shock" : "grin",
        prop: "clipboard",
        tilt: boom ? -10 : 0,
        blink: lidAt(t, 11),
        facing: 1,
      }),
      person(cam, { i: 12, o: MECHANIC, okey: "mech1" }, 1.35, D0, 2.65, { side: false, mirror: false }, {
        mode: "stand",
        expr: boom ? "shock" : "smile",
        prop: "wrench",
        tilt: boom ? -12 : 0,
        blink: lidAt(t, 12),
        facing: 1,
      })
    );
    blob(out, s.light, sun, -1.85, D0, 2.35);
    blob(out, s.light, sun, 1.35, D0, 2.65);

    if (f >= 138) {
      const u = clamp01((f - 138) / 18);
      out.fx.push(
        {
          key: `fwburst|${q(u, 16)}`,
          cw: 500,
          ch: 500,
          draw: (p) => fxBurst(p, q(u, 16), "#ffcf48", 14, 60, 235),
          x: 3.15,
          y: D0 + 1.85,
          z: 2.35,
          w: 2.1,
          h: 2.1,
        },
        {
          key: `fwstars|${q(u, 16)}`,
          cw: 420,
          ch: 420,
          draw: (p) => fxStars(p, q(u, 16)),
          x: 3.15,
          y: D0 + 2.25,
          z: 2.45,
          w: 1.95,
          h: 1.95,
        }
      );
    }
  }

  // ---- Shot 2: 1943 Boeing B-29 Rollout & Blueprint Table ----
  if (id === 2) {
    const cheer = f >= 215;
    out.places.push(
      person(cam, { i: 14, o: ENGINEER, okey: "engA" }, -3.85, D0, 1.95, { side: false, mirror: false }, {
        mode: "stand",
        expr: cheer ? "laugh" : "grin",
        prop: "clipboard",
        blink: lidAt(t, 14),
        facing: 1,
      }),
      person(cam, { i: 15, o: HARKER, okey: "engB" }, -1.85, D0, 2.15, { side: false, mirror: false }, {
        mode: "stand",
        expr: "grin",
        prop: ["point", q(smooth((f - 200) / 20), 20)],
        blink: lidAt(t, 15),
        facing: 1,
      }),
      person(cam, { i: 16, o: MECHANIC, okey: "mechB" }, 2.15, D0, 2.35, { side: false, mirror: false }, {
        mode: "stand",
        expr: "grin",
        prop: "wrench",
        wave: cheer ? q(Math.sin(t * 8), 16) : undefined,
        blink: lidAt(t, 16),
        facing: -1,
      })
    );
    blob(out, s.light, sun, -3.85, D0, 1.95);
    blob(out, s.light, sun, -1.85, D0, 2.15);
    blob(out, s.light, sun, 2.15, D0, 2.35);
  }

  // ---- Shot 3: Shivering Fleece Flyer vs Warm B-29 Pressurized Cabin & Tunnel ----
  if (id === 3) {
    const shiver = q(Math.sin(t * 24) * 8, 10);
    out.places.push(
      person(cam, { i: 21, o: FLEECE_CREW, okey: "fleece" }, -2.15, D0, 1.85, { side: false, mirror: false }, {
        mode: "stand",
        expr: "nervous",
        tilt: shiver,
        blink: lidAt(t, 21),
        facing: 1,
      }),
      person(cam, { i: 22, o: GENERAL, okey: "warmcrew" }, 0.35, D0, 2.15, { side: false, mirror: false }, {
        mode: "stand",
        expr: "laugh",
        wave: q(Math.sin(t * 7), 16),
        blink: lidAt(t, 22),
        facing: 1,
      })
    );
    blob(out, s.light, sun, -2.15, D0, 1.85);
    blob(out, s.light, sun, 0.35, D0, 2.15);

    // Chilly frost puff over shivering fleece flyer
    const pu = q((t * 1.5) % 1, 16);
    out.fx.push({
      key: `frostpuff|${pu}`,
      cw: 300,
      ch: 300,
      draw: (p) => fxPuff(p, pu),
      x: -2.15,
      y: D0 + 2.25,
      z: 2.05,
      w: 0.85,
      h: 0.85,
      soft: true,
    });
  }

  // ---- Shot 4: Crammed Cowlings & Lightweight Magnesium Block ----
  if (id === 4) {
    out.places.push(
      person(cam, { i: 31, o: ENGINEER, okey: "magEng" }, 1.25, D0, 2.35, { side: false, mirror: false }, {
        mode: "stand",
        expr: f > 670 ? "nervous" : "stern",
        prop: ["point", q(smooth((f - 585) / 22), 20)],
        blink: lidAt(t, 31),
        facing: 1,
      }),
      person(cam, { i: 32, o: MECHANIC, okey: "magMech" }, 3.75, D0, 2.25, { side: false, mirror: false }, {
        mode: "stand",
        expr: "nervous",
        prop: "wrench",
        blink: lidAt(t, 32),
        facing: -1,
      })
    );
    blob(out, s.light, sun, 1.25, D0, 2.35);
    blob(out, s.light, sun, 3.75, D0, 2.25);
  }

  // ---- Shot 7: "Unluckily, its own wings kept celebrating the Fourth of July" ----
  if (id === 7) {
    const launch = clamp01((f - 1072) / 18);
    out.places.push(
      person(cam, { i: 41, o: GENERAL, okey: "julyPilot" }, 1.15, D0, 2.35, { side: false, mirror: false }, {
        mode: "stand",
        expr: f >= 1076 ? "shock" : "nervous",
        tilt: f >= 1076 ? -12 : 0,
        blink: lidAt(t, 41),
        facing: 1,
      })
    );
    blob(out, s.light, sun, 1.15, D0, 2.35);

    out.fx.push({
      key: "julyRocket",
      cw: 260,
      ch: 340,
      draw: (p) => fxJulyRocket(p),
      x: 2.55,
      y: D0 + 2.05 + launch * 1.15,
      z: 2.15,
      w: 0.78,
      h: 1.02,
      rot: 0.08 * Math.sin(t * 18),
    });

    if (f >= 1076) {
      const u = clamp01((f - 1076) / 22);
      out.fx.push(
        {
          key: `julyburst|${q(u, 16)}`,
          cw: 500,
          ch: 500,
          draw: (p) => fxBurst(p, q(u, 16), "#ff4848", 14, 55, 240),
          x: 2.55,
          y: D0 + 2.85,
          z: 2.25,
          w: 2.25,
          h: 2.25,
        },
        {
          key: `julystars|${q(u, 16)}`,
          cw: 420,
          ch: 420,
          draw: (p) => fxStars(p, q(u, 16)),
          x: 2.55,
          y: D0 + 3.05,
          z: 2.35,
          w: 2.05,
          h: 2.05,
        }
      );
    }
  }

  // ---- Shot 9: Golden-Hour Park Boiling Soup & Angled Spoon Analogy (`PARK`) ----
  if (id === 9) {
    const sp = soupAt(f);
    const sz = PARK[2] - 3.5;
    out.places.push(
      person(cam, { i: 51, o: CAMPER, okey: "souper" }, PARK[0] - 0.58, D0, sz - 0.15, { side: false, mirror: false }, {
        mode: "sit",
        expr: sp.spoon > 0.5 ? "grin" : "shock",
        tilt: 8,
        blink: lidAt(t, 51),
        facing: 1,
      })
    );
    blob(out, s.light, sun, PARK[0] - 0.58, D0, sz - 0.15);

    // Steaming red ceramic soup bowl on the wooden park table
    out.fx.push({
      key: "soupBowl",
      cw: 340,
      ch: 240,
      draw: (p) => fxSoupBowl(p),
      x: PARK[0] + 0.15,
      y: D0 + 1.24,
      z: sz,
      w: 0.92,
      h: 0.65,
    });

    // Flat white breeze skimming right across the top of the bowl
    if (sp.puff > 0.05) {
      const slide = ((f - 1278) % 24) / 24;
      out.fx.push({
        key: "flatRibbon",
        cw: 340,
        ch: 160,
        draw: (p) => fxAirRibbon(p, "#f5f8ff"),
        x: PARK[0] - 0.15 + slide * 0.65,
        y: D0 + 1.58,
        z: sz + 0.04,
        w: 0.95,
        h: 0.45,
      });
    }

    // Angled silver spoon lowering to scoop the breeze straight down inside!
    if (sp.spoon > 0.05) {
      out.fx.push({
        key: "spoonBaffle",
        cw: 320,
        ch: 240,
        draw: (p) => fxSpoonBaffle(p),
        x: PARK[0] + 0.32,
        y: D0 + 1.85 - sp.spoon * 0.28,
        z: sz + 0.06,
        w: 0.95,
        h: 0.72,
        rot: -0.45 * sp.spoon,
      });
    }
    if (sp.scoop > 0.05) {
      const dive = ((f - 1384) % 20) / 20;
      out.fx.push({
        key: "scoopRibbon",
        cw: 340,
        ch: 160,
        draw: (p) => fxAirRibbon(p, "#52d4ff"),
        x: PARK[0] + 0.16,
        y: D0 + 1.55 - dive * 0.25,
        z: sz + 0.1,
        w: 0.88,
        h: 0.42,
        rot: -0.78,
      });
    }
  }

  // ---- Shot 10 (f < 1532): Mechanics bolting curved metal baffles into nacelle #2 ----
  if (id === 10 && f < 1532) {
    out.places.push(
      person(cam, { i: 61, o: MECHANIC, okey: "baffleMech" }, 1.35, D0, 2.35, { side: false, mirror: false }, {
        mode: "stand",
        expr: "grin",
        prop: "wrench",
        wave: q(Math.sin(t * 9), 16),
        blink: lidAt(t, 61),
        facing: 1,
      }),
      person(cam, { i: 62, o: ENGINEER, okey: "baffleEng" }, 3.65, D0, 2.25, { side: false, mirror: false }, {
        mode: "stand",
        expr: "laugh",
        prop: "clipboard",
        blink: lidAt(t, 62),
        facing: -1,
      })
    );
    blob(out, s.light, sun, 1.35, D0, 2.35);
    blob(out, s.light, sun, 3.65, D0, 2.25);

    if (f >= 1450 && f < 1495) {
      const u = clamp01((f - 1450) / 45);
      out.fx.push({
        key: `bafflestars|${q(u, 16)}`,
        cw: 420,
        ch: 420,
        draw: (p) => fxStars(p, q(u, 16)),
        x: 2.55,
        y: D0 + 1.85,
        z: 2.35,
        w: 1.55,
        h: 1.55,
      });
    }
  }

  // ---- Shot 12: Stalin's Bolt-for-Bolt Tu-4 Clone & The Accidental Seattle Drill-Hole Patch (`SOVIET`) ----
  if (id === 12) {
    const patched = f >= 1936;
    out.places.push(
      person(cam, { i: 71, o: STALIN_MARSHAL, okey: "marshal" }, SOVIET[0] - 0.25, D0, SOVIET[2] - 0.25, { side: false, mirror: false }, {
        mode: "stand",
        expr: patched ? "grin" : "stern",
        prop: ["point", q(smooth((f - 1835) / 22), 20)],
        blink: lidAt(t, 71),
        facing: 1,
      }),
      person(cam, { i: 72, o: ENGINEER, okey: "sovEng" }, SOVIET[0] + 1.85, D0, SOVIET[2] - 0.35, { side: false, mirror: false }, {
        mode: "stand",
        expr: patched ? "shock" : "nervous",
        prop: "clipboard",
        blink: lidAt(t, 72),
        facing: -1,
      })
    );
    blob(out, s.light, sun, SOVIET[0] - 0.25, D0, SOVIET[2] - 0.25);
    blob(out, s.light, sun, SOVIET[0] + 1.85, D0, SOVIET[2] - 0.35);

    if (f >= 1936 && f < 1985) {
      const u = clamp01((f - 1936) / 49);
      out.fx.push({
        key: `patchstars|${q(u, 16)}`,
        cw: 420,
        ch: 420,
        draw: (p) => fxStars(p, q(u, 16)),
        x: SOVIET[0] + 1.55,
        y: D0 + 1.75,
        z: SOVIET[2] - 0.65,
        w: 1.45,
        h: 1.45,
      });
    }
  }

  return out;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite;
  private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private cloudDeck = new THREE.Group();
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];

  private heroUS: B29Rig;
  private heroSoviet: B29Rig;
  private wingmen: B29Rig[] = [];
  private moneySet = new THREE.Group();
  private blueprintSet = new THREE.Group();
  private soupTableSet = new THREE.Group();
  private bowlHotMat: THREE.MeshBasicMaterial;
  private sovietSet = new THREE.Group();
  private patchGroup: THREE.Group;

  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();
  private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;

    // ---- 1. Sky + Sun + Horizon Clouds ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        c0: { value: new THREE.Color() },
        c1: { value: new THREE.Color() },
        c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() },
        c4: { value: new THREE.Color() },
        e: { value: new THREE.Vector4() },
      },
      vertexShader:
        "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1;
    this.sky.frustumCulled = false;
    this.sky.layers.set(NOINK);
    R.add(this.sky);

    this.sunDisc = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false })
    );
    this.sunHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haloTex(),
        color: new THREE.Color(1, 1, 1),
        fog: false,
        depthWrite: false,
        depthTest: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
      })
    );
    this.sunDisc.renderOrder = -0.5;
    this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) {
      m.frustumCulled = false;
      m.layers.set(NOINK);
      R.add(m);
    }

    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);

    this.cloudMaps = {
      day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)),
      golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)),
    };
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.25;
      const d = 610 + (i % 3) * 60;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: this.cloudMaps.day[i % 4],
          color: new THREE.Color(1.08, 1.08, 1.08),
          transparent: true,
          depthWrite: false,
          fog: false,
        })
      );
      const w = 135 + (i % 4) * 32;
      m.position.set(Math.cos(a) * d, 115 + (i % 4) * 34, Math.sin(a) * d);
      m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m);
      R.add(m);
    }

    // ---- 2. Continuous Grass Ground + Town / Airfield / Park ----
    const gb = new Batch();
    const grassM = lam("grassHD", () => ({ map: grassHD() }));
    gb.add(quadUp(-900, 900, -900, 900, 450, 450), grassM);
    gb.build(R, false);
    buildTown(R, kit, sightLines());

    // ---- 3. High-Altitude Cloud Sea Deck (y ~ SKY_Y - 14 = 94 m for Shots 5, 6, 8, 10b, 11) ----
    const cloudDeckFloor = new THREE.Mesh(
      new THREE.CircleGeometry(520, 32),
      twoTone(new THREE.MeshLambertMaterial({ color: "#eef4fc" }))
    );
    cloudDeckFloor.rotation.x = -Math.PI / 2;
    cloudDeckFloor.position.set(0, SKY_Y - 18, 0);
    cloudDeckFloor.layers.set(NOINK);
    this.cloudDeck.add(cloudDeckFloor);

    const puffGeo = new THREE.SphereGeometry(1, 14, 10);
    const puffMat = twoTone(new THREE.MeshLambertMaterial({ color: "#f7fafe" }));
    for (let i = 0; i < 64; i++) {
      const rx = (((Math.sin(i * 73.1) * 43758.5453) % 1) + 1) % 1;
      const rz = (((Math.sin(i * 191.7) * 43758.5453) % 1) + 1) % 1;
      const rr = (((Math.sin(i * 31.3) * 43758.5453) % 1) + 1) % 1;
      const px = (rx - 0.5) * 260;
      const pz = (rz - 0.5) * 280;
      const rad = 11 + rr * 18;
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.set(px, SKY_Y - 17 + rr * 3.5, pz);
      puff.scale.set(rad * 1.4, rad * 0.52, rad * 1.15);
      puff.layers.set(NOINK);
      this.cloudDeck.add(puff);
    }
    R.add(this.cloudDeck);

    // ---- 4. B-29 Aircraft Fleet (Hero US, Hero Soviet Tu-4, and 2 Pacific Wingmen) ----
    this.heroUS = createB29("us");
    this.heroSoviet = createB29("soviet");
    R.add(this.heroUS.root, this.heroSoviet.root);

    for (let i = 0; i < 2; i++) {
      const w = createB29("us");
      w.root.scale.setScalar(0.65);
      this.wingmen.push(w);
      R.add(w.root);
    }

    // ---- 5. Shot 1: $3 Billion Treasury Bullion Stack ----
    for (const [cx, cy, cz, col] of [
      [-3.2, D0 + 0.42, 1.6, "#486840"],
      [-2.25, D0 + 0.42, 1.75, "#486840"],
      [-2.72, D0 + 1.15, 1.68, "#dfb43c"],
      [-2.72, D0 + 1.72, 1.68, "#f2cb4c"],
    ] as const) {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.72, 0.82),
        twoTone(new THREE.MeshLambertMaterial({ color: col }))
      );
      crate.position.set(cx, cy, cz);
      crate.castShadow = true;
      this.moneySet.add(crate);
    }
    R.add(this.moneySet);

    // ---- 6. Shot 2: 1943 Boeing B-29 Blueprint Table Set ----
    const woodM = twoTone(new THREE.MeshLambertMaterial({ color: "#8a5a38" }));
    const tblTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 1.35), woodM);
    tblTop.position.set(-2.85, D0 + 0.94, 1.85);
    tblTop.rotation.x = 0.14;
    tblTop.castShadow = true;
    const bpSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(1.88, 1.18),
      new THREE.MeshBasicMaterial({ map: b29BlueprintTex(), color: 0xededed })
    );
    bpSheet.rotation.x = -Math.PI / 2 + 0.14;
    bpSheet.position.set(-2.85, D0 + 0.99, 1.86);
    bpSheet.layers.set(NOINK);
    this.blueprintSet.add(tblTop, bpSheet);
    for (const [lx, lz] of [
      [-3.75, 1.3],
      [-1.95, 1.3],
      [-3.75, 2.4],
      [-1.95, 2.4],
    ] as const) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.94, 0.09), woodM);
      leg.position.set(lx, D0 + 0.47, lz);
      leg.castShadow = true;
      this.blueprintSet.add(leg);
    }
    R.add(this.blueprintSet);

    // ---- 7. Shot 9: Golden-Hour Park Soup Table (`PARK[2] - 3.5`, clear of campfire ring) ----
    const sz = PARK[2] - 3.5;
    const pTblTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 1.3), woodM);
    pTblTop.position.set(PARK[0] + 0.15, D0 + 0.96, sz);
    pTblTop.castShadow = true;
    this.soupTableSet.add(pTblTop);
    for (const s of [-0.85, 0.85]) {
      const pLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.96, 0.95), woodM);
      pLeg.position.set(PARK[0] + 0.15 + s, D0 + 0.48, sz);
      pLeg.castShadow = true;
      this.soupTableSet.add(pLeg);
    }
    this.bowlHotMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(2.4, 0.78, 0.22),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const bowlHotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), this.bowlHotMat);
    bowlHotMesh.scale.set(1.3, 0.55, 1.0);
    bowlHotMesh.position.set(PARK[0] + 0.15, D0 + 1.15, sz + 0.02);
    bowlHotMesh.layers.set(NOINK);
    this.soupTableSet.add(bowlHotMesh);
    R.add(this.soupTableSet);

    // ---- 8. Shot 12: Soviet Stone Terrace + Seattle Drill-Hole Wing Patch Stand (`SOVIET`) ----
    const stoneM = lam("sovietStone", () => ({
      map: stoneHD("sovietStoneHD", ["#d6cec0", "#cbc2b3", "#dfd8ca", "#c2b9aa"], "#968d7e"),
    }));
    const bb = new Batch();
    const bz = SOVIET[2];
    bb.add(boxGeo(V(-6.5, D0 - 0.1, bz - 6.0), V(6.5, D0 + 0.04, bz + 1.4), 2), stoneM);
    bb.add(boxGeo(V(-6.5, D0 + 0.68, bz + 1.15), V(6.5, D0 + 0.78, bz + 1.42), 2), stoneM);
    for (let x = -6.0; x <= 6.0; x += 0.55) {
      bb.add(boxGeo(V(x - 0.07, D0 + 0.16, bz + 1.22), V(x + 0.07, D0 + 0.68, bz + 1.36)), stoneM);
    }
    for (const cx of [-4.4, 4.4]) {
      bb.add(new THREE.CylinderGeometry(0.36, 0.4, 5.2, 14).translate(cx, D0 + 2.6, bz + 1.1), stoneM);
    }
    const plazaM = lam("sovietPlaza", () => ({
      map: stoneHD("sovietPlazaHD", ["#b7b2aa", "#aba69e", "#c2bdb5", "#a39e96"], "#7e7972"),
    }));
    bb.add(boxGeo(V(-28, D0 - 0.08, bz + 1.4), V(28, D0 + 0.01, bz + 34), 4), plazaM);
    for (const [bx, bzz, bw, bh, si] of [
      [-14, bz + 22, 10, 8.4, 0],
      [0, bz + 26, 14, 9.8, 7],
      [14, bz + 22, 10, 8.4, 6],
    ] as const) {
      house(bb, bx, bzz, Math.PI, bw, 8, bh, si);
    }
    bb.build(this.sovietSet);

    const { stand: patchStand, patchGroup } = createWingPatchStand();
    this.patchGroup = patchGroup;
    patchStand.scale.setScalar(0.68);
    patchStand.position.set(0.85, D0, bz - 0.55);
    patchStand.rotation.y = Math.PI - 0.15;
    this.sovietSet.add(patchStand);
    this.sovietSet.position.set(SOVIET[0], 0, 0);
    R.add(this.sovietSet);

    // ---- 9. Foreground Framing Props ----
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos);
      o.rotation.y = fg.yaw ?? 0;
      o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b });
      R.add(o);
    }
  }

  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0;
    let fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f);
      const x = c.look[0] - c.pos[0];
      const z = c.look[2] - c.pos[2];
      const n = Math.hypot(x, z) || 1;
      fx += x / n;
      fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1;
    fx /= n;
    fz /= n;
    const az = THREE.MathUtils.degToRad(SUN_SHOT[id]?.az ?? L.az);
    const el = THREE.MathUtils.degToRad(SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az);
    const hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) {
    while (this.actors.length <= i) this.actors.push(new Actor(this.root));
    return this.actors[i];
  }
  private fx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new Fx(this.root));
    return this.fxs[i];
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1];
    const L = LIGHTS[s.light];

    // ---- Camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...c.look);
    cam.rotateZ(c.roll);
    cam.fov = c.fov;
    cam.near = 0.2;
    cam.far = 1500;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    const focus = V(...c.look);
    const dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);

    // ---- Two-Tone Sun + Shadow Fit ----
    const K = LOOK[s.light];
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky);
    this.hemi.groundColor.set(L.ground);
    this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol);
    this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.2 + 8, 14, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 32);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220);
    this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr;
    sc.right = Rr;
    sc.top = Rr;
    sc.bottom = -Rr;
    sc.near = 20;
    sc.far = 480;
    sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias;
    this.sun.shadow.normalBias = L.normalBias * (Rr / 12);

    TONE.uLitCol.value.set(...L.lit);
    TONE.uShadeCol.value.set(...L.shade);
    TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert;
    TONE.uSideK.value = L.sideK;
    TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce);
    TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint);
    CHAR.uCharShade.value = L.charShade;
    CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad;
    CHAR.uSideTint.value.set(...L.sideTint);

    // ---- Sky, Fog, Sun Disc & Horizon Clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear;
    this.fog.far = L.fogFar;
    scene.fog = this.fog;
    scene.background = null;

    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position);
      this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }

    const highSky = cam.position.y > D0 + 35;
    this.cloudDeck.visible = highSky;
    if (highSky) {
      this.cloudDeck.position.set(cam.position.x, 0, cam.position.z);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i];
      const mat = m.material as THREE.MeshBasicMaterial;
      m.position.y = (highSky ? SKY_Y + 28 : 115) + (i % 4) * 28;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }

    // ---- Foreground Props & Shot-Specific Sets ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    this.moneySet.visible = id === 1;
    this.blueprintSet.visible = id === 2;
    this.soupTableSet.visible = id === 9;
    if (id === 9) {
      const sp = soupAt(f);
      this.bowlHotMat.opacity = sp.bowlHot * (0.65 + 0.2 * Math.sin(f * 0.5));
    }
    this.sovietSet.visible = id === 12;
    if (id === 12) {
      const patchSlide = clamp01((f - 1930) / 16);
      this.patchGroup.visible = f >= 1850;
      this.patchGroup.position.set(0.05 + (1 - patchSlide) * 0.75, 1.35 + (1 - patchSlide) * 0.45, 0.20);
    }

    // ---- Hero B-29 Pose ----
    this.heroUS.root.visible = false;
    this.heroSoviet.root.visible = false;
    const bp = heroB29(id, f);
    applyB29Pose(bp.variant === "soviet" ? this.heroSoviet : this.heroUS, bp, f);

    // ---- Shot 11: Pacific Superfortress Wingmen ----
    const showFleet = id === 11;
    this.wingmen.forEach((w, i) => {
      w.root.visible = false;
      if (!showFleet) return;
      applyB29Pose(
        w,
        {
          ...bp,
          scale: 0.62,
          x: bp.x + (i === 0 ? -9.5 : 8.8),
          y: bp.y + (i === 0 ? 1.8 : -1.2),
          z: bp.z - 8.5 - i * 5.5,
          flare: 0,
        },
        f
      );
    });

    // ---- 2D Cast + Effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stageB29(id, f, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));

    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 0.9 * sc2, p.z), 3.6))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;

    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(Math.abs(p.w), Math.abs(p.h)))))
        continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else {
        e.mesh.quaternion.copy(cam.quaternion);
        e.mesh.rotateZ(p.rot ?? 0);
      }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;

    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();

    return focus;
  }
}
