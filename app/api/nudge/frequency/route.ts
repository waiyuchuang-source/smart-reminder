import { NextRequest, NextResponse } from "next/server";
import { getFrequencyConfig } from "@/lib/frequency-config";

interface FrequencyRecord {
  userId: string;
  type: string;
  timestamp: number;
}

const frequencyStore = new Map<string, FrequencyRecord[]>();
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const config = await getFrequencyConfig();
  const globalCoolingMs = config.globalCoolingMinutes * 60 * 1000;

  const records = frequencyStore.get(userId) ?? [];
  const now = Date.now();

  const lastRecord = records[0];
  if (lastRecord && now - lastRecord.timestamp < globalCoolingMs) {
    const remainMs = globalCoolingMs - (now - lastRecord.timestamp);
    return NextResponse.json({
      allowed: false,
      reason: "global_cooling",
      remainSeconds: Math.ceil(remainMs / 1000),
      todayCount: getDailyCount(records, now),
    });
  }

  const dailyCount = getDailyCount(records, now);
  if (dailyCount >= config.maxDailyNudges) {
    return NextResponse.json({
      allowed: false,
      reason: "daily_limit",
      todayCount: dailyCount,
    });
  }

  return NextResponse.json({
    allowed: true,
    todayCount: dailyCount,
  });
}

/** POST: 记录一次投递事件 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const userId = typeof body.userId === "string" ? body.userId : null;
  const type = typeof body.type === "string" ? body.type : "standard_nudge";

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const records = frequencyStore.get(userId) ?? [];
  const newRecord: FrequencyRecord = { userId, type, timestamp: Date.now() };

  // 保留最近 100 条，防止内存膨胀
  const updated = [newRecord, ...records].slice(0, 100);
  frequencyStore.set(userId, updated);

  return NextResponse.json({
    recorded: true,
    todayCount: getDailyCount(updated, Date.now()),
  });
}

function getDailyCount(records: FrequencyRecord[], now: number): number {
  const dayStart = now - DAY_MS;
  return records.filter((r) => r.timestamp > dayStart).length;
}
