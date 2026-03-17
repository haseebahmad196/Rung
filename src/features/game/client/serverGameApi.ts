import type { BidValue } from "@/features/game";
import type { ServerGameSnapshot } from "./serverGameTypes";

type ServerGameResponse = {
  game: ServerGameSnapshot;
};

export async function fetchServerGame(tableId: string, playerId: string) {
  const cacheKey = Date.now();
  const response = await fetch(
    `/api/realtime/game?tableId=${encodeURIComponent(tableId)}&playerId=${encodeURIComponent(playerId)}&_ts=${cacheKey}`,
    { cache: "no-store" }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch game state.");
  }

  const data = (await response.json()) as ServerGameResponse;
  return data.game;
}

export async function startServerGame(tableId: string, playerId: string, fillBots = true) {
  const response = await fetch("/api/realtime/game/start", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tableId,
      playerId,
      fillBots,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to start game.");
  }

  const data = (await response.json()) as ServerGameResponse;
  return data.game;
}

export async function postServerBidAction(
  tableId: string,
  playerId: string,
  action: "pass" | "bid",
  bid?: BidValue
) {
  const response = await fetch("/api/realtime/game/bid", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tableId,
      playerId,
      action,
      bid,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to apply bid action.");
  }

  const data = (await response.json()) as ServerGameResponse;
  return data.game;
}

export async function postServerTrumpSelection(tableId: string, playerId: string, cardId: string) {
  const response = await fetch("/api/realtime/game/trump", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tableId,
      playerId,
      cardId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to select trump.");
  }

  const data = (await response.json()) as ServerGameResponse;
  return data.game;
}

export async function postServerPlayCard(tableId: string, playerId: string, cardId: string) {
  const response = await fetch("/api/realtime/game/play", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tableId,
      playerId,
      cardId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to play card.");
  }

  const data = (await response.json()) as ServerGameResponse;
  return data.game;
}
