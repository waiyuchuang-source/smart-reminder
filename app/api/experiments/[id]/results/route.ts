import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proportionZTest } from "@/lib/stats-significance";

interface VariantMetrics {
  variantId: string;
  variantName: string;
  views: number;
  clicks: number;
  ctr: number;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({ where: { id } });
  if (!experiment) {
    return NextResponse.json({ success: false, error: "Experiment not found" }, { status: 404 });
  }

  const variants = JSON.parse(experiment.variants) as { id: string; name: string }[];

  const logs = await prisma.nudgeLog.groupBy({
    by: ["variantId", "action"],
    where: { experimentId: id },
    _count: true,
  });

  const metricsMap = new Map<string, { views: number; clicks: number }>();
  for (const v of variants) {
    metricsMap.set(v.id, { views: 0, clicks: 0 });
  }

  for (const row of logs) {
    if (!row.variantId) continue;
    const m = metricsMap.get(row.variantId);
    if (!m) continue;
    if (row.action === "nudge_viewed") m.views += row._count;
    if (row.action === "nudge_clicked") m.clicks += row._count;
  }

  const variantMetrics: VariantMetrics[] = variants.map((v) => {
    const m = metricsMap.get(v.id) || { views: 0, clicks: 0 };
    return {
      variantId: v.id,
      variantName: v.name,
      views: m.views,
      clicks: m.clicks,
      ctr: m.views > 0 ? (m.clicks / m.views) * 100 : 0,
    };
  });

  const comparisons: { variantA: string; variantB: string; zScore: number; pValue: number; significant: boolean; confidenceLevel: string }[] = [];
  for (let i = 0; i < variantMetrics.length; i++) {
    for (let j = i + 1; j < variantMetrics.length; j++) {
      const a = variantMetrics[i];
      const b = variantMetrics[j];
      const result = proportionZTest(a.clicks, a.views, b.clicks, b.views);
      comparisons.push({
        variantA: a.variantId,
        variantB: b.variantId,
        ...result,
      });
    }
  }

  const totalAssignments = await prisma.experimentAssignment.count({ where: { experimentId: id } });

  return NextResponse.json({
    success: true,
    data: {
      experiment: { ...experiment, variants },
      metrics: variantMetrics,
      comparisons,
      totalAssignments,
    },
  });
}
