// "The Bomber Whose Engines Were Made of Fireworks": 68.2 s vertical (9:16) animated story short about the Boeing B-29 Superfortress
// in the "flat 2D cartoon characters in a painted 3D world" style.
// Post chain: InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot) ->
//   [bloom (HDR emissive only) + NEUTRAL tone mapping + colour grade], MSAA 4, grain OFF.
import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, staticFile, useCurrentFrame, useDelayRender } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction,
  BloomEffect,
  Effect,
  EffectComposer as PostEffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { World, getKit } from "./world";
import { InkPass, noInkFallback } from "../mustang/ink";
import { LensBlur, GrainEffect } from "../mustang/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../mustang/grade";
import { Kit } from "../mustang/build";
import { TOTAL, FLASH_AT, SHOTS, layersAt, dofAt } from "./story";

export const B29_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({
  ink: true,
  lens: true,
  pre: true,
  bloom: true,
  grade: true,
  grain: false,
  ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}),
});

const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.5,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3();
const fpt = new THREE.Vector3();
const glSize = new THREE.Vector2();

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { gl, camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const { delayRender, continueRender } = useDelayRender();
  const firstPaintHold = useRef<number | null>(null);

  useLayoutEffect(() => {
    firstPaintHold.current = delayRender(`B29Shot ${id} initial WebGL paint`);
    return () => {
      if (firstPaintHold.current !== null) {
        continueRender(firstPaintHold.current);
        firstPaintHold.current = null;
      }
    };
  }, [id, delayRender, continueRender]);

  const fx = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const ink = new InkPass(scene, cam);
    const lens = new LensBlur({ maxCoC: 24, nearScale: 1.2 });
    const bloom = makeBloom();
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
    const grade = new GradeEffect(GRADES.day, GRADE_STRENGTH.day);
    const grain = new GrainEffect({ amount: 0.025, cellPx: 1.5 });

    const composer = new PostEffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: 4,
      depthBuffer: true,
      stencilBuffer: false,
    });
    composer.autoRenderToScreen = true;
    composer.addPass(new RenderPass(scene, cam));
    if (on.ink) composer.addPass(ink);
    if (on.lens && on.pre) composer.addPass(new EffectPass(cam, lens.pre));
    if (on.lens) composer.addPass(new EffectPass(cam, lens.main));
    const tail: Effect[] = [];
    if (on.bloom) tail.push(bloom);
    tail.push(tone);
    if (on.grade) tail.push(grade);
    if (on.grain) tail.push(grain);
    composer.addPass(new EffectPass(cam, ...tail));

    gl.getSize(glSize);
    if (glSize.x > 0 && glSize.y > 0) {
      composer.setSize(glSize.x, glSize.y);
    }

    return { composer, ink, lens, bloom, tone, grade, grain };
  }, [gl, camera, scene, on]);

  useLayoutEffect(() => {
    const prevTone = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    return () => {
      gl.toneMapping = prevTone;
    };
  }, [gl]);

  useEffect(
    () => () => {
      fx.composer.dispose();
      fx.ink.dispose();
      fx.lens.dispose();
    },
    [fx]
  );

  const appliedSize = useRef({ w: -1, h: -1, pr: -1 });
  const frameState = useRef({ id, f });
  frameState.current = { id, f };

  const syncWorld = (shotId: number, frame: number) => {
    if (world.root.parent !== scene) scene.add(world.root);
    const cam = camera as THREE.PerspectiveCamera;
    target.copy(world.update(shotId, frame, cam, scene));
    noInkFallback(world.root);
    const d = dofAt(frame);
    cam.getWorldDirection(fwd);
    if (d.focus) fpt.set(...d.focus(frame));
    else fpt.copy(target);
    fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
    fx.lens.cInf = d.cInf;
    gradeFor(fx.grade, SHOTS[shotId - 1].light);
    fx.grain.seed = frame;
  };

  useFrame((_, delta) => {
    const cur = frameState.current;
    syncWorld(cur.id, cur.f);
    gl.getSize(glSize);
    const pr = gl.getPixelRatio();
    const ap = appliedSize.current;
    if (glSize.x !== ap.w || glSize.y !== ap.h || pr !== ap.pr) {
      if (glSize.x > 0 && glSize.y > 0) {
        fx.composer.setSize(glSize.x, glSize.y);
        ap.w = glSize.x;
        ap.h = glSize.y;
        ap.pr = pr;
      }
    }
    const prevAuto = gl.autoClear;
    gl.autoClear = true;
    fx.composer.render(delta);
    gl.autoClear = prevAuto;
    if (firstPaintHold.current !== null) {
      continueRender(firstPaintHold.current);
      firstPaintHold.current = null;
    }
  }, 1);

  return <primitive object={world.root} dispose={null} />;
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas
      width={1080}
      height={1920}
      {...(dprOverride() ? { dpr: dprOverride() } : {})}
      shadows
      gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}
    >
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const B29Short: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useMemo(getKit, []);
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      <Audio src={staticFile("b29_mix.mp3")} />
      {layersAt(f).map((l, i) => (
        <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />
      ))}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
    </AbsoluteFill>
  );
};
