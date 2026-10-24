import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import * as THREE from "three";
import campaign from "@/assets/noir-campaign.jpg";
import bridal from "@/assets/hair.jpg";
import { shouldReduceQuality, spatialPose, type SpatialQuality } from "@/lib/noir-spatial";
import { signatureGeometry, studioTexture, pigmentTexture, sceneColor } from "./spatial-geometry";

export type SceneProps = { progress: RefObject<number>; requestRender: RefObject<(() => void) | null>; finish: number; unfolded: boolean; quality: SpatialQuality; active: boolean; onReady: () => void; onUnfold: () => void; onFailure: () => void; onSlow: () => void };

function Portrait({ image, position, rotation, width, height }: { image: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number }) {
  const texture = useTexture(image);
  const ivory = useMemo(() => sceneColor("--ivory"), []);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; }, [texture]);
  return <group position={position} rotation={rotation}>
    <mesh position={[0, 0, -0.06]}><boxGeometry args={[width + 0.035, height + 0.035, 0.08]} /><meshStandardMaterial color={ivory} metalness={0.35} roughness={0.5} /></mesh>
    <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} /></mesh>
  </group>;
}

function Installation({ progress, requestRender, finish, unfolded, quality, active, onReady, onUnfold, onSlow }: SceneProps) {
  const signature = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const photographs = useRef<THREE.Group>(null);
  const { size, invalidate, gl } = useThree();
  const compact = quality === "compact";
  const geometry = useMemo(() => signatureGeometry(compact ? 90 : 180, compact ? 6 : 10), [compact]);
  const grain = useMemo(studioTexture, []);
  const pigment = useMemo(pigmentTexture, []);
  const palette = useMemo(() => ({ background: sceneColor("--background"), ivory: sceneColor("--foreground"), rose: sceneColor("--primary"), gold: sceneColor("--soft-pink"), floor: sceneColor("--secondary") }), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const samples = useRef({ count: 0, elapsed: 0, warmup: 0 });
  const initialized = useRef(false);
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => { requestRender.current = () => { if (active) invalidate(); }; if (active) invalidate(); return () => { requestRender.current = null; }; }, [active, invalidate, requestRender]);
  useEffect(() => { if (active) invalidate(); }, [finish, unfolded, quality, active, invalidate]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => grain.dispose(), [grain]);
  useEffect(() => () => pigment.dispose(), [pigment]);
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
    if (signature.current) {
      const spread = unfolded ? 1 : pose.spread;
      const scale = size.width < 760 ? 1.16 - spread * 0.06 : 0.82 - spread * 0.08;
      target.setScalar(scale);
      settling ||= signature.current.scale.distanceToSquared(target) > 0.00001;
      signature.current.scale.lerp(target, damping);
      // Leave negative space beside each chapter; the installation never bobs or spins.
      const horizontal = p < 0.5 ? 2.25 - pose.spread * 4.1 : -1.85 + (1 - pose.spread) / 0.45 * 4.1;
      target.set(size.width < 760 ? 0 : horizontal, 0.15, 0);
      settling ||= signature.current.position.distanceToSquared(target) > 0.00001;
      signature.current.position.lerp(target, damping);
      const rotation = -0.18 + p * 0.45 + (unfolded ? 0.55 : 0);
      settling ||= Math.abs(signature.current.rotation.y - rotation) > 0.001;
      signature.current.rotation.y += (rotation - signature.current.rotation.y) * damping;
      signature.current.rotation.z = -0.04;
    }
    if (material.current) {
      const color = finish === 0 ? palette.rose : finish === 1 ? palette.gold : palette.ivory;
      settling ||= Math.abs(material.current.color.r - color.r) + Math.abs(material.current.color.g - color.g) + Math.abs(material.current.color.b - color.b) > 0.001;
      material.current.color.lerp(color, damping);
      const metalness = finish === 2 ? 0.22 : finish === 1 ? 0.78 : 0.62;
      const roughness = finish === 2 ? 0.42 : finish === 1 ? 0.3 : 0.36;
      settling ||= Math.abs(material.current.metalness - metalness) > 0.001 || Math.abs(material.current.roughness - roughness) > 0.001;
      material.current.metalness += (metalness - material.current.metalness) * damping;
      material.current.roughness += (roughness - material.current.roughness) * damping;
    }
    if (photographs.current) {
      const rotation = -p * 0.08;
      settling ||= Math.abs(photographs.current.rotation.y - rotation) > 0.001;
      photographs.current.rotation.y += (rotation - photographs.current.rotation.y) * damping;
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
    gl.domElement.dataset['finish'] = String(finish);
    gl.domElement.dataset['unfolded'] = String(unfolded);
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
    <group ref={signature} position={[1.2, 0.15, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow onClick={event => { event.stopPropagation(); onUnfold(); }}>
        <meshPhysicalMaterial ref={material} color={palette.rose} metalness={0.62} roughness={0.36} roughnessMap={pigment} bumpMap={pigment} bumpScale={0.012} clearcoat={0.3} clearcoatRoughness={0.35} sheen={0.25} sheenColor={palette.ivory} sheenRoughness={0.65} envMapIntensity={1.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometry} position={[0, 0, -0.45]} rotation={[0, 0.12, 0.08]} scale={0.97} castShadow>
        <meshStandardMaterial color={palette.gold} metalness={0.72} roughness={0.4} roughnessMap={pigment} bumpMap={pigment} bumpScale={0.008} side={THREE.DoubleSide} />
      </mesh>
    </group>
    <Suspense fallback={null}><group ref={photographs}>
      <Portrait image={campaign} position={[0.9, 1.5, -4.8]} rotation={[0, 0.08, 0]} width={2.5} height={1.67} />
      <Portrait image={bridal} position={[4.9, 1.4, -5.8]} rotation={[0, -0.12, 0]} width={1.45} height={1.89} />
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