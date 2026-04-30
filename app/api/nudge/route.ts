import { NextResponse } from "next/server";
import { MOCK_USERS, MOCK_TASKS } from "@/lib/mock-data";
import { matchNudgeForUser } from "@/lib/nudge-matcher";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-passive-1";
  
  const user = MOCK_USERS.find((u) => u.id === userId);
  const tasks = MOCK_TASKS[userId] || [];
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const message = matchNudgeForUser(user, tasks);

  return NextResponse.json({ message });
}
