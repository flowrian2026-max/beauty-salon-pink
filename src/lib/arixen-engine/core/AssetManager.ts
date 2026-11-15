import type { AssetManifest } from '../types/config';
import type { DiagnosticsManager } from './DiagnosticsManager';
import type { EngineCore } from './EngineCore';

export interface LoadedImageAsset {
  key: string;
  url: string;
  image: HTMLImageElement;
  isFallback: boolean;
}

export class AssetManager {
  private images = new Map<string, LoadedImageAsset>();
  private modelCache = new Map<string, unknown>();
  private inFlight = new Map<string, Promise<LoadedImageAsset | null>>();
  private failedKeys = new Set<string>();
  private totalCount = 0;
  private disposed = false;
  private abortController = new AbortController();
  private baseUrl = '';

  constructor(
    private core: EngineCore,
    private diagnostics?: DiagnosticsManager
  ) {}

  setBaseUrl(baseUrl?: string): void {
    this.baseUrl = (baseUrl || '').replace(/\/+$/, '');
  }

  resolveUrl(url: string): string {
    if (!url) return url;
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('/')
    ) {
      return url;
    }
    if (!this.baseUrl) return url;
    const cleanRel = url.replace(/^\.\//, '');
    return `${this.baseUrl}/${cleanRel}`;
  }

  getStats() {
    const total = Math.max(this.totalCount, this.images.size);
    const loaded = this.images.size;
    const progressPct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 100;
    return {
      loaded,
      total,
      failed: this.failedKeys.size,
      progressPct,
    };
  }

  getImage(key: string): HTMLImageElement | null {
    return this.images.get(key)?.image ?? null;
  }

  hasImage(key: string): boolean {
    return this.images.has(key);
  }

  setCachedModel(url: string, model: unknown): void {
    this.modelCache.set(this.resolveUrl(url), model);
  }

  getCachedModel<T = unknown>(url: string): T | null {
    return (this.modelCache.get(this.resolveUrl(url)) as T) ?? null;
  }

  async loadImage(
    key: string,
    rawUrl: string,
    fallbackSrc?: string
  ): Promise<LoadedImageAsset | null> {
    if (this.disposed || this.abortController.signal.aborted) return null;
    const url = this.resolveUrl(rawUrl);

    const cached = this.images.get(key);
    if (cached) return cached;

    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const signal = this.abortController.signal;

    const promise = (async () => {
      const img = await this.fetchImageElement(url, signal);
      if (this.disposed || signal.aborted) return null;

      if (img) {
        const record: LoadedImageAsset = { key, url, image: img, isFallback: false };
        this.images.set(key, record);
        const stats = this.getStats();
        this.core.emit('assetProgress', {
          loaded: stats.loaded,
          total: stats.total,
          progressPct: stats.progressPct,
          key,
        });
        return record;
      }

      this.failedKeys.add(key);
      this.core.emit('assetError', {
        key,
        url,
        reason: 'Failed to load image resource',
      });
      this.diagnostics?.warn('AssetManager', 'ASSET_LOAD_FAILED', `Failed to load "${key}" (${url})`, {
        key,
        url,
      });

      if (fallbackSrc) {
        const resolvedFallback = this.resolveUrl(fallbackSrc);
        const fbImg = await this.fetchImageElement(resolvedFallback, signal);
        if (fbImg && !this.disposed && !signal.aborted) {
          const record: LoadedImageAsset = {
            key,
            url: resolvedFallback,
            image: fbImg,
            isFallback: true,
          };
          this.images.set(key, record);
          return record;
        }
      }

      const safeImg = await this.createSafePlaceholderImage(key);
      if (safeImg && !this.disposed && !signal.aborted) {
        const record: LoadedImageAsset = {
          key,
          url: 'procedural://fallback',
          image: safeImg,
          isFallback: true,
        };
        this.images.set(key, record);
        return record;
      }

      return null;
    })();

    this.inFlight.set(key, promise);
    const res = await promise;
    this.inFlight.delete(key);
    return res;
  }

  async preloadManifest(
    manifest: AssetManifest,
    options: { concurrency?: number; onItemLoaded?: (key: string, img: HTMLImageElement) => void } = {}
  ): Promise<void> {
    if (manifest.assetBaseUrl) {
      this.setBaseUrl(manifest.assetBaseUrl);
    }

    const entries: Array<[string, string]> = [];
    if (manifest.staticImage?.src) {
      entries.push(['static', manifest.staticImage.src]);
    }
    if (manifest.frames) {
      const priority = new Set(manifest.priorityFrames || []);
      for (const k of priority) {
        if (manifest.frames[k]) entries.push([k, manifest.frames[k]]);
      }
      for (const [k, url] of Object.entries(manifest.frames)) {
        if (!priority.has(k)) entries.push([k, url]);
      }
    }
    if (manifest.spriteSheet?.src) {
      entries.push(['spriteSheet', manifest.spriteSheet.src]);
    }
    if (manifest.layers) {
      for (const layer of manifest.layers) {
        entries.push([`layer:${layer.id}`, layer.src]);
      }
    }

    this.totalCount = entries.length;
    if (entries.length === 0) return;

    const priorityCount = Math.min(
      entries.length,
      (manifest.priorityFrames?.length || 0) + (manifest.staticImage ? 1 : 0)
    );

    for (let i = 0; i < priorityCount; i++) {
      if (this.disposed || this.abortController.signal.aborted) return;
      const [key, url] = entries[i];
      const loaded = await this.loadImage(key, url, manifest.staticImage?.fallbackSrc);
      if (loaded) options.onItemLoaded?.(key, loaded.image);
    }

    const concurrency = Math.max(1, options.concurrency ?? 6);
    let cursor = priorityCount;
    await Promise.all(
      Array.from({ length: Math.min(concurrency, Math.max(1, entries.length - cursor)) }, async () => {
        while (cursor < entries.length && !this.disposed && !this.abortController.signal.aborted) {
          const idx = cursor++;
          const [key, url] = entries[idx];
          const loaded = await this.loadImage(key, url);
          if (loaded) options.onItemLoaded?.(key, loaded.image);
        }
      })
    );
  }

  private fetchImageElement(src: string, signal?: AbortSignal): Promise<HTMLImageElement | null> {
    if (typeof Image === 'undefined') return Promise.resolve(null);
    return new Promise((resolve) => {
      if (signal?.aborted) {
        resolve(null);
        return;
      }
      const img = new Image();
      const onAbort = () => {
        img.onload = null;
        img.onerror = null;
        img.src = '';
        resolve(null);
      };
      signal?.addEventListener('abort', onAbort, { once: true });

      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        signal?.removeEventListener('abort', onAbort);
        resolve(img);
      };
      img.onerror = () => {
        signal?.removeEventListener('abort', onAbort);
        resolve(null);
      };
      img.src = src;
    });
  }

  private async createSafePlaceholderImage(label: string): Promise<HTMLImageElement | null> {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 120);
    grad.addColorStop(0, '#2a303c');
    grad.addColorStop(1, '#12151b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(215, 226, 234, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#D7E2EA';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.slice(0, 18), 128, 128);

    const dataUrl = canvas.toDataURL('image/png');
    return this.fetchImageElement(dataUrl);
  }

  dispose(): void {
    this.disposed = true;
    this.abortController.abort();
    this.images.clear();
    this.modelCache.clear();
    this.inFlight.clear();
    this.failedKeys.clear();
  }
}
