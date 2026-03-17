import { NextResponse } from "next/server";
import { getServerMatchManager } from "@/features/game/server/matchManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlayCardBody = {
  tableId?: string;
  playerId?: string;
  cardId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as PlayCardBody;
  const tableId = body.tableId?.trim();
  const playerId = body.playerId?.trim();
  const cardId = body.cardId?.trim();

  if (!tableId || !playerId || !cardId) {
    return NextResponse.json(
      { error: "tableId, playerId and cardId are required" },
      { status: 400 }
    );
  }

  try {
    const manager = getServerMatchManager();
    manager.playCard(tableId, playerId, cardId);
    const game = manager.getGameView(tableId, playerId);

    if (!game) {
      return NextResponse.json({ error: "Game has not been started for this table yet." }, { status: 404 });
    }

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to play card.",
      },
      { status: 400 }
    );
  }
}
