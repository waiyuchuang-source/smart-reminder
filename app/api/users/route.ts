import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany();

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      lastActiveAt: u.lastActiveAt.toISOString(),
      teamMateIds: u.teamMateIds ? JSON.parse(u.teamMateIds) : [],
    })),
  );
}
