import { describe, it, expect } from "vitest";
import {
  calculateStarVelocity,
  estimateInitialVelocity,
  calculateHNBoost,
  calculateOverallScore,
  roundScore,
} from "@/lib/scoring";

describe("calculateStarVelocity", () => {
  it("calculates stars gained per day", () => {
    const oneDay = 1000 * 60 * 60 * 24;
    expect(calculateStarVelocity(1100, 1000, oneDay)).toBe(100);
  });

  it("handles multi-day periods", () => {
    const sevenDays = 7 * 1000 * 60 * 60 * 24;
    expect(calculateStarVelocity(1070, 1000, sevenDays)).toBe(10);
  });

  it("returns 0 for zero time difference", () => {
    expect(calculateStarVelocity(1100, 1000, 0)).toBe(0);
  });

  it("returns 0 for negative time difference", () => {
    expect(calculateStarVelocity(1100, 1000, -1000)).toBe(0);
  });

  it("handles star decrease (negative velocity)", () => {
    const oneDay = 1000 * 60 * 60 * 24;
    expect(calculateStarVelocity(900, 1000, oneDay)).toBe(-100);
  });

  it("handles no change in stars", () => {
    const oneDay = 1000 * 60 * 60 * 24;
    expect(calculateStarVelocity(1000, 1000, oneDay)).toBe(0);
  });
});

describe("estimateInitialVelocity", () => {
  it("estimates velocity assuming ~2yr repo age", () => {
    expect(estimateInitialVelocity(73000)).toBeCloseTo(100, 0);
  });

  it("returns 0 for 0 stars", () => {
    expect(estimateInitialVelocity(0)).toBe(0);
  });

  it("handles small star counts", () => {
    const result = estimateInitialVelocity(730);
    expect(result).toBe(1);
  });
});

describe("calculateHNBoost", () => {
  it("applies the scoring formula: points * 0.1 + mentions * 2", () => {
    // 100 points * 0.1 = 10, 5 mentions * 2 = 10, total = 20
    expect(calculateHNBoost(100, 5)).toBe(20);
  });

  it("returns 0 for no HN activity", () => {
    expect(calculateHNBoost(0, 0)).toBe(0);
  });

  it("weights points at 0.1x", () => {
    expect(calculateHNBoost(1000, 0)).toBe(100);
  });

  it("weights mentions at 2x", () => {
    expect(calculateHNBoost(0, 10)).toBe(20);
  });
});

describe("calculateOverallScore", () => {
  it("sums star velocity and HN boost", () => {
    expect(calculateOverallScore(50, 20)).toBe(70);
  });

  it("works with zero HN boost", () => {
    expect(calculateOverallScore(50, 0)).toBe(50);
  });

  it("works with zero velocity", () => {
    expect(calculateOverallScore(0, 20)).toBe(20);
  });
});

describe("roundScore", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundScore(10.456)).toBe(10.46);
  });

  it("preserves exact values", () => {
    expect(roundScore(10.5)).toBe(10.5);
  });

  it("handles 0", () => {
    expect(roundScore(0)).toBe(0);
  });
});
