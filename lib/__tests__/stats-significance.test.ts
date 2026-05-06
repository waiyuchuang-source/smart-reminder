import { describe, it, expect } from "vitest";
import { proportionZTest } from "../stats-significance";

describe("Proportion Z-Test", () => {
  it("should detect significant difference with large sample", () => {
    const result = proportionZTest(150, 1000, 100, 1000);
    expect(result.significant).toBe(true);
    expect(result.confidenceLevel).toBe("high");
    expect(result.pValue).toBeLessThan(0.05);
  });

  it("should not detect significance with similar proportions", () => {
    const result = proportionZTest(50, 500, 48, 500);
    expect(result.significant).toBe(false);
  });

  it("should handle zero views gracefully", () => {
    const result = proportionZTest(0, 0, 10, 100);
    expect(result.pValue).toBe(1);
    expect(result.significant).toBe(false);
    expect(result.confidenceLevel).toBe("low");
  });

  it("should handle identical proportions", () => {
    const result = proportionZTest(10, 100, 10, 100);
    expect(result.zScore).toBe(0);
    expect(result.significant).toBe(false);
  });

  it("should return non-significant for small effect size", () => {
    const result = proportionZTest(55, 500, 45, 500);
    expect(result.pValue).toBeGreaterThan(0.05);
    expect(result.confidenceLevel).not.toBe("high");
  });

  it("should return correct z-score sign", () => {
    const result = proportionZTest(200, 1000, 100, 1000);
    expect(result.zScore).toBeGreaterThan(0);

    const reversed = proportionZTest(100, 1000, 200, 1000);
    expect(reversed.zScore).toBeLessThan(0);
  });
});
