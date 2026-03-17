import { NextRequest, NextResponse } from "next/server";
import { getPresenceStore } from "@/features/table/realtime/server/presenceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tableId = request.nextUrl.searchParams.get("tableId")?.trim();
  if (!tableId) {
    return NextResponse.json({ error: "tableId is required" }, { status: 400 });
  }

  const store = getPresenceStore();
  const state = store.getSnapshot(tableId);

  return NextResponse.json({ state }, { status: 200 });
}
