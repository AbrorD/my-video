import * as THREE from "three";

/**
 * Mathematically accurate faceted geometry of Lockheed F-117A Nighthawk.
 * Every polygon is a flat planar facet (faceting principle / "Hopeless Diamond").
 * Coordinate system:
 * +Z: Forward (Nose tip)
 * -Z: Aft (Exhaust / Tail)
 * +Y: Up
 * -Y: Down (Keel)
 * +X: Right wing
 * -X: Left wing
 */
export function createF117Geometry(): THREE.BufferGeometry {
  const vertices: number[] = [];

  // Helper to add a triangle with counter-clockwise winding
  function addTri(
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number]
  ) {
    vertices.push(p1[0], p1[1], p1[2]);
    vertices.push(p2[0], p2[1], p2[2]);
    vertices.push(p3[0], p3[1], p3[2]);
  }

  // Helper to add a planar quad as two triangles
  function addQuad(
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    p4: [number, number, number]
  ) {
    addTri(p1, p2, p3);
    addTri(p1, p3, p4);
  }

  // 1. Key Landmarks
  const NOSE_TIP: [number, number, number] = [0, 0.05, 4.6];
  const NOSE_CHINE_L: [number, number, number] = [-0.45, 0.02, 3.8];
  const NOSE_CHINE_R: [number, number, number] = [0.45, 0.02, 3.8];
  const NOSE_TOP_RIDGE: [number, number, number] = [0, 0.22, 3.7];

  // Canopy facets
  const CANOPY_NOSE: [number, number, number] = [0, 0.35, 2.9];
  const CANOPY_APEX: [number, number, number] = [0, 0.72, 1.8];
  const CANOPY_SIDE_L: [number, number, number] = [-0.45, 0.52, 1.8];
  const CANOPY_SIDE_R: [number, number, number] = [0.45, 0.52, 1.8];
  const CANOPY_AFT: [number, number, number] = [0, 0.58, 0.9];

  // Forward Chine & Fuselage
  const CHINE_FWD_L: [number, number, number] = [-1.15, -0.02, 2.6];
  const CHINE_FWD_R: [number, number, number] = [1.15, -0.02, 2.6];
  const CHINE_MID_L: [number, number, number] = [-1.95, -0.04, 1.2];
  const CHINE_MID_R: [number, number, number] = [1.95, -0.04, 1.2];

  // Engine Inlets (Trapezoidal / Faceted on upper fuselage)
  const INTAKE_LIP_L: [number, number, number] = [-0.85, 0.42, 0.8];
  const INTAKE_LIP_R: [number, number, number] = [0.85, 0.42, 0.8];
  const INTAKE_TOP_L: [number, number, number] = [-0.65, 0.48, -0.2];
  const INTAKE_TOP_R: [number, number, number] = [0.65, 0.48, -0.2];

  // Spine & Upper deck
  const SPINE_MID: [number, number, number] = [0, 0.48, 0.1];
  const SPINE_AFT: [number, number, number] = [0, 0.32, -1.5];
  const EXHAUST_CENTER: [number, number, number] = [0, 0.12, -3.1];

  // Main Delta Wings (67.5° sweep leading edge)
  const CHINE_OUTER_L: [number, number, number] = [-3.15, -0.06, -0.4];
  const CHINE_OUTER_R: [number, number, number] = [3.15, -0.06, -0.4];
  const WINGTIP_L: [number, number, number] = [-4.6, -0.08, -1.9];
  const WINGTIP_R: [number, number, number] = [4.6, -0.08, -1.9];

  // Serrated Trailing Edge (W-notch serrations)
  const TRAIL_OUTER_L: [number, number, number] = [-3.5, -0.07, -2.2];
  const TRAIL_OUTER_R: [number, number, number] = [3.5, -0.07, -2.2];
  const TRAIL_NOTCH_L: [number, number, number] = [-2.1, -0.05, -2.9];
  const TRAIL_NOTCH_R: [number, number, number] = [2.1, -0.05, -2.9];
  const TRAIL_IN_L: [number, number, number] = [-0.85, -0.03, -2.3];
  const TRAIL_IN_R: [number, number, number] = [0.85, -0.03, -2.3];

  // Underside Keel (Inverted Pyramid Diamond belly to deflect ground radar)
  const NOSE_KEEL: [number, number, number] = [0, -0.28, 4.0];
  const KEEL_FWD: [number, number, number] = [0, -0.58, 2.6];
  const KEEL_MID: [number, number, number] = [0, -0.72, 0.8];
  const BELLY_FLAT_L: [number, number, number] = [-0.95, -0.42, 0.7];
  const BELLY_FLAT_R: [number, number, number] = [0.95, -0.42, 0.7];
  const KEEL_AFT: [number, number, number] = [0, -0.46, -1.2];
  const KEEL_EXHAUST: [number, number, number] = [0, -0.16, -2.6];

  // --- TOP SURFACE FACETS ---
  // Nose Cone Facets
  addTri(NOSE_TIP, NOSE_CHINE_L, NOSE_TOP_RIDGE);
  addTri(NOSE_TIP, NOSE_TOP_RIDGE, NOSE_CHINE_R);

  // Nose to Canopy Transition
  addTri(NOSE_TOP_RIDGE, NOSE_CHINE_L, CANOPY_NOSE);
  addTri(NOSE_TOP_RIDGE, CANOPY_NOSE, NOSE_CHINE_R);
  addTri(NOSE_CHINE_L, CHINE_FWD_L, CANOPY_NOSE);
  addTri(NOSE_CHINE_R, CANOPY_NOSE, CHINE_FWD_R);

  // Canopy Windshield Facets (Flat Glass Panes)
  addTri(CANOPY_NOSE, CANOPY_SIDE_L, CANOPY_APEX);
  addTri(CANOPY_NOSE, CANOPY_APEX, CANOPY_SIDE_R);
  addTri(CANOPY_NOSE, CHINE_FWD_L, CANOPY_SIDE_L);
  addTri(CANOPY_NOSE, CANOPY_SIDE_R, CHINE_FWD_R);

  // Canopy Side & Roof Panes
  addTri(CANOPY_APEX, CANOPY_SIDE_L, CANOPY_AFT);
  addTri(CANOPY_APEX, CANOPY_AFT, CANOPY_SIDE_R);

  // Chine to Inlets
  addQuad(CANOPY_SIDE_L, CHINE_FWD_L, CHINE_MID_L, INTAKE_LIP_L);
  addQuad(CHINE_FWD_R, CANOPY_SIDE_R, INTAKE_LIP_R, CHINE_MID_R);

  // Canopy Aft to Inlets & Spine
  addTri(CANOPY_AFT, CANOPY_SIDE_L, INTAKE_LIP_L);
  addTri(CANOPY_AFT, INTAKE_LIP_R, CANOPY_SIDE_R);
  addTri(CANOPY_AFT, INTAKE_LIP_L, SPINE_MID);
  addTri(CANOPY_AFT, SPINE_MID, INTAKE_LIP_R);

  // Upper Fuselage Spine & Engine Deck
  addQuad(SPINE_MID, INTAKE_LIP_L, INTAKE_TOP_L, SPINE_AFT);
  addQuad(SPINE_MID, SPINE_AFT, INTAKE_TOP_R, INTAKE_LIP_R);
  addTri(SPINE_AFT, INTAKE_TOP_L, EXHAUST_CENTER);
  addTri(SPINE_AFT, EXHAUST_CENTER, INTAKE_TOP_R);

  // Wings Top Facets (Sloped down from fuselage to razor chine)
  addQuad(CHINE_MID_L, CHINE_OUTER_L, INTAKE_TOP_L, INTAKE_LIP_L);
  addQuad(CHINE_MID_R, INTAKE_LIP_R, INTAKE_TOP_R, CHINE_OUTER_R);

  addTri(CHINE_OUTER_L, WINGTIP_L, TRAIL_OUTER_L);
  addTri(CHINE_OUTER_R, TRAIL_OUTER_R, WINGTIP_R);

  addQuad(CHINE_OUTER_L, TRAIL_OUTER_L, TRAIL_NOTCH_L, INTAKE_TOP_L);
  addQuad(CHINE_OUTER_R, INTAKE_TOP_R, TRAIL_NOTCH_R, TRAIL_OUTER_R);

  addQuad(INTAKE_TOP_L, TRAIL_NOTCH_L, TRAIL_IN_L, EXHAUST_CENTER);
  addQuad(INTAKE_TOP_R, EXHAUST_CENTER, TRAIL_IN_R, TRAIL_NOTCH_R);

  // --- UNDERSIDE FACETS (DIAMOND RADAR-DEFLECTING KEEL) ---
  // Nose Bottom
  addTri(NOSE_TIP, NOSE_KEEL, NOSE_CHINE_L);
  addTri(NOSE_TIP, NOSE_CHINE_R, NOSE_KEEL);

  addTri(NOSE_KEEL, KEEL_FWD, NOSE_CHINE_L);
  addTri(NOSE_KEEL, NOSE_CHINE_R, KEEL_FWD);
  addTri(NOSE_CHINE_L, KEEL_FWD, CHINE_FWD_L);
  addTri(NOSE_CHINE_R, CHINE_FWD_R, KEEL_FWD);

  // Belly Keel Slopes
  addQuad(KEEL_FWD, KEEL_MID, BELLY_FLAT_L, CHINE_FWD_L);
  addQuad(KEEL_FWD, CHINE_FWD_R, BELLY_FLAT_R, KEEL_MID);

  addQuad(CHINE_FWD_L, BELLY_FLAT_L, CHINE_MID_L, CHINE_MID_L);
  addQuad(CHINE_FWD_R, CHINE_MID_R, BELLY_FLAT_R, CHINE_FWD_R);

  addQuad(KEEL_MID, KEEL_AFT, BELLY_FLAT_L, BELLY_FLAT_L);
  addQuad(KEEL_MID, BELLY_FLAT_R, KEEL_AFT, BELLY_FLAT_R);

  addQuad(BELLY_FLAT_L, KEEL_AFT, TRAIL_IN_L, CHINE_OUTER_L);
  addQuad(BELLY_FLAT_R, CHINE_OUTER_R, TRAIL_IN_R, KEEL_AFT);

  addTri(KEEL_AFT, KEEL_EXHAUST, TRAIL_IN_L);
  addTri(KEEL_AFT, TRAIL_IN_R, KEEL_EXHAUST);
  addTri(KEEL_EXHAUST, EXHAUST_CENTER, TRAIL_IN_L);
  addTri(KEEL_EXHAUST, TRAIL_IN_R, EXHAUST_CENTER);

  // Underside Wing Panes
  addTri(CHINE_MID_L, BELLY_FLAT_L, CHINE_OUTER_L);
  addTri(CHINE_MID_R, CHINE_OUTER_R, BELLY_FLAT_R);

  addTri(CHINE_OUTER_L, TRAIL_OUTER_L, WINGTIP_L);
  addTri(CHINE_OUTER_R, WINGTIP_R, TRAIL_OUTER_R);

  addQuad(CHINE_OUTER_L, TRAIL_NOTCH_L, TRAIL_OUTER_L, TRAIL_OUTER_L);
  addQuad(CHINE_OUTER_R, TRAIL_OUTER_R, TRAIL_NOTCH_R, CHINE_OUTER_R);

  addQuad(CHINE_OUTER_L, TRAIL_IN_L, TRAIL_NOTCH_L, TRAIL_NOTCH_L);
  addQuad(CHINE_OUTER_R, TRAIL_NOTCH_R, TRAIL_IN_R, CHINE_OUTER_R);

  // --- V-TAIL RUDDEVATORS (Twin Canted All-Faceted Tail Fins) ---
  // Left V-Tail Fin (Canted outward ~48°)
  const V_TAIL_L_BASE_FWD: [number, number, number] = [-0.65, 0.25, -1.4];
  const V_TAIL_L_BASE_AFT: [number, number, number] = [-0.55, 0.12, -2.5];
  const V_TAIL_L_TIP_FWD: [number, number, number] = [-1.65, 1.48, -2.1];
  const V_TAIL_L_TIP_AFT: [number, number, number] = [-1.45, 1.35, -2.9];

  addQuad(V_TAIL_L_BASE_FWD, V_TAIL_L_TIP_FWD, V_TAIL_L_TIP_AFT, V_TAIL_L_BASE_AFT);
  addQuad(V_TAIL_L_BASE_FWD, V_TAIL_L_BASE_AFT, V_TAIL_L_TIP_AFT, V_TAIL_L_TIP_FWD);

  // Right V-Tail Fin (Canted outward ~48°)
  const V_TAIL_R_BASE_FWD: [number, number, number] = [0.65, 0.25, -1.4];
  const V_TAIL_R_BASE_AFT: [number, number, number] = [0.55, 0.12, -2.5];
  const V_TAIL_R_TIP_FWD: [number, number, number] = [1.65, 1.48, -2.1];
  const V_TAIL_R_TIP_AFT: [number, number, number] = [1.45, 1.35, -2.9];

  addQuad(V_TAIL_R_BASE_FWD, V_TAIL_R_BASE_AFT, V_TAIL_R_TIP_AFT, V_TAIL_R_TIP_FWD);
  addQuad(V_TAIL_R_BASE_FWD, V_TAIL_R_TIP_FWD, V_TAIL_R_TIP_AFT, V_TAIL_R_BASE_AFT);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.computeVertexNormals();

  return geom;
}
