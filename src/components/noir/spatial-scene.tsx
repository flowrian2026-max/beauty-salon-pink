import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import * as THREE from "three";
import campaign from "@/assets/noir-campaign.jpg";
import bridal from "@/assets/hair.jpg";
import { shouldReduceQuality, spatialPose, type SpatialQuality } from "@/lib/noir-spatial";
import { studioTexture, sceneColor } from "./spatial-geometry";

export type SceneProps = { progress: RefObject<number>; requestRender: RefObject<(() => void) | null>; quality: SpatialQuality; active: boolean; onReady: () => void; onFailure: () => void; onSlow: () => void };

function Portrait({ image, position, rotation, width, height }: { image: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number }) {
  const texture = useTexture(image);
  const ivory = useMemo(() => sceneColor("--foreground"), []);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; }, [texture]);
  return <group position={position} rotation={rotation}>
    <mesh position={[0, 0, -0.06]}><boxGeometry args={[width + 0.035, height + 0.035, 0.08]} /><meshStandardMaterial color={ivory} metalness={0.35} roughness={0.5} /></mesh>
    <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} /></mesh>
  </group>;
}

function Installation({ progress, requestRender, quality, active, onReady, onSlow }: SceneProps) {
  const photographs = useRef<THREE.Group>(null);
  const { size, invalidate, gl } = useThree();
  const compact = quality === "compact";
  const grain = useMemo(studioTexture, []);
  const palette = useMemo(() => ({ background: sceneColor("--background"), ivory: sceneColor("--foreground"), gold: sceneColor("--soft-pink"), floor: sceneColor("--secondary") }), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const samples = useRef({ count: 0, elapsed: 0, warmup: 0 });
  const initialized = useRef(false);
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => { requestRender.current = () => { if (active) invalidate(); }; if (active) invalidate(); return () => { requestRender.current = null; }; }, [active, invalidate, requestRender]);
  useEffect(() => { if (active) invalidate(); }, [quality, active, invalidate]);
  useEffect(() => () => grain.dispose(), [grain]);
  useFrame(({ camera }, rawDelta) => {
    if (!active) return;
    const delta = Math.min(rawDelta, 0.05);
    const p = progress.current;
    const pose = spatialPose(p, size.width < 760);
    target.set(...pose.position); lookTarget.set(...pose.target);
    const damping = initialized.current ? 1 - Math.exp(-3.5 * delta) : 1;
    let settling = camera.position.distanceToSquared(target) > 0.00001;
    settling ||= look.distanceToSquared(lookTarget) > 0.00001;
    camera.position.lerp(target, damping); look.lerp(lookTarget, damping); camera.lookAt(look);
    if (photographs.current) {
      const spread = size.width < 760 ? 0.48 : 1.0 - Math.abs(p - 0.5) * 0.7;
      target.set(size.width < 760 ? 0 : (p < 0.5 ? -0.6 : 0.55), 0, -2.2 + spread * 0.25);
      settling ||= photographs.current.position.distanceToSquared(target) > 0.00001;
      photographs.current.position.lerp(target, damping);
      const rotation = p < 0.5 ? -0.025 : 0.025;
      settling ||= Math.abs(photographs.current.rotation.y - rotation) > 0.001;
      photographs.current.rotation.y += (rotation - photographs.current.rotation.y) * damping;
      photographs.current.scale.setScalar(size.width < 760 ? 0.82 : 1.0 + spread * 0.08);
    }
    initialized.current = true;
    if (settling) invalidate();
    if (!compact && rawDelta < 0.5) {
      const sample = samples.current;
      sample.warmup += rawDelta;
      if (sample.warmup > 2) {
        sample.count++; sample.elapsed += rawDelta;
        if (shouldReduceQuality(sample.count, sample.elapsed)) onSlow();
        else if (sample.count >= 120) { sample.count = 0; sample.elapsed = 0; }
      }
    }
    gl.domElement.dataset['camera'] = camera.position.toArray().map(v => v.toFixed(2)).join(',');
    gl.domElement.dataset['progress'] = p.toFixed(3);
    gl.domElement.dataset['quality'] = quality;
    gl.domElement.dataset['frames'] = String(Number(gl.domElement.dataset['frames'] ?? 0) + 1);
  });
  return <>
    <color attach="background" args={[palette.background]} />
    <fog attach="fog" args={[palette.background, 19, 38]} />
    <ambientLight intensity={0.55} color={palette.ivory} />
    <directionalLight position={[-3, 7, 6]} intensity={2.1} color={palette.ivory} castShadow={!compact} shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={0.035} shadow-bias={-0.0002} shadow-radius={4} />
    <directionalLight position={[5, 2, 5]} intensity={0.8} color={palette.ivory} />
    <Environment resolution={compact ? 64 : 128}>
      <Lightformer position={[-4, 4, 5]} rotation={[0, Math.PI / 4, 0]} scale={[5, 7, 1]} intensity={5} color={palette.ivory} />
      <Lightformer position={[5, 1, 3]} rotation={[0, -Math.PI / 3, 0]} scale={[4, 6, 1]} intensity={2.5} color={palette.ivory} />
      <Lightformer position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[7, 5, 1]} intensity={3} color={palette.ivory} />
      <Lightformer position={[1, 3, -4]} rotation={[0, Math.PI, 0]} scale={[2, 5, 1]} intensity={3} color={palette.gold} />
    </Environment>
    <Suspense fallback={null}><group ref={photographs} position={[0, 0.1, -2.2]}>
      <Portrait image={campaign} position={[-2.05, 0.65, -1.1]} rotation={[0, 0.055, 0]} width={3.55} height={2.45} />
      <Portrait image={bridal} position={[2.0, 0.05, -0.4]} rotation={[0, -0.07, 0]} width={2.2} height={3.05} />
    </group></Suspense>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color={palette.floor} roughness={0.82} metalness={0.06} bumpMap={grain} bumpScale={0.014} /></mesh>
  </>;
}

export default function SpatialScene(props: SceneProps) {
  const compact = props.quality === "compact";
  return <Canvas shadows={compact ? false : "percentage"} dpr={compact ? 1 : 1.5} frameloop="demand" camera={{ position: [0, 0.95, 14], fov: 38, near: 0.1, far: 50 }} gl={{ antialias: false, alpha: false, powerPreference: "low-power", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }} onCreated={({ gl }) => { gl.domElement.addEventListener("webglcontextlost", props.onFailure, { once: true }); }}>
    <Suspense fallback={null}><Installation {...props} /></Suspense>
  </Canvas>;
}