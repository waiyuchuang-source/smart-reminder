import { NextResponse } from "next/server";
import { db } from "@/lib/mock-data";
import { generateCopiesBatch } from "@/lib/ai-engine";
import { NudgeTone } from "@/lib/types";

export async function POST() {
  const BATCH_SIZE = 10;
  
  const empatheticCount = Math.round(BATCH_SIZE * db.weights.empathetic);
  const motivationalCount = Math.round(BATCH_SIZE * db.weights.motivational);
  const humorousCount = Math.round(BATCH_SIZE * db.weights.humorous);

  // Run in parallel
  const [emp, mot, hum] = await Promise.all([
    generateCopiesBatch("empathetic", empatheticCount),
    generateCopiesBatch("motivational", motivationalCount),
    generateCopiesBatch("humorous", humorousCount),
  ]);

  const newCopies = [...emp, ...mot, ...hum].map((c, i) => ({
    ...c,
    id: `gen-${Date.now()}-${i}`,
    targetSegment: "all" as const, // Simplified for demo
  }));

  // Update in-memory DB
  db.generatedCopies = [...newCopies, ...db.generatedCopies].slice(0, 50); // Keep last 50

  return NextResponse.json({ 
    success: true, 
    generated: newCopies.length,
    distribution: {
      empathetic: emp.length,
      motivational: mot.length,
      humorous: hum.length
    }
  });
}
