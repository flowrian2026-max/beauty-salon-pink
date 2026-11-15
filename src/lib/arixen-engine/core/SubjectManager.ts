import type { InteractionCapabilities, SubjectConfig } from '../types/config';

export class SubjectManager {
  private config: SubjectConfig;
  private capabilities: InteractionCapabilities;
  private previousState: string;
  private currentState: string;

  constructor(config: SubjectConfig) {
    this.config = config;
    this.capabilities = { ...config.interactions };
    this.currentState = config.behaviors.initialState;
    this.previousState = config.behaviors.initialState;
  }

  getConfig(): SubjectConfig {
    return this.config;
  }

  getCapabilities(): InteractionCapabilities {
    return this.capabilities;
  }

  updateCapabilities(partial: Partial<InteractionCapabilities>): void {
    this.capabilities = {
      ...this.capabilities,
      ...partial,
    };
  }

  setState(nextState: string): { changed: boolean; previous: string } {
    if (nextState === this.currentState) {
      return { changed: false, previous: this.previousState };
    }
    this.previousState = this.currentState;
    this.currentState = nextState;
    return { changed: true, previous: this.previousState };
  }

  getState(): string {
    return this.currentState;
  }

  reset(): void {
    this.capabilities = { ...this.config.interactions };
    this.previousState = this.currentState;
    this.currentState = this.config.behaviors.initialState;
  }
}
