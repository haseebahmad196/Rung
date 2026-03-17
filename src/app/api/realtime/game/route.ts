import { NextRequest, NextResponse } from "next/server";
import { getServerMatchManager } from "@/features/game/server/matchManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tableId = request.nextUrl.searchParams.get("tableId")?.trim();
  const playerId = request.nextUrl.searchParams.get("playerId")?.trim();

  if (!tableId || !playerId) {
    return NextResponse.json({ error: "tableId and playerId are required" }, { status: 400 });
  }

  const manager = getServerMatchManager();
  const game = manager.getGameView(tableId, playerId);

  if (!game) {
    return NextResponse.json({ error: "Game has not been started for this table yet." }, { status: 404 });
  }

  return NextResponse.json({ game }, { status: 200 });
}