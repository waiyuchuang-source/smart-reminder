import { NextResponse } from "next/server";
import { getAllUserFatigue } from "@/lib/fatigue";

export async function GET() {
  try {
    const data = await getAllUserFatigue();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to compute fatigue" }, { status: 500 });
  }
}
