import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { matchNudgeForUser } from "../nudge-matcher";
import { nudgeGovernor } from "../nudge-governor";
import { MOCK_USERS, FALLBACK_COPIES } from "../mock-data";
import { storageAdapter } from "../storage-adapter";
import type { NudgeCopy } from "../types";

const copies: NudgeCopy[] = FALLBACK_COPIES;
const allUsers = MOCK_USERS;

describe("Nudge Logic & Scoring Engine", () => {
  const user = MOCK_USERS[0]; // passive user
  const tasks = [
    {
      id: "task-test",
      title: "Test Task",
      course: "Math",
      durationMinutes: 20,
      status: "pending" as const,
      dueDate: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    storageAdapter.clearAll();
    nudgeGovernor.clearHistory(user.id);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should match an empathetic nudge for a passive user at appropriate time", () => {
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55);
    expect(result.isAppropriateTime).toBe(true);
    expect(result.message).toContain("林晓");
    expect(result.message).toContain("Test Task");
  });

  it("should block nudges based on frequency control (Global Cooling)", () => {
    nudgeGovernor.recordDelivery(user.id, "standard_nudge");
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55);
    expect(result.isAppropriateTime).toBe(false);
    expect(result.reason).toContain("Global cooling");
  });

  it("should allow nudges after cooling period", () => {
    nudgeGovernor.recordDelivery(user.id, "standard_nudge");
    vi.advanceTimersByTime(61 * 60 * 1000);
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55);
    expect(result.isAppropriateTime).toBe(true);
  });

  it("should provide motivational nudge when all tasks are completed", () => {
    const completedTasks = [{ ...tasks[0], status: "completed" as const }];
    const result = matchNudgeForUser(user, completedTasks, copies, allUsers);
    expect(result.isAppropriateTime).toBe(true);
    expect(result.copyId).toBeTruthy();
  });

  it("should handle invalid time gracefully", () => {
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 3, 0);
    expect(result.isAppropriateTime).toBe(false);
    expect(result.message).toContain("处理任务");
  });

  it("should suppress nudge when fatigue is high (>=70)", () => {
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55, {
      fatigueScore: 85,
      fatigueThresholdHigh: 70,
      fatigueThresholdMedium: 40,
    });
    expect(result.isAppropriateTime).toBe(false);
    expect(result.reason).toBe("fatigue_high");
    expect(result.message).toContain("休息");
  });

  it("should still produce a result at medium fatigue (40-70) but filter low-quality copies", () => {
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55, {
      fatigueScore: 55,
      fatigueThresholdHigh: 70,
      fatigueThresholdMedium: 40,
    });
    expect(result.isAppropriateTime).toBe(true);
    expect(result.message).toBeTruthy();
  });

  it("should behave normally at low fatigue (<40)", () => {
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55, {
      fatigueScore: 20,
      fatigueThresholdHigh: 70,
      fatigueThresholdMedium: 40,
    });
    expect(result.isAppropriateTime).toBe(true);
    expect(result.message).toContain("林晓");
  });
});
