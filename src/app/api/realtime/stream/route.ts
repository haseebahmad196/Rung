import { NextRequest } from "next/server";
import { getServerMatchManager } from "@/features/game/server/matchManager";
import { getPresenceStore } from "@/features/table/realtime/server/presenceStore";
import type { TableRealtimeState } from "@/features/table/realtime/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeState(state: TableRealtimeState) {
  return `event: state\ndata: ${JSON.stringify(state)}\n\n`;
}

function encodeGame(game: unknown) {
  return `event: game\ndata: ${JSON.stringify(game)}\n\n`;
}

export async function GET(request: NextRequest) {
  const tableId = request.nextUrl.searchParams.get("tableId")?.trim();
  const playerId = request.nextUrl.searchParams.get("playerId")?.trim() ?? null;

  if (!tableId) {
    return new Response("tableId is required", { status: 400 });
  }

  const store = getPresenceStore();
  const matchManager = getServerMatchManager();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const writeState = (state: TableRealtimeState) => {
        controller.enqueue(encoder.encode(encodeState(state)));
      };

      const writeGame = () => {
        if (!playerId) return;
        controller.enqueue(encoder.encode(encodeGame(matchManager.getGameView(tableId, playerId))));
      };

      writeState(store.getSnapshot(tableId));
      writeGame();

      const unsubscribe = store.subscribe(tableId, (state) => {
        writeState(state);
      });

      const unsubscribeGame = matchManager.subscribe(tableId, () => {
        writeGame();
      });

      const keepAliveTimer = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAliveTimer);
        unsubscribe();
        unsubscribeGame();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
