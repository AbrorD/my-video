import type { ThreeElements } from "@react-three/fiber";

export type StopKontak3DProps = ThreeElements["group"] & {
  /**
   * Mode bedah (dissection / exploded view)
   * Jika true, tutup atas terangkat dan menjadi semi-transparan
   */
  dissectMode?: boolean;

  /**
   * Kemajuan animasi ledakan / bedah (0 = tertutup rapat, 1 = terbuka penuh)
   * Berguna untuk animasi transisi mulus di Remotion atau kontrol slider
   */
  explodeProgress?: number;

  /**
   * Ketinggian angkat tutup atas saat mode bedah terbuka penuh (default: 4.2)
   */
  explodedLift?: number;

  /**
   * Tingkat transparansi (opacity) tutup atas saat mode bedah (default: 0.28)
   */
  topOpacity?: number;

  /**
   * Status saklar on/off (true = ON menyala merah, false = OFF)
   */
  powerOn?: boolean;

  /**
   * Warna bodi utama stop kontak (default: '#F8FAFC' off-white)
   */
  bodyColor?: string;

  /**
   * Warna rel konduktor kuningan (default: '#D49B28' brass)
   */
  brassColor?: string;

  /**
   * Warna garis outline teknis Edges (default: '#18181B' charcoal black)
   */
  edgeColor?: string;

  /**
   * Ketebalan garis Edges (default: 1.2)
   */
  edgeLineWidth?: number;

  /**
   * Tampilkan label anotasi teknis 3D / callouts (default: false)
   */
  showAnnotations?: boolean;
};

export interface StopKontakCanvasProps {
  width?: number | string;
  height?: number | string;
  dissectMode?: boolean;
  explodeProgress?: number;
  powerOn?: boolean;
  autoRotate?: boolean;
  showFloorGrid?: boolean;
  showCalloutCards?: boolean;
  zoom?: number;
  cameraPosition?: [number, number, number];
  rotationY?: number;
  style?: React.CSSProperties;
}
