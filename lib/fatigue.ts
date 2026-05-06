import { prisma } from "./prisma";

export interface FatigueFactors {
  dismissRate: number;
  recentDensity: number;
  timeOfDayFactor: number;
}

export interface FatigueResult {
  score: number;
  level: "low" | "medium" | "high";
  factors: FatigueFactors;
}

const WEIGHTS = { dismissRate: 0.5, recentDensity: 0.3, timeOfDay: 0.2 };
const DENSITY_CAP = 6;

export function getTimeOfDayFactor(hour: number): number {
  if (hour >= 23 || hour < 6) return 1.0;
  if ((hour >= 6 && hour < 8) || (hour >= 22 && hour < 23)) return 0.5;
  return 0.0;
}

export function calculateFatigueScore(factors: FatigueFactors): number {
  const dismissComponent = Math.min(factors.dismissRate, 1) * 100;
  const densityComponent = Math.min(factors.recentDensity / DENSITY_CAP, 1) * 100;
  const todComponent = factors.timeOfDayFactor * 100;

  const raw =
    WEIGHTS.dismissRate * dismissComponent +
    WEIGHTS.recentDensity * densityComponent +
    WEIGHTS.timeOfDay * todComponent;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function getFatigueLevel(score: number, thresholdHigh = 70, thresholdMedium = 40): "low" | "medium" | "high" {
  if (score >= thresholdHigh) return "high";
  if (score >= thresholdMedium) return "medium";
  return "low";
}

export async function getUserFatigue(userId: string, mockHour?: number): Promise<FatigueResult> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const [viewedCount, dismissedCount, recentCount] = await Promise.all([
    prisma.nudgeLog.count({ where: { userId, action: "nudge_viewed", timestamp: { gte: sevenDaysAgo } } }),
    prisma.nudgeLog.count({ where: { userId, action: "dismissed", timestamp: { gte: sevenDaysAgo } } }),
    prisma.nudgeLog.count({ where: { userId, timestamp: { gte: twoHoursAgo } } }),
  ]);

  const total = viewedCount + dismissedCount;
  const dismissRate = total > 0 ? dismissedCount / total : 0;
  const hour = mockHour !== undefined ? mockHour : now.getHours();

  const factors: FatigueFactors = {
    dismissRate,
    recentDensity: recentCount,
    timeOfDayFactor: getTimeOfDayFactor(hour),
  };

  const score = calculateFatigueScore(factors);
  return { score, level: getFatigueLevel(score), factors };
}

export async function getAllUserFatigue(): Promise<Array<{ userId: string; userName: string; fatigue: FatigueResult }>> {
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const results = await Promise.all(
    users.map(async (u) => ({
      userId: u.id,
      userName: u.name,
      fatigue: await getUserFatigue(u.id),
    })),
  );
  return results;
}
