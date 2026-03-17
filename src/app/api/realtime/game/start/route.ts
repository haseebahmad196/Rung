import { NextResponse } from "next/server";
import { getServerMatchManager } from "@/features/game/server/matchManager";
import { getPresenceStore } from "@/features/table/realtime/server/presenceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StartGameBody = {
  tableId?: string;
  playerId?: string;
  fillBots?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as StartGameBody;
  const tableId = body.tableId?.trim();
  const playerId = body.playerId?.trim();

  if (!tableId || !playerId) {
    return NextResponse.json({ error: "tableId and playerId are required" }, { status: 400 });
  }

  try {
    const presenceStore = getPresenceStore();
    const tableState = presenceStore.getSnapshot(tableId);
    const manager = getServerMatchManager();
    manager.startGame(tableState, { fillBots: body.fillBots ?? false });
    const game = manager.getGameView(tableId, playerId);

    if (!game) {
      return NextResponse.json({ error: "Game has not been started for this table yet." }, { status: 404 });
    }

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start game.",
      },
      { status: 400 }
    );
  }
}