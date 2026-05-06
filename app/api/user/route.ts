import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-passive-1";

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    lastActiveAt: user.lastActiveAt.toISOString(),
    teamMateIds: user.teamMateIds ? JSON.parse(user.teamMateIds) : [],
  });
}
