import type { MaterialOverride, SubjectConfig, ThreeDMaterialPreset } from '../types/config';
import type { EngineCore } from './EngineCore';

export class MaterialManager {
  private presets: ThreeDMaterialPreset[] = [];
  private activePresetId: string | null = null;
  private activeOverride: MaterialOverride | null = null;
  private hiddenLayerGroups = new Set<string>();
  private hiddenLayerIds = new Set<string>();

  constructor(config: SubjectConfig, private core: EngineCore) {
    this.presets = [...(config.assets.threeD?.materialPresets || [])];
    this.activePresetId = this.presets[0]?.id ?? null;

    if (config.assets.layers) {
      for (const layer of config.assets.layers) {
        if (layer.visible === false) {
          this.hiddenLayerIds.add(layer.id);
        }
      }
    }
  }

  getPresets(): ThreeDMaterialPreset[] {
    return [...this.presets];
  }

  getActivePresetId(): string | null {
    return this.activePresetId;
  }

  getActivePreset(): ThreeDMaterialPreset | null {
    return this.presets.find((p) => p.id === this.activePresetId) ?? null;
  }

  getActiveOverride(): MaterialOverride | null {
    return this.activeOverride ? { ...this.activeOverride } : null;
  }

  setPreset(presetId: string): ThreeDMaterialPreset | null {
    const preset = this.presets.find((p) => p.id === presetId) ?? null;
    if (!preset) return null;
    this.activePresetId = preset.id;
    this.activeOverride = null;
    this.core.emit('materialChange', { presetId: preset.id });
    return preset;
  }

  setOverride(override: MaterialOverride): void {
    this.activeOverride = { ...override };
    this.core.emit('materialChange', {
      presetId: this.activePresetId,
      override: this.activeOverride,
    });
  }

  toggleLayerGroup(group: string, visible?: boolean): boolean {
    const currentlyHidden = this.hiddenLayerGroups.has(group);
    const nextVisible = visible ?? currentlyHidden;
    if (nextVisible) {
      this.hiddenLayerGroups.delete(group);
    } else {
      this.hiddenLayerGroups.add(group);
    }
    return nextVisible;
  }

  toggleLayer(layerId: string, visible?: boolean): boolean {
    const currentlyHidden = this.hiddenLayerIds.has(layerId);
    const nextVisible = visible ?? currentlyHidden;
    if (nextVisible) {
      this.hiddenLayerIds.delete(layerId);
    } else {
      this.hiddenLayerIds.add(layerId);
    }
    return nextVisible;
  }

  isLayerVisible(layerId: string, layerGroup?: string): boolean {
    if (this.hiddenLayerIds.has(layerId)) return false;
    if (layerGroup && this.hiddenLayerGroups.has(layerGroup)) return false;
    return true;
  }

  getHiddenLayerGroups(): string[] {
    return Array.from(this.hiddenLayerGroups);
  }

  reset(config: SubjectConfig): void {
    this.activePresetId = this.presets[0]?.id ?? null;
    this.activeOverride = null;
    this.hiddenLayerGroups.clear();
    this.hiddenLayerIds.clear();
    if (config.assets.layers) {
      for (const layer of config.assets.layers) {
        if (layer.visible === false) {
          this.hiddenLayerIds.add(layer.id);
        }
      }
    }
  }
}
