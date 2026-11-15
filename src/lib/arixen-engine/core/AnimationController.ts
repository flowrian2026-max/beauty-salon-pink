import type { BehaviorSequenceDef, BehaviorStepDef } from '../types/config';

export interface PropTransform {
  id: string;
  u: number;
  v: number;
  visible: boolean;
  grip: 'on' | 'pull' | 'off' | false;
}

export interface ActiveSequenceEvaluation {
  sequenceId: string;
  stepIndex: number;
  step: BehaviorStepDef;
  isNewStep: boolean;
  completed: boolean;
}

export class AnimationController {
  private activeSeq: BehaviorSequenceDef | null = null;
  private stepIndex = -1;
  private stepStartMs = 0;
  private speedMultiplier = 1;

  // Prop interpolation state
  private propStates = new Map<
    string,
    {
      from: [number, number];
      to: [number, number];
      current: [number, number];
      moveStart: number;
      moveMs: number;
      visible: boolean;
      grip: 'on' | 'pull' | 'off' | false;
    }
  >();

  setSpeedMultiplier(speed: number): void {
    this.speedMultiplier = Math.max(0.25, Math.min(3, speed));
  }

  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  getActiveSequence(): BehaviorSequenceDef | null {
    return this.activeSeq;
  }

  getCurrentStep(): BehaviorStepDef | null {
    if (!this.activeSeq || this.stepIndex < 0 || this.stepIndex >= this.activeSeq.steps.length) {
      return null;
    }
    return this.activeSeq.steps[this.stepIndex];
  }

  start(sequence: BehaviorSequenceDef, now: number): BehaviorStepDef | null {
    this.activeSeq = sequence;
    this.stepIndex = 0;
    this.stepStartMs = now;
    const step = sequence.steps[0] ?? null;
    if (step?.propMove) {
      this.applyPropMove(step.propMove, now);
    }
    return step;
  }

  jumpToLastStep(now: number): BehaviorStepDef | null {
    if (!this.activeSeq || this.activeSeq.steps.length === 0) return null;
    this.stepIndex = this.activeSeq.steps.length - 1;
    this.stepStartMs = now;
    const step = this.activeSeq.steps[this.stepIndex];
    if (step?.propMove) {
      this.applyPropMove(step.propMove, now);
    }
    return step;
  }

  stop(): void {
    this.activeSeq = null;
    this.stepIndex = -1;
    for (const [, prop] of this.propStates) {
      prop.visible = false;
      prop.grip = false;
    }
  }

  evaluate(now: number): ActiveSequenceEvaluation | null {
    if (!this.activeSeq) return null;
    const current = this.activeSeq.steps[this.stepIndex];
    if (!current) {
      this.stop();
      return null;
    }

    const duration = current.durationMs / this.speedMultiplier;
    let isNewStep = false;

    if (now - this.stepStartMs > duration) {
      this.stepIndex++;
      if (this.stepIndex >= this.activeSeq.steps.length) {
        const finishedId = this.activeSeq.id;
        this.stop();
        return {
          sequenceId: finishedId,
          stepIndex: -1,
          step: current,
          isNewStep: false,
          completed: true,
        };
      }
      this.stepStartMs = now;
      isNewStep = true;
      const nextStep = this.activeSeq.steps[this.stepIndex];
      if (nextStep?.propMove) {
        this.applyPropMove(nextStep.propMove, now);
      }
    }

    const step = this.activeSeq.steps[this.stepIndex];
    return {
      sequenceId: this.activeSeq.id,
      stepIndex: this.stepIndex,
      step,
      isNewStep,
      completed: false,
    };
  }

  private applyPropMove(
    move: NonNullable<BehaviorStepDef['propMove']>,
    now: number
  ): void {
    const existing = this.propStates.get(move.propId) ?? {
      from: move.propId === 'fly' ? [1.35, 0.02] : [1.3, 0.86],
      to: move.propId === 'fly' ? [1.35, 0.02] : [1.3, 0.86],
      current: move.propId === 'fly' ? [1.35, 0.02] : [1.3, 0.86],
      moveStart: now,
      moveMs: 1,
      visible: false,
      grip: false as const,
    };
    existing.from = [...existing.to];
    existing.to = [...move.to];
    existing.moveStart = now;
    existing.moveMs = Math.max(1, (move.durationMs ?? 300) / this.speedMultiplier);
    if (move.visible !== undefined) existing.visible = move.visible;
    if (move.grip !== undefined) existing.grip = move.grip;
    this.propStates.set(move.propId, existing);
  }

  getPropTransforms(now: number): PropTransform[] {
    const result: PropTransform[] = [];
    for (const [id, prop] of this.propStates) {
      const mk = Math.min(1, (now - prop.moveStart) / prop.moveMs);
      const me = mk * mk * (3 - 2 * mk);
      let u = prop.from[0] + (prop.to[0] - prop.from[0]) * me;
      let v = prop.from[1] + (prop.to[1] - prop.from[1]) * me;
      if (id === 'fly') {
        const jitterFade = 1 - (mk >= 1 ? 0.85 : 0);
        u += Math.sin(now * 0.02) * 0.012 * jitterFade;
        v += Math.cos(now * 0.027) * 0.012 * jitterFade;
      }
      prop.current = [u, v];
      result.push({
        id,
        u,
        v,
        visible: prop.visible,
        grip: prop.grip,
      });
    }
    return result;
  }

  getPropPosition(propId: string): [number, number] | null {
    return this.propStates.get(propId)?.current ?? null;
  }
}
