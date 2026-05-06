import { User, Task, NudgeCopy } from "./types";
import { nudgeGovernor } from "./nudge-governor";

export interface NudgeResult {
  message: string | null;
  isAppropriateTime: boolean;
  reason?: string;
  copyId?: string;
  tone?: string;
}

export interface FatigueOptions {
  fatigueScore?: number;
  fatigueThresholdHigh?: number;
  fatigueThresholdMedium?: number;
}

export function matchNudgeForUser(
  user: User,
  tasks: Task[],
  copies: NudgeCopy[],
  allUsers: User[],
  mockHour?: number,
  mockMinute?: number,
  fatigue?: FatigueOptions,
): NudgeResult {
  const pendingTasks = tasks.filter((t) => t.status !== "completed");

  if (pendingTasks.length === 0 && tasks.length > 0) {
    const candidates = copies.filter((c) => c.tone === "motivational");
    const best = selectBestCandidate(candidates.length ? candidates : copies, user, null);
    return { message: interpolate(best.template, user, null, allUsers), isAppropriateTime: true, copyId: best.id, tone: best.tone };
  }

  if (pendingTasks.length === 0) {
    return { message: null, isAppropriateTime: true };
  }

  const nextTask = pendingTasks[0];
  const now = new Date();
  const currentHour = mockHour !== undefined ? mockHour : now.getHours();
  const currentMinute = mockMinute !== undefined ? mockMinute : now.getMinutes();

  const freqCheck = nudgeGovernor.isAllowed(user.id, "standard_nudge");
  if (!freqCheck.allowed) {
    return { message: "正在专注学习中，我会静静陪伴你...", isAppropriateTime: false, reason: freqCheck.reason };
  }

  if (fatigue?.fatigueScore !== undefined) {
    const highThreshold = fatigue.fatigueThresholdHigh ?? 70;
    const medThreshold = fatigue.fatigueThresholdMedium ?? 40;
    if (fatigue.fatigueScore >= highThreshold) {
      return { message: "检测到你可能有些疲惫，先休息一下吧，我稍后再来陪你~", isAppropriateTime: false, reason: "fatigue_high" };
    }
    if (fatigue.fatigueScore >= medThreshold) {
      copies = copies.filter((c) => (c.baseScore || 5) >= 7);
      if (copies.length === 0) {
        return { message: "今天辛苦了，只推荐最适合你的内容~", isAppropriateTime: true };
      }
    }
  }

  let isAppropriateTime = false;
  let fallbackMessage = "";

  if (user.segment === "active") {
    isAppropriateTime = currentHour === 21;
    fallbackMessage = `自驱型学霸无需打扰，如果 21:00 还没完成「${nextTask.title}」，我再来提醒你~`;
  } else if (user.segment === "passive") {
    if (user.preferredReminderTime) {
      const [pHour, pMin] = user.preferredReminderTime.split(":").map(Number);
      const diff = pHour * 60 + pMin - (currentHour * 60 + currentMinute);
      isAppropriateTime = diff > 0 && diff <= 15;
    }
    if (!isAppropriateTime) {
      isAppropriateTime = (currentHour >= 16 && currentHour < 18) || (currentHour >= 19 && currentHour < 21);
      fallbackMessage = `被动型学生建议在 17:00 或 20:00 前处理任务，目前处于非提醒高峰。`;
    }
  } else if (user.segment === "at-risk") {
    isAppropriateTime = true;
  }

  if (!isAppropriateTime) {
    return { message: fallbackMessage, isAppropriateTime: false };
  }

  const buddyProgress = getBuddyProgress(user, allUsers);

  const candidates = copies.filter(
    (c) => c.targetSegment === user.segment || c.targetSegment === "all" || c.tone === getPreferredTone(user.segment),
  );

  const bestCopy = selectBestCandidate(candidates.length ? candidates : copies, user, nextTask, buddyProgress);

  return { message: interpolate(bestCopy.template, user, nextTask, allUsers), isAppropriateTime: true, copyId: bestCopy.id, tone: bestCopy.tone };
}

interface BuddyProgress {
  buddyName: string;
  buddyCompletionRate: number;
  buddyIsOnline: boolean;
}

function getBuddyProgress(user: User, allUsers: User[]): BuddyProgress | null {
  if (!user.deskMateId) return null;
  const buddy = allUsers.find((u) => u.id === user.deskMateId);
  if (!buddy) return null;
  const completionRate = Math.min(buddy.streakDays / 30, 1);
  return { buddyName: buddy.name, buddyCompletionRate: completionRate, buddyIsOnline: buddy.isOnline ?? false };
}

function selectBestCandidate(candidates: NudgeCopy[], user: User, task: Task | null, buddyProgress?: BuddyProgress | null): NudgeCopy {
  if (candidates.length === 0) throw new Error("No copies available");

  const scores = candidates.map((copy) => {
    let score = copy.baseScore || 5;
    if (copy.targetSegment === user.segment) score += 3;
    if (copy.tone === getPreferredTone(user.segment)) score += 2;
    if (task && task.durationMinutes > 30 && copy.tags?.includes("efficient")) score += 1;
    if (user.streakDays > 7 && copy.tags?.includes("streak")) score += 1.5;
    if (user.deskMateName && copy.tags?.includes("social")) score += 1;
    if (buddyProgress) {
      if (buddyProgress.buddyIsOnline && copy.tags?.includes("social")) score += 2;
      if (buddyProgress.buddyCompletionRate > 0.5 && copy.tags?.includes("competitive")) score += 1.5;
    }
    score += Math.random();
    return { copy, score };
  });

  return scores.sort((a, b) => b.score - a.score)[0].copy;
}

function getPreferredTone(segment: string): string {
  switch (segment) {
    case "active": return "motivational";
    case "passive": return "empathetic";
    case "at-risk": return "humorous";
    default: return "empathetic";
  }
}

function interpolate(template: string, user: User, task: Task | null, allUsers: User[]): string {
  let result = template.replace(/{user_name}/g, user.name).replace(/{streak}/g, user.streakDays.toString());

  const buddy = user.deskMateId ? allUsers.find((u) => u.id === user.deskMateId) : null;
  result = result.replace(/{buddy_name}/g, buddy?.name || user.deskMateName || "你的队友");

  if (task) {
    result = result.replace(/{task_name}/g, task.title).replace(/{task_duration}/g, task.durationMinutes.toString());
  }
  return result;
}
