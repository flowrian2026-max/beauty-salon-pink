export class TransitionManager {
  private currentKey: string;
  private previousKey: string;
  private transitionStart = 0;
  private transitionDurationMs = 1;
  private maxCrossfadeMs: number;

  constructor(initialKey = 'rest', maxCrossfadeMs = 70) {
    this.currentKey = initialKey;
    this.previousKey = initialKey;
    this.maxCrossfadeMs = maxCrossfadeMs;
  }

  setMaxCrossfadeMs(ms: number): void {
    this.maxCrossfadeMs = ms;
  }

  transitionTo(nextKey: string, durationMs: number, now: number): boolean {
    if (nextKey === this.currentKey) return false;
    const progress = this.getProgress(now);
    this.previousKey = progress > 0.5 ? this.currentKey : this.previousKey;
    this.currentKey = nextKey;
    this.transitionStart = now;
    this.transitionDurationMs = Math.min(this.maxCrossfadeMs, Math.max(1, durationMs));
    return true;
  }

  getProgress(now: number): number {
    return Math.min(1, Math.max(0, (now - this.transitionStart) / this.transitionDurationMs));
  }

  getKeys(): { from: string; to: string } {
    return { from: this.previousKey, to: this.currentKey };
  }

  reset(key: string): void {
    this.currentKey = key;
    this.previousKey = key;
    this.transitionStart = 0;
    this.transitionDurationMs = 1;
  }

  static damp(current: number, target: number, lambda: number, dt: number): number {
    return current + (target - current) * (1 - Math.exp(-lambda * dt));
  }
}
