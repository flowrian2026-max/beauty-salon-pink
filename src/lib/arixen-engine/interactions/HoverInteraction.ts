import type { InteractionZoneDef } from '../types/config';
import type { InteractionAdapter } from './BaseInteraction';

export interface HoverCallbacks {
  onZoneEnter: (zone: InteractionZoneDef) => void;
  onZoneLeave: (zone: InteractionZoneDef) => void;
  onExternalHoverChange?: (entering: boolean) => void;
}

export class HoverInteraction implements InteractionAdapter {
  public readonly id = 'hover';
  private enabled: boolean;
  private activeZone: InteractionZoneDef | null = null;
  private zoneSince = 0;
  private externalCleanups: Array<() => void> = [];

  constructor(
    private callbacks: HoverCallbacks,
    options: { enabled?: boolean; externalSelectors?: string[] } = {}
  ) {
    this.enabled = options.enabled ?? true;
    if (options.externalSelectors?.length) {
      this.bindExternalSelectors(options.externalSelectors);
    }
  }

  bindExternalSelectors(selectors: string[]): void {
    this.unbindExternalSelectors();
    if (typeof document === 'undefined') return;

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const onEnter = () => {
          if (this.enabled) this.callbacks.onExternalHoverChange?.(true);
        };
        const onLeave = () => {
          if (this.enabled) this.callbacks.onExternalHoverChange?.(false);
        };
        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointerleave', onLeave);
        this.externalCleanups.push(() => {
          el.removeEventListener('pointerenter', onEnter);
          el.removeEventListener('pointerleave', onLeave);
        });
      });
    }
  }

  private unbindExternalSelectors(): void {
    for (const cleanup of this.externalCleanups) cleanup();
    this.externalCleanups = [];
  }

  updateZone(nextZone: InteractionZoneDef | null, now: number): void {
    if (!this.enabled) {
      if (this.activeZone) {
        const prev = this.activeZone;
        this.activeZone = null;
        this.callbacks.onZoneLeave(prev);
      }
      return;
    }

    if (nextZone?.id !== this.activeZone?.id) {
      if (this.activeZone) {
        this.callbacks.onZoneLeave(this.activeZone);
      }
      this.activeZone = nextZone;
      this.zoneSince = now;
      if (nextZone) {
        this.callbacks.onZoneEnter(nextZone);
      }
    }
  }

  getActiveZone(): InteractionZoneDef | null {
    return this.enabled ? this.activeZone : null;
  }

  getHoverDurationMs(now: number): number {
    return this.activeZone ? now - this.zoneSince : 0;
  }

  clear(): void {
    if (this.activeZone) {
      const prev = this.activeZone;
      this.activeZone = null;
      this.callbacks.onZoneLeave(prev);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.clear();
    this.unbindExternalSelectors();
  }
}
