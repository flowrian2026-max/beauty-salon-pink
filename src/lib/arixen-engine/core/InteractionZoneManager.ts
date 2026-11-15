import type { InteractionZoneDef } from '../types/config';

export class InteractionZoneManager {
  private zones: InteractionZoneDef[] = [];
  private alphaMap: Uint8ClampedArray | null = null;
  private alphaThreshold: number;

  constructor(zones: InteractionZoneDef[] = [], alphaThreshold = 40) {
    this.zones = zones;
    this.alphaThreshold = alphaThreshold;
  }

  setZones(zones: InteractionZoneDef[]): void {
    this.zones = zones;
  }

  getZones(): InteractionZoneDef[] {
    return this.zones;
  }

  buildAlphaMaskFromImage(img: HTMLImageElement): void {
    if (typeof document === 'undefined') return;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 128, 128);
    this.alphaMap = ctx.getImageData(0, 0, 128, 128).data;
  }

  isSolidAt(u: number, v: number): boolean {
    if (u < 0 || v < 0 || u >= 1 || v >= 1) return false;
    if (!this.alphaMap) {
      // If no alpha mask is loaded, hit test against defined zones or unit square
      return u >= 0.08 && u <= 0.92 && v >= 0.08 && v <= 0.92;
    }
    const idx = (((v * 128) | 0) * 128 + ((u * 128) | 0)) * 4 + 3;
    return this.alphaMap[idx] > this.alphaThreshold;
  }

  hitTest(u: number, v: number, requireAlphaSolid = false): InteractionZoneDef | null {
    if (requireAlphaSolid && !this.isSolidAt(u, v)) {
      return null;
    }

    // Evaluate zones in reverse definition order or priority order (specific zones first)
    for (const zone of this.zones) {
      if (this.matchesZone(zone, u, v)) {
        return zone;
      }
    }
    return null;
  }

  findZoneByObjectName(objectName: string): InteractionZoneDef | null {
    return (
      this.zones.find(
        (z) =>
          z.objectName === objectName ||
          (z.objectName && objectName.toLowerCase().includes(z.objectName.toLowerCase()))
      ) || null
    );
  }

  private matchesZone(zone: InteractionZoneDef, u: number, v: number): boolean {
    if (zone.customHitTest) {
      return zone.customHitTest(u, v);
    }

    const b = zone.bounds;
    if (!b) return false;

    switch (zone.shape) {
      case 'rect': {
        const w = b.w ?? 0.1;
        const h = b.h ?? 0.1;
        return Math.abs(u - b.x) <= w / 2 && Math.abs(v - b.y) <= h / 2;
      }
      case 'circle': {
        const r = b.r ?? 0.08;
        const dx = u - b.x;
        const dy = v - b.y;
        return dx * dx + dy * dy <= r * r;
      }
      case 'ellipse': {
        const rx = b.rx ?? 0.1;
        const ry = b.ry ?? 0.1;
        const dx = (u - b.x) / rx;
        const dy = (v - b.y) / ry;
        return dx * dx + dy * dy <= 1;
      }
      case 'polygon': {
        const pts = b.points;
        if (!pts || pts.length < 3) return false;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i][0];
          const yi = pts[i][1];
          const xj = pts[j][0];
          const yj = pts[j][1];
          const intersect = yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi + 1e-9) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      }
      default:
        return false;
    }
  }

  clearAlphaMask(): void {
    this.alphaMap = null;
  }
}
