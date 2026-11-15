import type { EngineEventListener, EngineEventMap, EngineEventName } from '../types/events';

export type CleanupFn = () => void;

export class EngineCore {
  private listeners = new Map<EngineEventName, Set<Function>>();
  private cleanups: CleanupFn[] = [];
  private rafId: number | null = null;
  private running = false;
  private visible = true;
  private reducedMotion = false;
  private lastTime = 0;
  private visibilityObserver: IntersectionObserver | null = null;
  private motionMediaQuery: MediaQueryList | null = null;
  private motionChangeHandler: ((e: MediaQueryListEvent) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = this.motionMediaQuery.matches;
      this.motionChangeHandler = (e: MediaQueryListEvent) => {
        this.reducedMotion = e.matches;
      };
      this.motionMediaQuery.addEventListener?.('change', this.motionChangeHandler);
    }
  }

  on<K extends EngineEventName>(event: K, listener: EngineEventListener<K>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
    };
  }

  emit<K extends EngineEventName>(event: K, payload: EngineEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      try {
        (listener as EngineEventListener<K>)(payload);
      } catch (err) {
        console.error(`[ARIXEN EngineCore] Listener error for "${event}":`, err);
      }
    }
  }

  registerCleanup(fn: CleanupFn): void {
    this.cleanups.push(fn);
  }

  observeVisibility(element: HTMLElement, pauseWhenHidden = true): void {
    this.visibilityObserver?.disconnect();
    if (!pauseWhenHidden || typeof IntersectionObserver === 'undefined') {
      this.visible = true;
      return;
    }
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          this.visible = entries[0].isIntersecting;
        }
      },
      { threshold: 0 }
    );
    this.visibilityObserver.observe(element);
  }

  isVisible(): boolean {
    return this.visible;
  }

  isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  startLoop(tick: (now: number, dt: number) => void): void {
    this.stopLoop();
    this.running = true;
    this.lastTime = performance.now();

    const frame = (now: number) => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(frame);
      const dt = Math.min(0.04, Math.max(0.0001, (now - this.lastTime) / 1000));
      this.lastTime = now;
      if (!this.visible) return;
      tick(now, dt);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  stopLoop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  dispose(): void {
    this.stopLoop();
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;

    if (this.motionMediaQuery && this.motionChangeHandler) {
      this.motionMediaQuery.removeEventListener?.('change', this.motionChangeHandler);
    }

    for (let i = this.cleanups.length - 1; i >= 0; i--) {
      try {
        this.cleanups[i]();
      } catch (err) {
        console.error('[ARIXEN EngineCore] Cleanup error:', err);
      }
    }
    this.cleanups = [];
    this.listeners.clear();
  }
}
