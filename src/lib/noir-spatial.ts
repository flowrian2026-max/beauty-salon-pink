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
  { position: [1.25, 0.75, 10.25], target: [0.15, 0.1, 0.35], spread: 1 },
  { position: [-0.65, 0.65, 11.1], target: [0, 0.18, 0], spread: 0.55 },
];

export function spatialPose(progress: number, mobile = false): SpatialPose {
  const p = Math.max(0, Math.min(1, progress));
  const first = stops[0];
  const second = stops[1];
  const third = stops[2];
  if (!first || !second || !third) return { position: [0, 0, 11], target: [0, 0, 0], spread: 0 };

  // Align the camera's two moves with the three on-screen scroll chapters.
  const a = p < 0.3 ? first : second;
  const b = p < 0.3 ? second : third;
  const segmentStart = p < 0.3 ? 0 : 0.3;
  const segmentEnd = p < 0.3 ? 0.3 : 0.73;
  const rawT = p >= 0.73 ? 1 : (p - segmentStart) / (segmentEnd - segmentStart);
  const t = Math.max(0, Math.min(1, rawT));
  const ease = t * t * t * (t * (t * 6 - 15) + 10);
  const interpolate = (start: [number, number, number], end: [number, number, number]): [number, number, number] => [
    start[0] + (end[0] - start[0]) * ease,
    start[1] + (end[1] - start[1]) * ease,
    start[2] + (end[2] - start[2]) * ease,
  ];
  const position = interpolate(a.position, b.position);
  if (mobile) { position[0] *= 0.25; position[2] -= 1.2; }
  return { position, target: interpolate(a.target, b.target), spread: a.spread + (b.spread - a.spread) * ease };
}
