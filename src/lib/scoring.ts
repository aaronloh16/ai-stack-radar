/**
 * Pure scoring functions extracted from collection scripts.
 * Used by collect-github.ts, collect-hn.ts, and tests.
 */

export function calculateStarVelocity(
  newerStars: number,
  olderStars: number,
  timeDiffMs: number
): number {
  const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
  if (timeDiffDays <= 0) return 0;
  return (newerStars - olderStars) / timeDiffDays;
}

export function estimateInitialVelocity(stars: number): number {
  // Rough estimate: assume repo is ~2 years old on average
  return stars / 730;
}

export function calculateHNBoost(
  totalPoints: number,
  mentionCount: number
): number {
  return totalPoints * 0.1 + mentionCount * 2;
}

export function calculateOverallScore(
  starVelocity: number,
  hnBoost: number
): number {
  return starVelocity + hnBoost;
}

export function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
