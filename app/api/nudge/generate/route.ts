import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCopiesBatch } from "@/lib/ai-engine";

export async function POST() {
  const BATCH_SIZE = 10;

  const weights = await prisma.toneWeight.findMany();
  const weightMap: Record<string, number> = {};
  for (const w of weights) weightMap[w.tone] = w.weight;

  const empatheticCount = Math.round(BATCH_SIZE * (weightMap.empathetic ?? 0.6));
  const motivationalCount = Math.round(BATCH_SIZE * (weightMap.motivational ?? 0.3));
  const humorousCount = Math.round(BATCH_SIZE * (weightMap.humorous ?? 0.1));

  const [emp, mot, hum] = await Promise.all([
    generateCopiesBatch("empathetic", empatheticCount),
    generateCopiesBatch("motivational", motivationalCount),
    generateCopiesBatch("humorous", humorousCount),
  ]);

  const allCopies = [...emp, ...mot, ...hum];

  await prisma.nudgeCopy.createMany({
    data: allCopies.map((c, i) => ({
      id: `gen-${Date.now()}-${i}`,
      tone: c.tone,
      targetSegment: "all",
      template: c.template,
      baseScore: 5,
    })),
  });

  return NextResponse.json({
    success: true,
    generated: allCopies.length,
    distribution: { empathetic: emp.length, motivational: mot.length, humorous: hum.length },
  });
}
