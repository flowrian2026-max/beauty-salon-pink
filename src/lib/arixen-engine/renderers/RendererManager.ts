import type { RendererType } from '../types/config';
import type { RendererAdapter, RendererContext, RendererRenderInput } from './BaseRenderer';
import { VideoRenderer } from './VideoRenderer';

export type RendererFactory = () => RendererAdapter;

export class RendererManager {
  private static customRegistry = new Map<string, RendererFactory>();
  private adapter: RendererAdapter | null = null;

  static registerRenderer(type: string, factory: RendererFactory): void {
    this.customRegistry.set(type, factory);
  }

  static unregisterRenderer(type: string): void {
    this.customRegistry.delete(type);
  }

  static getRegisteredCustomTypes(): Set<string> {
    return new Set(this.customRegistry.keys());
  }

  createAdapter(type: RendererType): RendererAdapter {
    const customFactory = RendererManager.customRegistry.get(type);
    if (customFactory) return customFactory();
    if (type === 'video') return new VideoRenderer();
    throw new Error(`PINKO ARIXEN test build does not include renderer: ${type}`);
  }

  async mount(ctx: RendererContext): Promise<RendererAdapter> {
    this.dispose();
    const adapter = this.createAdapter(ctx.config.renderer);
    this.adapter = adapter;
    await adapter.mount(ctx);
    return adapter;
  }

  getAdapter(): RendererAdapter | null {
    return this.adapter;
  }

  render(input: RendererRenderInput): void {
    this.adapter?.render(input);
  }

  dispose(): void {
    this.adapter?.dispose();
    this.adapter = null;
  }
}
