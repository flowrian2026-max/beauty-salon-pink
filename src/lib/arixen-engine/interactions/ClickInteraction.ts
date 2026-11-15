import type { InteractionAdapter } from './BaseInteraction';

export interface ClickCallbacks {
  toSurfaceUv: (clientX: number, clientY: number) => [number, number];
  onClick: (u: number, v: number, event: MouseEvent | PointerEvent) => void;
}

export class ClickInteraction implements InteractionAdapter {
  public readonly id = 'click';
  private enabled: boolean;

  constructor(
    private element: HTMLElement,
    private callbacks: ClickCallbacks,
    options: { enabled?: boolean; attachDomClick?: boolean } = {}
  ) {
    this.enabled = options.enabled ?? true;
    if (options.attachDomClick) {
      this.element.addEventListener('click', this.handleDomClick);
    }
  }

  private handleDomClick = (e: MouseEvent) => {
    if (!this.enabled) return;
    const [u, v] = this.callbacks.toSurfaceUv(e.clientX, e.clientY);
    this.callbacks.onClick(u, v, e);
  };

  triggerTap(u: number, v: number, event: MouseEvent | PointerEvent): void {
    if (!this.enabled) return;
    this.callbacks.onClick(u, v, event);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.element.removeEventListener('click', this.handleDomClick);
  }
}
