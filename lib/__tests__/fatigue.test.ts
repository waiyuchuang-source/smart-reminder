import { describe, it, expect } from "vitest";
import { calculateFatigueScore, getTimeOfDayFactor, getFatigueLevel } from "../fatigue";

describe("getTimeOfDayFactor", () => {
  it("returns 1.0 for late night hours (23-06)", () => {
    expect(getTimeOfDayFactor(0)).toBe(1.0);
    expect(getTimeOfDayFactor(3)).toBe(1.0);
    expect(getTimeOfDayFactor(5)).toBe(1.0);
    expect(getTimeOfDayFactor(23)).toBe(1.0);
  });

  it("returns 0.5 for dawn/dusk hours (06-08, 22)", () => {
    expect(getTimeOfDayFactor(6)).toBe(0.5);
    expect(getTimeOfDayFactor(7)).toBe(0.5);
    expect(getTimeOfDayFactor(22)).toBe(0.5);
  });

  it("returns 0.0 for normal hours (08-22)", () => {
    expect(getTimeOfDayFactor(8)).toBe(0.0);
    expect(getTimeOfDayFactor(10)).toBe(0.0);
    expect(getTimeOfDayFactor(14)).toBe(0.0);
    expect(getTimeOfDayFactor(21)).toBe(0.0);
  });
});

describe("calculateFatigueScore", () => {
  it("returns 0 for zero factors", () => {
    expect(calculateFatigueScore({ dismissRate: 0, recentDensity: 0, timeOfDayFactor: 0 })).toBe(0);
  });

  it("returns 100 for maxed factors", () => {
    expect(calculateFatigueScore({ dismissRate: 1, recentDensity: 6, timeOfDayFactor: 1 })).toBe(100);
  });

  it("dismiss rate is the dominant factor (weight 0.5)", () => {
    const highDismiss = calculateFatigueScore({ dismissRate: 0.8, recentDensity: 0, timeOfDayFactor: 0 });
    const highDensity = calculateFatigueScore({ dismissRate: 0, recentDensity: 5, timeOfDayFactor: 0 });
    expect(highDismiss).toBeGreaterThan(highDensity);
  });

  it("caps density at 6", () => {
    const atCap = calculateFatigueScore({ dismissRate: 0, recentDensity: 6, timeOfDayFactor: 0 });
    const overCap = calculateFatigueScore({ dismissRate: 0, recentDensity: 12, timeOfDayFactor: 0 });
    expect(atCap).toBe(overCap);
  });

  it("medium range scenario", () => {
    const score = calculateFatigueScore({ dismissRate: 0.3, recentDensity: 2, timeOfDayFactor: 0 });
    expect(score).toBeGreaterThan(10);
    expect(score).toBeLessThan(50);
  });
});

describe("getFatigueLevel", () => {
  it("returns correct levels with default thresholds", () => {
    expect(getFatigueLevel(80)).toBe("high");
    expect(getFatigueLevel(70)).toBe("high");
    expect(getFatigueLevel(55)).toBe("medium");
    expect(getFatigueLevel(40)).toBe("medium");
    expect(getFatigueLevel(20)).toBe("low");
    expect(getFatigueLevel(0)).toBe("low");
  });

  it("respects custom thresholds", () => {
    expect(getFatigueLevel(55, 60, 30)).toBe("medium");
    expect(getFatigueLevel(65, 60, 30)).toBe("high");
    expect(getFatigueLevel(25, 60, 30)).toBe("low");
  });
});
