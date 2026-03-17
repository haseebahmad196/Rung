import { NextResponse } from "next/server";
import { getPresenceStore } from "@/features/table/realtime/server/presenceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HeartbeatBody = {
  tableId?: string;
  playerId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as HeartbeatBody;
  const tableId = body.tableId?.trim();
  const playerId = body.playerId?.trim();

  if (!tableId || !playerId) {
    return NextResponse.json({ error: "tableId and playerId are required" }, { status: 400 });
  }

  const store = getPresenceStore();
  const result = store.heartbeat(tableId, playerId);

  if (!result.ok) {
    return NextResponse.json({ error: "Player not found", state: result.state }, { status: 404 });
  }

  return NextResponse.json({ state: result.state }, { status: 200 });
}
