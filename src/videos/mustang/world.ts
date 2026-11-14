// Complete 3D P-51 Mustang world: 5-stop sky, camera-relative two-tone sun, airfield & arched hangar, muddy French
// pasture, golden-hour campfire clearing, high-altitude cloud sea, Allison & Merlin Mustangs, Bf 109s, B-17 bombers,
// Merlin V12 hoist, Berlin terrace + framed cow recon photo, and 2D flat cartoon cast.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, buildTown, house, Kit, Ray, kitClone } from "./build";
import { ctex, stoneHD, grassHD, cloudHD } from "./paint";
import { Pen, fxCowPhoto } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage, COW_GEO } from "./cast";
import {
  FPS,
  D0,
  SKY_Y,
  SHOTS,
  BERLIN,
  camAt,
  heroMustang,
  PlanePose,
  V3,
  smooth,
  FOREGROUND,
  ShotDef,
} from "./story";
import {
  createMustang,
  createBf109,
  createB17,
  createMerlinHoist,
  makeProceduralKit,
  MustangRig,
} from "./aircraft";

let kitVal: Kit | null = null;
export const getKit = (): Kit => {
  if (!kitVal) kitVal = makeProceduralKit();
  return kitVal;
};

let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) kitP = Promise.resolve(getKit());
  return kitP;
};

const discTex = () =>
  ctex("sunDisc", 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });

const haloTex = () =>
  ctex("sunHalo", 256, 256, (g) => {
    const im = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const u = Math.hypot(x - 127.5, y - 127.5) / 128;
        const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
        const i = (y * 256 + x) * 4;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = 255;
        im.data[i + 3] = Math.round(255 * Math.min(1, a));
      }
    }
    g.putImageData(im, 0, 0);
  });

const blueprintTex = () =>
  ctex("blueprintHD", 512, 360, (g) => {
    g.fillStyle = "#224e8a";
    g.fillRect(0, 0, 512, 360);
    g.strokeStyle = "rgba(255,255,255,0.22)";
    g.lineWidth = 2;
    for (let x = 32; x < 512; x += 32) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 360); g.stroke();
    }
    for (let y = 32; y < 360; y += 32) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke();
    }
    g.strokeStyle = "#f2f6ff";
    g.lineWidth = 6;
    g.strokeRect(18, 18, 476, 324);
    // Clean top-down silhouette of Mustang laminar wings + fuselage (zero text!)
    g.beginPath();
    g.moveTo(256, 56);
    g.lineTo(274, 140);
    g.lineTo(446, 162);
    g.lineTo(446, 196);
    g.lineTo(272, 212);
    g.lineTo(266, 286);
    g.lineTo(328, 296);
    g.lineTo(328, 314);
    g.lineTo(184, 314);
    g.lineTo(184, 296);
    g.lineTo(246, 286);
    g.lineTo(240, 212);
    g.lineTo(66, 196);
    g.lineTo(66, 162);
    g.lineTo(238, 140);
    g.closePath();
    g.stroke();
  });

const SUN_SHOT: Record<number, { az?: number; el?: number }> = {
  2: { az: -55, el: 34 },
  9: { az: -125, el: 9 },
  10: { az: 8, el: 7 },
  11: { az: -115, el: 12 },
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
      for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]]) {
        out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
      }
    }
  }
  return out;
};

function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, dy = 0) {
  const y = D0 + dy;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}

const applyMustangPose = (rig: MustangRig, p: PlanePose) => {
  rig.root.visible = true;
  rig.root.position.set(...p.pos);
  rig.root.rotation.order = "YXZ";
  rig.root.rotation.set(p.pitch, p.yaw, p.roll);
  rig.prop.rotation.z = p.propSpin;
  rig.disc.visible = Math.abs(p.propSpin) > 0.6;
  rig.reconCam.visible = !!p.reconCam;
  rig.cowling.visible = !p.openNose;
  rig.exposedEngine.visible = !!p.openNose;
  rig.dropTanks.visible = !!p.dropTanks;
  const jg = p.jetGlow ?? 0;
  rig.jetCone.visible = jg > 0.02;
  rig.jetMat.opacity = jg * 0.82;
  rig.jetCone.scale.set(1, 1, 0.8 + 0.45 * jg);
  const gear = rig.root.getObjectByName("landingGear");
  if (gear) gear.visible = p.pos[1] < D0 + 2.25;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private cowActors: Actor[] = [];
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
  private deckPuffs: THREE.Mesh[] = [];
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];

  private mustangAllison: MustangRig;
  private mustangMerlin: MustangRig;
  private wingmen: MustangRig[] = [];
  private bf109s: THREE.Group[] = [];
  private bombers: THREE.Group[] = [];
  private merlinHoist: { wrap: THREE.Group; engine: THREE.Group };
  private blueprintSet = new THREE.Group();
  private berlinSet = new THREE.Group();

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
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
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

    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
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
        new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.08, 1.08, 1.08), transparent: true, depthWrite: false, fog: false })
      );
      const w = 135 + (i % 4) * 32;
      m.position.set(Math.cos(a) * d, 115 + (i % 4) * 34, Math.sin(a) * d);
      m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m);
      R.add(m);
    }

    // ---- 2. Continuous Grass Ground + Town / Airfield / Pasture / Campfire ----
    const gb = new Batch();
    const grassM = lam("grassHD", () => ({ map: grassHD() }));
    gb.add(quadUp(-900, 900, -900, 900, 450, 450), grassM);
    gb.build(R, false);
    buildTown(R, kit, sightLines());

    // ---- 3. High-Altitude Cloud Sea Deck (y ~ SKY_Y - 14 = 94 m for Shots 4, 5a, 9, 11, 12) ----
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
      const rx = ((Math.sin(i * 73.1) * 43758.5453) % 1 + 1) % 1;
      const rz = ((Math.sin(i * 191.7) * 43758.5453) % 1 + 1) % 1;
      const rr = ((Math.sin(i * 31.3) * 43758.5453) % 1 + 1) % 1;
      const px = (rx - 0.5) * 260;
      const pz = (rz - 0.5) * 280;
      const rad = 11 + rr * 18;
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.set(px, SKY_Y - 17 + rr * 3.5, pz);
      puff.scale.set(rad * 1.4, rad * 0.52, rad * 1.15);
      puff.layers.set(NOINK);
      this.cloudDeck.add(puff);
      this.deckPuffs.push(puff);
    }
    R.add(this.cloudDeck);

    // ---- 4. Aircraft Fleet + Rolls-Royce Merlin Hoist ----
    this.mustangAllison = createMustang("allison");
    this.mustangMerlin = createMustang("merlin");
    R.add(this.mustangAllison.root, this.mustangMerlin.root);

    for (let i = 0; i < 2; i++) {
      const w = createMustang("merlin");
      this.wingmen.push(w);
      R.add(w.root);
    }
    for (let i = 0; i < 2; i++) {
      const bf = createBf109();
      this.bf109s.push(bf);
      R.add(bf);
    }
    for (let i = 0; i < 3; i++) {
      const b17 = createB17();
      this.bombers.push(b17);
      R.add(b17);
    }

    this.merlinHoist = createMerlinHoist();
    this.merlinHoist.wrap.position.set(-3.05, D0, 0.42);
    this.merlinHoist.wrap.rotation.y = 0.18 + Math.PI / 2;
    R.add(this.merlinHoist.wrap);

    // ---- 5. Shot 2 Blueprint Table Set ----
    const woodM = twoTone(new THREE.MeshLambertMaterial({ color: "#8a5a38" }));
    const tblTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.25), woodM);
    tblTop.position.set(3.05, D0 + 0.94, 2.2);
    tblTop.rotation.x = 0.14;
    tblTop.castShadow = true;
    const bpSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(1.68, 1.08),
      new THREE.MeshBasicMaterial({ map: blueprintTex(), color: 0xededed })
    );
    bpSheet.rotation.x = -Math.PI / 2 + 0.14;
    bpSheet.position.set(3.05, D0 + 0.99, 2.21);
    bpSheet.layers.set(NOINK);
    this.blueprintSet.add(tblTop, bpSheet);
    for (const [lx, lz] of [[2.25, 1.7], [3.85, 1.7], [2.25, 2.7], [3.85, 2.7]] as const) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.94, 0.09), woodM);
      leg.position.set(lx, D0 + 0.47, lz);
      leg.castShadow = true;
      this.blueprintSet.add(leg);
    }
    R.add(this.blueprintSet);

    // ---- 6. Shot 13 Berlin Stone Terrace + Framed B&W Cow Recon Photo ----
    const stoneM = lam("berlinStone", () => ({ map: stoneHD("berlinStoneHD", ["#d6cec0", "#cbc2b3", "#dfd8ca", "#c2b9aa"], "#968d7e") }));
    const walnutM = twoTone(new THREE.MeshLambertMaterial({ color: "#5c3a24" }));
    const bb = new Batch();
    const bz = BERLIN[2];
    // Stone terrace floor & low classical balustrade (0.78 m tall -> crosses legs only, never torsos!)
    bb.add(boxGeo(V(-6.5, D0 - 0.1, bz - 6.0), V(6.5, D0 + 0.04, bz + 1.4), 2), stoneM);
    bb.add(boxGeo(V(-6.5, D0 + 0.68, bz + 1.15), V(6.5, D0 + 0.78, bz + 1.42), 2), stoneM);
    bb.add(boxGeo(V(-6.5, D0 + 0.04, bz + 1.18), V(6.5, D0 + 0.16, bz + 1.39), 2), stoneM);
    for (let x = -6.0; x <= 6.0; x += 0.55) {
      bb.add(boxGeo(V(x - 0.07, D0 + 0.16, bz + 1.22), V(x + 0.07, D0 + 0.68, bz + 1.36)), stoneM);
    }
    // Framing neoclassical stone columns on outer edges
    for (const cx of [-4.4, 4.4]) {
      bb.add(new THREE.CylinderGeometry(0.36, 0.4, 5.2, 14).translate(cx, D0 + 2.6, bz + 1.1), stoneM);
      bb.add(boxGeo(V(cx - 0.52, D0 + 0.04, bz + 0.58), V(cx + 0.52, D0 + 0.45, bz + 1.62)), stoneM);
    }
    // Carved walnut side table at [1.65, D0, bz - 0.45] holding the framed cow recon photo
    bb.add(boxGeo(V(1.05, D0 + 1.14, bz - 0.88), V(2.25, D0 + 1.22, bz - 0.05)), walnutM);
    for (const [lx, lz] of [[1.14, bz - 0.8], [2.16, bz - 0.8], [1.14, bz - 0.12], [2.16, bz - 0.12]] as const) {
      bb.add(boxGeo(V(lx - 0.05, D0 + 0.04, lz - 0.05), V(lx + 0.05, D0 + 1.14, lz + 0.05)), walnutM);
    }
    // Distant Berlin stone plaza + neoclassical ministry wings & copper civic dome across z = bz+2..bz+30
    const plazaM = lam("berlinPlaza", () => ({ map: stoneHD("berlinPlazaHD", ["#b7b2aa", "#aba69e", "#c2bdb5", "#a39e96"], "#7e7972") }));
    bb.add(boxGeo(V(-28, D0 - 0.08, bz + 1.4), V(28, D0 + 0.01, bz + 34), 4), plazaM);
    const domeCopper = twoTone(new THREE.MeshLambertMaterial({ color: "#5e8f80" }));
    for (const [bx, bzz, bw, bh, si] of [
      [-14, bz + 22, 10, 8.4, 0],
      [0, bz + 26, 14, 9.8, 7],
      [14, bz + 22, 10, 8.4, 6],
    ] as const) {
      house(bb, bx, bzz, Math.PI, bw, 8, bh, si);
    }
    // Central neoclassical portico + copper dome crowning the central ministry building
    bb.add(boxGeo(V(-3.6, D0 + 9.8, bz + 23), V(3.6, D0 + 13.4, bz + 29), 2), stoneM);
    bb.add(new THREE.SphereGeometry(3.4, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, D0 + 13.4, bz + 26), domeCopper);
    bb.build(this.berlinSet);

    // Unlit framed B&W cow recon photo on the table facing the S13c lens (-z)!
    const photoFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.65),
      new THREE.MeshBasicMaterial({ map: ctex("cowPhoto", 700, 540, (g) => fxCowPhoto(new Pen(g))), color: 0xeaeaea })
    );
    photoFace.layers.set(NOINK);
    photoFace.position.set(1.65, D0 + 1.54, bz - 0.51);
    photoFace.rotation.y = Math.PI - 0.08;
    const photoBack = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.67, 0.045), walnutM);
    photoBack.position.set(1.65, D0 + 1.54, bz - 0.48);
    photoBack.rotation.y = -0.08;
    photoBack.castShadow = true;
    this.berlinSet.add(photoFace, photoBack);
    this.berlinSet.position.set(BERLIN[0], 0, 0);
    R.add(this.berlinSet);

    // ---- 7. Foreground Framing Props ----
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
  private cowActor(i: number) {
    while (this.cowActors.length <= i) this.cowActors.push(new Actor(this.root, COW_GEO));
    return this.cowActors[i];
  }
  private fx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new Fx(this.root));
    return this.fxs[i];
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS;
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
    this.blueprintSet.visible = id === 2;
    this.berlinSet.visible = id === 13;

    // ---- Hero Mustang Pose ----
    this.mustangAllison.root.visible = false;
    this.mustangMerlin.root.visible = false;
    const mp = heroMustang(id, f);
    if (mp) {
      applyMustangPose(mp.variant === "merlin" ? this.mustangMerlin : this.mustangAllison, mp);
    }

    // ---- Twin German Bf 109s (Shot 5, f < 700: waving effortlessly overhead!) ----
    const showBf = id === 5 && f < 700;
    this.bf109s.forEach((bf, i) => {
      bf.visible = showBf;
      if (showBf) {
        const u = (f - 638) / 62;
        bf.position.set(2.4 + i * 3.8, SKY_Y + 2.2 + i * 1.1, -14 + u * 28 - i * 4.2);
        bf.rotation.order = "YXZ";
        bf.rotation.set(-0.02, -0.05, 0.34 * Math.sin(t * 7.5 + i)); // playful wing-waggle wave!
      }
    });

    // ---- Rolls-Royce Merlin 61 Hoist (Shot 8: lowers into open nose at f=1169!) ----
    this.merlinHoist.wrap.visible = id === 8;
    if (id === 8) {
      const dropU = smooth((f - 1138) / 31);
      this.merlinHoist.engine.visible = f < 1172;
      this.merlinHoist.engine.position.set(0, 2.75 - dropU * 1.18, 0);
    }

    // ---- B-17 Bomber Escort Formation (Shot 12) + Victory Wingmen (Shots 12 & 13) ----
    const showBombers = id === 12;
    const b17Offsets: V3[] = [
      [-5.5, SKY_Y + 0.6, 0],
      [-14.5, SKY_Y - 1.8, -12],
      [7.5, SKY_Y + 1.8, -16],
    ];
    this.bombers.forEach((b17, i) => {
      b17.visible = showBombers;
      if (showBombers && mp) {
        const off = b17Offsets[i];
        b17.position.set(off[0], off[1] + 0.12 * Math.sin(t * 1.6 + i), mp.pos[2] * 0.62 + off[2]);
        b17.rotation.set(0, 0, 0.03 * Math.sin(t * 1.3 + i));
      }
    });

    const showWingmen = id === 12 || id === 13;
    this.wingmen.forEach((w, i) => {
      w.root.visible = false;
      if (!showWingmen || !mp) return;
      if (id === 12) {
        applyMustangPose(w, {
          ...mp,
          pos: [mp.pos[0] + (i === 0 ? -9.5 : 8.2), mp.pos[1] + (i === 0 ? 1.8 : -1.4), mp.pos[2] - 7.5 - i * 5.5],
          roll: mp.roll * 0.8,
        });
      } else {
        applyMustangPose(w, {
          ...mp,
          pos: [
            mp.pos[0] - (i + 1) * 5.8,
            mp.pos[1] + (i === 0 ? 1.6 : 2.8),
            mp.pos[2] + (i === 0 ? 3.2 : -2.6),
          ],
        });
      }
    });

    // ---- 2D Cast + Effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));

    let ai = 0;
    let ci = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 0.9 * sc2, p.z), 3.6))) continue;
      const a = p.geo === "cow" ? this.cowActor(ci++) : this.actor(ai++);
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
    for (let i = ci; i < this.cowActors.length; i++) this.cowActors[i].mesh.visible = false;

    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(Math.abs(p.w), Math.abs(p.h))))) continue;
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
