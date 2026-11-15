import type { InteractionAdapter } from './BaseInteraction';

export interface DragCallbacks {
  toSurfaceUv: (clientX: number, clientY: number) => [number, number];
  canStartDrag: (u: number, v: number) => boolean;
  onDragStart: (u: number, v: number, event: PointerEvent) => void;
  onDragMove: (u: number, v: number, event: PointerEvent) => void;
  onDragEnd: (info: {
    startU: number;
    startV: number;
    endU: number;
    endV: number;
    heldMs: number;
    event: PointerEvent;
  }) => void;
}

export class DragInteraction implements InteractionAdapter {
  public readonly id = 'drag';
  private enabled: boolean;
  private pressed = false;
  private downAt = 0;
  private startU = 0.5;
  private startV = 0.5;
  private currentU = 0.5;
  private currentV = 0.5;

  private downHandler: (e: PointerEvent) => void;
  private moveHandler: (e: PointerEvent) => void;
  private upHandler: (e: PointerEvent) => void;

  constructor(
    private element: HTMLElement,
    private callbacks: DragCallbacks,
    options: { enabled?: boolean } = {}
  ) {
    this.enabled = options.enabled ?? true;

    this.downHandler = (e: PointerEvent) => {
      if (!this.enabled) return;
      const [u, v] = this.callbacks.toSurfaceUv(e.clientX, e.clientY);
      if (!this.callbacks.canStartDrag(u, v)) return;

      this.pressed = true;
      this.downAt = performance.now();
      this.startU = u;
      this.startV = v;
      this.currentU = u;
      this.currentV = v;
      try {
        this.element.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore synthetic pointer events
      }
      e.preventDefault();
      this.callbacks.onDragStart(u, v, e);
    };

    this.moveHandler = (e: PointerEvent) => {
      if (!this.enabled || !this.pressed) return;
      const [u, v] = this.callbacks.toSurfaceUv(e.clientX, e.clientY);
      this.currentU = u;
      this.currentV = v;
      this.callbacks.onDragMove(u, v, e);
    };

    this.upHandler = (e: PointerEvent) => {
      if (!this.pressed) return;
      const heldMs = performance.now() - this.downAt;
      this.pressed = false;
      this.callbacks.onDragEnd({
        startU: this.startU,
        startV: this.startV,
        endU: this.currentU,
        endV: this.currentV,
        heldMs,
        event: e,
      });
    };

    this.element.addEventListener('pointerdown', this.downHandler);
    window.addEventListener('pointermove', this.moveHandler, { passive: true });
    window.addEventListener('pointerup', this.upHandler);
    window.addEventListener('pointercancel', this.upHandler);
  }

  isDragging(): boolean {
    return this.pressed;
  }

  getStartUv(): [number, number] {
    return [this.startU, this.startV];
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.pressed = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.downHandler);
    window.removeEventListener('pointermove', this.moveHandler);
    window.removeEventListener('pointerup', this.upHandler);
    window.removeEventListener('pointercancel', this.upHandler);
  }
}
