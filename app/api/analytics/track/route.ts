import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TrackEventSchema = z.object({
  userId: z.string(),
  copyId: z.string(),
  tone: z.string(),
  action: z.enum(["nudge_viewed", "nudge_clicked", "task_completed", "dismissed"]),
  experimentId: z.string().optional(),
  variantId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = TrackEventSchema.parse(body);

    const log = await prisma.nudgeLog.create({
      data: {
        userId: event.userId,
        copyId: event.copyId,
        tone: event.tone,
        action: event.action,
        experimentId: event.experimentId,
        variantId: event.variantId,
      },
    });

    return NextResponse.json({ success: true, id: log.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid event data" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to track event" }, { status: 500 });
  }
}
