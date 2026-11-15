import type { AssetManager } from '../core/AssetManager';
import type { BehaviorFrameOutput } from '../core/BehaviorManager';
import type { DiagnosticsManager } from '../core/DiagnosticsManager';
import type { InteractionZoneManager } from '../core/InteractionZoneManager';
import type { MaterialManager } from '../core/MaterialManager';
import type { PerformanceManager } from '../core/PerformanceManager';
import type { PhysicsController } from '../core/PhysicsController';
import type { SceneCameraController } from '../core/SceneCameraController';
import type { MaterialOverride, SubjectConfig } from '../types/config';
import type { NormalizedPointer, TouchGesturePayload } from '../types/events';

export interface RendererContext {
  container: HTMLElement;
  config: SubjectConfig;
  assets: AssetManager;
  physics: PhysicsController;
  zones: InteractionZoneManager;
  performance: PerformanceManager;
  materials?: MaterialManager;
  sceneCamera?: SceneCameraController;
  diagnostics?: DiagnosticsManager;
  onHotspotSelect?: (id: string, label: string, description?: string) => void;
  onFirstAssetReady?: () => void;
}

export interface RendererRenderInput {
  now: number;
  dt: number;
  behavior: BehaviorFrameOutput;
  pointer: { u: number; v: number; shake: number; speed: number };
  proximity: number;
  pressed: boolean;
  reducedMotion: boolean;
}

export interface RendererAdapter {
  readonly type: SubjectConfig['renderer'];
  mount(ctx: RendererContext): Promise<void>;
  render(input: RendererRenderInput): void;
  toSurfaceUv(clientX: number, clientY: number): [number, number];
  setMaterialPreset?(presetId: string): void;
  applyMaterialOverride?(override: MaterialOverride | null): void;
  setCameraPreset?(presetId: string): void;
  setPanEnabled?(enabled: boolean): void;
  setZoomEnabled?(enabled: boolean): void;
  setAutoRotate?(enabled: boolean): void;
  setEnvironmentPreset?(preset: 'studio' | 'warm' | 'cool' | 'dramatic'): void;
  applyPinchZoom?(scaleFactor: number): void;
  nudgeView?(dx: number, dy: number): void;
  setDragEnabled?(enabled: boolean): void;
  onPointerMove?(pointer: NormalizedPointer): void;
  onTouchGesture?(gesture: TouchGesturePayload): void;
  onZoneClick?(u: number, v: number): string | null;
  hitTestPart?(u: number, v: number): string | null;
  reset?(): void;
  dispose(): void;
}
