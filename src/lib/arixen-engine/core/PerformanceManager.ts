import type { PerformanceConfig } from '../types/config';

export class PerformanceManager {
  private config: Required<PerformanceConfig>;
  private fps = 60;
  private frameTimeMs = 16.6;
  private qualityScale = 1;
  private slowFrameCount = 0;
  private fastFrameCount = 0;
  private lastSampleTime = 0;
  private frameCounter = 0;
  private lastTelemetryEmit = 0;

  constructor(config?: PerformanceConfig) {
    this.config = {
      maxDpr: config?.maxDpr ?? 2,
      adaptiveQuality: config?.adaptiveQuality ?? true,
      pauseWhenHidden: config?.pauseWhenHidden ?? true,
      respectReducedMotion: config?.respectReducedMotion ?? true,
      preloadStrategy: config?.preloadStrategy ?? 'priority-then-lazy',
      targetFps: config?.targetFps ?? 60,
    };
  }

  recordFrame(now: number, dtSeconds: number): boolean {
    const ms = dtSeconds * 1000;
    this.frameTimeMs = this.frameTimeMs * 0.9 + ms * 0.1;
    this.frameCounter++;

    if (this.lastSampleTime === 0) {
      this.lastSampleTime = now;
    }

    const elapsed = now - this.lastSampleTime;
    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCounter * 1000) / elapsed);
      this.frameCounter = 0;
      this.lastSampleTime = now;

      if (this.config.adaptiveQuality) {
        if (this.fps < 36) {
          this.slowFrameCount++;
          this.fastFrameCount = 0;
          if (this.slowFrameCount >= 2 && this.qualityScale > 0.65) {
            this.qualityScale = Math.max(0.65, Number((this.qualityScale - 0.15).toFixed(2)));
          }
        } else if (this.fps >= 55) {
          this.fastFrameCount++;
          this.slowFrameCount = 0;
          if (this.fastFrameCount >= 4 && this.qualityScale < 1) {
            this.qualityScale = Math.min(1, Number((this.qualityScale + 0.1).toFixed(2)));
          }
        }
      }
    }

    if (now - this.lastTelemetryEmit >= 250) {
      this.lastTelemetryEmit = now;
      return true;
    }
    return false;
  }

  getEffectiveDpr(): number {
    const raw = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return Math.min(raw, this.config.maxDpr) * this.qualityScale;
  }

  getMetrics() {
    return {
      fps: this.fps,
      frameTimeMs: Number(this.frameTimeMs.toFixed(1)),
      qualityScale: this.qualityScale,
    };
  }

  reset(): void {
    this.qualityScale = 1;
    this.slowFrameCount = 0;
    this.fastFrameCount = 0;
  }
}
