import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-passive-1";

  const tasks = await prisma.task.findMany({ where: { userId } });

  return NextResponse.json(tasks);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { taskId, status } = body as { taskId: string; status: string };

  if (!taskId || !status) {
    return NextResponse.json({ error: "taskId and status required" }, { status: 400 });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  return NextResponse.json(task);
}
