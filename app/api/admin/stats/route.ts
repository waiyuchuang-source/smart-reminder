import { NextResponse } from "next/server";
import { db } from "@/lib/mock-data";

export async function GET() {
  const stats = Object.entries(db.stats).map(([tone, data]) => ({
    tone,
    views: data.views,
    clicks: data.clicks,
    ctr: data.views > 0 ? (data.clicks / data.views) * 100 : 0,
  }));

  return NextResponse.json({
    stats,
    weights: db.weights,
    totalCopies: db.generatedCopies.length,
  });
}
