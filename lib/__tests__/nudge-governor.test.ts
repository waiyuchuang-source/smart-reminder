import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nudgeGovernor } from "../nudge-governor";
import { storageAdapter } from "../storage-adapter";

describe("Nudge Governor — 频控边界测试", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    storageAdapter.clearAll();
    nudgeGovernor.clearHistory("test-user");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("首次请求应当放行", () => {
    const result = nudgeGovernor.isAllowed("test-user", "standard_nudge");
    expect(result.allowed).toBe(true);
  });

  it("全局冷却期内（15分钟）应当拦截", () => {
    nudgeGovernor.recordDelivery("test-user", "standard_nudge");
    const result = nudgeGovernor.isAllowed("test-user", "standard_nudge");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Global cooling");
  });

  it("全局冷却期过后但类型冷却期内应当拦截", () => {
    nudgeGovernor.recordDelivery("test-user", "standard_nudge");

    // 推进 16 分钟（超过全局冷却 15 分钟）
    vi.advanceTimersByTime(16 * 60 * 1000);

    const result = nudgeGovernor.isAllowed("test-user", "standard_nudge");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Type-specific cooling");
  });

  it("类型冷却期过后（60分钟）应当放行", () => {
    nudgeGovernor.recordDelivery("test-user", "standard_nudge");

    // 推进 61 分钟
    vi.advanceTimersByTime(61 * 60 * 1000);

    const result = nudgeGovernor.isAllowed("test-user", "standard_nudge");
    expect(result.allowed).toBe(true);
  });

  it("不同类型的 nudge 不应互相影响类型冷却", () => {
    nudgeGovernor.recordDelivery("test-user", "type_a");

    // 推进 16 分钟（超过全局冷却）
    vi.advanceTimersByTime(16 * 60 * 1000);

    // type_b 不应被 type_a 的类型冷却影响
    const result = nudgeGovernor.isAllowed("test-user", "type_b");
    expect(result.allowed).toBe(true);
  });

  it("clearHistory 应当清除指定用户的所有记录", () => {
    nudgeGovernor.recordDelivery("test-user", "standard_nudge");
    nudgeGovernor.clearHistory("test-user");

    const result = nudgeGovernor.isAllowed("test-user", "standard_nudge");
    expect(result.allowed).toBe(true);
  });

  it("不同用户的频控状态应当隔离", () => {
    nudgeGovernor.recordDelivery("user-a", "standard_nudge");

    const resultB = nudgeGovernor.isAllowed("user-b", "standard_nudge");
    expect(resultB.allowed).toBe(true);
  });
});
