export type SubjectCategory =
  | 'human'
  | 'anatomy'
  | 'tattoo'
  | 'animal'
  | 'mascot'
  | 'fashion'
  | 'footwear'
  | 'perfume'
  | 'jewelry'
  | 'watch'
  | 'beverage'
  | 'cosmetic'
  | 'automotive'
  | 'product'
  | '3d-object'
  | 'custom';

export type RendererType =
  | 'image'
  | 'frame-sequence'
  | 'sprite-sheet'
  | 'layered-image'
  | 'webgl-mesh'
  | 'three-d'
  | 'video'
  | (string & {});

export type EngineStatus =
  | 'idle'
  | 'validating'
  | 'mounting'
  | 'ready'
  | 'error'
  | 'disposed';

export type DiagnosticSeverity = 'info' | 'warn' | 'error';

export interface EngineDiagnostic {
  id: string;
  timestamp: number;
  severity: DiagnosticSeverity;
  source: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface MaterialOverride {
  color?: string;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  emissive?: string;
  targetPart?: string;
}

export interface CameraPresetDef {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface StaticImageAsset {
  src: string;
  fallbackSrc?: string;
  alt?: string;
}

export interface SpriteSheetSequenceDef {
  start: number;
  end: number;
  fps?: number;
  loop?: boolean;
}

export interface SpriteSheetAsset {
  src: string;
  rows: number;
  cols: number;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  fps?: number;
  loop?: boolean;
  sequences?: Record<string, SpriteSheetSequenceDef>;
}

export interface ImageLayerAnimation {
  type: 'float' | 'pulse' | 'sway' | 'bubble' | 'rotate' | 'tilt';
  speed?: number;
  amplitude?: number;
  phaseOffset?: number;
}

export interface ImageLayerDef {
  id: string;
  src: string;
  label?: string;
  zIndex: number;
  opacity?: number;
  parallaxFactor?: number;
  tiltFactor?: number;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  layerGroup?: string;
  animation?: ImageLayerAnimation;
  variantGroup?: string;
  variantValue?: string;
  visible?: boolean;
}

export interface ThreeDMaterialPreset {
  id: string;
  label: string;
  color: string;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  transmission?: number;
  emissive?: string;
  targetPart?: string;
}

export interface ThreeDHotspotDef {
  id: string;
  objectName: string;
  label: string;
  description?: string;
  highlightColor?: string;
}

export interface ThreeDAssetDef {
  modelUrl?: string;
  proceduralPreset?:
    | 'sneaker'
    | 'perfume'
    | 'jewelry'
    | 'automotive'
    | 'watch'
    | 'mascot'
    | 'custom';
  environmentPreset?: 'studio' | 'warm' | 'cool' | 'dramatic';
  backgroundColor?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  initialRotation?: [number, number, number];
  cameraDistance?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  minDistance?: number;
  maxDistance?: number;
  pbrTextures?: boolean;
  cameraPresets?: CameraPresetDef[];
  materialPresets?: ThreeDMaterialPreset[];
  hotspots?: ThreeDHotspotDef[];
}

export interface VideoAssetDef {
  src: string;
  poster?: string;
  loop?: boolean;
  muted?: boolean;
  scrubMode?: 'pointer-x' | 'pointer-y' | 'scroll' | 'playback';
  playbackRate?: number;
  syntheticFallbackPreset?: 'turntable' | 'liquid-wave';
}

export interface PropAssetDef {
  id: string;
  type: 'fly' | 'hand' | 'sparkle' | 'custom';
  svgMarkup?: string;
  className?: string;
}

export interface AssetManifest {
  assetBaseUrl?: string;
  staticImage?: StaticImageAsset;
  frames?: Record<string, string>;
  priorityFrames?: string[];
  fallbackFrame?: string;
  spriteSheet?: SpriteSheetAsset;
  layers?: ImageLayerDef[];
  threeD?: ThreeDAssetDef;
  video?: VideoAssetDef;
  props?: PropAssetDef[];
}

export interface InteractionCapabilities {
  pointerTracking: boolean;
  touchTracking: boolean;
  hover: boolean;
  click: boolean;
  drag: boolean;
  scroll: boolean;
  magnet: boolean;
  proximity: boolean;
  pinchZoom?: boolean;
  swipe?: boolean;
  keyboard?: boolean;
  pointerSensitivity?: number;
  hoverDelayMs?: number;
  shakeThreshold?: number;
  externalHoverSelectors?: string[];
}

export interface ZoneBounds {
  x: number;
  y: number;
  w?: number;
  h?: number;
  rx?: number;
  ry?: number;
  r?: number;
  points?: Array<[number, number]>;
}

export interface ZoneAction {
  type:
    | 'set-state'
    | 'trigger-behavior'
    | 'cycle-variant'
    | 'highlight-part'
    | 'set-material'
    | 'toggle-layer'
    | 'set-camera'
    | 'emit-event';
  target: string;
  value?: unknown;
  durationMs?: number;
  crossfadeMs?: number;
  jolt?: [number, number, number, number, number];
}

export interface InteractionZoneDef {
  id: string;
  label: string;
  shape: 'rect' | 'ellipse' | 'circle' | 'polygon' | 'mesh-part' | 'alpha-mask' | 'custom';
  bounds?: ZoneBounds;
  objectName?: string;
  customHitTest?: (u: number, v: number) => boolean;
  cursor?: string;
  hoverAction?: ZoneAction;
  clickAction?: ZoneAction;
  dragAction?: ZoneAction;
  description?: string;
}

export interface BehaviorStepDef {
  state?: string;
  frame?: string;
  crossfadeMs?: number;
  durationMs: number;
  lean?: [number, number];
  jolt?: [number, number, number, number, number];
  lookAtProp?: string;
  propMove?: {
    propId: string;
    to: [number, number];
    durationMs?: number;
    visible?: boolean;
    grip?: 'on' | 'pull' | 'off' | false;
  };
  materialPresetId?: string;
  cameraPresetId?: string;
  spriteSequence?: string;
  layerOverrides?: Record<
    string,
    { offsetX?: number; offsetY?: number; scale?: number; opacity?: number; rotation?: number }
  >;
  cameraOffset?: [number, number, number];
}

export interface BehaviorSequenceDef {
  id: string;
  name: string;
  priority: number;
  interruptible: boolean;
  steps: BehaviorStepDef[];
}

export interface BlinkConfig {
  enabled: boolean;
  intervalRangeMs: [number, number];
  halfFrame: string;
  closedFrame: string;
  stepDurationMs?: number;
}

export interface DirectionalGazeConfig {
  enabled: boolean;
  neutralThreshold: number;
  ring: string[];
  frameMap: Record<string, string>;
  neutralFrame: string;
  scrollDownDirection?: string;
}

export interface VariantGroupConfig {
  values: string[];
  currentIndex: number;
  lockDirectionalWhenActive?: boolean;
}

export interface DragFeedbackRule {
  minPull: number;
  state: string;
}

export interface BehaviorProfile {
  initialState: string;
  wakeOnFirstInput?: boolean;
  sleepState?: string;
  wakeTransitionState?: string;
  idleEnabled: boolean;
  idleDelayRangeMs?: [number, number];
  idleRotation?: string[];
  sequences: Record<string, BehaviorSequenceDef>;
  blinkConfig?: BlinkConfig;
  directionalGaze?: DirectionalGazeConfig;
  variants?: Record<string, VariantGroupConfig>;
  dragStates?: DragFeedbackRule[];
  releasePullMoods?: DragFeedbackRule[];
  pullCountMoods?: Array<{ minCount: number; state: string; durationMs: number }>;
  pullWindowMs?: number;
  shakeBehavior?: {
    enabled: boolean;
    windState?: string;
    extremeState?: string;
    threshold?: number;
    extremeThreshold?: number;
  };
  externalHoverReaction?: {
    enterState: string;
    leaveState: string;
    leaveDurationMs?: number;
  };
}

export interface PhysicsConfig {
  enabled: boolean;
  mode: 'soft-body-mesh' | 'spring-2d' | 'spring-3d' | 'none';
  fixedStepHz?: number;
  gridResolution?: number;
  overscan?: number;
  wobbleHz?: number;
  dampingRatio?: number;
  dragRadius?: number;
  dragLimit?: number;
  stiffness?: number;
  damping?: number;
  inertia?: number;
  interactionStrength?: number;
  preventMeshFold?: boolean;
  alphaHitTestThreshold?: number;
}

export interface MagnetConfig {
  enabled: boolean;
  strength?: number;
  padding?: number;
  axis?: 'both' | 'x' | 'y';
  rotationStrength?: number;
  touchEquivalent?: boolean;
}

export interface PerformanceConfig {
  maxDpr?: number;
  adaptiveQuality?: boolean;
  pauseWhenHidden?: boolean;
  respectReducedMotion?: boolean;
  preloadStrategy?: 'eager' | 'priority-then-lazy' | 'on-demand';
  targetFps?: number;
}

export interface ResponsiveRule {
  minWidth?: number;
  maxWidth?: number;
  maxDpr?: number;
  sheetWidth?: number;
  disablePhysics?: boolean;
}

export interface SubjectConfig {
  id: string;
  name: string;
  category: SubjectCategory;
  description?: string;
  renderer: RendererType;
  assets: AssetManifest;
  interactions: InteractionCapabilities;
  zones: InteractionZoneDef[];
  behaviors: BehaviorProfile;
  physics: PhysicsConfig;
  magnet?: MagnetConfig;
  performance?: PerformanceConfig;
  responsive?: ResponsiveRule[];
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ArixenPlugin {
  id: string;
  name: string;
  version?: string;
  onInit?: (ctx: {
    config: SubjectConfig;
    registerBehavior: (seq: BehaviorSequenceDef) => void;
    emitDiagnostic: (diag: Omit<EngineDiagnostic, 'id' | 'timestamp'>) => void;
  }) => void;
  onBeforeRender?: (input: { now: number; dt: number; activeState: string }) => void;
  onStateChange?: (state: string, previousState: string) => void;
  onDispose?: () => void;
}
