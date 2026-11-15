import type { ArixenPlugin, BehaviorSequenceDef, EngineDiagnostic, SubjectConfig } from '../types/config';

export class PluginManager {
  private plugins = new Map<string, ArixenPlugin>();

  register(
    plugin: ArixenPlugin,
    context: {
      config: SubjectConfig;
      registerBehavior: (seq: BehaviorSequenceDef) => void;
      emitDiagnostic: (diag: Omit<EngineDiagnostic, 'id' | 'timestamp'>) => void;
    }
  ): void {
    if (!plugin?.id) return;
    if (this.plugins.has(plugin.id)) {
      this.unregister(plugin.id);
    }
    this.plugins.set(plugin.id, plugin);
    try {
      plugin.onInit?.(context);
    } catch (err) {
      context.emitDiagnostic({
        severity: 'error',
        source: `plugin:${plugin.id}`,
        code: 'PLUGIN_INIT_ERROR',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  unregister(pluginId: string): void {
    const existing = this.plugins.get(pluginId);
    if (!existing) return;
    try {
      existing.onDispose?.();
    } catch {
      // swallow plugin teardown errors so host engine remains stable
    }
    this.plugins.delete(pluginId);
  }

  notifyBeforeRender(input: { now: number; dt: number; activeState: string }): void {
    for (const plugin of this.plugins.values()) {
      try {
        plugin.onBeforeRender?.(input);
      } catch {
        // isolate per-frame plugin errors
      }
    }
  }

  notifyStateChange(state: string, previousState: string): void {
    for (const plugin of this.plugins.values()) {
      try {
        plugin.onStateChange?.(state, previousState);
      } catch {
        // isolate state hook errors
      }
    }
  }

  listPlugins(): Array<{ id: string; name: string; version?: string }> {
    return Array.from(this.plugins.values()).map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
    }));
  }

  disposeAll(): void {
    for (const id of Array.from(this.plugins.keys())) {
      this.unregister(id);
    }
  }
}
