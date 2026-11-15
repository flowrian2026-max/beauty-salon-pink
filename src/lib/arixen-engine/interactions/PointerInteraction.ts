import type { NormalizedPointer } from '../types/events';
import type { InteractionAdapter } from './BaseInteraction';

export interface PointerCallbacks {
  toSurfaceUv: (clientX: number, clientY: number) => [number, number];
  onMove: (pointer: NormalizedPointer) => void;
  onLeave?: () => void;
}

export class PointerInteraction implements InteractionAdapter {
  public readonly id = 'pointer';
  private enabled: boolean;
  private sensitivity = 1;
  private lastX = 0;
  private lastY = 0;
  private hasLast = false;
  private smoothU = 0.5;
  private smoothV = 0.5;
  private speed = 0;
  private shake = 0;
  private shakeThreshold = 1.5;

  private moveHandler: (e: PointerEvent) => void;
  private leaveHandler: () => void;

  constructor(
    private callbacks: PointerCallbacks,
    options: { enabled?: boolean; sensitivity?: number; shakeThreshold?: number } = {}
  ) {
    this.enabled = options.enabled ?? true;
    this.sensitivity = options.sensitivity ?? 1;
    this.shakeThreshold = options.shakeThreshold ?? 1.5;

    this.moveHandler = (e: PointerEvent) => {
      if (!this.enabled) return;
      const dx = this.hasLast ? e.clientX - this.lastX : 0;
      const dy = this.hasLast ? e.clientY - this.lastY : 0;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.hasLast = true;

      const [rawU, rawV] = this.callbacks.toSurfaceUv(e.clientX, e.clientY);
      const u = 0.5 + (rawU - 0.5) * this.sensitivity;
      const v = 0.5 + (rawV - 0.5) * this.sensitivity;
      const stepDist = Math.hypot(dx, dy);
      this.speed += stepDist * 0.004;
      this.smoothU = u;
      this.smoothV = v;

      this.callbacks.onMove({
        u,
        v,
        nx: (u - 0.5) * 2,
        ny: (v - 0.5) * 2,
        clientX: e.clientX,
        clientY: e.clientY,
        dx,
        dy,
        speed: this.speed,
        isTouch: e.pointerType === 'touch',
      });
    };

    this.leaveHandler = () => {
      this.callbacks.onLeave?.();
    };

    window.addEventListener('pointermove', this.moveHandler, { passive: true });
    window.addEventListener('pointerleave', this.leaveHandler, { passive: true });
  }

  stepKinematics(dt: number): { speed: number; shake: number } {
    this.speed *= Math.exp(-dt * 6);
    const active = this.speed > this.shakeThreshold ? 1 : 0;
    const rate = active ? 1.2 : 0.9;
    this.shake += (active - this.shake) * (1 - Math.exp(-dt * rate));
    return { speed: this.speed, shake: this.shake };
  }

  getPointer(): { u: number; v: number; shake: number; speed: number } {
    return { u: this.smoothU, v: this.smoothV, shake: this.shake, speed: this.speed };
  }

  setSensitivity(val: number): void {
    this.sensitivity = Math.max(0.1, Math.min(3, val));
  }

  getSensitivity(): number {
    return this.sensitivity;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.smoothU = 0.5;
      this.smoothV = 0.5;
      this.speed = 0;
      this.shake = 0;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    window.removeEventListener('pointermove', this.moveHandler);
    window.removeEventListener('pointerleave', this.leaveHandler);
  }
}
