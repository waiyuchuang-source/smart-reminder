import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tones = ["empathetic", "motivational", "humorous"] as const;

  const [statsRaw, weights, totalCopies, totalViews, totalClicks, totalDismissed, totalCompleted] = await Promise.all([
    Promise.all(
      tones.map(async (tone) => {
        const [views, clicks, dismissed] = await Promise.all([
          prisma.nudgeLog.count({ where: { tone, action: "nudge_viewed" } }),
          prisma.nudgeLog.count({ where: { tone, action: "nudge_clicked" } }),
          prisma.nudgeLog.count({ where: { tone, action: "dismissed" } }),
        ]);
        return {
          tone,
          views,
          clicks,
          dismissed,
          ctr: views > 0 ? (clicks / views) * 100 : 0,
          dismissRate: (views + dismissed) > 0 ? (dismissed / (views + dismissed)) * 100 : 0,
        };
      }),
    ),
    prisma.toneWeight.findMany(),
    prisma.nudgeCopy.count(),
    prisma.nudgeLog.count({ where: { action: "nudge_viewed" } }),
    prisma.nudgeLog.count({ where: { action: "nudge_clicked" } }),
    prisma.nudgeLog.count({ where: { action: "dismissed" } }),
    prisma.nudgeLog.count({ where: { action: "task_completed" } }),
  ]);

  const weightMap: Record<string, number> = {};
  for (const w of weights) weightMap[w.tone] = w.weight;

  const openRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const completionRate = totalClicks > 0 ? (totalCompleted / totalClicks) * 100 : 0;
  const overallDismissRate = (totalViews + totalDismissed) > 0 ? (totalDismissed / (totalViews + totalDismissed)) * 100 : 0;

  return NextResponse.json({
    stats: statsRaw,
    weights: weightMap,
    totalCopies,
    totalViews,
    totalClicks,
    totalDismissed,
    totalCompleted,
    openRate,
    completionRate,
    overallDismissRate,
  });
}
