import type { InteractionAdapter } from './BaseInteraction';

export interface ScrollCallbacks {
  onScrollActivity: (info: { scrollY: number; deltaY: number; untilMs: number }) => void;
}

export class ScrollInteraction implements InteractionAdapter {
  public readonly id = 'scroll';
  private enabled: boolean;
  private lastScrollY: number;
  private scrollUntilMs = 0;
  private handler: () => void;

  constructor(private callbacks: ScrollCallbacks, options: { enabled?: boolean } = {}) {
    this.enabled = options.enabled ?? true;
    this.lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    this.handler = () => {
      if (!this.enabled) return;
      const now = performance.now();
      const currentY = window.scrollY;
      const deltaY = currentY - this.lastScrollY;
      if (Math.abs(deltaY) > 2) {
        this.scrollUntilMs = now + 500;
        this.lastScrollY = currentY;
      }
      this.callbacks.onScrollActivity({
        scrollY: currentY,
        deltaY,
        untilMs: this.scrollUntilMs,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handler, { passive: true });
    }
  }

  isScrolling(now: number): boolean {
    return this.enabled && now < this.scrollUntilMs;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.scrollUntilMs = 0;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handler);
    }
  }
}
