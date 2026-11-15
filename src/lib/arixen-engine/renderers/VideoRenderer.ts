import type { RendererAdapter, RendererContext, RendererRenderInput } from './BaseRenderer';

export class VideoRenderer implements RendererAdapter {
  public readonly type = 'video' as const;
  private ctx!: RendererContext;
  private videoEl: HTMLVideoElement | null = null;
  private synthCanvas: HTMLCanvasElement | null = null;
  private synthCtx: CanvasRenderingContext2D | null = null;
  private scrubProgress = 0.5;
  private lastSeekAt = 0;
  private resizeObserver: ResizeObserver | null = null;
  private errorHandler: (() => void) | null = null;

  async mount(ctx: RendererContext): Promise<void> {
    this.ctx = ctx;
    const cfg = ctx.config.assets.video;

    if (cfg?.src) {
      const video = document.createElement('video');
      video.src = ctx.assets.resolveUrl(cfg.src);
      if (cfg.poster) video.poster = ctx.assets.resolveUrl(cfg.poster);
      video.loop = cfg.loop ?? true;
      video.muted = cfg.muted ?? true;
      video.playsInline = true;
      video.preload = 'auto';
      video.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;';

      this.errorHandler = () => {
        ctx.diagnostics?.warn(
          'VideoRenderer',
          'VIDEO_LOAD_FALLBACK',
          `Video source "${cfg.src}" failed to load; switching to synthetic fallback stream.`
        );
        video.remove();
        this.videoEl = null;
        this.mountSyntheticCanvas(ctx);
      };
      video.addEventListener('error', this.errorHandler);

      ctx.container.appendChild(video);
      this.videoEl = video;

      if (cfg.scrubMode === 'playback') {
        video.play().catch(() => {});
      }
      ctx.onFirstAssetReady?.();
      return;
    }

    this.mountSyntheticCanvas(ctx);
    ctx.onFirstAssetReady?.();
  }

  private mountSyntheticCanvas(ctx: RendererContext): void {
    if (this.synthCanvas) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    ctx.container.appendChild(canvas);
    this.synthCanvas = canvas;
    this.synthCtx = canvas.getContext('2d');

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = ctx.performance.getEffectiveDpr();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    syncSize();
    this.resizeObserver = new ResizeObserver(syncSize);
    this.resizeObserver.observe(canvas);
  }

  render(input: RendererRenderInput): void {
    const cfg = this.ctx.config.assets.video;
    const { dt, pointer, reducedMotion } = input;

    let targetProgress = this.scrubProgress;
    if (cfg?.scrubMode === 'pointer-x' && !reducedMotion) {
      targetProgress = Math.max(0, Math.min(1, pointer.u));
    } else if (cfg?.scrubMode === 'pointer-y' && !reducedMotion) {
      targetProgress = Math.max(0, Math.min(1, pointer.v));
    } else if (cfg?.scrubMode === 'scroll' && typeof window !== 'undefined' && !reducedMotion) {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    } else if (!reducedMotion) {
      targetProgress = (this.scrubProgress + dt * 0.2 * (cfg?.playbackRate ?? 1)) % 1;
    }

    this.scrubProgress += (targetProgress - this.scrubProgress) * (1 - Math.exp(-dt * 12));

    if (this.videoEl) {
      const tilt = this.ctx.physics.stepSpringTilt(
        dt,
        reducedMotion ? 0 : (pointer.v - 0.5) * 3.2,
        reducedMotion ? 0 : (pointer.u - 0.5) * 4.2
      );
      this.videoEl.style.transform = `scale(1.035) rotateY(${tilt.x.toFixed(2)}deg) rotateX(${tilt.y.toFixed(2)}deg)`;
    }

    if (this.videoEl && this.videoEl.duration && cfg?.scrubMode !== 'playback' && !this.videoEl.seeking) {
      const frameRate = 24;
      const desiredTime = this.scrubProgress * this.videoEl.duration;
      const frameTime = Math.round(desiredTime * frameRate) / frameRate;
      const now = performance.now();
      if (Math.abs(this.videoEl.currentTime - frameTime) > 1 / (frameRate * 2) && now - this.lastSeekAt >= 40) {
        try {
          this.videoEl.currentTime = frameTime;
          this.lastSeekAt = now;
        } catch {
          // Ignore transient seek errors while the browser is decoding.
        }
      }
    }

    if (this.synthCanvas && this.synthCtx) {
      this.drawSyntheticFrame(this.synthCanvas, this.synthCtx, this.scrubProgress);
    }
  }

  private drawSyntheticFrame(c: HTMLCanvasElement, g: CanvasRenderingContext2D, t: number): void {
    const w = c.width;
    const h = c.height;
    const cx = w / 2;
    const cy = h / 2;
    const angle = t * Math.PI * 2;

    g.clearRect(0, 0, w, h);
    g.save();
    g.translate(cx, cy);
    const radius = Math.min(w, h) * 0.3;
    const grad = g.createLinearGradient(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      -Math.cos(angle) * radius,
      -Math.sin(angle) * radius
    );
    grad.addColorStop(0, '#b600a8');
    grad.addColorStop(0.5, '#7621b0');
    grad.addColorStop(1, '#38bdf8');
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(0, 0, radius, radius * (0.65 + 0.35 * Math.abs(Math.cos(angle))), angle * 0.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  toSurfaceUv(clientX: number, clientY: number): [number, number] {
    const rect = this.ctx.container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return [0.5, 0.5];
    return [(clientX - rect.left) / rect.width, (clientY - rect.top) / rect.height];
  }

  reset(): void {
    this.scrubProgress = 0.5;
    if (this.videoEl) {
      this.videoEl.currentTime = 0;
    }
  }

  dispose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.videoEl) {
      if (this.errorHandler) {
        this.videoEl.removeEventListener('error', this.errorHandler);
      }
      this.videoEl.pause();
      this.videoEl.remove();
      this.videoEl = null;
    }
    this.synthCanvas?.remove();
    this.synthCanvas = null;
    this.synthCtx = null;
  }
}
