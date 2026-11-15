import type { PhysicsConfig } from '../types/config';

interface BrushNode {
  index: number;
  weight: number;
  u0: number;
  v0: number;
}

export interface BrushHold {
  u: number;
  v: number;
  px: number;
  py: number;
  nodes: BrushNode[];
}

export class PhysicsController {
  private config: Required<PhysicsConfig>;
  private enabled: boolean;
  private strengthMultiplier = 1;

  // Soft-body mesh buffers (72x72 default)
  public readonly N: number;
  public readonly M: number;
  public readonly OVER: number;
  public readonly SPAN: number;
  public readonly ORIGIN: number;
  public readonly count: number;

  public rest: Float32Array;
  public dyn: Float32Array;
  private ux: Float32Array;
  private uy: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private sx: Float32Array;
  private sy: Float32Array;
  private restX: Float32Array;
  private restY: Float32Array;
  private lineA: Float32Array;
  private lineB: Float32Array;
  private lineP: Float32Array;

  private simLeft = 0;
  private lastSteps = 0;
  private brush: BrushHold | null = null;

  // 2D/3D spring state for lean, tilt, recoil
  private leanX = 0;
  private leanY = 0;
  private leanVx = 0;
  private leanVy = 0;
  private tiltX = 0;
  private tiltY = 0;
  private tiltVx = 0;
  private tiltVy = 0;

  constructor(config: PhysicsConfig) {
    this.config = {
      enabled: config.enabled,
      mode: config.mode,
      fixedStepHz: config.fixedStepHz ?? 240,
      gridResolution: config.gridResolution ?? 72,
      overscan: config.overscan ?? 1.7,
      wobbleHz: config.wobbleHz ?? 2.3,
      dampingRatio: config.dampingRatio ?? 0.14,
      dragRadius: config.dragRadius ?? 0.22,
      dragLimit: config.dragLimit ?? 0.24,
      stiffness: config.stiffness ?? 70,
      damping: config.damping ?? 8,
      inertia: config.inertia ?? 1,
      interactionStrength: config.interactionStrength ?? 1,
      preventMeshFold: config.preventMeshFold ?? true,
      alphaHitTestThreshold: config.alphaHitTestThreshold ?? 40,
    };
    this.enabled = this.config.enabled && this.config.mode !== 'none';
    this.strengthMultiplier = this.config.interactionStrength;

    this.N = this.config.gridResolution;
    this.M = this.N + 1;
    this.OVER = this.config.overscan;
    this.SPAN = this.OVER / this.N;
    this.ORIGIN = 0.5 - this.OVER / 2;
    this.count = this.M * this.M;

    if (this.config.mode === 'soft-body-mesh') {
      this.rest = new Float32Array(this.count * 2);
      this.dyn = new Float32Array(this.count * 3);
      this.ux = new Float32Array(this.count);
      this.uy = new Float32Array(this.count);
      this.vx = new Float32Array(this.count);
      this.vy = new Float32Array(this.count);
      this.sx = new Float32Array(this.count);
      this.sy = new Float32Array(this.count);
      this.restX = new Float32Array(this.count);
      this.restY = new Float32Array(this.count);
      this.lineA = new Float32Array(this.M);
      this.lineB = new Float32Array(this.M);
      this.lineP = new Float32Array(this.M);

      for (let j = 0, k = 0; j < this.M; j++) {
        for (let i = 0; i < this.M; i++) {
          this.rest[k++] = this.ORIGIN + i * this.SPAN;
          this.rest[k++] = this.ORIGIN + j * this.SPAN;
        }
      }
      for (let k = 0; k < this.count; k++) {
        this.restX[k] = this.rest[k * 2];
        this.restY[k] = this.rest[k * 2 + 1];
      }
    } else {
      this.rest = new Float32Array(0);
      this.dyn = new Float32Array(0);
      this.ux = new Float32Array(0);
      this.uy = new Float32Array(0);
      this.vx = new Float32Array(0);
      this.vy = new Float32Array(0);
      this.sx = new Float32Array(0);
      this.sy = new Float32Array(0);
      this.restX = new Float32Array(0);
      this.restY = new Float32Array(0);
      this.lineA = new Float32Array(0);
      this.lineB = new Float32Array(0);
      this.lineP = new Float32Array(0);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled && this.config.mode !== 'none';
    if (!this.enabled) {
      this.releaseHold();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setInteractionStrength(strength: number): void {
    this.strengthMultiplier = Math.max(0, Math.min(2.5, strength));
  }

  getInteractionStrength(): number {
    return this.strengthMultiplier;
  }

  getMode(): PhysicsConfig['mode'] {
    return this.config.mode;
  }

  getStepsPerFrame(): number {
    return this.lastSteps;
  }

  getBrush(): BrushHold | null {
    return this.brush;
  }

  getPullMagnitude(): number {
    if (!this.brush) return 0;
    return Math.hypot(this.brush.px, this.brush.py);
  }

  takeHold(u: number, v: number, radius = this.config.dragRadius): BrushHold {
    const nodes: BrushNode[] = [];
    if (this.config.mode === 'soft-body-mesh' && this.enabled) {
      const r2 = radius * radius;
      for (let k = 0; k < this.count; k++) {
        const dx = this.rest[k * 2] + this.ux[k] - u;
        const dy = this.rest[k * 2 + 1] + this.uy[k] - v;
        const w = Math.exp(-(dx * dx + dy * dy) / r2);
        if (w > 0.02) {
          nodes.push({ index: k, weight: w, u0: this.ux[k], v0: this.uy[k] });
        }
      }
    }
    this.brush = { u, v, px: 0, py: 0, nodes };
    return this.brush;
  }

  updateHold(pu: number, pv: number): void {
    if (!this.brush) return;
    let px = (pu - this.brush.u) * this.strengthMultiplier;
    let py = (pv - this.brush.v) * this.strengthMultiplier;
    const L = Math.hypot(px, py);
    const lim = this.config.dragLimit;
    if (L > 0) {
      const k = (lim * (1 - Math.exp(-L / lim))) / L;
      px *= k;
      py *= k;
    }
    this.brush.px = px;
    this.brush.py = py;
  }

  setDirectHoldOffset(px: number, py: number): void {
    if (!this.brush) return;
    this.brush.px = px;
    this.brush.py = py;
  }

  releaseHold(): void {
    this.brush = null;
  }

  poke(u: number, v: number, dx: number, dy: number, radius = 0.09): void {
    if (!this.enabled) return;
    const scale = this.strengthMultiplier;
    if (this.config.mode === 'soft-body-mesh') {
      const r2 = radius * radius;
      for (let k = 0; k < this.count; k++) {
        const ax = this.rest[k * 2] - u;
        const ay = this.rest[k * 2 + 1] - v;
        const w = Math.exp(-(ax * ax + ay * ay) / r2);
        this.vx[k] += dx * scale * w;
        this.vy[k] += dy * scale * w;
      }
    } else {
      this.tiltVx += dx * scale * 2.5;
      this.tiltVy += dy * scale * 2.5;
    }
  }

  stepSpringLean(dt: number, targetX: number, targetY: number): { x: number; y: number } {
    if (!this.enabled) {
      this.leanX *= Math.exp(-dt * 10);
      this.leanY *= Math.exp(-dt * 10);
      return { x: this.leanX, y: this.leanY };
    }
    const stiffness = this.config.stiffness;
    const damping = this.config.damping;
    this.leanVx += ((targetX - this.leanX) * stiffness - this.leanVx * damping) * dt;
    this.leanVy += ((targetY - this.leanY) * stiffness - this.leanVy * damping) * dt;
    this.leanX += this.leanVx * dt;
    this.leanY += this.leanVy * dt;
    return { x: this.leanX, y: this.leanY };
  }

  stepSpringTilt(dt: number, targetX: number, targetY: number): { x: number; y: number } {
    const stiffness = this.config.stiffness * 0.85;
    const damping = this.config.damping * 1.1;
    const sx = targetX * this.strengthMultiplier;
    const sy = targetY * this.strengthMultiplier;
    this.tiltVx += ((sx - this.tiltX) * stiffness - this.tiltVx * damping) * dt;
    this.tiltVy += ((sy - this.tiltY) * stiffness - this.tiltVy * damping) * dt;
    this.tiltX += this.tiltVx * dt;
    this.tiltY += this.tiltVy * dt;
    return { x: this.tiltX, y: this.tiltY };
  }

  stepSoftBodyMesh(dt: number): Float32Array {
    if (this.config.mode !== 'soft-body-mesh') {
      this.lastSteps = 0;
      return this.dyn;
    }

    if (!this.enabled) {
      // Smoothly relax mesh back to zero displacement
      const decay = Math.exp(-dt * 12);
      for (let k = 0; k < this.count; k++) {
        this.ux[k] *= decay;
        this.uy[k] *= decay;
        this.vx[k] = 0;
        this.vy[k] = 0;
      }
      this.lastSteps = 0;
    } else {
      const H = 1 / this.config.fixedStepHz;
      this.simLeft += dt;
      let steps = 0;
      while (this.simLeft >= H && steps < 9) {
        this.stepWave(H);
        this.simLeft -= H;
        steps++;
      }
      if (steps === 9) this.simLeft = 0;
      this.lastSteps = steps;
    }

    // Spatial smoothing pass
    for (let j = 0; j < this.M; j++) {
      for (let i = 0; i < this.M; i++) {
        const k = j * this.M + i;
        const edge = i === 0 || j === 0 || i === this.N || j === this.N;
        this.sx[k] = edge
          ? this.ux[k]
          : (this.ux[k] * 4 + this.ux[k - 1] + this.ux[k + 1] + this.ux[k - this.M] + this.ux[k + this.M]) / 8;
        this.sy[k] = edge
          ? this.uy[k]
          : (this.uy[k] * 4 + this.uy[k - 1] + this.uy[k + 1] + this.uy[k - this.M] + this.uy[k + this.M]) / 8;
      }
    }

    if (this.config.preventMeshFold) {
      this.untangle();
    }

    // Write vertex attributes (dx, dy, compression shade)
    for (let k = 0, o = 0; k < this.count; k++) {
      this.dyn[o++] = this.sx[k];
      this.dyn[o++] = this.sy[k];
      const r = k % this.M;
      const c = (k / this.M) | 0;
      let sh = 1;
      if (r > 0 && r < this.N && c > 0 && c < this.N) {
        sh = Math.max(
          0.86,
          Math.min(
            1.16,
            1 - (this.sx[k + 1] - this.sx[k - 1] + (this.sy[k + this.M] - this.sy[k - this.M])) * 1.8
          )
        );
      }
      this.dyn[o++] = sh;
    }

    return this.dyn;
  }

  private stepWave(dt: number): void {
    const wobble = this.config.wobbleHz * 2 * Math.PI;
    const reach = 0.085 / this.SPAN;
    const c = reach * wobble;
    const gamma = 2 * this.config.dampingRatio * wobble;
    const nu = 0.2 * c;
    const c2 = c * c;
    const wo2 = wobble * wobble;

    for (let j = 1; j < this.N; j++) {
      for (let i = 1; i < this.N; i++) {
        const k = j * this.M + i;
        const l = k - 1;
        const r = k + 1;
        const t = k - this.M;
        const b = k + this.M;
        const lx = this.ux[l] + this.ux[r] + this.ux[t] + this.ux[b] - 4 * this.ux[k];
        const ly = this.uy[l] + this.uy[r] + this.uy[t] + this.uy[b] - 4 * this.uy[k];
        const lvx = this.vx[l] + this.vx[r] + this.vx[t] + this.vx[b] - 4 * this.vx[k];
        const lvy = this.vy[l] + this.vy[r] + this.vy[t] + this.vy[b] - 4 * this.vy[k];
        this.vx[k] += (c2 * lx - wo2 * this.ux[k] - gamma * this.vx[k] + nu * lvx) * dt;
        this.vy[k] += (c2 * ly - wo2 * this.uy[k] - gamma * this.vy[k] + nu * lvy) * dt;
      }
    }

    if (this.brush) {
      for (const node of this.brush.nodes) {
        const k = node.index;
        const w = node.weight;
        const K = 3000 * w;
        const D = 90 * w;
        this.vx[k] += ((node.u0 + this.brush.px * w - this.ux[k]) * K - this.vx[k] * D) * dt;
        this.vy[k] += ((node.v0 + this.brush.py * w - this.uy[k]) * K - this.vy[k] * D) * dt;
      }
    }

    for (let k = 0; k < this.count; k++) {
      this.ux[k] += this.vx[k] * dt;
      this.uy[k] += this.vy[k] * dt;
    }
  }

  private orderLine(start: number, stride: number, field: Float32Array, base: Float32Array): void {
    const gap = this.SPAN * 0.34;
    for (let i = 0; i < this.M; i++) {
      const k = start + i * stride;
      this.lineP[i] = base[k] + field[k];
    }
    this.lineA[0] = this.lineP[0];
    for (let i = 1; i < this.M; i++) {
      this.lineA[i] = Math.max(this.lineP[i], this.lineA[i - 1] + gap);
    }
    this.lineB[this.N] = this.lineP[this.N];
    for (let i = this.N - 1; i >= 0; i--) {
      this.lineB[i] = Math.min(this.lineP[i], this.lineB[i + 1] - gap);
    }
    for (let i = 0; i < this.M; i++) {
      const k = start + i * stride;
      field[k] = (this.lineA[i] + this.lineB[i]) / 2 - base[k];
    }
  }

  private untangle(): void {
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < this.M; j++) this.orderLine(j * this.M, 1, this.sx, this.restX);
      for (let i = 0; i < this.M; i++) this.orderLine(i, this.M, this.sy, this.restY);
    }
  }

  reset(): void {
    this.brush = null;
    this.simLeft = 0;
    this.leanX = 0;
    this.leanY = 0;
    this.leanVx = 0;
    this.leanVy = 0;
    this.tiltX = 0;
    this.tiltY = 0;
    this.tiltVx = 0;
    this.tiltVy = 0;
    this.ux.fill(0);
    this.uy.fill(0);
    this.vx.fill(0);
    this.vy.fill(0);
    this.sx.fill(0);
    this.sy.fill(0);
    this.dyn.fill(0);
  }
}
