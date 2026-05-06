import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectChurnUsers, markParentNotified } from "@/services/churn-detector.server";
import { sendParentWeeklyReport } from "@/services/external-push.server";

export async function GET() {
  const churnUsers = await detectChurnUsers();
  return Response.json({ success: true, data: { alerts: churnUsers } });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_BODY", message: "Request body must be JSON" } },
      { status: 400 },
    );
  }

  const userId = typeof body.userId === "string" ? body.userId : null;
  if (!userId) {
    return Response.json(
      { success: false, error: { code: "MISSING_USER_ID", message: "userId is required" } },
      { status: 400 },
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    return Response.json(
      { success: false, error: { code: "USER_NOT_FOUND", message: `User ${userId} not found` } },
      { status: 404 },
    );
  }

  const rawTasks = await prisma.task.findMany({ where: { userId } });
  const tasks = rawTasks.map((t) => ({
    ...t,
    status: t.status as "pending" | "in-progress" | "completed",
  }));
  const user = {
    ...dbUser,
    segment: dbUser.segment as "active" | "passive" | "at-risk",
    avatar: dbUser.avatar ?? undefined,
    lastActiveAt: dbUser.lastActiveAt.toISOString(),
    teamMateIds: dbUser.teamMateIds ? JSON.parse(dbUser.teamMateIds) : [],
    preferredReminderTime: dbUser.preferredReminderTime ?? undefined,
    deskMateName: dbUser.deskMateName ?? undefined,
    deskMateId: dbUser.deskMateId ?? undefined,
  };

  const pushResult = await sendParentWeeklyReport(user, tasks);
  markParentNotified(userId);

  return Response.json({ success: true, data: { push: pushResult } });
}
