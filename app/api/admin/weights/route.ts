import { NextResponse } from "next/server";
import { db } from "@/lib/mock-data";
import { ToneWeights } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const weights: ToneWeights = await request.json();
    
    // Validate weights sum to 1 (approximately)
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 0.01) {
      return NextResponse.json({ error: "Weights must sum to 1" }, { status: 400 });
    }

    db.weights = weights;

    return NextResponse.json({ success: true, weights: db.weights });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
