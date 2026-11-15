import type {
  EngineDiagnostic,
  EngineStatus,
  InteractionZoneDef,
  MaterialOverride,
  RendererType,
} from './config';

export interface NormalizedPointer {
  /** Normalized viewport/surface X in [0, 1] */
  u: number;
  /** Normalized viewport/surface Y in [0, 1] */
  v: number;
  /** Centered coordinates in [-1, 1] */
  nx: number;
  /** Centered coordinates in [-1, 1] */
  ny: number;
  /** Client pixels */
  clientX: number;
  clientY: number;
  /** Delta pixels */
  dx: number;
  dy: number;
  speed: number;
  isTouch: boolean;
}

export interface TouchGesturePayload {
  type: 'tap' | 'drag' | 'swipe' | 'pinch';
  u: number;
  v: number;
  deltaX?: number;
  deltaY?: number;
  scale?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  touchCount: number;
}

export interface EngineTelemetry {
  status: EngineStatus;
  fps: number;
  frameTimeMs: number;
  qualityScale: number;
  rendererType: RendererType;
  activeBehavior: string | null;
  activeState: string;
  activeZone: string | null;
  activeMaterialPresetId: string | null;
  activeCameraPresetId: string | null;
  loadedAssets: number;
  totalAssets: number;
  failedAssets: number;
  assetProgressPct: number;
  physicsStepsPerFrame: number;
  isVisible: boolean;
  reducedMotion: boolean;
  pointerU: number;
  pointerV: number;
}

export interface EngineEventMap {
  statusChange: { status: EngineStatus; previousStatus: EngineStatus };
  ready: { subjectId: string; renderer: RendererType };
  stateChange: { state: string; previousState: string };
  behaviorStart: { behaviorId: string; priority: number };
  behaviorEnd: { behaviorId: string };
  zoneEnter: { zone: InteractionZoneDef };
  zoneLeave: { zone: InteractionZoneDef };
  zoneClick: { zone: InteractionZoneDef; u: number; v: number };
  variantChange: { group: string; value: string; index: number };
  materialChange: { presetId: string | null; override?: MaterialOverride };
  cameraPresetChange: { presetId: string; label: string };
  hotspotSelect: { id: string; label: string; description?: string };
  assetProgress: { loaded: number; total: number; progressPct: number; key: string };
  assetError: { key: string; url: string; reason: string };
  diagnostic: EngineDiagnostic;
  telemetry: EngineTelemetry;
  dispose: { subjectId: string };
}

export type EngineEventName = keyof EngineEventMap;
export type EngineEventListener<K extends EngineEventName> = (payload: EngineEventMap[K]) => void;
