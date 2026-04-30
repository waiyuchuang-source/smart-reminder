import { NextResponse } from "next/server";
import { MOCK_TASKS } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-passive-1";
  
  const tasks = MOCK_TASKS[userId] || [];
  
  return NextResponse.json(tasks);
}
