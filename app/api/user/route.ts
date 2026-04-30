import { NextResponse } from "next/server";
import { MOCK_USERS } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-passive-1";
  
  const user = MOCK_USERS.find((u) => u.id === userId);
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
