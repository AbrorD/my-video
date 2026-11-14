import React, { useRef, useState, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Grid } from "@react-three/drei";
import { delayRender, continueRender } from "remotion";
import * as THREE from "three";
import { StopKontak3D } from "./StopKontak3D";
import { TechnicalCallouts } from "./TechnicalCallouts";
import type { StopKontakCanvasProps } from "./types";

interface RotatingRigProps {
  autoRotate?: boolean;
  rotationY?: number;
  children: React.ReactNode;
}

const RotatingRig: React.FC<RotatingRigProps> = ({
  autoRotate = false,
  rotationY = -Math.PI / 4,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, rotationY, 0]}>
      {children}
    </group>
  );
};

const CameraController: React.FC<{
  position: [number, number, number];
  zoom: number;
  onReady?: () => void;
}> = ({ position, zoom, onReady }) => {
  const { camera, invalidate } = useThree();
  const readyRef = useRef(false);

  useLayoutEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(0, 0, 0);
    if ("zoom" in camera) {
      (camera as THREE.OrthographicCamera).zoom = zoom;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [camera, position, zoom, invalidate]);

  useFrame(() => {
    camera.lookAt(0, 0, 0);
    if (!readyRef.current) {
      readyRef.current = true;
      if (onReady) onReady();
    }
  });

  return null;
};

export const StopKontakCanvas: React.FC<StopKontakCanvasProps> = ({
  width = "100%",
  height = "100%",
  dissectMode = false,
  explodeProgress: propExplodeProgress,
  powerOn = true,
  autoRotate = false,
  showFloorGrid = true,
  showCalloutCards = true,
  zoom = 44,
  cameraPosition = [18, 16, 18],
  rotationY = -Math.PI / 4,
  style,
}) => {
  // Koordinasi render Remotion agar screenshot diambil setelah WebGL siap
  const [handle] = useState(() =>
    typeof delayRender === "function"
      ? delayRender("Menunggu Canvas Three.js & CSG selesai merakit geometri")
      : null
  );

  const handleReady = () => {
    if (handle !== null && typeof continueRender === "function") {
      continueRender(handle);
    }
  };

  const currentProgress =
    typeof propExplodeProgress === "number"
      ? Math.max(0, Math.min(1, propExplodeProgress))
      : dissectMode
        ? 1
        : 0;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "#F6F4EE", // Warna kertas warm parchment referensi
        overflow: "hidden",
        ...style,
      }}
    >
      <Canvas
        shadows
        orthographic
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          preserveDrawingBuffer: true,
        }}
        camera={{
          position: cameraPosition,
          zoom,
          near: -80,
          far: 140,
        }}
        onCreated={({ camera, gl }) => {
          camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
          gl.renderLists.dispose();
          // Lanjutkan render jika CameraController belum sempat
          setTimeout(handleReady, 100);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Kontrol Kamera Isometrik Presisi */}
        <OrthographicCamera
          makeDefault
          position={cameraPosition}
          zoom={zoom}
          near={-80}
          far={140}
        />
        <CameraController
          position={cameraPosition}
          zoom={zoom}
          onReady={handleReady}
        />

        {/* Pencahayaan Isometrik Gaya Ilustrasi Teknis (Flat/Toon) */}
        <ambientLight intensity={1.5} color="#FFFFFF" />

        {/* Cahaya Utama (Key Light) Menghasilkan Bayangan Lembut */}
        <directionalLight
          position={[14, 24, 16]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-bias={-0.0001}
        />

        {/* Cahaya Pengisi (Fill Light Biru Muda Halus) */}
        <directionalLight
          position={[-16, 14, -12]}
          intensity={0.7}
          color="#E0F2FE"
        />

        {/* Cahaya Bawah Halus */}
        <directionalLight
          position={[0, -10, 0]}
          intensity={0.25}
          color="#FFFFFF"
        />

        {/* Grid Lantai Isometrik Bergaya Blueprint / Dokumen Teknis */}
        {showFloorGrid && (
          <Grid
            position={[0, -0.6, 0]}
            args={[50, 50]}
            cellSize={1.2}
            cellThickness={0.8}
            cellColor="#D5D0C3"
            sectionSize={6}
            sectionThickness={1.4}
            sectionColor="#A8A29E"
            fadeDistance={45}
            infiniteGrid
          />
        )}

        {/* Bidang Bayangan Halus di Atas Lantai */}
        <mesh
          position={[0, -0.58, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[40, 40]} />
          <shadowMaterial opacity={0.16} />
        </mesh>

        {/* Model 3D Prosedural Stop Kontak dengan Kontrol Orientasi */}
        <RotatingRig autoRotate={autoRotate} rotationY={rotationY}>
          <StopKontak3D
            dissectMode={dissectMode}
            explodeProgress={currentProgress}
            powerOn={powerOn}
          />
        </RotatingRig>
      </Canvas>

      {/* Kartu Anotasi Teknis Bergaya Editorial / Video Edukasi */}
      {showCalloutCards && (
        <TechnicalCallouts
          explodeProgress={currentProgress}
          powerOn={powerOn}
        />
      )}
    </div>
  );
};
