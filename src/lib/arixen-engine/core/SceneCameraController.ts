import type { CameraPresetDef, SubjectConfig } from '../types/config';
import type { EngineCore } from './EngineCore';

export class SceneCameraController {
  private presets: CameraPresetDef[] = [];
  private activePresetId: string | null = null;
  private panEnabled: boolean;
  private zoomEnabled: boolean;
  private autoRotate: boolean;
  private environmentPreset: 'studio' | 'warm' | 'cool' | 'dramatic';
  private zoomMultiplier = 1;

  constructor(config: SubjectConfig, private core: EngineCore) {
    const threeD = config.assets.threeD;
    this.presets = [...(threeD?.cameraPresets || [])];
    this.activePresetId = this.presets[0]?.id ?? null;
    this.panEnabled = threeD?.enablePan ?? true;
    this.zoomEnabled = threeD?.enableZoom ?? true;
    this.autoRotate = threeD?.autoRotate ?? false;
    this.environmentPreset = threeD?.environmentPreset ?? 'studio';
  }

  getPresets(): CameraPresetDef[] {
    return [...this.presets];
  }

  getActivePresetId(): string | null {
    return this.activePresetId;
  }

  getActivePreset(): CameraPresetDef | null {
    return this.presets.find((p) => p.id === this.activePresetId) ?? null;
  }

  setPreset(presetId: string): CameraPresetDef | null {
    const preset = this.presets.find((p) => p.id === presetId) ?? null;
    if (!preset) return null;
    this.activePresetId = preset.id;
    this.core.emit('cameraPresetChange', { presetId: preset.id, label: preset.label });
    return preset;
  }

  setPanEnabled(enabled: boolean): void {
    this.panEnabled = enabled;
  }

  isPanEnabled(): boolean {
    return this.panEnabled;
  }

  setZoomEnabled(enabled: boolean): void {
    this.zoomEnabled = enabled;
  }

  isZoomEnabled(): boolean {
    return this.zoomEnabled;
  }

  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  isAutoRotate(): boolean {
    return this.autoRotate;
  }

  setEnvironmentPreset(preset: 'studio' | 'warm' | 'cool' | 'dramatic'): void {
    this.environmentPreset = preset;
  }

  getEnvironmentPreset(): 'studio' | 'warm' | 'cool' | 'dramatic' {
    return this.environmentPreset;
  }

  setZoomMultiplier(multiplier: number): void {
    this.zoomMultiplier = Math.max(0.55, Math.min(2.2, multiplier));
  }

  getZoomMultiplier(): number {
    return this.zoomMultiplier;
  }

  reset(config: SubjectConfig): void {
    const threeD = config.assets.threeD;
    this.activePresetId = this.presets[0]?.id ?? null;
    this.panEnabled = threeD?.enablePan ?? true;
    this.zoomEnabled = threeD?.enableZoom ?? true;
    this.autoRotate = threeD?.autoRotate ?? false;
    this.environmentPreset = threeD?.environmentPreset ?? 'studio';
    this.zoomMultiplier = 1;
  }
}
