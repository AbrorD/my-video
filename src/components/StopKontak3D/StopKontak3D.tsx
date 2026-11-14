import React, { useMemo } from "react";
import * as THREE from "three";
import { Geometry, Base, Subtraction } from "@react-three/csg";
import { Edges } from "@react-three/drei";
import type { StopKontak3DProps } from "./types";

// Posisi Z untuk 4 cekungan soket (gang 1 sampai 4)
export const SOCKET_Z = [-3.75, -1.25, 1.25, 3.75] as const;

/**
 * Membuat geometri RoundedBox presisi menggunakan THREE.Shape & THREE.ExtrudeGeometry
 * dengan sudut membulat dan bevel halus pada tepiannya.
 */
function createRoundedHousingGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevel: number = 0.12
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hl = depth / 2;
  const r = Math.min(radius, hw - 0.05, hl - 0.05);

  shape.moveTo(-hw + r, -hl);
  shape.lineTo(hw - r, -hl);
  shape.quadraticCurveTo(hw, -hl, hw, -hl + r);
  shape.lineTo(hw, hl - r);
  shape.quadraticCurveTo(hw, hl, hw - r, hl);
  shape.lineTo(-hw + r, hl);
  shape.quadraticCurveTo(-hw, hl, -hw, hl - r);
  shape.lineTo(-hw, -hl + r);
  shape.quadraticCurveTo(-hw, -hl, -hw + r, -hl);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Menghasilkan garis kontur teknis presisi tinggi untuk Bodi Tutup Atas:
 * Mencakup bibir melingkar 4 soket, dasar lubang steker, bukaan saklar, dan batas luar bodi
 * tanpa garis triangulasi acak dari tessellation CSG.
 */
function createTechnicalHousingEdges(
  width: number,
  depth: number,
  radius: number,
  topY: number,
  socketZList: readonly number[],
  socketRadius: number
): THREE.BufferGeometry {
  const points: number[] = [];
  const hw = width / 2;
  const hl = depth / 2;
  const r = Math.min(radius, hw - 0.05, hl - 0.05);

  // 1. Garis batas luar rounded box pada permukaan atas
  const cornerSegs = 8;
  const outerLoop: THREE.Vector3[] = [];

  // Sudut Kanan Atas (+X, +Z)
  for (let i = 0; i <= cornerSegs; i++) {
    const a = (Math.PI / 2) * (i / cornerSegs);
    outerLoop.push(
      new THREE.Vector3(
        hw - r + Math.cos(a) * r,
        topY,
        hl - r + Math.sin(a) * r
      )
    );
  }
  // Sudut Kiri Atas (-X, +Z)
  for (let i = 0; i <= cornerSegs; i++) {
    const a = Math.PI / 2 + (Math.PI / 2) * (i / cornerSegs);
    outerLoop.push(
      new THREE.Vector3(
        -hw + r + Math.cos(a) * r,
        topY,
        hl - r + Math.sin(a) * r
      )
    );
  }
  // Sudut Kiri Bawah (-X, -Z)
  for (let i = 0; i <= cornerSegs; i++) {
    const a = Math.PI + (Math.PI / 2) * (i / cornerSegs);
    outerLoop.push(
      new THREE.Vector3(
        -hw + r + Math.cos(a) * r,
        topY,
        -hl + r + Math.sin(a) * r
      )
    );
  }
  // Sudut Kanan Bawah (+X, -Z)
  for (let i = 0; i <= cornerSegs; i++) {
    const a = 1.5 * Math.PI + (Math.PI / 2) * (i / cornerSegs);
    outerLoop.push(
      new THREE.Vector3(
        hw - r + Math.cos(a) * r,
        topY,
        -hl + r + Math.sin(a) * r
      )
    );
  }

  for (let i = 0; i < outerLoop.length; i++) {
    const p1 = outerLoop[i];
    const p2 = outerLoop[(i + 1) % outerLoop.length];
    points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
  }

  // 2. Garis lingkar 4 soket (Bibir atas, lantai cekungan, dan lubang steker)
  const circleSegs = 36;
  socketZList.forEach((posZ) => {
    // Bibir atas soket
    for (let i = 0; i < circleSegs; i++) {
      const a1 = (2 * Math.PI * i) / circleSegs;
      const a2 = (2 * Math.PI * (i + 1)) / circleSegs;
      points.push(
        Math.cos(a1) * socketRadius,
        topY,
        posZ + Math.sin(a1) * socketRadius,
        Math.cos(a2) * socketRadius,
        topY,
        posZ + Math.sin(a2) * socketRadius
      );
      // Lantai dasar cekungan
      points.push(
        Math.cos(a1) * socketRadius,
        topY - 0.52,
        posZ + Math.sin(a1) * socketRadius,
        Math.cos(a2) * socketRadius,
        topY - 0.52,
        posZ + Math.sin(a2) * socketRadius
      );
    }

    // 2 lubang pin tusukan steker di dasar cekungan
    [-0.48, 0.48].forEach((pinX) => {
      const pinR = 0.15;
      for (let i = 0; i < 16; i++) {
        const a1 = (2 * Math.PI * i) / 16;
        const a2 = (2 * Math.PI * (i + 1)) / 16;
        points.push(
          pinX + Math.cos(a1) * pinR,
          topY - 0.52,
          posZ + Math.sin(a1) * pinR,
          pinX + Math.cos(a2) * pinR,
          topY - 0.52,
          posZ + Math.sin(a2) * pinR
        );
      }
    });

    // Garis slot arde atas & bawah
    [-0.98, 0.98].forEach((slotZOffset) => {
      const sz = posZ + slotZOffset;
      const sw = 0.11;
      const sl = 0.07;
      // Kotak slot
      points.push(
        -sw, topY, sz - sl,  sw, topY, sz - sl,
         sw, topY, sz - sl,  sw, topY, sz + sl,
         sw, topY, sz + sl, -sw, topY, sz + sl,
        -sw, topY, sz + sl, -sw, topY, sz - sl
      );
    });
  });

  // 3. Garis batas bukaan saklar rocker di ujung depan
  const swX = 0.78;
  const swZ1 = -6.03;
  const swZ2 = -5.07;
  points.push(
    -swX, topY, swZ1,  swX, topY, swZ1,
     swX, topY, swZ1,  swX, topY, swZ2,
     swX, topY, swZ2, -swX, topY, swZ2,
    -swX, topY, swZ2, -swX, topY, swZ1
  );

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3)
  );
  return geom;
}

export const StopKontak3D: React.FC<StopKontak3DProps> = ({
  dissectMode = false,
  explodeProgress: propExplodeProgress,
  explodedLift = 4.2,
  topOpacity = 0.28,
  powerOn = true,
  bodyColor = "#F8FAFC",
  brassColor = "#D49B28",
  edgeColor = "#18181B",
  edgeLineWidth = 1.2,
  showAnnotations = false,
  ...groupProps
}) => {
  // Hitung tingkat pembukaan mode bedah (0 = tertutup rapat, 1 = terbuka penuh)
  const progress =
    typeof propExplodeProgress === "number"
      ? Math.max(0, Math.min(1, propExplodeProgress))
      : dissectMode
        ? 1
        : 0;

  const currentLift = progress * explodedLift;
  const currentOpacity = 1 - progress * (1 - topOpacity);
  const isTransparent = progress > 0.02;

  // 1. Geometri dasar Bodi Atas (RoundedBox) sebelum dilubangi CSG
  const topCoverBaseGeometry = useMemo(() => {
    return createRoundedHousingGeometry(3.9, 0.58, 14.8, 0.55, 0.12);
  }, []);

  // 2. Garis kontur teknis bersih untuk Tutup Atas
  const topHousingEdgesGeometry = useMemo(() => {
    return createTechnicalHousingEdges(
      3.9,
      14.8,
      0.55,
      0.29,
      SOCKET_Z,
      1.17
    );
  }, []);

  // 3. Geometri Bodi Bawah (Base Tray)
  const bottomHousingGeometry = useMemo(() => {
    return createRoundedHousingGeometry(3.9, 0.52, 14.8, 0.55, 0.1);
  }, []);

  // 4. Kabel Fleksibel menggunakan CatmullRomCurve3 & TubeGeometry
  const cableCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.05, 5.8), // Masuk terminal penjepit
      new THREE.Vector3(0, 0.0, 7.2), // Keluar dari ujung bodi
      new THREE.Vector3(0, -0.2, 8.5), // Melewati boot karet pelindung tekukan
      new THREE.Vector3(0.4, -0.44, 10.0), // Menyentuh bidang lantai
      new THREE.Vector3(1.4, -0.44, 11.8), // Melengkung halus ke samping
      new THREE.Vector3(2.8, -0.44, 13.5), // Lengkungan dinamis
      new THREE.Vector3(4.8, -0.44, 14.8), // Menjauh
      new THREE.Vector3(7.2, -0.44, 15.6), // Ujung kabel
    ]);
  }, []);

  return (
    <group {...groupProps}>
      {/* ========================================================
          1. GRUP 'TUTUP ATAS' (Top Cover Housing + CSG Cavities)
          Terpisah agar bisa dianimasikan terangkat & transparan
          ======================================================== */}
      <group
        name="Tutup Atas"
        position={[0, 0.32 + currentLift, 0]}
      >
        {/* Mesh Bodi Atas: Dibentuk secara prosedural via CSG Subtraction */}
        <mesh castShadow receiveShadow>
          <meshToonMaterial
            color={bodyColor}
            transparent={isTransparent}
            opacity={currentOpacity}
            depthWrite={!isTransparent}
          />

          <Geometry computeVertexNormals>
            {/* Dasar Bodi RoundedBox */}
            <Base geometry={topCoverBaseGeometry} />

            {/* 4 Cekungan Soket Lingkaran Utama beserta Lubang Pin & Slot Arde */}
            {SOCKET_Z.map((posZ, idx) => (
              <React.Fragment key={`socket-csg-${idx}`}>
                {/* 1. Lubang Cekungan Soket Utama (Diameter ~2.34 unit) */}
                <Subtraction position={[0, 0.22, posZ]}>
                  <cylinderGeometry args={[1.17, 1.17, 0.58, 36]} />
                </Subtraction>

                {/* 2. Lubang Pin Fasa (Live Hole) - Kiri */}
                <Subtraction position={[-0.48, -0.15, posZ]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.6, 18]} />
                </Subtraction>

                {/* 3. Lubang Pin Netral (Neutral Hole) - Kanan */}
                <Subtraction position={[0.48, -0.15, posZ]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.6, 18]} />
                </Subtraction>

                {/* 4. Slot Celah Penjepit Arde Atas */}
                <Subtraction position={[0, 0.22, posZ - 0.98]}>
                  <boxGeometry args={[0.22, 0.38, 0.14]} />
                </Subtraction>

                {/* 5. Slot Celah Penjepit Arde Bawah */}
                <Subtraction position={[0, 0.22, posZ + 0.98]}>
                  <boxGeometry args={[0.22, 0.38, 0.14]} />
                </Subtraction>
              </React.Fragment>
            ))}

            {/* Cekungan untuk Saklar Utama di Ujung Depan */}
            <Subtraction position={[0, 0.22, -5.55]}>
              <boxGeometry args={[1.56, 0.48, 0.96]} />
            </Subtraction>
          </Geometry>
        </mesh>

        {/* Garis outline ilustrasi teknis murni bebas garis triangulasi internal */}
        <lineSegments geometry={topHousingEdgesGeometry}>
          <lineBasicMaterial
            color={edgeColor}
            linewidth={edgeLineWidth}
            transparent={isTransparent}
            opacity={Math.max(currentOpacity, 0.45)}
          />
        </lineSegments>

        {/* --- Komponen Pelengkap pada Tutup Atas --- */}

        {/* Bingkai Saklar (Switch Bezel) */}
        <mesh position={[0, 0.35, -5.55]}>
          <boxGeometry args={[1.52, 0.12, 0.92]} />
          <meshToonMaterial
            color="#27272A"
            transparent={isTransparent}
            opacity={currentOpacity}
          />
          <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
        </mesh>

        {/* Tombol Saklar Rocker (Merah khas stop kontak dengan indikator neon) */}
        <mesh
          position={[0, 0.42, -5.55]}
          rotation={[powerOn ? -0.14 : 0.14, 0, 0]}
        >
          <boxGeometry args={[1.32, 0.18, 0.74]} />
          <meshToonMaterial
            color={powerOn ? "#DC2626" : "#991B1B"}
            emissive={powerOn ? "#7F1D1D" : "#000000"}
            emissiveIntensity={powerOn ? 0.45 : 0}
            transparent={isTransparent}
            opacity={currentOpacity}
          />
          <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
        </mesh>

        {/* Garis Simbol "I" & "O" pada Saklar */}
        <mesh position={[0, 0.52, -5.7]}>
          <boxGeometry args={[0.08, 0.02, 0.24]} />
          <meshToonMaterial
            color="#FEF08A"
            transparent={isTransparent}
            opacity={currentOpacity}
          />
        </mesh>
        <mesh position={[0, 0.52, -5.4]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
          <meshToonMaterial
            color="#FEF08A"
            transparent={isTransparent}
            opacity={currentOpacity}
          />
        </mesh>

        {/* Klip Arde (Ground Clips) yang mencuat di dinding soket */}
        {SOCKET_Z.map((posZ, idx) => (
          <group key={`ground-clip-${idx}`}>
            {/* Klip Arde Atas */}
            <mesh position={[0, 0.26, posZ - 0.96]}>
              <boxGeometry args={[0.16, 0.32, 0.05]} />
              <meshToonMaterial
                color={brassColor}
                transparent={isTransparent}
                opacity={Math.max(currentOpacity, 0.5)}
              />
              <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
            </mesh>

            {/* Klip Arde Bawah */}
            <mesh position={[0, 0.26, posZ + 0.96]}>
              <boxGeometry args={[0.16, 0.32, 0.05]} />
              <meshToonMaterial
                color={brassColor}
                transparent={isTransparent}
                opacity={Math.max(currentOpacity, 0.5)}
              />
              <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
            </mesh>
          </group>
        ))}

        {/* Tutup Baut Estetika di 4 Sudut */}
        {[
          [-1.5, -6.6],
          [1.5, -6.6],
          [-1.5, 6.6],
          [1.5, 6.6],
        ].map(([cx, cz], i) => (
          <mesh key={`screw-cap-${i}`} position={[cx, 0.32, cz]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
            <meshToonMaterial
              color="#CBD5E1"
              transparent={isTransparent}
              opacity={currentOpacity}
            />
            <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
          </mesh>
        ))}
      </group>

      {/* ========================================================
          2. GRUP 'KOMPONEN DALAM' (Internal Electrical Conductor)
          Disusun dari BoxGeometry tipis memanjang warna kuningan
          ======================================================== */}
      <group
        name="Komponen Dalam"
        position={[0, 0.05 + progress * 0.35, 0]}
      >
        {/* --- A. REL KONDUKTOR KUNINGAN MEMANJANG (BRASS BUSBARS) --- */}

        {/* 1. Rel Fasa (Live Busbar - L): Berjalan di sisi kiri (X = -0.48) */}
        <mesh position={[-0.48, 0.08, -0.4]}>
          <boxGeometry args={[0.07, 0.26, 9.8]} />
          <meshToonMaterial color={brassColor} />
          <Edges threshold={18} color={edgeColor} lineWidth={edgeLineWidth} />
        </mesh>

        {/* 2. Rel Netral (Neutral Busbar - N): Berjalan di sisi kanan (X = +0.48) */}
        <mesh position={[0.48, 0.08, 0.4]}>
          <boxGeometry args={[0.07, 0.26, 9.8]} />
          <meshToonMaterial color={brassColor} />
          <Edges threshold={18} color={edgeColor} lineWidth={edgeLineWidth} />
        </mesh>

        {/* 3. Rel Arde / Ground (Earth Busbar - PE): Berjalan di poros tengah (X = 0) */}
        <mesh position={[0, -0.06, 0.0]}>
          <boxGeometry args={[0.08, 0.16, 10.2]} />
          <meshToonMaterial color="#CA8A04" />
          <Edges threshold={18} color={edgeColor} lineWidth={edgeLineWidth} />
        </mesh>

        {/* --- B. PENJEPIT KONTAK PEGAS KUNINGAN (CONTACT CLIPS) DI 4 SOKET --- */}
        {SOCKET_Z.map((posZ, idx) => (
          <group key={`clips-gang-${idx}`}>
            {/* Penjepit Kontak Fasa (L) - Sepasang plat pegas lentur membentuk celah jepit */}
            <group position={[-0.48, 0.15, posZ]}>
              {/* Plat Pegas Sisi Dalam */}
              <mesh position={[-0.055, 0, 0]} rotation={[0, 0, -0.08]}>
                <boxGeometry args={[0.035, 0.38, 0.24]} />
                <meshToonMaterial color={brassColor} />
                <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
              </mesh>
              {/* Plat Pegas Sisi Luar */}
              <mesh position={[0.055, 0, 0]} rotation={[0, 0, 0.08]}>
                <boxGeometry args={[0.035, 0.38, 0.24]} />
                <meshToonMaterial color={brassColor} />
                <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
              </mesh>
              {/* Kaki Penghubung ke Rel Utama */}
              <mesh position={[0, -0.16, 0]}>
                <boxGeometry args={[0.12, 0.06, 0.24]} />
                <meshToonMaterial color={brassColor} />
              </mesh>
            </group>

            {/* Penjepit Kontak Netral (N) - Sepasang plat pegas lentur */}
            <group position={[0.48, 0.15, posZ]}>
              {/* Plat Pegas Sisi Dalam */}
              <mesh position={[-0.055, 0, 0]} rotation={[0, 0, -0.08]}>
                <boxGeometry args={[0.035, 0.38, 0.24]} />
                <meshToonMaterial color={brassColor} />
                <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
              </mesh>
              {/* Plat Pegas Sisi Luar */}
              <mesh position={[0.055, 0, 0]} rotation={[0, 0, 0.08]}>
                <boxGeometry args={[0.035, 0.38, 0.24]} />
                <meshToonMaterial color={brassColor} />
                <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
              </mesh>
              {/* Kaki Penghubung ke Rel Utama */}
              <mesh position={[0, -0.16, 0]}>
                <boxGeometry args={[0.12, 0.06, 0.24]} />
                <meshToonMaterial color={brassColor} />
              </mesh>
            </group>

            {/* Tiang Naik Arde (Ground Riser) dari Rel Tengah ke Permukaan Cekungan */}
            <group position={[0, 0.08, posZ]}>
              {/* Tiang Naik ke Klip Atas */}
              <mesh position={[0, 0.06, -0.96]}>
                <boxGeometry args={[0.1, 0.36, 0.04]} />
                <meshToonMaterial color="#CA8A04" />
                <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
              </mesh>
              {/* Jembatan Penghubung dari Rel Tengah */}
              <mesh position={[0, -0.1, -0.48]}>
                <boxGeometry args={[0.06, 0.04, 0.96]} />
                <meshToonMaterial color="#CA8A04" />
              </mesh>

              {/* Tiang Naik ke Klip Bawah */}
              <mesh position={[0, 0.06, 0.96]}>
                <boxGeometry args={[0.1, 0.36, 0.04]} />
                <meshToonMaterial color="#CA8A04" />
                <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
              </mesh>
              {/* Jembatan Penghubung dari Rel Tengah */}
              <mesh position={[0, -0.1, 0.48]}>
                <boxGeometry args={[0.06, 0.04, 0.96]} />
                <meshToonMaterial color="#CA8A04" />
              </mesh>
            </group>
          </group>
        ))}

        {/* --- C. TERMINAL BLOK SAMBUNGAN KABEL (TERMINAL BLOCK) --- */}
        <group position={[0, 0.02, 5.6]}>
          {/* Dudukan Terminal Isolator Tahan Panas */}
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[2.2, 0.28, 1.3]} />
            <meshToonMaterial color="#334155" />
            <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
          </mesh>

          {/* 3 Kerah Terminal Kuningan Penjepit Baut */}
          {[-0.58, 0, 0.58].map((posX, i) => (
            <group key={`terminal-screw-${i}`} position={[posX, 0.12, 0]}>
              {/* Baut Penjepit Kuningan */}
              <mesh>
                <cylinderGeometry args={[0.16, 0.16, 0.18, 16]} />
                <meshToonMaterial color={brassColor} />
                <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
              </mesh>
              {/* Celah Obeng Minus */}
              <mesh position={[0, 0.09, 0]}>
                <boxGeometry args={[0.04, 0.03, 0.28]} />
                <meshToonMaterial color="#1E293B" />
              </mesh>
            </group>
          ))}

          {/* Plat Penjepit Kabel (Cable Clamp) Anti Tarik */}
          <mesh position={[0, 0.08, 0.85]}>
            <boxGeometry args={[1.8, 0.22, 0.36]} />
            <meshToonMaterial color="#F8FAFC" />
            <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
          </mesh>
          {/* Baut Plat Penjepit Kiri & Kanan */}
          <mesh position={[-0.65, 0.2, 0.85]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
            <meshToonMaterial color="#94A3B8" />
          </mesh>
          <mesh position={[0.65, 0.2, 0.85]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
            <meshToonMaterial color="#94A3B8" />
          </mesh>
        </group>

        {/* --- D. KABEL INTI BERWARNA DI DALAM BODI (INTERNAL WIRE LEADS) --- */}
        {/* 1. Kabel Fasa (Cokelat / Brown): Terminal ke Saklar & Saklar ke Rel L */}
        <mesh position={[-0.58, 0.06, 5.0]}>
          <boxGeometry args={[0.1, 0.1, 0.9]} />
          <meshToonMaterial color="#78350F" />
        </mesh>
        <mesh position={[-0.48, 0.06, -5.0]}>
          <boxGeometry args={[0.1, 0.1, 0.7]} />
          <meshToonMaterial color="#78350F" />
        </mesh>

        {/* 2. Kabel Netral (Biru / Blue): Terminal ke Rel N */}
        <mesh position={[0.58, 0.06, 5.0]}>
          <boxGeometry args={[0.1, 0.1, 0.9]} />
          <meshToonMaterial color="#1D4ED8" />
        </mesh>

        {/* 3. Kabel Arde (Kuning-Hijau / Yellow-Green Striped): Terminal ke Rel PE */}
        <mesh position={[0, -0.04, 5.0]}>
          <boxGeometry args={[0.1, 0.1, 0.9]} />
          <meshToonMaterial color="#65A30D" />
        </mesh>

        {/* --- E. MEKANISME INTERNAL SAKLAR (SWITCH MECHANISM) --- */}
        <group position={[0, 0.08, -5.55]}>
          {/* Kotak Rumah Saklar Poliamida Hitam */}
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[1.44, 0.36, 0.88]} />
            <meshToonMaterial color="#1E293B" />
            <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
          </mesh>
          {/* Terminal Kontak Saklar */}
          <mesh position={[-0.35, 0.16, 0]}>
            <boxGeometry args={[0.12, 0.18, 0.3]} />
            <meshToonMaterial color={brassColor} />
          </mesh>
          <mesh position={[0.35, 0.16, 0]}>
            <boxGeometry args={[0.12, 0.18, 0.3]} />
            <meshToonMaterial color={brassColor} />
          </mesh>
        </group>

        {/* --- F. SEKAT PEMISAH ISOLASI PLASTIK (INSULATING BAFFLES) --- */}
        {/* Dinding pemisah antara Rel Fasa dan Rel Arde */}
        <mesh position={[-0.24, 0.04, -0.2]}>
          <boxGeometry args={[0.06, 0.28, 9.6]} />
          <meshToonMaterial color="#E2E8F0" />
        </mesh>
        {/* Dinding pemisah antara Rel Netral dan Rel Arde */}
        <mesh position={[0.24, 0.04, 0.2]}>
          <boxGeometry args={[0.06, 0.28, 9.6]} />
          <meshToonMaterial color="#E2E8F0" />
        </mesh>
      </group>

      {/* ========================================================
          3. GRUP 'BODI BAWAH' (Bottom Housing / Base Tray)
          Menampung dudukan rel, pengait baut, dan kaki karet
          ======================================================== */}
      <group name="Bodi Bawah" position={[0, -0.26, 0]}>
        <mesh receiveShadow castShadow geometry={bottomHousingGeometry}>
          <meshToonMaterial color="#EAEFF5" />
          <Edges threshold={18} color={edgeColor} lineWidth={edgeLineWidth} />
        </mesh>

        {/* 4 Kaki Karet Anti-Selip di Bagian Bawah */}
        {[
          [-1.4, -6.4],
          [1.4, -6.4],
          [-1.4, 6.4],
          [1.4, 6.4],
        ].map(([rx, rz], i) => (
          <mesh key={`rubber-foot-${i}`} position={[rx, -0.3, rz]}>
            <cylinderGeometry args={[0.26, 0.26, 0.06, 16]} />
            <meshToonMaterial color="#18181B" />
            <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
          </mesh>
        ))}

        {/* Lubang Sekrup Pemasangan Dinding (Keyhole Slots) di Bagian Bawah */}
        {[-3.0, 3.0].map((slotZ, i) => (
          <mesh
            key={`wall-slot-${i}`}
            position={[0, -0.3, slotZ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.28, 0.28, 0.04, 16]} />
            <meshToonMaterial color="#CBD5E1" />
          </mesh>
        ))}
      </group>

      {/* ========================================================
          4. GRUP 'KABEL LISTRIK' (Power Cord & Strain Relief)
          Menggunakan TubeGeometry dengan CatmullRomCurve3
          ======================================================== */}
      <group name="Kabel Listrik">
        {/* Selongsong Karet Pelindung Tekukan Kabel (Strain Relief Grommet) */}
        <group position={[0, -0.04, 7.35]}>
          {/* Ring 1 - Pangkal tebal menempel pada bodi */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.35, 18]} />
            <meshToonMaterial color="#334155" />
            <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
          </mesh>
          {/* Ring 2 - Kerucut penahan fleksibilitas bertingkat */}
          <mesh position={[0, -0.05, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.48, 0.52, 0.35, 18]} />
            <meshToonMaterial color="#334155" />
            <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
          </mesh>
          {/* Ring 3 - Ujung peredam lentur */}
          <mesh position={[0, -0.1, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.46, 0.35, 18]} />
            <meshToonMaterial color="#334155" />
            <Edges threshold={20} color={edgeColor} lineWidth={edgeLineWidth} />
          </mesh>
        </group>

        {/* Kabel Utama Fleksibel (TubeGeometry + CatmullRomCurve3) */}
        <mesh castShadow receiveShadow>
          <tubeGeometry args={[cableCurve, 64, 0.32, 16, false]} />
          <meshToonMaterial color="#E2E8F0" />
          <Edges threshold={15} color={edgeColor} lineWidth={edgeLineWidth} />
        </mesh>
      </group>
    </group>
  );
};
