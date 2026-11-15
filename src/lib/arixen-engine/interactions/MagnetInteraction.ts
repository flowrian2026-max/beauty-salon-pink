import type { MagnetConfig } from '../types/config';
import type { InteractionAdapter } from './BaseInteraction';

export class MagnetInteraction implements InteractionAdapter {
  public readonly id = 'magnet';
  private config: Required<MagnetConfig>;
  private enabled: boolean;
  private reducedMotion = false;
  private isActive = false;

  private moveHandler: (e: MouseEvent) => void;
  private touchMoveHandler: (e: TouchEvent) => void;
  private touchEndHandler: () => void;

  constructor(private element: HTMLElement, config: MagnetConfig = { enabled: true }) {
    this.config = {
      enabled: config.enabled ?? true,
      strength: config.strength ?? 4,
      padding: config.padding ?? 40,
      axis: config.axis ?? 'both',
      rotationStrength: config.rotationStrength ?? 0,
      touchEquivalent: config.touchEquivalent ?? true,
    };
    this.enabled = this.config.enabled;

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    this.element.style.willChange = 'transform';

    this.moveHandler = (e: MouseEvent) => {
      this.applyAttraction(e.clientX, e.clientY);
    };

    this.touchMoveHandler = (e: TouchEvent) => {
      if (!this.config.touchEquivalent || e.touches.length === 0) return;
      const t = e.touches[0];
      this.applyAttraction(t.clientX, t.clientY);
    };

    this.touchEndHandler = () => {
      this.resetTransform();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this.moveHandler, { passive: true });
      if (this.config.touchEquivalent) {
        window.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
        window.addEventListener('touchend', this.touchEndHandler, { passive: true });
      }
    }
  }

  private applyAttraction(clientX: number, clientY: number): void {
    if (!this.enabled || this.reducedMotion) {
      if (this.isActive) this.resetTransform();
      return;
    }

    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distX = Math.abs(clientX - centerX);
    const distY = Math.abs(clientY - centerY);
    const pad = this.config.padding;

    if (distX < rect.width / 2 + pad && distY < rect.height / 2 + pad) {
      this.isActive = true;
      const rawX = (clientX - centerX) / Math.max(0.5, this.config.strength);
      const rawY = (clientY - centerY) / Math.max(0.5, this.config.strength);
      const x = this.config.axis === 'y' ? 0 : rawX;
      const y = this.config.axis === 'x' ? 0 : rawY;
      const rot = this.config.rotationStrength
        ? ((clientX - centerX) / Math.max(1, rect.width / 2 + pad)) * this.config.rotationStrength
        : 0;

      this.element.style.transition = 'transform 0.3s ease-out';
      this.element.style.transform = rot
        ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`
        : `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    } else if (this.isActive) {
      this.resetTransform();
    }
  }

  resetTransform(): void {
    this.isActive = false;
    this.element.style.transition = 'transform 0.6s ease-in-out';
    this.element.style.transform = 'translate3d(0px, 0px, 0px)';
  }

  updateConfig(partial: Partial<MagnetConfig>): void {
    this.config = { ...this.config, ...partial };
    if (partial.enabled !== undefined) {
      this.setEnabled(partial.enabled);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.resetTransform();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.moveHandler);
      window.removeEventListener('touchmove', this.touchMoveHandler);
      window.removeEventListener('touchend', this.touchEndHandler);
    }
    this.element.style.transform = '';
    this.element.style.transition = '';
    this.element.style.willChange = '';
  }
}
