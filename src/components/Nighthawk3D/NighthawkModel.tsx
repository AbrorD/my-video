import React, { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { staticFile } from "remotion";

interface NighthawkModelProps {
  frame: number;
  highlightFacets?: boolean;
  edgeGlowColor?: string;
  wireframeOpacity?: number;
}

export const NighthawkModel: React.FC<NighthawkModelProps> = ({
  frame,
  highlightFacets = true,
  edgeGlowColor = "#38BDF8",
  wireframeOpacity = 0.75,
}) => {
  const gltf = useGLTF(staticFile("nighthawk.glb"));

  const { sceneGroup, edgeSegments } = useMemo(() => {
    // Clone scene to avoid mutating the cached GLTF scene across renders
    const root = gltf.scene.clone(true);
    root.updateMatrixWorld(true);

    // 1. Calculate original bounding box
    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    // 2. Center geometry around (0, 0, 0)
    root.position.set(-center.x, -center.y, -center.z);

    // 3. Create pivot group:
    // In this GLTF, aircraft nose is at -X, tail at +X.
    // Rotate +90° (+Math.PI / 2) around Y so nose points forward (+Z).
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.PI / 2;
    pivot.add(root);

    // 4. Normalize scale so total aircraft length is ~7.2 units
    const length = Math.max(size.x, size.z);
    const targetScale = length > 0 ? 7.2 / length : 0.3;

    const wrapper = new THREE.Group();
    wrapper.scale.set(targetScale, targetScale, targetScale);
    wrapper.add(pivot);

    // 5. Enhance materials and collect edge segments
    const edgesList: THREE.LineSegments[] = [];
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (highlightFacets && mesh.geometry) {
          try {
            const edges = new THREE.EdgesGeometry(mesh.geometry, 16);
            const lineMat = new THREE.LineBasicMaterial({
              color: 0x38bdf8,
              transparent: true,
              opacity: wireframeOpacity,
              linewidth: 1.2,
            });
            const edgeLines = new THREE.LineSegments(edges, lineMat);
            mesh.add(edgeLines);
            edgesList.push(edgeLines);
          } catch (e) {
            console.warn("Edge generation skipped for:", mesh.name, e);
          }
        }
      }
    });

    return { sceneGroup: wrapper, edgeSegments: edgesList };
  }, [gltf.scene, highlightFacets, wireframeOpacity]);

  // Dynamically update wireframe edge color based on edgeGlowColor
  useMemo(() => {
    const targetHex = edgeGlowColor === "#34D399" ? 0x34d399 : 0x00f0ff;
    for (const seg of edgeSegments) {
      (seg.material as THREE.LineBasicMaterial).color.set(targetHex);
    }
  }, [edgeSegments, edgeGlowColor]);

  // Subtle flight pitch/roll oscillation derived strictly from frame
  const pitch = Math.sin(frame * 0.035) * 0.015;
  const roll = Math.cos(frame * 0.025) * 0.02;

  return (
    <group rotation={[pitch, 0, roll]}>
      <primitive object={sceneGroup} />

      {/* Subtle infrared-shielded exhaust glow at the rear (-Z) */}
      <pointLight
        position={[0, 0.1, -3.4]}
        color="#F97316"
        intensity={0.9 + Math.sin(frame * 0.2) * 0.25}
        distance={3.5}
      />
    </group>
  );
};

useGLTF.preload(staticFile("nighthawk.glb"));
