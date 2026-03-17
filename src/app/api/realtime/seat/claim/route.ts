import { NextResponse } from "next/server";
import { getPresenceStore } from "@/features/table/realtime/server/presenceStore";
import type { SeatNumber } from "@/features/table/realtime/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClaimSeatBody = {
  tableId?: string;
  playerId?: string;
  seat?: number;
};

function isSeatNumber(value: number): value is SeatNumber {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ClaimSeatBody;
  const tableId = body.tableId?.trim();
  const playerId = body.playerId?.trim();
  const seat = Number(body.seat);

  if (!tableId || !playerId || !isSeatNumber(seat)) {
    return NextResponse.json({ error: "tableId, playerId and valid seat are required" }, { status: 400 });
  }

  const store = getPresenceStore();
  const result = store.claimSeat(tableId, playerId, seat);

  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
