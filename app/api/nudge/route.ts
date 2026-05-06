import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchNudgeForUser } from "@/lib/nudge-matcher";
import { getActiveExperiments, getOrCreateAssignment } from "@/lib/experiment";
import { getUserFatigue } from "@/lib/fatigue";
import { getFrequencyConfig } from "@/lib/frequency-config";
import type { User, NudgeCopy } from "@/lib/types";

function toAppUser(dbUser: { id: string; name: string; avatar: string | null; segment: string; streakDays: number; lastActiveAt: Date; preferredReminderTime: string | null; deskMateName: string | null; deskMateId: string | null; isOnline: boolean; teamMateIds: string | null; rankLevel: number; rankTitle: string }): User {
  return {
    ...dbUser,
    segment: dbUser.segment as User["segment"],
    avatar: dbUser.avatar ?? undefined,
    lastActiveAt: dbUser.lastActiveAt.toISOString(),
    preferredReminderTime: dbUser.preferredReminderTime ?? undefined,
    deskMateName: dbUser.deskMateName ?? undefined,
    deskMateId: dbUser.deskMateId ?? undefined,
    teamMateIds: dbUser.teamMateIds ? JSON.parse(dbUser.teamMateIds) : [],
  };
}

function toAppCopy(c: { id: string; tone: string; targetSegment: string; template: string; createdAt: Date; baseScore: number; tags: string | null }): NudgeCopy {
  return {
    ...c,
    tone: c.tone as NudgeCopy["tone"],
    targetSegment: c.targetSegment as NudgeCopy["targetSegment"],
    createdAt: c.createdAt.toISOString(),
    tags: c.tags ? JSON.parse(c.tags) : undefined,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-passive-1";
  const mockHourParam = searchParams.get("mockHour");
  const mockMinuteParam = searchParams.get("mockMinute");
  const mockHour = mockHourParam ? parseInt(mockHourParam, 10) : undefined;
  const mockMinute = mockMinuteParam ? parseInt(mockMinuteParam, 10) : undefined;

  const [dbUser, dbTasks, dbCopies, dbAllUsers] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.task.findMany({ where: { userId } }),
    prisma.nudgeCopy.findMany(),
    prisma.user.findMany(),
  ]);

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = toAppUser(dbUser);
  const allUsers = dbAllUsers.map(toAppUser);
  const copies = dbCopies.map(toAppCopy);

  const tasks = dbTasks.map((t) => ({ ...t, status: t.status as "pending" | "in-progress" | "completed" }));

  const [fatigueResult, freqConfig] = await Promise.all([
    getUserFatigue(userId, mockHour),
    getFrequencyConfig(),
  ]);

  const result = matchNudgeForUser(user, tasks, copies, allUsers, mockHour, mockMinute, {
    fatigueScore: fatigueResult.score,
    fatigueThresholdHigh: freqConfig.fatigueThresholdHigh,
    fatigueThresholdMedium: freqConfig.fatigueThresholdMedium,
  });

  let experimentId: string | undefined;
  let variantId: string | undefined;

  try {
    const experiments = await getActiveExperiments();
    const toneExp = experiments.find((e) => e.type === "tone");
    if (toneExp && toneExp.variants.length >= 2) {
      const assignment = await getOrCreateAssignment(userId, toneExp);
      experimentId = toneExp.id;
      variantId = assignment.variantId;
    }
  } catch {
    // experiment assignment failure should not block nudge delivery
  }

  return NextResponse.json({
    ...result,
    experimentId,
    variantId,
    fatigueScore: fatigueResult.score,
    fatigueLevel: fatigueResult.level,
  });
}
