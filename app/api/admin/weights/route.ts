import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ToneWeights } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const weights: ToneWeights = await request.json();

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 0.01) {
      return NextResponse.json({ error: "Weights must sum to 1" }, { status: 400 });
    }

    await Promise.all(
      Object.entries(weights).map(([tone, weight]) =>
        prisma.toneWeight.upsert({ where: { tone }, update: { weight }, create: { tone, weight } }),
      ),
    );

    return NextResponse.json({ success: true, weights });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
