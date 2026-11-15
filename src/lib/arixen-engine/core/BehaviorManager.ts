import type { BehaviorProfile, InteractionZoneDef, SubjectConfig } from '../types/config';
import { AnimationController, type PropTransform } from './AnimationController';
import type { EngineCore } from './EngineCore';

export interface BehaviorFrameOutput {
  logicalState: string;
  crossfadeMs: number;
  directionalFrame: string | null;
  activeVariants: Record<string, string | null>;
  leanOffset: [number, number];
  materialPresetId: string | null;
  cameraPresetId: string | null;
  spriteSequence: string | null;
  layerOverrides: Record<string, { offsetX?: number; offsetY?: number; scale?: number; opacity?: number; rotation?: number }> | null;
  cameraOffset: [number, number, number] | null;
  props: PropTransform[];
  joltToApply: [number, number, number, number, number] | null;
}

export class BehaviorManager {
  private profile: BehaviorProfile;
  private animation: AnimationController;
  private core: EngineCore;

  private awake: boolean;
  private lastInputMs = -1e9;
  private startTimeMs = 0;
  private nextIdleMs = 30000;
  private idleRotationQueue: string[] = [];
  private idleEnabled: boolean;

  private currentPriority = 0;
  private activeSequenceId: string | null = null;
  private logicalState: string;
  private crossfadeMs = 70;

  private moodState: string | null = null;
  private moodUntilMs = 0;
  private pullTimestamps: number[] = [];

  private nextBlinkMs = 0;
  private blinkStep = -1;
  private blinkStartMs = 0;
  private currentDirectionalFrame: string | null = null;

  private variantIndices: Record<string, number> = {};
  private activeMaterialPresetId: string | null = null;

  constructor(config: SubjectConfig, core: EngineCore, animation: AnimationController) {
    this.profile = config.behaviors;
    this.core = core;
    this.animation = animation;
    this.idleEnabled = config.behaviors.idleEnabled;
    this.logicalState = config.behaviors.initialState;
    this.awake = !config.behaviors.wakeOnFirstInput;
    this.nextIdleMs = this.pickIdleDelay();

    if (config.behaviors.variants) {
      for (const [k, v] of Object.entries(config.behaviors.variants)) {
        this.variantIndices[k] = v.currentIndex;
      }
    }

    if (config.assets.threeD?.materialPresets?.[0]) {
      this.activeMaterialPresetId = config.assets.threeD.materialPresets[0].id;
    }
  }

  markReady(now: number): void {
    this.startTimeMs = now;
  }

  registerBehavior(seq: BehaviorProfile['sequences'][string]): void {
    if (!seq?.id) return;
    this.profile.sequences[seq.id] = seq;
  }

  setIdleEnabled(enabled: boolean): void {
    this.idleEnabled = enabled;
    if (!enabled && this.currentPriority === 0 && this.activeSequenceId) {
      this.stopSequence();
    }
  }

  getActiveBehaviorId(): string | null {
    return this.activeSequenceId;
  }

  getLogicalState(): string {
    return this.logicalState;
  }

  getVariantState(group: string): { value: string | null; index: number } {
    const cfg = this.profile.variants?.[group];
    if (!cfg) return { value: null, index: -1 };
    const idx = this.variantIndices[group] ?? -1;
    return {
      value: idx >= 0 && idx < cfg.values.length ? cfg.values[idx] : null,
      index: idx,
    };
  }

  cycleVariant(group: string): { value: string | null; index: number } {
    const cfg = this.profile.variants?.[group];
    if (!cfg || cfg.values.length === 0) return { value: null, index: -1 };
    const prev = this.variantIndices[group] ?? -1;
    const next = prev + 1 >= cfg.values.length ? -1 : prev + 1;
    this.variantIndices[group] = next;
    const val = next >= 0 ? cfg.values[next] : 'default';
    this.core.emit('variantChange', { group, value: val, index: next });
    return { value: next >= 0 ? cfg.values[next] : null, index: next };
  }

  setMaterialPreset(presetId: string): void {
    this.activeMaterialPresetId = presetId;
  }

  getMaterialPreset(): string | null {
    return this.activeMaterialPresetId;
  }

  wake(now: number): void {
    this.lastInputMs = now;
    if (!this.awake) {
      this.awake = true;
      const [minB, maxB] = this.profile.blinkConfig?.intervalRangeMs ?? [2200, 5600];
      this.nextBlinkMs = now + Math.min(1600, minB);
      if (this.profile.wakeTransitionState && this.profile.directionalGaze) {
        this.currentDirectionalFrame = this.profile.wakeTransitionState;
        setTimeout(() => {
          if (this.awake) {
            this.currentDirectionalFrame = this.profile.directionalGaze?.neutralFrame ?? 'rest';
          }
        }, 110);
      }
      if (maxB < minB) {
        this.nextBlinkMs = now + 1600;
      }
    }
    this.nextIdleMs = this.pickIdleDelay();
  }

  triggerSequence(sequenceId: string, now: number, forcePriority?: number): boolean {
    const seq = this.profile.sequences[sequenceId];
    if (!seq) return false;

    const priority = forcePriority ?? seq.priority;
    const active = this.animation.getActiveSequence();
    if (active && priority < this.currentPriority && !active.interruptible) {
      return false;
    }

    this.currentPriority = priority;
    this.activeSequenceId = seq.id;
    const firstStep = this.animation.start(seq, now);
    this.core.emit('behaviorStart', { behaviorId: seq.id, priority });

    if (firstStep?.materialPresetId) {
      this.activeMaterialPresetId = firstStep.materialPresetId;
    }
    return true;
  }

  interruptIdle(now: number, isPressed: boolean): void {
    if (!this.activeSequenceId || isPressed) return;
    const active = this.animation.getActiveSequence();
    if (!active) return;

    if (active.id === 'doze') {
      this.animation.jumpToLastStep(now);
      return;
    }

    if (active.interruptible && this.currentPriority <= 10) {
      this.stopSequence();
    }
  }

  stopSequence(): void {
    if (!this.activeSequenceId) return;
    this.animation.stop();
    this.activeSequenceId = null;
    this.currentPriority = 0;
    this.core.emit('behaviorEnd', { behaviorId: '' });
  }

  triggerMood(state: string, durationMs: number, now: number): void {
    this.moodState = state;
    this.moodUntilMs = now + durationMs;
  }

  clearMood(): void {
    this.moodState = null;
    this.moodUntilMs = 0;
  }

  handleExternalHover(entering: boolean, now: number): void {
    const rx = this.profile.externalHoverReaction;
    if (!rx) return;
    if (entering) {
      this.triggerMood(rx.enterState, 1e7, now);
    } else {
      this.triggerMood(rx.leaveState, rx.leaveDurationMs ?? 700, now);
    }
  }

  handleZoneClick(zone: InteractionZoneDef, now: number): { jolt?: [number, number, number, number, number] } {
    const action = zone.clickAction;
    if (!action) return {};

    switch (action.type) {
      case 'cycle-variant':
        this.cycleVariant(action.target);
        break;
      case 'trigger-behavior':
        this.triggerSequence(action.target, now, 30);
        break;
      case 'set-state':
        this.triggerMood(action.target, action.durationMs ?? 1100, now);
        break;
      case 'set-material':
        this.setMaterialPreset(action.target);
        break;
    }
    return { jolt: action.jolt };
  }

  handleDragRelease(pullLength: number, now: number): void {
    const windowMs = this.profile.pullWindowMs ?? 14000;
    this.pullTimestamps = this.pullTimestamps.filter((t) => now - t < windowMs);
    this.pullTimestamps.push(now);
    const count = this.pullTimestamps.length;

    if (this.profile.pullCountMoods) {
      const sorted = [...this.profile.pullCountMoods].sort((a, b) => b.minCount - a.minCount);
      for (const rule of sorted) {
        if (count >= rule.minCount) {
          this.triggerMood(rule.state, rule.durationMs, now);
          return;
        }
      }
    }

    if (this.profile.releasePullMoods) {
      const sorted = [...this.profile.releasePullMoods].sort((a, b) => b.minPull - a.minPull);
      for (const rule of sorted) {
        if (pullLength > rule.minPull) {
          this.triggerMood(rule.state, 700 + pullLength * 2800, now);
          return;
        }
      }
    }
  }

  evaluateFrame(params: {
    now: number;
    reducedMotion: boolean;
    pressed: boolean;
    pullLength: number;
    downZoneId: string | null;
    hoverZone: InteractionZoneDef | null;
    hoverDurationMs: number;
    shakeIntensity: number;
    pu: number;
    pv: number;
    scrollingDown: boolean;
  }): BehaviorFrameOutput {
    const {
      now,
      reducedMotion,
      pressed,
      pullLength,
      downZoneId,
      hoverZone,
      hoverDurationMs,
      shakeIntensity,
      pu,
      pv,
      scrollingDown,
    } = params;

    let joltToApply: [number, number, number, number, number] | null = null;
    let leanOffset: [number, number] = [0, 0];
    let wantDirectionalOverride: string | null = null;
    let materialPresetId = this.activeMaterialPresetId;
    let cameraPresetId: string | null = null;
    let spriteSequence: string | null = null;
    let layerOverrides: BehaviorFrameOutput['layerOverrides'] = null;
    let cameraOffset: [number, number, number] | null = null;

    // 1. Evaluate active behavior sequence or start idle act
    if (this.activeSequenceId) {
      const evalRes = this.animation.evaluate(now);
      if (!evalRes || evalRes.completed) {
        this.activeSequenceId = null;
        this.currentPriority = 0;
        this.core.emit('behaviorEnd', { behaviorId: evalRes?.sequenceId ?? '' });
      } else {
        const step = evalRes.step;
        if (evalRes.isNewStep && step.jolt) {
          joltToApply = step.jolt;
        }
        if (step.lean) leanOffset = step.lean;
        if (step.materialPresetId) {
          this.activeMaterialPresetId = step.materialPresetId;
          materialPresetId = step.materialPresetId;
        }
        if (step.cameraPresetId) cameraPresetId = step.cameraPresetId;
        if (step.spriteSequence) spriteSequence = step.spriteSequence;
        if (step.layerOverrides) layerOverrides = step.layerOverrides;
        if (step.cameraOffset) cameraOffset = step.cameraOffset;

        if (step.state?.startsWith('eye:')) {
          this.logicalState = this.profile.initialState;
          wantDirectionalOverride = step.state.slice(4);
          this.crossfadeMs = step.crossfadeMs ?? 60;
        } else if (step.state === 'half' || step.state === 'closed') {
          this.logicalState = this.profile.initialState;
          wantDirectionalOverride = step.state;
          this.crossfadeMs = step.crossfadeMs ?? 90;
        } else if (step.state) {
          this.logicalState = step.state;
          this.crossfadeMs = step.crossfadeMs ?? 120;
        }
      }
    } else if (
      this.idleEnabled &&
      !reducedMotion &&
      !pressed &&
      this.startTimeMs > 0 &&
      now - Math.max(this.lastInputMs, this.startTimeMs) > this.nextIdleMs
    ) {
      const rotation = this.profile.idleRotation || Object.keys(this.profile.sequences);
      if (rotation.length > 0) {
        if (this.idleRotationQueue.length === 0) {
          this.idleRotationQueue = [...rotation];
        }
        const nextId = this.idleRotationQueue.shift()!;
        this.triggerSequence(nextId, now, 0);
        this.lastInputMs = now;
        this.nextIdleMs = this.pickIdleDelay();
        if (!this.awake) this.wake(now);
      }
    }

    // 2. Direct interaction & mood arbitration when no sequence owns the frame
    if (!this.activeSequenceId) {
      let nextState = this.profile.initialState;
      let nextCrossfade = 110;

      if (pressed) {
        if (this.profile.dragStates && this.profile.dragStates.length > 0) {
          const sorted = [...this.profile.dragStates].sort((a, b) => b.minPull - a.minPull);
          let matched: string | null = null;
          for (const rule of sorted) {
            if (pullLength > rule.minPull) {
              matched = rule.state;
              break;
            }
          }
          if (matched) {
            nextState = matched;
          } else if (downZoneId && downZoneId !== 'hair' && downZoneId !== 'body') {
            nextState = sorted[sorted.length - 1]?.state ?? this.profile.initialState;
          }
          nextCrossfade = 90;
        }
      } else if (this.moodState && now < this.moodUntilMs) {
        nextState = this.moodState;
        nextCrossfade = 90;
      } else if (
        this.profile.shakeBehavior?.enabled &&
        shakeIntensity > (this.profile.shakeBehavior.threshold ?? 0.55)
      ) {
        const extreme = this.profile.shakeBehavior.extremeThreshold ?? 0.92;
        nextState =
          shakeIntensity > extreme
            ? this.profile.shakeBehavior.extremeState ?? nextState
            : this.profile.shakeBehavior.windState ?? nextState;
        nextCrossfade = 90;
      } else if (
        hoverZone?.hoverAction?.type === 'set-state' &&
        hoverDurationMs > 80
      ) {
        nextState = hoverZone.hoverAction.target;
        nextCrossfade = hoverZone.hoverAction.crossfadeMs ?? 90;
      }

      this.logicalState = nextState;
      this.crossfadeMs = nextCrossfade;
    }

    // 3. Directional gaze & blink logic (when in neutral state)
    const gazeCfg = this.profile.directionalGaze;
    let resolvedDirectionalFrame: string | null = null;
    if (gazeCfg?.enabled && this.logicalState === this.profile.initialState) {
      // Check if an active variant locks directional frames (e.g. colored hair in Mina)
      let lockedByVariant = false;
      if (this.profile.variants) {
        for (const [group, cfg] of Object.entries(this.profile.variants)) {
          if (cfg.lockDirectionalWhenActive && (this.variantIndices[group] ?? -1) >= 0) {
            lockedByVariant = true;
            resolvedDirectionalFrame = cfg.values[this.variantIndices[group]];
            break;
          }
        }
      }

      if (!lockedByVariant) {
        const blinkCfg = this.profile.blinkConfig;
        if (wantDirectionalOverride) {
          this.currentDirectionalFrame =
            gazeCfg.frameMap[wantDirectionalOverride] ?? wantDirectionalOverride;
        } else if (!this.awake && this.profile.sleepState) {
          this.currentDirectionalFrame = this.profile.sleepState;
        } else if (blinkCfg?.enabled && this.blinkStep >= 0) {
          const stepDur = blinkCfg.stepDurationMs ?? 62;
          const s = ((now - this.blinkStartMs) / stepDur) | 0;
          if (s !== this.blinkStep) {
            this.blinkStep = s;
            if (s === 0 || s === 2) {
              this.currentDirectionalFrame = blinkCfg.halfFrame;
              this.crossfadeMs = 20;
            } else if (s === 1) {
              this.currentDirectionalFrame = blinkCfg.closedFrame;
              this.crossfadeMs = 20;
            } else {
              this.blinkStep = -1;
            }
          }
        } else {
          // Determine gaze target (prop or scroll or cursor)
          let tx = pu - 0.5;
          let ty = pv - 0.46;
          const currentStep = this.animation.getCurrentStep();
          if (currentStep?.lookAtProp) {
            const propPos = this.animation.getPropPosition(currentStep.lookAtProp);
            if (propPos) {
              tx = propPos[0] - 0.5;
              ty = propPos[1] - 0.46;
            }
          } else if (scrollingDown && gazeCfg.scrollDownDirection) {
            tx = 0;
            ty = 1;
          }

          if (Math.hypot(tx, ty) < gazeCfg.neutralThreshold) {
            this.currentDirectionalFrame = gazeCfg.neutralFrame;
          } else {
            const angle = (Math.atan2(-ty, tx) + Math.PI * 2) % (Math.PI * 2);
            const idx = Math.round(angle / (Math.PI / 8)) % gazeCfg.ring.length;
            const dirKey = gazeCfg.ring[idx];
            this.currentDirectionalFrame = gazeCfg.frameMap[dirKey] ?? gazeCfg.neutralFrame;
          }
          this.crossfadeMs = 50;

          if (blinkCfg?.enabled && now > this.nextBlinkMs) {
            this.blinkStep = 0;
            this.blinkStartMs = now;
            this.currentDirectionalFrame = blinkCfg.halfFrame;
            this.crossfadeMs = 20;
            const [minB, maxB] = blinkCfg.intervalRangeMs;
            this.nextBlinkMs = now + minB + Math.random() * (maxB - minB);
          }
        }
        resolvedDirectionalFrame = this.currentDirectionalFrame;
      }
    }

    const activeVariants: Record<string, string | null> = {};
    if (this.profile.variants) {
      for (const [group, cfg] of Object.entries(this.profile.variants)) {
        const idx = this.variantIndices[group] ?? -1;
        activeVariants[group] = idx >= 0 && idx < cfg.values.length ? cfg.values[idx] : null;
      }
    }

    return {
      logicalState: this.logicalState,
      crossfadeMs: this.crossfadeMs,
      directionalFrame: resolvedDirectionalFrame,
      activeVariants,
      leanOffset,
      materialPresetId,
      cameraPresetId,
      spriteSequence,
      layerOverrides,
      cameraOffset,
      props: this.animation.getPropTransforms(now),
      joltToApply,
    };
  }

  private pickIdleDelay(): number {
    const [min, max] = this.profile.idleDelayRangeMs ?? [30000, 45000];
    return min + Math.random() * Math.max(0, max - min);
  }

  reset(now: number): void {
    this.stopSequence();
    this.clearMood();
    this.pullTimestamps = [];
    this.logicalState = this.profile.initialState;
    this.blinkStep = -1;
    this.lastInputMs = now;
    this.nextIdleMs = this.pickIdleDelay();
    if (this.profile.variants) {
      for (const [k, v] of Object.entries(this.profile.variants)) {
        this.variantIndices[k] = v.currentIndex;
      }
    }
  }
}
