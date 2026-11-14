// Procedural 3D aircraft, Rolls-Royce Merlin V12 hoist, airfield structures, and procedural nature/prop kit
// built with twoTone() materials so InkPass outlines every fuselage, laminar wing, belly scoop, canopy, and tree!
import * as THREE from "three";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { ctex } from "./paint";
import { Kit } from "./build";

const mat = (hex: string, shine = 0) =>
  shine > 0
    ? twoTone(new THREE.MeshPhongMaterial({ color: hex, specular: "#b8c0cc", shininess: shine }), 0.16)
    : twoTone(new THREE.MeshLambertMaterial({ color: hex }));

/** USAAF star-and-bar roundel texture (uncluttered, crisp ink rim) */
const roundelUS = () =>
  ctex("roundelUS", 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = "#223a6b";
    g.strokeStyle = "#181520";
    g.lineWidth = 10;
    g.fillRect(12, 96, 232, 64);
    g.strokeRect(12, 96, 232, 64);
    g.beginPath();
    g.arc(128, 128, 76, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#f5f2e8";
    g.fillRect(18, 106, 220, 44);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 27 : 68;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      if (i === 0) g.moveTo(128 + r * Math.cos(a), 128 + r * Math.sin(a));
      else g.lineTo(128 + r * Math.cos(a), 128 + r * Math.sin(a));
    }
    g.closePath();
    g.fill();
  });

/** RAF roundel for Duxford / Mustang Mk X */
export const roundelRAF = () =>
  ctex("roundelRAF", 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    for (const [r, c] of [
      [96, "#e8c840"],
      [82, "#243b70"],
      [54, "#f5f2e8"],
      [28, "#c83232"],
    ] as const) {
      g.fillStyle = c;
      g.beginPath();
      g.arc(128, 128, r, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Balkenkreuz marking for German Bf 109 */
const crossDE = () =>
  ctex("crossDE", 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = "#f4f2ec";
    g.fillRect(92, 24, 72, 208);
    g.fillRect(24, 92, 208, 72);
    g.fillStyle = "#1c1c22";
    g.fillRect(106, 24, 44, 208);
    g.fillRect(24, 106, 208, 44);
  });

/** Translucent spinning propeller blur disc (NOINK so it never gets a hard black circle outline) */
const propDiscTex = () =>
  ctex("propDisc", 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const gr = g.createRadialGradient(128, 128, 18, 128, 128, 122);
    gr.addColorStop(0, "rgba(220,230,240,0.05)");
    gr.addColorStop(0.55, "rgba(210,220,235,0.28)");
    gr.addColorStop(0.92, "rgba(245,220,90,0.35)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(128, 128, 122, 0, Math.PI * 2);
    g.fill();
  });

export type MustangRig = {
  root: THREE.Group;
  prop: THREE.Group;
  disc: THREE.Mesh;
  reconCam: THREE.Group;
  cowling: THREE.Group;
  exposedEngine: THREE.Group;
  jetCone: THREE.Mesh;
  jetMat: THREE.MeshBasicMaterial;
  dropTanks: THREE.Group;
};

/** Builds a sculpted 3D North American P-51 Mustang (+z = nose forward, +y = up, wingspan ~11.2 m, length ~9.8 m) */
export const createMustang = (variant: "allison" | "merlin"): MustangRig => {
  const root = new THREE.Group();
  const isMerlin = variant === "merlin";

  const bodyM = isMerlin ? mat("#d4dce6", 55) : mat("#5b6d43");
  const bellyM = isMerlin ? mat("#c6d0dc", 45) : mat("#9aa2ab");
  const noseM = isMerlin ? mat("#cf2f2f", 35) : mat("#d8b638");
  const antiGlareM = mat("#475338");
  const glassM = twoTone(new THREE.MeshPhongMaterial({ color: "#9ad0f5", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.72 }), 0.1);
  const darkM = mat("#2b2d36");
  const tireM = mat("#23242b");
  const stripeW = mat("#f4f1ea");
  const stripeB = mat("#22232a");
  const brassM = mat("#d8a948", 40);

  // Sculpted fuselage lathe along z (-4.6 tail to +3.8 spinner base)
  const prof: [number, number][] = [
    [-4.6, 0.08],
    [-3.8, 0.28],
    [-2.2, 0.52],
    [-0.6, 0.68],
    [0.8, 0.68],
    [2.2, 0.58],
    [3.35, 0.36],
    [3.65, 0.24],
  ];
  const lathePts = prof.map(([z, r]) => new THREE.Vector2(r, z));
  const fuseGeo = new THREE.LatheGeometry(lathePts, 16);
  fuseGeo.rotateX(Math.PI / 2);
  fuseGeo.scale(0.84, 1.12, 1.0); // tall sleek Mustang oval cross-section
  const fuse = new THREE.Mesh(fuseGeo, bodyM);
  fuse.castShadow = true;
  fuse.receiveShadow = true;
  root.add(fuse);

  // Olive anti-glare panel ahead of cockpit + invasion stripes on Merlin aft fuselage
  const ag = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 2.2), antiGlareM);
  ag.position.set(0, 0.69, 1.95);
  ag.castShadow = true;
  root.add(ag);

  if (isMerlin) {
    // Red tail fin + black/white D-Day stripes on rear fuselage
    for (let i = 0; i < 5; i++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.42, 0.34, 14), i % 2 === 0 ? stripeW : stripeB);
      band.rotation.x = Math.PI / 2;
      band.scale.set(0.86, 1.13, 1);
      band.position.set(0, 0, -1.65 - i * 0.34);
      root.add(band);
    }
  } else {
    // Allison top carburetor intake scoop right behind spinner!
    const topScoop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 1.05), bodyM);
    topScoop.position.set(0, 0.68, 2.55);
    root.add(topScoop);
  }

  // ---- Iconic P-51 Aft Ventral Belly Radiator Scoop (THE MEREDITH EFFECT!) ----
  const scoop = new THREE.Group();
  const scoopBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 2.35), bellyM);
  scoopBody.position.set(0, -0.74, -0.85);
  scoopBody.castShadow = true;
  const scoopLip = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.52, 0.22), darkM);
  scoopLip.position.set(0, -0.74, 0.34);
  const scoopNozzle = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.35), darkM);
  scoopNozzle.position.set(0, -0.70, -2.08);
  scoop.add(scoopBody, scoopLip, scoopNozzle);
  root.add(scoop);

  // Meredith Effect glowing thermal thrust cone shooting out the rear belly nozzle!
  const jetGeo = new THREE.ConeGeometry(0.32, 2.8, 12, 1, true);
  jetGeo.rotateX(Math.PI / 2); // base at nozzle, tip pointing -z!
  jetGeo.translate(0, 0, -1.4);
  const jetMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.4, 1.15, 0.32), // HDR > 1.0 so BloomEffect gives it a warm glowing halo!
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const jetCone = new THREE.Mesh(jetGeo, jetMat);
  jetCone.position.set(0, -0.70, -2.22);
  jetCone.layers.set(NOINK);
  root.add(jetCone);

  // ---- Laminar-Flow Tapered Wings ----
  for (const s of [-1, 1]) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 1.35);
    wingShape.lineTo(s * 5.55, 0.65);
    wingShape.lineTo(s * 5.55, -0.35);
    wingShape.lineTo(0, -1.05);
    wingShape.closePath();
    const wGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 2 });
    wGeo.rotateX(-Math.PI / 2);
    const wing = new THREE.Mesh(wGeo, bodyM);
    wing.position.set(0, -0.22, 0.25);
    wing.rotation.z = s * 0.085; // 5 deg dihedral!
    wing.castShadow = true;
    wing.receiveShadow = true;
    root.add(wing);

    if (isMerlin) {
      // Invasion stripes on mid-wing
      for (let k = 0; k < 5; k++) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 1.75), k % 2 === 0 ? stripeW : stripeB);
        st.position.set(s * (1.35 + k * 0.36), -0.14 + Math.abs(1.35 + k * 0.36) * 0.085, 0.12);
        st.rotation.z = s * 0.085;
        root.add(st);
      }
    }
    // USAAF Roundel on outer left wing
    if (s < 0) {
      const rPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.15, 1.15),
        new THREE.MeshBasicMaterial({ map: roundelUS(), alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -2 })
      );
      rPlane.rotation.x = -Math.PI / 2;
      rPlane.rotation.y = s * 0.085;
      rPlane.position.set(s * 3.85, 0.25, 0.22);
      rPlane.layers.set(NOINK);
      root.add(rPlane);
    }
  }

  // Underwing silver drop tanks (toggled on for Merlin long-range Berlin escort)
  const dropTanks = new THREE.Group();
  for (const s of [-1, 1]) {
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.25, 6, 12), mat("#cfd8e4", 50));
    tank.rotation.x = Math.PI / 2;
    tank.position.set(s * 2.15, -0.48, 0.25);
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.55), bodyM);
    pylon.position.set(s * 2.15, -0.28, 0.25);
    dropTanks.add(tank, pylon);
  }
  dropTanks.visible = false;
  root.add(dropTanks);

  // ---- Tail Fin + Horizontal Stabilizers ----
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0, 1.85);
  finShape.lineTo(-0.75, 1.85);
  finShape.lineTo(-1.45, 0);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  finGeo.rotateY(Math.PI / 2);
  finGeo.translate(-0.06, 0.2, -3.35);
  const fin = new THREE.Mesh(finGeo, isMerlin ? noseM : bodyM);
  fin.castShadow = true;
  root.add(fin);

  const hStab = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.11, 0.85), bodyM);
  hStab.position.set(0, 0.35, -4.05);
  hStab.castShadow = true;
  root.add(hStab);

  // ---- Canopy + Seated Pilot Silhouette ----
  const pilotHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), mat("#f5cfa8"));
  pilotHead.position.set(0, 0.88, -0.05);
  const pilotHelm = new THREE.Mesh(new THREE.SphereGeometry(0.225, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), mat("#5a3b26"));
  pilotHelm.position.copy(pilotHead.position);
  root.add(pilotHead, pilotHelm);

  const canGeo = new THREE.SphereGeometry(0.46, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  canGeo.scale(0.82, 1.05, isMerlin ? 2.45 : 2.1);
  const canopy = new THREE.Mesh(canGeo, glassM);
  canopy.position.set(0, 0.62, isMerlin ? -0.15 : 0.05);
  root.add(canopy);
  if (!isMerlin) {
    // Razorback spine behind canopy on Allison P-51A
    const razor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 2.2), bodyM);
    razor.position.set(0, 0.62, -1.65);
    razor.rotation.x = 0.14;
    root.add(razor);
  }

  // ---- Clunky F.24 Recon Camera Box (visible on low-altitude cow/mud recon sorties!) ----
  const reconCam = new THREE.Group();
  const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.48, 0.62), darkM);
  camBody.position.set(0.22, 0.96, -0.68);
  const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.42, 12), brassM);
  camLens.rotation.z = -Math.PI / 2.6;
  camLens.position.set(0.56, 0.86, -0.68);
  reconCam.add(camBody, camLens);
  reconCam.visible = false;
  root.add(reconCam);

  // ---- Removable Nose Cowling + Exposed Engine Bay (for Shot 7 Sparrow & Shot 8 Merlin Swap!) ----
  const cowling = new THREE.Group();
  const cowlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.52, 1.45, 14), bodyM);
  cowlMesh.rotation.x = Math.PI / 2;
  cowlMesh.scale.set(0.85, 1.12, 1);
  cowlMesh.position.set(0, 0.06, 2.85);
  // 6 exhaust stacks on each side
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 6), darkM);
      ex.rotation.z = s * 1.25;
      ex.position.set(s * 0.42, 0.16, 2.25 + k * 0.19);
      cowling.add(ex);
    }
  }
  cowling.add(cowlMesh);
  root.add(cowling);

  const exposedEngine = new THREE.Group();
  const blk = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 1.15), darkM);
  blk.position.set(0, 0.08, 2.75);
  const blower = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 12), brassM);
  blower.rotation.x = Math.PI / 2;
  blower.position.set(0, 0.15, 2.1);
  exposedEngine.add(blk, blower);
  exposedEngine.visible = false;
  root.add(exposedEngine);

  // ---- Spinner + Propeller Blades + Spinning Blur Disc ----
  const prop = new THREE.Group();
  prop.position.set(0, 0.06, 3.68);
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.78, 14), noseM);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.z = 0.36;
  prop.add(spinner);

  const nBlades = isMerlin ? 4 : 3;
  for (let i = 0; i < nBlades; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.65, 0.035), darkM);
    const a = (i * Math.PI * 2) / nBlades;
    blade.position.set(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0.12);
    blade.rotation.z = a - Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.16, 0.04), mat("#f2d03b"));
    tip.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0.12);
    tip.rotation.z = a - Math.PI / 2;
    prop.add(blade, tip);
  }
  root.add(prop);

  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(3.45, 3.45),
    new THREE.MeshBasicMaterial({ map: propDiscTex(), transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide })
  );
  disc.position.set(0, 0.06, 3.82);
  disc.layers.set(NOINK);
  root.add(disc);

  // Landing gear legs + wheels (deployed when near ground y < D0 + 2.2, hidden in flight by world.ts)
  const gear = new THREE.Group();
  gear.name = "landingGear";
  for (const s of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.15, 8), mat("#b8c0cc"));
    strut.position.set(s * 1.35, -0.78, 1.05);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 14), tireM);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(s * 1.42, -1.32, 1.05);
    gear.add(strut, wheel);
  }
  const tailWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10), tireM);
  tailWheel.rotation.z = Math.PI / 2;
  tailWheel.position.set(0, -0.45, -3.85);
  gear.add(tailWheel);
  root.add(gear);

  return { root, prop, disc, reconCam, cowling, exposedEngine, jetCone, jetMat, dropTanks };
};

/** German Messerschmitt Bf 109 (slate blue-grey + bright yellow nose cowling) */
export const createBf109 = () => {
  const g = new THREE.Group();
  const bodyM = mat("#556474");
  const yellowM = mat("#ecc232");
  const glassM = twoTone(new THREE.MeshPhongMaterial({ color: "#9ec9eb", transparent: true, opacity: 0.72 }), 0.1);

  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.48, 7.8, 12), bodyM);
  fuse.rotation.x = Math.PI / 2;
  fuse.position.z = -0.5;
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.46, 1.85, 12), yellowM);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 2.65;
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 12), yellowM);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.z = 3.88;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.15, 1.65), bodyM);
  wing.position.set(0, -0.18, 0.45);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 1.1), yellowM);
  fin.position.set(0, 0.68, -3.95);
  const hStab = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.1, 0.75), bodyM);
  hStab.position.set(0, 0.35, -3.95);
  const can = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 1.55), glassM);
  can.position.set(0, 0.56, 0.25);

  const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshBasicMaterial({ map: crossDE(), alphaTest: 0.4, side: THREE.DoubleSide }));
  cross.rotation.y = Math.PI / 2;
  cross.position.set(0.49, 0.08, -1.5);
  cross.layers.set(NOINK);

  const disc = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({ map: propDiscTex(), transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide }));
  disc.position.set(0, 0, 4.02);
  disc.layers.set(NOINK);

  g.add(fuse, nose, spinner, wing, fin, hStab, can, cross, disc);
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o !== disc && o !== cross) o.castShadow = true;
  });
  return g;
};

/** Boeing B-17 Flying Fortress 4-engine heavy bomber for Shot 12 Berlin escort! */
export const createB17 = () => {
  const g = new THREE.Group();
  const oliveM = mat("#515e3d");
  const bellyM = mat("#959ea6");
  const redM = mat("#c63232");
  const glassM = twoTone(new THREE.MeshPhongMaterial({ color: "#a4d2f4", transparent: true, opacity: 0.75 }), 0.1);

  const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 14.5, 8, 16), oliveM);
  fuse.rotation.x = Math.PI / 2;
  const noseGlass = new THREE.Mesh(new THREE.SphereGeometry(0.88, 12, 10), glassM);
  noseGlass.position.set(0, -0.05, 8.0);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(24.0, 0.34, 3.4), oliveM);
  wing.position.set(0, 0.1, 1.2);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 3.2), redM);
  fin.position.set(0, 2.4, -6.8);
  const hStab = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.22, 1.9), oliveM);
  hStab.position.set(0, 0.4, -7.0);
  g.add(fuse, noseGlass, wing, fin, hStab);

  for (const x of [-7.6, -3.8, 3.8, 7.6]) {
    const nac = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.52, 2.4, 12), bellyM);
    nac.rotation.x = Math.PI / 2;
    nac.position.set(x, 0.05, 2.4);
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: propDiscTex(), transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide }));
    disc.position.set(x, 0.05, 3.72);
    disc.layers.set(NOINK);
    g.add(nac, disc);
  }
  return g;
};

/** Rolls-Royce Merlin 61 V12 engine + two-stage supercharger on workshop hoist (Shot 8) */
export const createMerlinHoist = () => {
  const wrap = new THREE.Group();
  const hoist = new THREE.Group();
  const steelM = mat("#545b68", 35);
  const blackM = mat("#262830", 30);
  const brassM = mat("#dfb14b", 55);

  // Steel A-frame gantry around x = -3.5, z = 0.8
  for (const s of [-1, 1]) {
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.6, 8), steelM);
    leg1.position.set(s * 1.65, 2.25, -0.55);
    leg1.rotation.x = 0.22;
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.6, 8), steelM);
    leg2.position.set(s * 1.65, 2.25, 0.55);
    leg2.rotation.x = -0.22;
    hoist.add(leg1, leg2);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 0.18), steelM);
  beam.position.set(0, 4.45, 0);
  hoist.add(beam);

  // Engine block + V12 cylinder banks + gold Rolls-Royce nameplate + two-stage rear supercharger!
  const engine = new THREE.Group();
  const crankcase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 1.32), blackM);
  engine.add(crankcase);
  for (const s of [-1, 1]) {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 1.24), blackM);
    bank.position.set(s * 0.22, 0.28, 0.04);
    bank.rotation.z = -s * 0.52;
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 1.22), brassM);
    cover.position.set(s * 0.31, 0.44, 0.04);
    cover.rotation.z = -s * 0.52;
    engine.add(bank, cover);
  }
  // Two-stage supercharger scroll + intercooler at the back of the Merlin!
  const stage1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 14), brassM);
  stage1.rotation.x = Math.PI / 2;
  stage1.position.set(0, 0.14, -0.78);
  const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.22, 14), brassM);
  stage2.rotation.x = Math.PI / 2;
  stage2.position.set(0, 0.14, -1.02);
  const intercooler = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.34), steelM);
  intercooler.position.set(0, 0.42, -0.88);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), steelM);
  chain.position.set(0, 1.45, 0);
  engine.add(stage1, stage2, intercooler, chain);

  wrap.add(hoist, engine);
  wrap.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  return { wrap, engine };
};

/** Procedural storybook trees, bushes, hedges, and airfield fuel drums so buildTown + FOREGROUND need zero external GLBs! */
export const makeProceduralKit = (): Kit => {
  const mkMat = (name: string, color: string) => {
    const m = new THREE.MeshStandardMaterial({ color });
    m.name = name; // matched by RECOLOR in build.ts!
    return m;
  };
  const leafG = mkMat("leafsGreen", "#62ae4c");
  const leafD = mkMat("leafsDark", "#4a9142");
  const bark = mkMat("woodBark", "#8a5a3c");
  const drumRed = mkMat("drumRed", "#c84238");
  const drumGold = mkMat("drumGold", "#dfb244");

  const makeTree = (cone = false, fat = 1.0) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * fat, 0.18 * fat, 0.42, 8), bark);
    trunk.position.y = 0.21;
    g.add(trunk);
    if (cone) {
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.55, 10), leafD);
      c1.position.y = 0.52;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.48, 10), leafG);
      c2.position.y = 0.82;
      g.add(c1, c2);
    } else {
      for (const [x, y, z, r, m] of [
        [0, 0.68, 0, 0.36 * fat, leafG],
        [-0.18 * fat, 0.58, 0.1, 0.26 * fat, leafD],
        [0.19 * fat, 0.6, -0.08, 0.27 * fat, leafG],
        [0, 0.86, 0.04, 0.25 * fat, leafG],
      ] as const) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m);
        s.position.set(x, y, z);
        g.add(s);
      }
    }
    return g;
  };

  const makeBush = () => {
    const g = new THREE.Group();
    for (const [x, y, z, r, m] of [
      [0, 0.38, 0, 0.42, leafG],
      [-0.32, 0.28, 0.08, 0.3, leafD],
      [0.34, 0.3, -0.06, 0.32, leafG],
    ] as const) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m);
      s.position.set(x, y, z);
      g.add(s);
    }
    return g;
  };

  const makeHedge = () => {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.75), leafD);
    box.position.y = 0.45;
    g.add(box);
    return g;
  };

  const makeDrums = () => {
    const g = new THREE.Group();
    for (const [x, z, m] of [
      [0, 0, drumRed],
      [0.62, 0.22, drumGold],
      [0.28, -0.52, drumRed],
    ] as const) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.88, 12), twoTone(new THREE.MeshLambertMaterial({ color: m.color })));
      d.position.set(x, 0.44, z);
      d.castShadow = true;
      g.add(d);
    }
    return g;
  };

  const oak = makeTree(false, 1.0);
  const fat = makeTree(false, 1.25);
  const cone = makeTree(true, 1.0);
  const bush = makeBush();
  return {
    tree_oak: oak,
    tree_default: oak.clone(),
    tree_detailed: fat,
    tree_fat: fat.clone(),
    tree_cone: cone,
    "tree-high-round": oak.clone(),
    tree: oak.clone(),
    plant_bushLarge: bush,
    plant_bushDetailed: bush.clone(),
    plant_bush: bush.clone(),
    hedge: makeHedge(),
    fuel_drums: makeDrums(),
  };
};
