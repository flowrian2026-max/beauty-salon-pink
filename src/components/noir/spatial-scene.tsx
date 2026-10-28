import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import * as THREE from "three";
import campaign from "@/assets/noir-campaign.jpg";
import { shouldReduceQuality, spatialPose, type SpatialQuality } from "@/lib/noir-spatial";
import { sceneColor, signatureGeometry } from "./spatial-geometry";

export type SceneProps = { progress: RefObject<number>; requestRender: RefObject<(() => void) | null>; quality: SpatialQuality; active: boolean; onReady: () => void; onFailure: () => void; onSlow: () => void };

function Portrait({ image, position, rotation, width, height }: { image: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number }) {
  const texture = useTexture(image);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; }, [texture]);
  return <group position={position} rotation={rotation}>
    <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} /></mesh>
  </group>;
}

/** A real scroll-driven 3D satin stroke: Pinko's signature V, not a flat illustration. */
function SignatureRibbon({ progress, compact }: { progress: RefObject<number>; compact: boolean }) {
  const ribbon = useRef<THREE.Group>(null);
  const geometry = useMemo(() => signatureGeometry(compact ? 112 : 180, compact ? 8 : 12), [compact]);
  const color = useMemo(() => sceneColor("--soft-pink"), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ size }, delta) => {
    if (!ribbon.current) return;
    const p = progress.current;
    const mobile = size.width < 760;
    const ease = 1 - Math.exp(-4.2 * Math.min(delta, 0.05));
    const targetX = mobile ? 0.12 : p < 0.3 ? 1.55 : p < 0.73 ? -1.35 : 1.5;
    const targetY = 0.02 + Math.sin(p * Math.PI * 2) * 0.12;
    const targetZ = 2.05 + p * 0.72;
    ribbon.current.position.x += (targetX - ribbon.current.position.x) * ease;
    ribbon.current.position.y += (targetY - ribbon.current.position.y) * ease;
    ribbon.current.position.z += (targetZ - ribbon.current.position.z) * ease;
    ribbon.current.rotation.y += ((-0.28 + p * 1.15) - ribbon.current.rotation.y) * ease;
    ribbon.current.rotation.x += ((0.1 + Math.sin(p * Math.PI) * 0.18) - ribbon.current.rotation.x) * ease;
    const scale = (mobile ? 0.42 : 0.73) * (1 + Math.sin(p * Math.PI) * 0.12);
    ribbon.current.scale.setScalar(scale);
  });
  return <group ref={ribbon} position={[1.45, 0, 2.05]}>
    <mesh geometry={geometry} castShadow={!compact} receiveShadow={!compact}>
      <meshPhysicalMaterial color={color} metalness={0.64} roughness={0.24} clearcoat={1} clearcoatRoughness={0.14} side={THREE.DoubleSide} />
    </mesh>
  </group>;
}

const petalSeeds: Array<{ position: [number, number, number]; scale: [number, number, number]; phase: number }> = [
  { position: [-2.4, 1.6, 1.0], scale: [0.13, 0.3, 0.055], phase: 0.2 },
  { position: [3.0, 1.4, 0.2], scale: [0.12, 0.27, 0.05], phase: 1.1 },
  { position: [2.8, -1.25, 1.1], scale: [0.11, 0.25, 0.05], phase: 2.2 },
  { position: [-1.8, -1.7, 0.5], scale: [0.12, 0.28, 0.05], phase: 2.9 },
  { position: [0.25, 2.45, -0.5], scale: [0.1, 0.23, 0.045], phase: 3.7 },
  { position: [3.5, -0.2, -0.8], scale: [0.1, 0.24, 0.045], phase: 4.4 },
  { position: [-3.1, 0.2, -0.6], scale: [0.09, 0.21, 0.04], phase: 5.2 },
];

/** Seven low-poly-count floating petals add depth while remaining mobile-friendly. */
function FloatingPetals({ progress, compact }: { progress: RefObject<number>; compact: boolean }) {
  const group = useRef<THREE.Group>(null);
  const petals = useRef<Array<THREE.Mesh | null>>([]);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, compact ? 10 : 16, compact ? 8 : 12), [compact]);
  const rose = useMemo(() => sceneColor("--primary"), []);
  const pearl = useMemo(() => sceneColor("--soft-pink"), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const p = progress.current;
    const ease = 1 - Math.exp(-2.5 * Math.min(delta, 0.05));
    group.current.rotation.y += ((p - 0.5) * 0.32 - group.current.rotation.y) * ease;
    group.current.children.forEach((child, index) => {
      const seed = petalSeeds[index];
      if (!(child instanceof THREE.Mesh) || !seed) return;
      child.position.y = seed.position[1] + Math.sin(clock.elapsedTime * 0.48 + seed.phase + p * 2) * 0.14;
      child.rotation.z = Math.sin(clock.elapsedTime * 0.28 + seed.phase) * 0.28 + p * 0.42;
      child.rotation.x = Math.cos(clock.elapsedTime * 0.22 + seed.phase) * 0.18;
    });
  });
  return <group ref={group}>
    {petalSeeds.map((seed, index) => <mesh key={seed.phase} ref={node => { petals.current[index] = node; }} geometry={geometry} position={seed.position} scale={seed.scale} rotation={[0.2, seed.phase, 0.35]}>
      <meshPhysicalMaterial color={index % 3 === 0 ? rose : pearl} metalness={0.28} roughness={0.3} clearcoat={0.85} clearcoatRoughness={0.2} side={THREE.DoubleSide} />
    </mesh>)}
  </group>;
}

function Installation({ progress, requestRender, quality, active, onReady, onSlow }: SceneProps) {
  const photographs = useRef<THREE.Group>(null);
  const { size, invalidate, gl } = useThree();
  const compact = quality === "compact";

  const palette = useMemo(() => ({ background: sceneColor("--background"), ivory: sceneColor("--foreground"), rose: sceneColor("--soft-pink") }), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const samples = useRef({ count: 0, elapsed: 0, warmup: 0 });
  const initialized = useRef(false);
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => { requestRender.current = () => { if (active) invalidate(); }; if (active) invalidate(); return () => { requestRender.current = null; }; }, [active, invalidate, requestRender]);
  useEffect(() => { if (active) invalidate(); }, [quality, active, invalidate]);
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
    <ambientLight intensity={0.72} color={palette.ivory} />
    <directionalLight position={[-3, 7, 6]} intensity={2.1} color={palette.ivory} castShadow={!compact} shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={0.035} shadow-bias={-0.0002} shadow-radius={4} />
    <directionalLight position={[5, 2, 5]} intensity={1.15} color={palette.rose} />
    <Environment resolution={compact ? 64 : 128}>
      <Lightformer position={[-4, 4, 5]} rotation={[0, Math.PI / 4, 0]} scale={[5, 7, 1]} intensity={5} color={palette.ivory} />
      <Lightformer position={[5, 1, 3]} rotation={[0, -Math.PI / 3, 0]} scale={[4, 6, 1]} intensity={2.5} color={palette.rose} />
      <Lightformer position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[7, 5, 1]} intensity={3} color={palette.ivory} />
      <Lightformer position={[1, 3, -4]} rotation={[0, Math.PI, 0]} scale={[2, 5, 1]} intensity={3} color={palette.rose} />
    </Environment>
    <Suspense fallback={null}><group ref={photographs} position={[0, 0.15, 0.8]}>
      <Portrait image={campaign} position={[0, 0, -0.7]} rotation={[0, 0, 0]} width={8.4} height={5.8} />
    </group></Suspense>
    <SignatureRibbon progress={progress} compact={compact} />
    <FloatingPetals progress={progress} compact={compact} />
  </>;
}

export default function SpatialScene(props: SceneProps) {
  const compact = props.quality === "compact";
  return <Canvas shadows={compact ? false : "percentage"} dpr={compact ? 1 : 1.5} frameloop="demand" camera={{ position: [0, 0.95, 14], fov: 38, near: 0.1, far: 50 }} gl={{ antialias: false, alpha: false, powerPreference: "low-power", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }} onCreated={({ gl }) => { gl.domElement.addEventListener("webglcontextlost", props.onFailure, { once: true }); }}>
    <Suspense fallback={null}><Installation {...props} /></Suspense>
  </Canvas>;
}
