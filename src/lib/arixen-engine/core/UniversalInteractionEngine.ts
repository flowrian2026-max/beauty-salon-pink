import type {
  ArixenPlugin,
  BehaviorSequenceDef,
  CameraPresetDef,
  ConfigValidationResult,
  EngineDiagnostic,
  EngineStatus,
  InteractionCapabilities,
  InteractionZoneDef,
  MaterialOverride,
  SubjectConfig,
  ThreeDMaterialPreset,
} from '../types/config';
import type { EngineEventListener, EngineEventName, EngineTelemetry } from '../types/events';
import { AnimationController } from './AnimationController';
import { AssetManager } from './AssetManager';
import { BehaviorManager } from './BehaviorManager';
import { DiagnosticsManager } from './DiagnosticsManager';
import { EngineCore } from './EngineCore';
import { ExperienceConfig } from './ExperienceConfig';
import { InteractionController } from './InteractionController';
import { InteractionZoneManager } from './InteractionZoneManager';
import { MaterialManager } from './MaterialManager';
import { PerformanceManager } from './PerformanceManager';
import { PhysicsController } from './PhysicsController';
import { PluginManager } from './PluginManager';
import { SceneCameraController } from './SceneCameraController';
import { SubjectManager } from './SubjectManager';
import { RendererManager, type RendererFactory } from '../renderers/RendererManager';

export interface EngineMountOptions {
  magnetTarget?: HTMLElement | null;
  plugins?: ArixenPlugin[];
}

export class UniversalInteractionEngine {
  private config: SubjectConfig;
  private validation: ConfigValidationResult;
  private status: EngineStatus = 'idle';

  private core: EngineCore;
  private diagnostics: DiagnosticsManager;
  private subject: SubjectManager;
  private assets: AssetManager;
  private rendererManager: RendererManager;
  private animation: AnimationController;
  private behavior: BehaviorManager;
  private physics: PhysicsController;
  private zones: InteractionZoneManager;
  private materials: MaterialManager;
  private sceneCamera: SceneCameraController;
  private performance: PerformanceManager;
  private plugins: PluginManager;
  private interactions: InteractionController | null = null;

  private container: HTMLElement | null = null;
  private mounted = false;
  private disposed = false;
  private onHead = false;
  private lastPointerDx = 0;
  private lastPointerDy = 0;
  private lastPointerU = 0.5;
  private lastPointerV = 0.5;
  private proximityIntensity = 0;

  static registerRenderer(type: string, factory: RendererFactory): void {
    RendererManager.registerRenderer(type, factory);
  }

  constructor(rawConfig: SubjectConfig) {
    this.core = new EngineCore();
    this.diagnostics = new DiagnosticsManager(this.core);
    this.setStatus('validating');

    this.validation = ExperienceConfig.validate(
      rawConfig,
      RendererManager.getRegisteredCustomTypes()
    );
    this.config = ExperienceConfig.normalize(rawConfig);

    for (const err of this.validation.errors) {
      this.diagnostics.error('ExperienceConfig', 'CONFIG_VALIDATION_ERROR', err);
    }
    for (const warn of this.validation.warnings) {
      this.diagnostics.warn('ExperienceConfig', 'CONFIG_VALIDATION_WARNING', warn);
    }

    this.subject = new SubjectManager(this.config);
    this.assets = new AssetManager(this.core, this.diagnostics);
    if (this.config.assets?.assetBaseUrl) {
      this.assets.setBaseUrl(this.config.assets.assetBaseUrl);
    }
    this.rendererManager = new RendererManager();
    this.animation = new AnimationController();
    this.behavior = new BehaviorManager(this.config, this.core, this.animation);
    this.physics = new PhysicsController(this.config.physics);
    this.zones = new InteractionZoneManager(
      this.config.zones || [],
      this.config.physics?.alphaHitTestThreshold ?? 40
    );
    this.materials = new MaterialManager(this.config, this.core);
    this.sceneCamera = new SceneCameraController(this.config, this.core);
    this.performance = new PerformanceManager(this.config.performance);
    this.plugins = new PluginManager();

    this.setStatus(this.validation.valid ? 'idle' : 'error');
  }

  private setStatus(next: EngineStatus): void {
    if (this.status === next) return;
    const prev = this.status;
    this.status = next;
    this.core.emit('statusChange', { status: next, previousStatus: prev });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getValidation(): ConfigValidationResult {
    return this.validation;
  }

  getDiagnostics(): EngineDiagnostic[] {
    return this.diagnostics.getAll();
  }

  getConfig(): SubjectConfig {
    return this.config;
  }

  getZones(): InteractionZoneDef[] {
    return this.zones.getZones();
  }

  getMaterialPresets(): ThreeDMaterialPreset[] {
    return this.materials.getPresets();
  }

  getCameraPresets(): CameraPresetDef[] {
    return this.sceneCamera.getPresets();
  }

  getAssetProgress() {
    return this.assets.getStats();
  }

  on<K extends EngineEventName>(event: K, listener: EngineEventListener<K>): () => void {
    return this.core.on(event, listener);
  }

  registerPlugin(plugin: ArixenPlugin): void {
    if (this.disposed) return;
    this.plugins.register(plugin, {
      config: this.config,
      registerBehavior: (seq) => this.registerBehavior(seq),
      emitDiagnostic: (diag) =>
        this.diagnostics.record(diag.severity, diag.source, diag.code, diag.message, diag.details),
    });
  }

  registerBehavior(sequence: BehaviorSequenceDef): void {
    this.behavior.registerBehavior(sequence);
  }

  async mount(container: HTMLElement, options: EngineMountOptions = {}): Promise<void> {
    if (this.disposed) return;

    if (!this.validation.valid) {
      this.setStatus('error');
      this.diagnostics.error(
        'UniversalInteractionEngine',
        'MOUNT_BLOCKED_INVALID_CONFIG',
        `Cannot mount "${this.config.id || 'unknown'}": ${this.validation.errors.join(' | ')}`
      );
      return;
    }

    // Prevent duplicate mount/RAF loops on the same engine instance
    if (this.mounted) {
      this.unmountRuntime();
    }

    this.setStatus('mounting');
    this.container = container;
    this.core.observeVisibility(container, this.config.performance?.pauseWhenHidden ?? true);

    if (options.plugins) {
      for (const plugin of options.plugins) {
        this.registerPlugin(plugin);
      }
    }

    try {
      const adapter = await this.rendererManager.mount({
        container,
        config: this.config,
        assets: this.assets,
        physics: this.physics,
        zones: this.zones,
        performance: this.performance,
        materials: this.materials,
        sceneCamera: this.sceneCamera,
        diagnostics: this.diagnostics,
        onHotspotSelect: (id, label, description) => {
          this.core.emit('hotspotSelect', { id, label, description });
        },
        onFirstAssetReady: () => {
          this.behavior.markReady(performance.now());
          this.setStatus('ready');
          this.core.emit('ready', {
            subjectId: this.config.id,
            renderer: this.config.renderer,
          });
        },
      });

      if (this.disposed) return;

      this.interactions = new InteractionController(
        container,
        options.magnetTarget ?? null,
        this.subject.getCapabilities(),
        this.config.magnet,
        {
          toSurfaceUv: (cx, cy) => adapter.toSurfaceUv(cx, cy),
          canStartDrag: (u, v) => {
            const caps = this.subject.getCapabilities();
            if (!caps.drag && !caps.click) return false;
            if (this.config.renderer === 'three-d') return false;
            if (this.config.physics.mode === 'soft-body-mesh') {
              return this.zones.isSolidAt(u, v);
            }
            return true;
          },
          hitTestZone: (u, v) => {
            const useAlpha = this.config.physics.mode === 'soft-body-mesh';
            if (this.config.renderer === 'three-d') {
              const part = adapter.hitTestPart?.(u, v);
              return part ? this.zones.findZoneByObjectName(part) : null;
            }
            return this.zones.hitTest(u, v, useAlpha);
          },
          onPointerMove: (ptr, proximity) => {
            const now = performance.now();
            this.lastPointerU = ptr.u;
            this.lastPointerV = ptr.v;
            this.lastPointerDx = ptr.dx;
            this.lastPointerDy = ptr.dy;
            this.proximityIntensity = proximity;

            this.behavior.wake(now);
            const pressed = this.interactions?.drag.isDragging() ?? false;
            this.behavior.interruptIdle(now, pressed);

            const useAlpha = this.config.physics.mode === 'soft-body-mesh';
            this.onHead = useAlpha
              ? this.zones.isSolidAt(ptr.u, ptr.v)
              : this.zones.hitTest(ptr.u, ptr.v) !== null;

            if (this.container) {
              const hoverZone = this.interactions?.hover.getActiveZone();
              this.container.style.cursor = pressed
                ? 'grabbing'
                : hoverZone?.cursor ||
                  (this.onHead && this.subject.getCapabilities().drag ? 'grab' : '');
            }

            if (
              this.onHead &&
              !pressed &&
              this.physics.isEnabled() &&
              this.config.physics.mode === 'soft-body-mesh'
            ) {
              this.physics.poke(ptr.u, ptr.v, ptr.dx * 0.00035, ptr.dy * 0.00035, 0.07);
            }

            if (pressed && this.physics.getBrush()) {
              this.physics.updateHold(ptr.u, ptr.v);
            }
          },
          onPointerLeave: () => {
            if (this.container) this.container.style.cursor = '';
          },
          onZoneEnter: (zone) => {
            this.core.emit('zoneEnter', { zone });
          },
          onZoneLeave: (zone) => {
            this.core.emit('zoneLeave', { zone });
          },
          onExternalHoverChange: (entering) => {
            this.behavior.handleExternalHover(entering, performance.now());
          },
          onDragStart: (u, v) => {
            const now = performance.now();
            this.behavior.wake(now);
            this.behavior.stopSequence();
            this.behavior.clearMood();
            if (this.subject.getCapabilities().drag) {
              this.physics.takeHold(u, v);
              if (this.container) this.container.style.cursor = 'grabbing';
            }
          },
          onDragMove: (u, v) => {
            if (this.subject.getCapabilities().drag && this.physics.getBrush()) {
              this.physics.updateHold(u, v);
            }
          },
          onDragEnd: ({ startU, startV, heldMs }) => {
            const now = performance.now();
            const pullLength = this.physics.getPullMagnitude();
            this.physics.releaseHold();
            if (this.container) {
              this.container.style.cursor = this.onHead ? 'grab' : '';
            }

            const caps = this.subject.getCapabilities();
            if (pullLength < 0.03 && heldMs < 380 && caps.click) {
              this.handleTapAt(startU, startV, now);
              return;
            }
            if (caps.drag) {
              this.behavior.handleDragRelease(pullLength, now);
            }
          },
          onTap: (u, v) => {
            this.handleTapAt(u, v, performance.now());
          },
          onTouchGesture: (gesture) => {
            const now = performance.now();
            this.behavior.wake(now);
            if (gesture.type === 'tap' && this.subject.getCapabilities().click) {
              this.handleTapAt(gesture.u, gesture.v, now);
            } else if (gesture.type === 'swipe' && this.subject.getCapabilities().swipe) {
              if (gesture.direction === 'left' || gesture.direction === 'right') {
                const groups = Object.keys(this.config.behaviors.variants || {});
                if (groups[0]) this.behavior.cycleVariant(groups[0]);
              }
            } else if (
              gesture.type === 'pinch' &&
              (this.subject.getCapabilities().pinchZoom ?? true) &&
              gesture.scale
            ) {
              this.sceneCamera.setZoomMultiplier(gesture.scale);
              adapter.applyPinchZoom?.(gesture.scale);
            }
            adapter.onTouchGesture?.(gesture);
          },
          onScrollActivity: () => {
            this.behavior.wake(performance.now());
          },
        }
      );

      // Keyboard accessibility controls when container or child receives focus
      const onKeyDown = (e: KeyboardEvent) => {
        if (!(this.subject.getCapabilities().keyboard ?? true)) return;
        const now = performance.now();
        this.behavior.wake(now);

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.lastPointerU = Math.max(0.05, this.lastPointerU - 0.08);
            adapter.nudgeView?.(-0.18, 0);
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.lastPointerU = Math.min(0.95, this.lastPointerU + 0.08);
            adapter.nudgeView?.(0.18, 0);
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.lastPointerV = Math.max(0.05, this.lastPointerV - 0.08);
            adapter.nudgeView?.(0, -0.14);
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.lastPointerV = Math.min(0.95, this.lastPointerV + 0.08);
            adapter.nudgeView?.(0, 0.14);
            break;
          case 'r':
          case 'R':
            this.reset();
            break;
          case 'Enter':
          case ' ': {
            if (e.target === container) {
              e.preventDefault();
              const seqIds = Object.keys(this.config.behaviors.sequences || {});
              if (seqIds[0]) this.triggerBehavior(seqIds[0]);
            }
            break;
          }
          case '1':
          case '2':
          case '3':
          case '4': {
            const presets = this.sceneCamera.getPresets();
            const idx = Number(e.key) - 1;
            if (presets[idx]) this.setCameraPreset(presets[idx].id);
            break;
          }
        }
      };
      container.addEventListener('keydown', onKeyDown);
      this.core.registerCleanup(() => container.removeEventListener('keydown', onKeyDown));

      // Attach click listener for 3D raycast hotspots
      if (this.config.renderer === 'three-d') {
        const onThreeClick = (e: MouseEvent) => {
          if (!this.subject.getCapabilities().click) return;
          const [u, v] = adapter.toSurfaceUv(e.clientX, e.clientY);
          const part = adapter.onZoneClick?.(u, v);
          if (part) {
            const zone = this.zones.findZoneByObjectName(part);
            if (zone) {
              this.core.emit('zoneClick', { zone, u, v });
              this.applyZoneAction(zone, performance.now());
            }
          }
        };
        container.addEventListener('click', onThreeClick);
        this.core.registerCleanup(() => container.removeEventListener('click', onThreeClick));
      }

      this.mounted = true;
      if (this.status !== 'ready') {
        this.setStatus('ready');
      }

      this.core.startLoop((now, dt) => {
        if (!this.mounted || this.disposed) return;

        const kinematics = this.interactions?.pointer.stepKinematics(dt) ?? {
          speed: 0,
          shake: 0,
        };
        const pressed = this.interactions?.drag.isDragging() ?? false;
        const pullLength = this.physics.getPullMagnitude();
        const startUv = this.interactions?.drag.getStartUv() ?? [0.5, 0.5];
        const downZone = pressed
          ? this.zones.hitTest(startUv[0], startUv[1], this.config.physics.mode === 'soft-body-mesh')
          : null;

        const hoverZone = this.interactions?.hover.getActiveZone() ?? null;
        const hoverDurationMs = this.interactions?.hover.getHoverDurationMs(now) ?? 0;
        const scrollingDown = this.interactions?.scroll.isScrolling(now) ?? false;

        const behaviorOut = this.behavior.evaluateFrame({
          now,
          reducedMotion:
            (this.config.performance?.respectReducedMotion ?? true) && this.core.isReducedMotion(),
          pressed,
          pullLength,
          downZoneId: downZone?.id ?? null,
          hoverZone,
          hoverDurationMs,
          shakeIntensity: kinematics.shake,
          pu: this.lastPointerU,
          pv: this.lastPointerV,
          scrollingDown,
        });

        if (behaviorOut.joltToApply) {
          this.physics.poke(...behaviorOut.joltToApply);
        }

        const stateRes = this.subject.setState(behaviorOut.logicalState);
        if (stateRes.changed) {
          this.plugins.notifyStateChange(behaviorOut.logicalState, stateRes.previous);
          this.core.emit('stateChange', {
            state: behaviorOut.logicalState,
            previousState: stateRes.previous,
          });
        }

        this.plugins.notifyBeforeRender({
          now,
          dt,
          activeState: behaviorOut.logicalState,
        });

        this.rendererManager.render({
          now,
          dt,
          behavior: behaviorOut,
          pointer: {
            u: this.lastPointerU,
            v: this.lastPointerV,
            shake: kinematics.shake,
            speed: kinematics.speed,
          },
          proximity: this.proximityIntensity,
          pressed,
          reducedMotion:
            (this.config.performance?.respectReducedMotion ?? true) && this.core.isReducedMotion(),
        });

        if (this.performance.recordFrame(now, dt)) {
          this.core.emit('telemetry', this.getTelemetry());
        }
      });
    } catch (err) {
      this.setStatus('error');
      this.diagnostics.error(
        'UniversalInteractionEngine',
        'MOUNT_FAILURE',
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  private applyZoneAction(zone: InteractionZoneDef, now: number): {
    jolt?: [number, number, number, number, number];
  } {
    const action = zone.clickAction;
    if (action?.type === 'toggle-layer') {
      this.materials.toggleLayerGroup(action.target);
    } else if (action?.type === 'set-camera') {
      this.setCameraPreset(action.target);
    } else if (action?.type === 'set-material') {
      this.setMaterialPreset(action.target);
    }
    return this.behavior.handleZoneClick(zone, now);
  }

  private handleTapAt(u: number, v: number, now: number): void {
    const useAlpha = this.config.physics.mode === 'soft-body-mesh';
    const zone = this.zones.hitTest(u, v, useAlpha);
    if (!zone) {
      if (this.config.renderer === 'three-d') {
        this.rendererManager.getAdapter()?.onZoneClick?.(u, v);
      }
      return;
    }

    this.core.emit('zoneClick', { zone, u, v });
    if (zone.description) {
      this.core.emit('hotspotSelect', {
        id: zone.id,
        label: zone.label,
        description: zone.description,
      });
    }
    const { jolt } = this.applyZoneAction(zone, now);
    if (jolt) {
      this.physics.poke(...jolt);
    } else {
      this.physics.poke(u, v, 0, 0.5, 0.06);
    }
  }

  private unmountRuntime(): void {
    this.core.stopLoop();
    this.interactions?.dispose();
    this.interactions = null;
    this.rendererManager.dispose();
    this.mounted = false;
  }

  // ---- Public Developer API ----

  setCapability<K extends keyof InteractionCapabilities>(
    key: K,
    value: InteractionCapabilities[K]
  ): void {
    const patch = { [key]: value } as Partial<InteractionCapabilities>;
    this.subject.updateCapabilities(patch);
    this.interactions?.updateCapabilities(patch);
    if (key === 'drag') {
      this.rendererManager.getAdapter()?.setDragEnabled?.(Boolean(value));
    }
  }

  setPointerSensitivity(sensitivity: number): void {
    this.setCapability('pointerSensitivity', sensitivity);
  }

  setAnimationSpeed(speed: number): void {
    this.animation.setSpeedMultiplier(speed);
  }

  setPhysicsEnabled(enabled: boolean): void {
    this.physics.setEnabled(enabled);
  }

  setPhysicsStrength(strength: number): void {
    this.physics.setInteractionStrength(strength);
  }

  setMagnetStrength(strength: number): void {
    this.interactions?.magnet?.updateConfig({ strength });
  }

  setMagnetEnabled(enabled: boolean): void {
    this.setCapability('magnet', enabled);
  }

  setIdleEnabled(enabled: boolean): void {
    this.behavior.setIdleEnabled(enabled);
  }

  triggerBehavior(behaviorId: string): boolean {
    const now = performance.now();
    this.behavior.wake(now);
    return this.behavior.triggerSequence(behaviorId, now, 35);
  }

  setMaterialPreset(presetId: string): void {
    this.materials.setPreset(presetId);
    this.behavior.setMaterialPreset(presetId);
    this.rendererManager.getAdapter()?.setMaterialPreset?.(presetId);
  }

  setMaterialOverride(override: MaterialOverride | null): void {
    if (override) {
      this.materials.setOverride(override);
    }
    this.rendererManager.getAdapter()?.applyMaterialOverride?.(override);
  }

  toggleLayerGroup(group: string, visible?: boolean): boolean {
    return this.materials.toggleLayerGroup(group, visible);
  }

  setCameraPreset(presetId: string): boolean {
    const preset = this.sceneCamera.setPreset(presetId);
    if (!preset) return false;
    this.rendererManager.getAdapter()?.setCameraPreset?.(presetId);
    return true;
  }

  setPanEnabled(enabled: boolean): void {
    this.sceneCamera.setPanEnabled(enabled);
    this.rendererManager.getAdapter()?.setPanEnabled?.(enabled);
  }

  setZoomEnabled(enabled: boolean): void {
    this.sceneCamera.setZoomEnabled(enabled);
    this.rendererManager.getAdapter()?.setZoomEnabled?.(enabled);
  }

  setAutoRotate(enabled: boolean): void {
    this.sceneCamera.setAutoRotate(enabled);
    this.rendererManager.getAdapter()?.setAutoRotate?.(enabled);
  }

  setEnvironmentPreset(preset: 'studio' | 'warm' | 'cool' | 'dramatic'): void {
    this.sceneCamera.setEnvironmentPreset(preset);
    this.rendererManager.getAdapter()?.setEnvironmentPreset?.(preset);
  }

  cycleVariant(group: string): { value: string | null; index: number } {
    return this.behavior.cycleVariant(group);
  }

  reset(): void {
    const now = performance.now();
    this.subject.reset();
    this.behavior.reset(now);
    this.physics.reset();
    this.materials.reset(this.config);
    this.sceneCamera.reset(this.config);
    this.rendererManager.getAdapter()?.reset?.();
    this.performance.reset();
  }

  getTelemetry(): EngineTelemetry {
    const perf = this.performance.getMetrics();
    const assetStats = this.assets.getStats();
    return {
      status: this.status,
      fps: perf.fps,
      frameTimeMs: perf.frameTimeMs,
      qualityScale: perf.qualityScale,
      rendererType: this.config.renderer,
      activeBehavior: this.behavior.getActiveBehaviorId(),
      activeState: this.behavior.getLogicalState(),
      activeZone: this.interactions?.hover.getActiveZone()?.id ?? null,
      activeMaterialPresetId: this.materials.getActivePresetId(),
      activeCameraPresetId: this.sceneCamera.getActivePresetId(),
      loadedAssets: assetStats.loaded,
      totalAssets: assetStats.total,
      failedAssets: assetStats.failed,
      assetProgressPct: assetStats.progressPct,
      physicsStepsPerFrame: this.physics.getStepsPerFrame(),
      isVisible: this.core.isVisible(),
      reducedMotion: this.core.isReducedMotion(),
      pointerU: Number(this.lastPointerU.toFixed(2)),
      pointerV: Number(this.lastPointerV.toFixed(2)),
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mounted = false;

    this.setStatus('disposed');
    this.core.emit('dispose', { subjectId: this.config.id });
    this.plugins.disposeAll();
    this.interactions?.dispose();
    this.interactions = null;
    this.rendererManager.dispose();
    this.assets.dispose();
    this.physics.reset();
    this.zones.clearAlphaMask();
    this.core.dispose();
    if (this.container) {
      this.container.style.cursor = '';
      this.container = null;
    }
  }
}

export async function createExperience(
  container: HTMLElement | null,
  config: SubjectConfig,
  options: EngineMountOptions = {}
): Promise<UniversalInteractionEngine> {
  const engine = new UniversalInteractionEngine(config);
  if (container) {
    await engine.mount(container, options);
  }
  return engine;
}
