import { describe, it, expect } from "vitest";
import { hashAssign } from "../experiment";

describe("Experiment Hash Assignment", () => {
  it("should return deterministic results for same userId+experimentId", () => {
    const a = hashAssign("user-1", "exp-1", 3);
    const b = hashAssign("user-1", "exp-1", 3);
    expect(a).toBe(b);
  });

  it("should return index within variant count range", () => {
    for (let i = 0; i < 100; i++) {
      const idx = hashAssign(`user-${i}`, "exp-test", 3);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(3);
    }
  });

  it("should distribute users roughly evenly across variants", () => {
    const counts = [0, 0, 0];
    const total = 1000;
    for (let i = 0; i < total; i++) {
      counts[hashAssign(`user-${i}`, "exp-dist", 3)]++;
    }
    for (const c of counts) {
      expect(c).toBeGreaterThan(total * 0.2);
      expect(c).toBeLessThan(total * 0.5);
    }
  });

  it("should produce different assignment for different experiments", () => {
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      results.add(hashAssign("user-1", `exp-${i}`, 3));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
