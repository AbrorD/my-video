// 2D flat cartoon cast & effects in the 3D Mustang world: characters are yaw-only billboards shaded by cardShade()
// with ground contact blobs; effects are unlit cards. All cards, effects and blobs live on the NOINK layer so InkPass
// never outlines quad borders.
import * as THREE from "three";
import {
  Pen,
  bodyFront,
  bodySide,
  ENGINEER,
  MECHANIC,
  GENERAL,
  GENERAL_NOHAT,
  HARKER,
  CAMPER,
  GORING,
  fxNote,
  fxBurst,
  fxPuff,
  fxStars,
  fxCreak,
  fxShadow,
  fxContact,
  fxCow,
  fxFlyingHat,
  fxSmokeCough,
  fxSparrow,
  fxBellows,
  fxFireRoar,
  fxBinoculars,
  Outfit,
  Expr,
  FrontOpts,
  SideOpts,
} from "./toon";
import {
  FPS,
  D0,
  PASTURE,
  PARK,
  BERLIN,
  SHOTS,
  T_FLYBY,
  T_HATS,
  T_DROP_ENG,
  T_BERLIN_PASS,
  heroMustang,
  campfireAt,
  smooth,
  clamp01,
} from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };

const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { cv, tex, w, h };
};

export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) {
      const l = want.get(r.key);
      if (l) l.push(r);
      else want.set(r.key, [r]);
    }
    for (const [key, e] of this.live) {
      if (!want.has(key)) {
        this.live.delete(key);
        this.free.push(e);
      }
    }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0];
        const i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  return new THREE.CanvasTexture(c);
})();
export const SU = 0.00216; // 1000 design units = 2.16 m
const BODY = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();
export const COW_GEO = (() => {
  const s = 0.00235;
  const g = new THREE.PlaneGeometry(640 * s, 480 * s);
  g.translate(0, (456 - 240) * s, 0);
  return g;
})();
const CARD = new THREE.PlaneGeometry(1, 1);
const ROOTS = new Set<THREE.Object3D>();

export class Actor {
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  dmat: THREE.MeshDepthMaterial;
  r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => {
      const rt = r.getRenderTarget();
      CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920;
    };
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ";
    this.mesh.renderOrder = 1;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  setGeo(geo: THREE.BufferGeometry) {
    if (this.mesh.geometry !== geo) this.mesh.geometry = geo;
  }
  bind() {
    const t = this.r?.tex;
    if (t) {
      this.mat.map = t;
      this.dmat.map = t;
    }
  }
}

export class Fx {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  soft: THREE.MeshBasicMaterial;
  blob: THREE.MeshBasicMaterial;
  r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) {
    this.mesh.material = soft ? this.soft : this.mat;
  }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) {
        t.generateMipmaps = false;
        t.minFilter = THREE.LinearFilter;
        t.needsUpdate = true;
      }
      this.blob.map = t;
      this.mesh.material = this.blob;
      this.mesh.renderOrder = 0.5;
    } else {
      this.mat.map = t;
      this.soft.map = t;
      this.mesh.renderOrder = 0;
    }
  }
}

export type Place = {
  key: string;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  scale?: number;
  mirror?: boolean;
  yaw?: number;
  geo?: "body" | "cow";
  roll?: number;
  size?: [number, number, number];
};

export type FxPlace = {
  key: string;
  cw: number;
  ch: number;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  flat?: boolean;
  rot?: number;
  soft?: boolean;
};

export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const q = (v: number, n = 60) => Math.round(v * n) / n;
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";

const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => {
    if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o;
  });
  return s as THREE.DirectionalLight | null;
};

const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null;
  let err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos);
    const e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) {
      err = e;
      best = s;
    }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};

const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1);
  const sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) {
    const k = f - Math.round(ts * FPS) + 1;
    if (k >= 0 && k < 4) return LID[k];
  }
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
): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror;
  const light = light2D(cam, mirror);
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

const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => {
  const c = clamp01(v);
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};
const hexOf = (c: [number, number, number], k: number) =>
  "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");

const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1;
  const ox = -SUN.x / hl;
  const oz = -SUN.z / hl;
  const rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
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
  const cc = hexOf(CONTACT[LNAME], k);
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

const addCow = (out: Stage, idx: number, x: number, y: number, z: number, t: number, startled = false, mirror = false) => {
  const chew = q((t * 0.9 + idx * 0.33) % 1, 24);
  out.places.push({
    key: `cow|${chew}|${startled ? 1 : 0}`,
    geo: "cow",
    x,
    y,
    z,
    mirror,
    scale: 1.05,
    size: [1280, 960, 2.0],
    draw: (p) => fxCow(p, chew, startled),
  });
  blob(out, x, y, z, 1.35, 0.95);
};

/** Sputtering dark exhaust puffs behind a coughing Allison Mustang */
const addCoughFx = (out: Stage, id: number, f: number) => {
  const m = heroMustang(id, f);
  if (!m || !m.cough || m.cough < 0.05) return;
  const t = f / FPS;
  for (let k = 0; k < 5; k++) {
    const age = ((t * 2.6 + k * 0.2) % 1);
    const side = k % 2 ? 0.88 : 0.65;
    const sz = (0.72 + 1.05 * age) * m.cough;
    out.fx.push({
      key: `cough|${q(age, 20)}`,
      cw: 360,
      ch: 360,
      draw: (p) => fxSmokeCough(p, q(age, 20)),
      x: m.pos[0] + side + 0.15 * Math.sin(age * 6 + k),
      y: m.pos[1] + 0.26 + age * 0.52,
      z: m.pos[2] + 1.8 - age * 4.2,
      w: sz,
      h: sz,
      rot: age * 1.4 * (k % 2 ? 1 : -1),
    });
  }
  const u = q((t * 1.8) % 1, 24);
  out.fx.push({
    key: `creak|${u}`,
    cw: 300,
    ch: 300,
    draw: (p) => fxCreak(p, u),
    x: m.pos[0] + 0.35,
    y: m.pos[1] + 1.15,
    z: m.pos[2] + 2.4,
    w: 0.9 * m.cough,
    h: 0.9 * m.cough,
  });
};

export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  const t = f / FPS;
  LNAME = s.light;
  findSun(cam, SUN);

  // Exhaust cough puffs whenever the Allison V-1710 struggles at altitude
  addCoughFx(out, id, f);

  // ---- Shot 1: Hook — French pasture cows + recon camera flash ("taking pictures of cows") ----
  if (id === 1) {
    const flashOn = f >= 74 && f < 82;
    const startled = f >= 74 && f < 98;
    addCow(out, 1, PASTURE[0] + 2.2, D0, PASTURE[2] + 3.5, t, startled, true);
    addCow(out, 2, PASTURE[0] + 3.8, D0, PASTURE[2] - 1.2, t, false, false);
    addCow(out, 3, PASTURE[0] + 4.6, D0, PASTURE[2] + 8.6, t, startled, true);
    if (flashOn) {
      const m = heroMustang(1, f)!;
      const u = (f - 74) / 8;
      out.fx.push({
        key: `flash|${q(u, 20)}`,
        cw: 500,
        ch: 500,
        draw: (p) => fxBurst(p, q(u, 20), "#ffffff", 12, 55, 240),
        x: m.pos[0] + 0.7,
        y: m.pos[1] + 0.85,
        z: m.pos[2] - 0.65,
        w: 1.5,
        h: 1.5,
      });
    }
  }

  // ---- Shot 2: 1940 California rollout in 102 days (engineers + mechanic around blueprint table & nose) ----
  if (id === 2) {
    const cheer = f >= 275;
    out.places.push(
      person(cam, { i: 11, o: ENGINEER, okey: "eng1" }, 3.8, D0, 1.9, { side: false, mirror: false }, {
        mode: "stand",
        expr: cheer ? "grin" : "smile",
        prop: "clipboard",
        blink: lidAt(t, 11),
        facing: -1,
      }),
      person(cam, { i: 12, o: ENGINEER, okey: "eng2" }, 2.3, D0, 1.4, { side: false, mirror: false }, {
        mode: "stand",
        expr: cheer ? "laugh" : "grin",
        prop: ["point", q(smooth((f - 220) / 18), 20)],
        blink: lidAt(t, 12),
        facing: -1,
      }),
      person(cam, { i: 13, o: MECHANIC, okey: "mech1" }, -4.3, D0, 1.5, { side: false, mirror: false }, {
        mode: "stand",
        expr: "grin",
        prop: "wrench",
        wave: cheer ? q(Math.sin(t * 8), 20) : undefined,
        blink: lidAt(t, 13),
        facing: 1,
      })
    );
    blob(out, 3.8, D0, 1.9);
    blob(out, 2.3, D0, 1.4);
    blob(out, -4.3, D0, 1.5);
  }

  // ---- Shot 3: Low pass blows every general's hat into the bushes! ----
  if (id === 3) {
    const hatsOff = t >= T_HATS - 0.04;
    const blast = t >= T_FLYBY;
    const gens: [number, number, number][] = [
      [4.75, D0, 6.1],
      [5.95, D0, 6.85],
      [7.15, D0, 7.6],
    ];
    gens.forEach(([gx, gy, gz], idx) => {
      const o = hatsOff ? GENERAL_NOHAT : GENERAL;
      const expr: Expr = hatsOff ? "shock" : blast ? "nervous" : "stern";
      const tilt = hatsOff ? -12 + 4 * Math.sin(t * 14 + idx) : blast ? -5 : 0;
      out.places.push(
        person(cam, { i: 21 + idx, o, okey: hatsOff ? `gnh${idx}` : `gh${idx}` }, gx, gy, gz, { side: false, mirror: false }, {
          mode: "stand",
          expr,
          tilt: q(tilt, 10),
          blink: lidAt(t, 21 + idx, [T_FLYBY, T_HATS]),
          facing: -1,
        })
      );
      blob(out, gx, gy, gz, 1.1);

      // Flying officer caps arcing straight into the runway bushes at x = 8.9!
      if (hatsOff) {
        const dt = Math.min(1.15, t - (T_HATS - 0.04) - idx * 0.05);
        if (dt >= 0) {
          const u = clamp01(dt / 0.72);
          const hx = gx + (8.95 - gx) * u;
          const hy = gy + 1.92 + Math.sin(u * Math.PI) * 0.95 - u * 0.92;
          const hz = gz + (idx - 1) * 0.35 * u;
          out.fx.push({
            key: "flyhat",
            cw: 260,
            ch: 200,
            draw: (p) => fxFlyingHat(p),
            x: hx,
            y: hy,
            z: hz,
            w: 0.48,
            h: 0.37,
            rot: u < 1 ? dt * 11 * (idx % 2 ? 1 : -1) : 0.45,
          });
          if (u > 0.82 && dt < 1.05) {
            const pu = clamp01((dt - 0.58) / 0.45);
            out.fx.push({
              key: `bushpuff|${q(pu, 16)}`,
              cw: 300,
              ch: 300,
              draw: (p) => fxPuff(p, q(pu, 16)),
              x: 8.85,
              y: D0 + 0.95,
              z: hz,
              w: 0.95,
              h: 0.95,
              soft: true,
            });
          }
        }
      }
    });
  }

  // ---- Shot 5 (f >= 700): Muddy French road recon + spotted cows ----
  if (id === 5 && f >= 700) {
    const flashOn = f >= 792 && f < 800;
    addCow(out, 4, PASTURE[0] + 1.6, D0, PASTURE[2] + 5.2, t, f >= 792 && f < 816, true);
    addCow(out, 5, PASTURE[0] + 3.5, D0, PASTURE[2] + 1.4, t, false, false);
    if (flashOn) {
      const m = heroMustang(5, f)!;
      const u = (f - 792) / 8;
      out.fx.push({
        key: `flash|${q(u, 20)}`,
        cw: 500,
        ch: 500,
        draw: (p) => fxBurst(p, q(u, 20), "#ffffff", 12, 55, 240),
        x: m.pos[0] + 0.7,
        y: m.pos[1] + 0.85,
        z: m.pos[2] - 0.65,
        w: 1.45,
        h: 1.45,
      });
    }
  }

  // ---- Shot 7: "Unluckily, it had the lungs of a sparrow" — tiny sparrow in open nose! ----
  if (id === 7) {
    const blink = f >= 926 && f < 930;
    const hop = f >= 936 && f < 946 ? Math.sin(((f - 936) / 10) * Math.PI) : 0;
    out.fx.push({
      key: `sparrow|${blink ? 1 : 0}|${q(hop, 16)}`,
      cw: 320,
      ch: 320,
      draw: (p) => fxSparrow(p, blink, q(hop, 16)),
      x: 0.62,
      y: D0 + 2.79,
      z: 2.40,
      w: 0.62,
      h: 0.62,
    });
    if (f >= 935) {
      const age = clamp01((f - 935) / 18);
      out.fx.push({
        key: "note0",
        cw: 220,
        ch: 260,
        draw: (p) => fxNote(p, 0, "#241726"),
        x: 0.88 + age * 0.14,
        y: D0 + 3.12 + age * 0.25,
        z: 2.44,
        w: 0.21,
        h: 0.24,
        rot: 0.2 * Math.sin(age * 8),
      });
    }
  }

  // ---- Shot 8: April 1942 RAF Duxford — Ronnie Harker & Merlin V12 drop! ----
  if (id === 8) {
    const pointing = smooth((f - 1092) / 14);
    const dropped = t >= T_DROP_ENG;
    const hExpr: Expr = dropped ? "laugh" : f >= 1112 ? "grin" : "stern";
    out.places.push(
      person(cam, { i: 41, o: HARKER, okey: "harker" }, -1.1, D0, 0.4, { side: false, mirror: false }, {
        mode: "stand",
        expr: hExpr,
        prop: pointing > 0.02 ? ["point", q(pointing, 20)] : null,
        blink: lidAt(t, 41),
        facing: -1,
      }),
      person(cam, { i: 42, o: MECHANIC, okey: "mech2" }, -5.3, D0, 0.3, { side: false, mirror: false }, {
        mode: "stand",
        expr: dropped ? "grin" : "neutral",
        prop: "wrench",
        wave: dropped ? q(Math.sin(t * 9), 20) : undefined,
        blink: lidAt(t, 42),
        facing: 1,
      })
    );
    blob(out, -1.1, D0, 0.4, 1.05);
    blob(out, -5.3, D0, 0.3, 1.0);

    if (t >= T_DROP_ENG && t < T_DROP_ENG + 0.35) {
      const u = (t - T_DROP_ENG) / 0.35;
      out.fx.push({
        key: `merlinhit|${q(u, 20)}`,
        cw: 500,
        ch: 500,
        draw: (p) => fxBurst(p, q(u, 20), "#ffe794", 12, 45, 235),
        x: -3.0,
        y: D0 + 1.72,
        z: 0.65,
        w: 1.65,
        h: 1.65,
      });
    }
  }

  // ---- Shot 10: Golden-hour campfire & bellows analogy ----
  if (id === 10) {
    const cf = campfireAt(f);
    const cExpr: Expr = cf.roar > 0.4 ? "laugh" : cf.squeeze > 0.3 ? "grin" : "smile";
    out.places.push(
      person(cam, { i: 55, o: CAMPER, okey: "camper" }, PARK[0] + 1.38, D0, PARK[2] + 0.15, { side: false, mirror: false }, {
        mode: "sit",
        expr: cExpr,
        tilt: q(6 + 8 * cf.squeeze, 15),
        blink: lidAt(t, 55),
        facing: 1,
      })
    );
    blob(out, PARK[0] + 1.38, D0, PARK[2] + 0.15, 1.15);

    // Bellows aimed screen-right toward the hearth at PARK[0] + 0.1
    out.fx.push({
      key: `bellows|${q(cf.squeeze, 24)}`,
      cw: 420,
      ch: 280,
      draw: (p) => fxBellows(p, q(cf.squeeze, 24)),
      x: PARK[0] + 0.78,
      y: D0 + 0.48,
      z: PARK[2] - 0.08,
      w: 0.78,
      h: 0.52,
      rot: -0.18 + 0.08 * cf.squeeze,
    });

    // Campfire flame + smoke -> roaring golden blaze!
    out.fx.push({
      key: `fire|${q(t % 1, 24)}|${q(cf.roar, 24)}|${q(cf.smoke, 16)}`,
      cw: 520,
      ch: 640,
      draw: (p) => fxFireRoar(p, q(t % 1, 24), q(cf.roar, 24), q(cf.smoke, 16)),
      x: PARK[0] + 0.1,
      y: D0 + 0.72 + 0.25 * cf.roar,
      z: PARK[2] - 0.04,
      w: 1.05 + 0.35 * cf.roar,
      h: 1.3 + 0.55 * cf.roar,
    });
  }

  // ---- Shot 13: Berlin Ministry Terrace — Göring drops binoculars -> cow recon photo payoff! ----
  if (id === 13) {
    const shocked = t >= T_BERLIN_PASS - 0.05;
    const gx = BERLIN[0] - 0.55;
    out.places.push(
      person(cam, { i: 88, o: GORING, okey: "goring" }, gx, D0, BERLIN[2] - 0.2, { side: false, mirror: false }, {
        mode: "stand",
        expr: shocked ? "shock" : "stern",
        prop: shocked ? null : "binoculars",
        tilt: shocked ? -6 : 0,
        blink: lidAt(t, 88, [T_BERLIN_PASS]),
        facing: 1,
      })
    );
    blob(out, gx, D0, BERLIN[2] - 0.2, 1.18);

    if (shocked) {
      const dt = Math.max(0, t - (T_BERLIN_PASS - 0.05));
      const fallT = Math.min(dt, 0.54);
      const by = Math.max(D0 + 0.14, D0 + 1.48 - 4.5 * fallT * fallT);
      out.fx.push({
        key: "binoc",
        cw: 220,
        ch: 180,
        draw: fxBinoculars,
        x: gx + 0.3 + fallT * 0.25,
        y: by,
        z: BERLIN[2] - 0.45,
        w: 0.36,
        h: 0.3,
        rot: fallT * 8.5,
      });
      if (dt > 0.75) {
        const u = q((t * 0.9) % 1, 24);
        out.fx.push({
          key: `stars|${u}`,
          cw: 420,
          ch: 210,
          draw: (p) => fxStars(p, u),
          x: gx,
          y: D0 + 2.28,
          z: BERLIN[2] - 0.2,
          w: 0.78,
          h: 0.39,
        });
      }
    }
  }

  return out;
};

export { FPS };
