import { NextResponse } from "next/server";
import { getServerMatchManager } from "@/features/game/server/matchManager";
import type { BidValue } from "@/features/game";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BidRequestBody = {
  tableId?: string;
  playerId?: string;
  action?: "pass" | "bid";
  bid?: BidValue;
};

function isBidValue(value: number): value is BidValue {
  return value === 7 || value === 9 || value === 11 || value === 13;
}

export async function POST(request: Request) {
  const body = (await request.json()) as BidRequestBody;
  const tableId = body.tableId?.trim();
  const playerId = body.playerId?.trim();
  const parsedBid = Number(body.bid);

  if (!tableId || !playerId || !body.action) {
    return NextResponse.json(
      { error: "tableId, playerId and action are required" },
      { status: 400 }
    );
  }

  const manager = getServerMatchManager();

  try {
    const updated =
      body.action === "pass"
        ? manager.applyBidAction(tableId, playerId, { type: "pass" })
        : isBidValue(parsedBid)
        ? manager.applyBidAction(tableId, playerId, {
            type: "bid",
            bid: parsedBid,
          })
        : null;

    if (!updated) {
      return NextResponse.json({ error: "Valid bid value is required" }, { status: 400 });
    }

    const game = manager.getGameView(tableId, playerId);
    if (!game) {
      return NextResponse.json({ error: "Game has not been started for this table yet." }, { status: 404 });
    }

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to apply bid action.",
      },
      { status: 400 }
    );
  }
}
