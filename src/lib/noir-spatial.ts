export type SpatialPose = { position: [number, number, number]; target: [number, number, number]; spread: number };
export type SpatialQuality = "studio" | "compact";
export type RenderingHints = { width: number; reduced: boolean; saveData?: boolean | undefined; cores?: number | undefined; memory?: number | undefined };
export function spatialRendering(hints: RenderingHints) {
  const compact = hints.width <= 760 || hints.saveData || (hints.cores !== undefined && hints.cores <= 4) || (hints.memory !== undefined && hints.memory <= 4);
  return { static: hints.reduced, quality: (compact ? "compact" : "studio") as SpatialQuality, dpr: compact ? 1 : 1.5, shadows: !compact };
}
export function shouldReduceQuality(samples: number, elapsed: number) {
  return samples >= 60 && elapsed / samples > 0.04;
}
const stops: SpatialPose[] = [
  { position: [0, 0.95, 14], target: [0, 0.3, 0], spread: 0 },
  { position: [1.65, 1.15, 12.9], target: [0, 0.3, 0], spread: 1 },
  { position: [-0.9, 0.8, 12], target: [0.1, 0.25, -0.2], spread: 0.55 },
];
export function spatialPose(progress: number, mobile = false): SpatialPose {
  const p = Math.max(0, Math.min(1, progress)) * 2;
  const index = Math.min(1, Math.floor(p));
  const a = stops[index] ?? stops[0];
  const b = stops[index + 1] ?? stops[2];
  if (!a || !b) return { position: [0, 0, 11], target: [0, 0, 0], spread: 0 };
  const t = p - index;
  // Minimum-jerk easing arrives at each studio composition without a sudden stop.
  const ease = t * t * t * (t * (t * 6 - 15) + 10);
  const interpolate = (start: [number, number, number], end: [number, number, number]): [number, number, number] => [start[0] + (end[0] - start[0]) * ease, start[1] + (end[1] - start[1]) * ease, start[2] + (end[2] - start[2]) * ease];
  const position = interpolate(a.position, b.position);
  if (mobile) { position[0] *= 0.25; position[2] -= 1.6; }
  return { position, target: interpolate(a.target, b.target), spread: a.spread + (b.spread - a.spread) * ease };
}