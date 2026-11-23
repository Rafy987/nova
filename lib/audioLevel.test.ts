import { describe, expect, it } from "vitest";
import { computeRms, rmsToLevel, smooth, targetLevel } from "./audioLevel";

describe("computeRms", () => {
  it("is 0 for silence and empty input", () => {
    expect(computeRms([])).toBe(0);
    expect(computeRms([0, 0, 0])).toBe(0);
  });
  it("equals amplitude for a constant signal", () => {
    expect(computeRms([0.5, -0.5, 0.5, -0.5])).toBeCloseTo(0.5);
  });
});

describe("rmsToLevel", () => {
  it("returns 0 below the noise floor", () => {
    expect(rmsToLevel(0.005)).toBe(0);
  });
  it("is clamped to 1 for loud input", () => {
    expect(rmsToLevel(1)).toBe(1);
  });
  it("grows with loudness", () => {
    expect(rmsToLevel(0.05)).toBeLessThan(rmsToLevel(0.1));
  });
});

describe("smooth", () => {
  it("rises faster than it falls", () => {
    const up = smooth(0, 1) - 0;
    const down = 1 - smooth(1, 0);
    expect(up).toBeGreaterThan(down);
  });
});

describe("targetLevel", () => {
  it("follows the mic only while listening", () => {
    expect(targetLevel("listening", 1, 0.7)).toBe(0.7);
    expect(targetLevel("idle", 1, 0.7)).toBe(0);
  });
  it("stays in 0..1 while speaking", () => {
    for (let t = 0; t < 5; t += 0.1) {
      const v = targetLevel("speaking", t, 0);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
