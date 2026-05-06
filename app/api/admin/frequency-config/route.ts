import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getFrequencyConfig, invalidateFrequencyConfigCache } from "@/lib/frequency-config";

const FrequencyConfigSchema = z.object({
  globalCoolingMinutes: z.number().int().min(1).max(120),
  typeCoolingMinutes: z.number().int().min(1).max(480),
  maxDailyNudges: z.number().int().min(1).max(50),
  fatigueThresholdHigh: z.number().int().min(1).max(100),
  fatigueThresholdMedium: z.number().int().min(0).max(99),
}).refine((d) => d.fatigueThresholdHigh > d.fatigueThresholdMedium, {
  message: "fatigueThresholdHigh must be greater than fatigueThresholdMedium",
});

export async function GET() {
  const config = await getFrequencyConfig();
  return NextResponse.json({ success: true, data: config });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = FrequencyConfigSchema.parse(body);

    await prisma.systemConfig.upsert({
      where: { key: "frequency_config" },
      update: { value: JSON.stringify(config) },
      create: { key: "frequency_config", value: JSON.stringify(config) },
    });

    invalidateFrequencyConfigCache();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to save config" }, { status: 500 });
  }
}
