import type { DiagnosticSeverity, EngineDiagnostic } from '../types/config';
import type { EngineCore } from './EngineCore';

export class DiagnosticsManager {
  private entries: EngineDiagnostic[] = [];
  private seq = 0;
  private maxEntries = 100;

  constructor(private core: EngineCore) {}

  record(
    severity: DiagnosticSeverity,
    source: string,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): EngineDiagnostic {
    const entry: EngineDiagnostic = {
      id: `diag-${++this.seq}`,
      timestamp: Date.now(),
      severity,
      source,
      code,
      message,
      details,
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    this.core.emit('diagnostic', entry);
    return entry;
  }

  info(source: string, code: string, message: string, details?: Record<string, unknown>): EngineDiagnostic {
    return this.record('info', source, code, message, details);
  }

  warn(source: string, code: string, message: string, details?: Record<string, unknown>): EngineDiagnostic {
    return this.record('warn', source, code, message, details);
  }

  error(source: string, code: string, message: string, details?: Record<string, unknown>): EngineDiagnostic {
    return this.record('error', source, code, message, details);
  }

  getAll(): EngineDiagnostic[] {
    return [...this.entries];
  }

  getErrors(): EngineDiagnostic[] {
    return this.entries.filter((e) => e.severity === 'error');
  }

  getWarnings(): EngineDiagnostic[] {
    return this.entries.filter((e) => e.severity === 'warn');
  }

  clear(): void {
    this.entries = [];
  }
}
