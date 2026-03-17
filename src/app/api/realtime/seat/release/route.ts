import { NextResponse } from "next/server";
import { getPresenceStore } from "@/features/table/realtime/server/presenceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReleaseSeatBody = {
  tableId?: string;
  playerId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ReleaseSeatBody;
  const tableId = body.tableId?.trim();
  const playerId = body.playerId?.trim();

  if (!tableId || !playerId) {
    return NextResponse.json({ error: "tableId and playerId are required" }, { status: 400 });
  }

  const store = getPresenceStore();
  const state = store.releaseSeat(tableId, playerId);

  return NextResponse.json({ state }, { status: 200 });
}
