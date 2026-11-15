import type { InteractionAdapter } from './BaseInteraction';

export class ProximityInteraction implements InteractionAdapter {
  public readonly id = 'proximity';
  private enabled: boolean;
  private radiusPx: number;
  private intensity = 0;

  constructor(
    private element: HTMLElement,
    options: { enabled?: boolean; radiusPx?: number } = {}
  ) {
    this.enabled = options.enabled ?? true;
    this.radiusPx = options.radiusPx ?? 320;
  }

  updateFromClientPoint(clientX: number, clientY: number): number {
    if (!this.enabled) {
      this.intensity = 0;
      return 0;
    }
    const rect = this.element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    this.intensity = Math.max(0, Math.min(1, 1 - dist / this.radiusPx));
    return this.intensity;
  }

  getIntensity(): number {
    return this.intensity;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.intensity = 0;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.intensity = 0;
  }
}
