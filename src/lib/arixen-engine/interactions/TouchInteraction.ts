import type { TouchGesturePayload } from '../types/events';
import type { InteractionAdapter } from './BaseInteraction';

export interface TouchCallbacks {
  toSurfaceUv: (clientX: number, clientY: number) => [number, number];
  onGesture: (gesture: TouchGesturePayload) => void;
}

export class TouchInteraction implements InteractionAdapter {
  public readonly id = 'touch';
  private enabled: boolean;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private initialPinchDist = 0;

  private touchStartHandler: (e: TouchEvent) => void;
  private touchMoveHandler: (e: TouchEvent) => void;
  private touchEndHandler: (e: TouchEvent) => void;

  constructor(
    private element: HTMLElement,
    private callbacks: TouchCallbacks,
    options: { enabled?: boolean } = {}
  ) {
    this.enabled = options.enabled ?? true;

    this.touchStartHandler = (e: TouchEvent) => {
      if (!this.enabled) return;
      if (e.touches.length === 1) {
        const t = e.touches[0];
        this.startX = t.clientX;
        this.startY = t.clientY;
        this.startTime = performance.now();
      } else if (e.touches.length === 2) {
        this.initialPinchDist = this.getPinchDistance(e.touches[0], e.touches[1]);
      }
    };

    this.touchMoveHandler = (e: TouchEvent) => {
      if (!this.enabled) return;
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const [u, v] = this.callbacks.toSurfaceUv(t.clientX, t.clientY);
        this.callbacks.onGesture({
          type: 'drag',
          u,
          v,
          deltaX: t.clientX - this.startX,
          deltaY: t.clientY - this.startY,
          touchCount: 1,
        });
      } else if (e.touches.length === 2 && this.initialPinchDist > 0) {
        const dist = this.getPinchDistance(e.touches[0], e.touches[1]);
        const scale = dist / this.initialPinchDist;
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const [u, v] = this.callbacks.toSurfaceUv(cx, cy);
        this.callbacks.onGesture({
          type: 'pinch',
          u,
          v,
          scale,
          touchCount: 2,
        });
      }
    };

    this.touchEndHandler = (e: TouchEvent) => {
      if (!this.enabled || e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this.startX;
      const dy = t.clientY - this.startY;
      const dist = Math.hypot(dx, dy);
      const elapsed = performance.now() - this.startTime;
      const [u, v] = this.callbacks.toSurfaceUv(t.clientX, t.clientY);

      if (dist > 45 && elapsed < 380) {
        const direction =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? 'right'
              : 'left'
            : dy > 0
              ? 'down'
              : 'up';
        this.callbacks.onGesture({
          type: 'swipe',
          u,
          v,
          deltaX: dx,
          deltaY: dy,
          direction,
          touchCount: 1,
        });
      } else if (dist < 14 && elapsed < 320) {
        this.callbacks.onGesture({
          type: 'tap',
          u,
          v,
          touchCount: 1,
        });
      }
      this.initialPinchDist = 0;
    };

    this.element.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    this.element.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
    this.element.addEventListener('touchend', this.touchEndHandler, { passive: true });
  }

  private getPinchDistance(a: Touch, b: Touch): number {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.element.removeEventListener('touchstart', this.touchStartHandler);
    this.element.removeEventListener('touchmove', this.touchMoveHandler);
    this.element.removeEventListener('touchend', this.touchEndHandler);
  }
}
