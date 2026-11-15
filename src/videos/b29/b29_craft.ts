// Procedural 3D Boeing B-29 Superfortress (and Soviet Tupolev Tu-4 clone), cutaway pressurized crawl-tunnel,
// exposed Wright R-3350 magnesium nacelle + curved cooling baffle, and Shot 12 Seattle drill-hole patch stand!
import * as THREE from "three";
import { twoTone } from "../mustang/shade";
import { NOINK } from "../mustang/ink";
import { ctex } from "../mustang/paint";
import { makeProceduralKit } from "../mustang/aircraft";

export { makeProceduralKit };

const mat = (hex: string, shine = 0) =>
  shine > 0
    ? twoTone(new THREE.MeshPhongMaterial({ color: hex, specular: "#eef4ff", shininess: shine }), 0.16)
    : twoTone(new THREE.MeshLambertMaterial({ color: hex }));

/** USAAF star-and-bar roundel texture */
const roundelUS = () =>
  ctex("b29_roundelUS", 256, 256, (g) => {
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

/** Soviet VVS Red Star marking for the reverse-engineered Tupolev Tu-4 (Shot 12) */
export const starSoviet = () =>
  ctex("b29_starSoviet", 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const drawStar = (R: number, r: number, fill: string, stroke?: string) => {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 ? r : R;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) g.moveTo(128 + rad * Math.cos(a), 128 + rad * Math.sin(a));
        else g.lineTo(128 + rad * Math.cos(a), 128 + rad * Math.sin(a));
      }
      g.closePath();
      g.fillStyle = fill;
      g.fill();
      if (stroke) {
        g.strokeStyle = stroke;
        g.lineWidth = 8;
        g.stroke();
      }
    };
    drawStar(108, 42, "#f5f2e8", "#181520");
    drawStar(92, 36, "#d22828");
  });

/** Translucent spinning propeller blur disc (NOINK so it never gets a hard black circle outline) */
const propDiscTex = () =>
  ctex("b29_propDisc", 256, 256, (g) => {
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

export type B29Rig = {
  root: THREE.Group;
  props: THREE.Group[];
  discs: THREE.Mesh[];
  cutawayTunnel: THREE.Group;
  tunnelCrew: THREE.Group;
  closedCowl2: THREE.Mesh;
  openNacelle: THREE.Group;
  rearCylMat: THREE.MeshBasicMaterial;
  flareCone: THREE.Mesh;
  flareMat: THREE.MeshBasicMaterial;
  baffleGroup: THREE.Group;
  coolCone: THREE.Mesh;
  coolMat: THREE.MeshBasicMaterial;
};

/**
 * Builds a sculpted 3D Boeing B-29 Superfortress (+z = nose forward, +y = up, wingspan ~16.8 m, length ~11.6 m)
 * Includes cutaway pressurized crawl-tunnel (Shot 3) and interactive inner-right nacelle #2 (Shots 1, 4, 5, 7, 8, 10, 11).
 */
export const createB29 = (variant: "us" | "soviet" = "us"): B29Rig => {
  const root = new THREE.Group();
  const isSoviet = variant === "soviet";

  const bodyM = mat(isSoviet ? "#ced6e0" : "#d8e0ea", 65);
  const bellyM = mat("#bec8d4", 45);
  const antiGlareM = mat("#424e36");
  const darkM = mat("#262830");
  const tireM = mat("#1f2026");
  const glassM = twoTone(
    new THREE.MeshPhongMaterial({ color: "#9ad0f5", specular: "#ffffff", shininess: 95, transparent: true, opacity: 0.72 }),
    0.1
  );
  const warmGlowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 1.08, 0.55) });
  const magM = mat("#7e8694", 30); // magnesium crankcase
  const baffleGoldM = mat("#eab844", 55); // curved golden-aluminum cooling baffle
  const redM = mat("#cf2e2e", 35);

  // ---- 1. Long Circular-Section Superfortress Fuselage (-6.2 tail to +4.2 greenhouse nose base) ----
  const prof: [number, number][] = [
    [-6.2, 0.14],
    [-5.2, 0.42],
    [-3.4, 0.72],
    [-1.4, 0.84],
    [1.8, 0.84],
    [3.6, 0.82],
    [4.35, 0.76],
  ];
  const fuseGeo = new THREE.LatheGeometry(prof.map(([z, r]) => new THREE.Vector2(r, z)), 18);
  fuseGeo.rotateX(Math.PI / 2);
  const fuse = new THREE.Mesh(fuseGeo, bodyM);
  fuse.castShadow = true;
  fuse.receiveShadow = true;
  root.add(fuse);

  // Olive anti-glare panel behind nose glass
  const ag = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 1.9), antiGlareM);
  ag.position.set(0, 0.8, 3.15);
  root.add(ag);

  // ---- 2. Iconic B-29 Stepless Glazed "Greenhouse" Nose (+4.2 to +5.55) ----
  const noseGroup = new THREE.Group();
  const noseGlassGeo = new THREE.SphereGeometry(0.76, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58);
  noseGlassGeo.rotateX(Math.PI / 2);
  noseGlassGeo.scale(1.0, 1.0, 1.75);
  const noseGlass = new THREE.Mesh(noseGlassGeo, glassM);
  noseGlass.position.set(0, 0.0, 4.25);
  noseGroup.add(noseGlass);

  // Aluminium framing ribs over the stepless greenhouse nose so InkPass draws signature B-29 nose frames!
  for (const zOff of [4.45, 4.95, 5.32]) {
    const r = zOff === 4.45 ? 0.75 : zOff === 4.95 ? 0.62 : 0.42;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.032, 8, 18), bodyM);
    ring.position.set(0, 0, zOff);
    noseGroup.add(ring);
  }
  for (const ang of [-0.9, -0.35, 0.35, 0.9]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 1.25), bodyM);
    rib.position.set(Math.sin(ang) * 0.58, Math.cos(ang) * 0.58, 4.82);
    rib.rotation.x = 0.28 * Math.cos(ang);
    rib.rotation.y = -0.28 * Math.sin(ang);
    noseGroup.add(rib);
  }
  // Seated pilot & co-pilot silhouettes visible inside the greenhouse nose
  for (const s of [-0.26, 0.26]) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat("#f5cfa8"));
    head.position.set(s, 0.34, 4.42);
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mat("#5a3b26"));
    helm.position.copy(head.position);
    noseGroup.add(head, helm);
  }
  root.add(noseGroup);

  // ---- 3. Remote-Controlled Dorsal & Ventral Gun Turrets + Astrodome ----
  for (const [y, z, sgn] of [
    [0.86, 2.35, 1],
    [0.84, -2.15, 1],
    [-0.84, -1.85, -1],
  ] as const) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), bodyM);
    if (sgn < 0) dome.rotation.x = Math.PI;
    dome.position.set(0, y, z);
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), darkM);
    const b2 = b1.clone();
    b1.rotation.x = Math.PI / 2;
    b2.rotation.x = Math.PI / 2;
    b1.position.set(-0.08, y + sgn * 0.12, z - 0.32);
    b2.position.set(0.08, y + sgn * 0.12, z - 0.32);
    root.add(dome, b1, b2);
  }

  // ---- 4. Cutaway Pressurized Cabins + Cozy Metal Crawl-Tunnel (Shot 3!) ----
  const cutawayTunnel = new THREE.Group();
  // Warm amber cabin recesses on the upper-right side (+x, +y) of fuselage, well above the wing root!
  const fwdCabin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.72, 1.55), warmGlowM);
  fwdCabin.position.set(0.68, 0.42, 2.75);
  const aftCabin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.72, 1.45), warmGlowM);
  aftCabin.position.set(0.68, 0.42, -2.25);
  // Dark cutaway rim frame so InkPass outlines the cutaway windows cleanly
  const fwdRim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.84, 1.68), darkM);
  fwdRim.position.set(0.64, 0.42, 2.75);
  const aftRim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.84, 1.58), darkM);
  aftRim.position.set(0.64, 0.42, -2.25);
  // Long pressurized golden-silver metal crawl-tunnel connecting forward and aft cabins over the bomb bay!
  const tunnelPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 3.8, 12), mat("#f0c665", 45));
  tunnelPipe.rotation.x = Math.PI / 2;
  tunnelPipe.position.set(0.72, 0.64, 0.25);
  // Rib rings along the tunnel
  for (const tz of [-1.2, -0.5, 0.25, 1.0, 1.65]) {
    const tr = new THREE.Mesh(new THREE.TorusGeometry(0.275, 0.032, 8, 14), darkM);
    tr.position.set(0.72, 0.64, tz);
    cutawayTunnel.add(tr);
  }
  // Cute little B-29 crewman scooting inside the tunnel!
  const tunnelCrew = new THREE.Group();
  const cBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.36, 6, 8), mat("#3b649c"));
  cBody.rotation.x = Math.PI / 2;
  const cHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat("#f5cfa8"));
  cHead.position.set(0.08, 0.08, -0.28);
  tunnelCrew.add(cBody, cHead);
  tunnelCrew.position.set(0.88, 0.68, 0.9);
  cutawayTunnel.add(fwdRim, fwdCabin, aftRim, aftCabin, tunnelPipe, tunnelCrew);
  cutawayTunnel.visible = false;
  root.add(cutawayTunnel);

  // ---- 5. High-Aspect-Ratio Superfortress Wings (Wingspan ~16.8 m) ----
  for (const s of [-1, 1]) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 1.45);
    wingShape.lineTo(s * 8.35, 0.55);
    wingShape.lineTo(s * 8.35, -0.25);
    wingShape.lineTo(0, -1.05);
    wingShape.closePath();
    const wGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.05,
      bevelSegments: 2,
    });
    wGeo.rotateX(-Math.PI / 2);
    const wing = new THREE.Mesh(wGeo, bodyM);
    wing.position.set(0, 0.05, 0.55);
    wing.rotation.z = s * 0.045; // slight dihedral
    wing.castShadow = true;
    wing.receiveShadow = true;
    root.add(wing);

    // Wing national insignia (USAAF roundel on left wing, or Soviet Red Star on both wings for Tu-4)
    if (isSoviet || s < 0) {
      const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 1.35),
        new THREE.MeshBasicMaterial({
          map: isSoviet ? starSoviet() : roundelUS(),
          alphaTest: 0.4,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        })
      );
      decal.rotation.x = -Math.PI / 2;
      decal.rotation.y = s * 0.045;
      decal.position.set(s * 6.4, 0.52, 0.55);
      decal.layers.set(NOINK);
      root.add(decal);
    }
  }

  // ---- 6. Iconic Tall Swept B-29 Tail Fin + Horizontal Stabilizers ----
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(-0.55, 2.85);
  finShape.lineTo(-1.35, 2.85);
  finShape.lineTo(-2.35, 0);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 1,
  });
  finGeo.rotateY(Math.PI / 2);
  finGeo.translate(-0.08, 0.35, -3.65);
  const fin = new THREE.Mesh(finGeo, bodyM);
  fin.castShadow = true;
  root.add(fin);

  // Tail marking: black/gold Boeing tail stripe or Soviet Red Star on Tu-4 tail
  if (isSoviet) {
    for (const s of [-1, 1]) {
      const tStar = new THREE.Mesh(
        new THREE.PlaneGeometry(1.05, 1.05),
        new THREE.MeshBasicMaterial({ map: starSoviet(), alphaTest: 0.4, side: THREE.DoubleSide })
      );
      tStar.rotation.y = (s * Math.PI) / 2;
      tStar.position.set(s * 0.11, 1.85, -4.65);
      tStar.layers.set(NOINK);
      root.add(tStar);
    }
  } else {
    const tailBand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 1.28), darkM);
    tailBand.position.set(0, 2.45, -4.65);
    root.add(tailBand);
  }

  const hStab = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.14, 1.15), bodyM);
  hStab.position.set(0, 0.42, -5.25);
  hStab.castShadow = true;
  root.add(hStab);

  // ---- 7. Four Wright R-3350 Duplex-Cyclone Engine Nacelles + 4-Blade Propellers ----
  const props: THREE.Group[] = [];
  const discs: THREE.Mesh[] = [];
  const nacPositions: [number, number, number][] = [
    [-5.45, 0.22, 1.55],
    [-2.55, 0.08, 1.75],
    [2.55, 0.08, 1.75], // <- Nacelle #2 (interactive cutaway / flare / baffle hero nacelle!)
    [5.45, 0.22, 1.55],
  ];

  let closedCowl2!: THREE.Mesh;
  const openNacelle = new THREE.Group();
  const rearCylMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.58, 0.64) });
  const baffleGroup = new THREE.Group();

  nacPositions.forEach(([nx, ny, nz], idx) => {
    const nacGroup = new THREE.Group();
    nacGroup.position.set(nx, ny, nz);

    // Rear nacelle body tapering into wing
    const rearBody = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.42, 1.55, 14), bellyM);
    rearBody.rotation.x = Math.PI / 2;
    rearBody.position.z = -0.35;
    rearBody.castShadow = true;
    nacGroup.add(rearBody);

    // Front streamlined cowling
    const frontCowl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.95, 14), bodyM);
    frontCowl.rotation.x = Math.PI / 2;
    frontCowl.position.z = 0.85;
    frontCowl.castShadow = true;
    nacGroup.add(frontCowl);

    // Red cowling lip ring
    const lipRing = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.045, 8, 16), redM);
    lipRing.position.z = 1.32;
    nacGroup.add(lipRing);

    if (idx === 2) {
      closedCowl2 = frontCowl;

      // Exposed Wright R-3350 Twin-Row 18-Cylinder Radial Engine + Magnesium Crankcase!
      openNacelle.position.set(nx, ny, nz);
      const magBlock = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.88, 12), magM);
      magBlock.rotation.x = Math.PI / 2;
      magBlock.position.z = 0.82;
      openNacelle.add(magBlock);

      // Front row of 9 cylinders (cool silver) + Rear row of 9 cylinders (starved for air / overheats!)
      for (let c = 0; c < 9; c++) {
        const a = (c * Math.PI * 2) / 9;
        const fCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.24, 8), bodyM);
        fCyl.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 1.02);
        fCyl.rotation.z = a - Math.PI / 2;
        const rCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.26, 8), rearCylMat);
        const a2 = a + Math.PI / 9;
        rCyl.position.set(Math.cos(a2) * 0.43, Math.sin(a2) * 0.43, 0.66);
        rCyl.rotation.z = a2 - Math.PI / 2;
        openNacelle.add(fCyl, rCyl);
      }
      openNacelle.visible = false;
      root.add(openNacelle);

      // Curved golden-aluminum cooling deflector baffles + wide-open cowl-flap vents (Shot 10 & 11!)
      baffleGroup.position.set(nx, ny, nz);
      for (let b = 0; b < 6; b++) {
        const a = (b * Math.PI * 2) / 6 + 0.3;
        const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.42), baffleGoldM);
        scoop.position.set(Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0.72);
        scoop.rotation.z = a;
        scoop.rotation.x = 0.35; // angled like the spoon in the soup bowl to scoop air inward!
        baffleGroup.add(scoop);
      }
      baffleGroup.visible = false;
      root.add(baffleGroup);
    }

    // 4-Blade Hamilton Standard Propeller + Spinner
    const prop = new THREE.Group();
    prop.position.set(0, 0, 1.38);
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 12), bodyM);
    spinner.rotation.x = Math.PI / 2;
    spinner.position.z = 0.18;
    prop.add(spinner);

    for (let b = 0; b < 4; b++) {
      const a = (b * Math.PI) / 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.22, 0.03), darkM);
      blade.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.05);
      blade.rotation.z = a - Math.PI / 2;
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.14, 0.035), mat("#f2d03b"));
      tip.position.set(Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0.05);
      tip.rotation.z = a - Math.PI / 2;
      prop.add(blade, tip);
    }
    nacGroup.add(prop);
    props.push(prop);

    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 2.55),
      new THREE.MeshBasicMaterial({
        map: propDiscTex(),
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    disc.position.set(0, 0, 1.46);
    disc.layers.set(NOINK);
    nacGroup.add(disc);
    discs.push(disc);

    root.add(nacGroup);
  });

  // ---- 8. Magnesium Engine Fire Flare Cone on Nacelle #2 (Shots 1, 5, 8, 11) ----
  const flareGeo = new THREE.ConeGeometry(0.62, 3.8, 14, 1, true);
  flareGeo.rotateX(Math.PI / 2); // base at nacelle #2, flaming tail streaming -z!
  flareGeo.translate(0, 0, -1.9);
  const flareMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.8, 1.05, 0.25), // HDR orange-white magnesium fire for Bloom!
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const flareCone = new THREE.Mesh(flareGeo, flareMat);
  flareCone.position.set(2.55, 0.08, 2.25);
  flareCone.layers.set(NOINK);
  root.add(flareCone);

  // ---- 9. Cool Sky-Blue Airflow Stream on Nacelle #2 (Shot 10 Baffle Fix!) ----
  const coolGeo = new THREE.ConeGeometry(0.58, 3.2, 14, 1, true);
  coolGeo.rotateX(Math.PI / 2);
  coolGeo.translate(0, 0, -1.6);
  const coolMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.38, 1.75, 2.6), // HDR cyan-sky cooling stream!
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const coolCone = new THREE.Mesh(coolGeo, coolMat);
  coolCone.position.set(2.55, 0.08, 2.45);
  coolCone.layers.set(NOINK);
  root.add(coolCone);

  // ---- 10. Tricycle Landing Gear (Nose Dual Wheel + Twin Main Bogies) ----
  const gear = new THREE.Group();
  gear.name = "landingGear";
  const nStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.15, 8), bellyM);
  nStrut.position.set(0, -0.95, 3.65);
  const nWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.24, 12), tireM);
  nWheel.rotation.z = Math.PI / 2;
  nWheel.position.set(0, -1.48, 3.65);
  gear.add(nStrut, nWheel);

  for (const s of [-1, 1]) {
    const mStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.35, 8), bellyM);
    mStrut.position.set(s * 2.55, -0.82, 1.15);
    const mWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 14), tireM);
    mWheel.rotation.z = Math.PI / 2;
    mWheel.position.set(s * 2.55, -1.42, 1.15);
    gear.add(mStrut, mWheel);
  }
  root.add(gear);

  return {
    root,
    props,
    discs,
    cutawayTunnel,
    tunnelCrew,
    closedCowl2,
    openNacelle,
    rearCylMat,
    flareCone,
    flareMat,
    baffleGroup,
    coolCone,
    coolMat,
  };
};

/**
 * 3D inspection stand for Shot 12 showing a giant close-up section of the reverse-engineered Soviet Tu-4 wing skin
 * with the famous accidental Boeing Seattle factory drill hole and the riveted square aluminum patch right on top!
 */
export const createWingPatchStand = () => {
  const g = new THREE.Group();
  const steelM = mat("#4e5664", 35);
  const silverM = mat("#d6dfe8", 65);
  const patchM = mat("#f2cb54", 60); // bright brass/aluminum patch so it reads unmistakably on camera
  const holeM = mat("#16171d");

  // Easel / inspection stand legs
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.14), steelM);
    leg.position.set(s * 1.15, 1.25, 0);
    leg.rotation.x = -0.12;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 1.1), steelM);
    foot.position.set(s * 1.15, 0.06, 0);
    g.add(leg, foot);
  }

  // Polished aluminum wing panel section
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.75, 0.14), silverM);
  panel.position.set(0, 1.55, 0.08);
  panel.rotation.x = -0.12;
  g.add(panel);

  // Soviet Red Star decal on upper-left of the wing skin panel
  const star = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.65),
    new THREE.MeshBasicMaterial({ map: starSoviet(), alphaTest: 0.4, side: THREE.DoubleSide })
  );
  star.position.set(-0.72, 1.82, 0.17);
  star.rotation.x = -0.12;
  star.layers.set(NOINK);
  g.add(star);

  // The accidental Seattle factory drill hole (dark circular bore with bevel rim in the center of the panel)
  const holeRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16), steelM);
  holeRim.position.set(0.22, 1.52, 0.16);
  holeRim.rotation.x = -0.12;
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.1, 16), holeM);
  hole.rotation.x = Math.PI / 2 - 0.12;
  hole.position.set(0.22, 1.52, 0.15);
  g.add(holeRim, hole);

  // The riveted square patch group (hinged/bolted slightly offset so both the patch and the dark drill-hole rim read clearly!)
  const patchGroup = new THREE.Group();
  patchGroup.position.set(0.22, 1.52, 0.20);
  patchGroup.rotation.x = -0.12;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.05), patchM);
  patchGroup.add(plate);
  for (const [rx, ry] of [
    [-0.24, -0.24],
    [0.24, -0.24],
    [-0.24, 0.24],
    [0.24, 0.24],
  ] as const) {
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), steelM);
    rivet.position.set(rx, ry, 0.04);
    patchGroup.add(rivet);
  }
  g.add(patchGroup);

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o !== star) o.castShadow = true;
  });
  return { stand: g, patchGroup };
};
