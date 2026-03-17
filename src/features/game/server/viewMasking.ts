import type { Card, PlayerState } from "@/features/game";
import type { ServerGameState } from "./types";

function maskHandForViewer(hand: Card[]) {
  return hand.map((card) => ({
    id: `hidden-${card.id}`,
    suit: "clubs" as const,
    rank: "2" as const,
  }));
}

export function buildGameView(game: ServerGameState, viewerPlayerId: string) {
  const filteredOpeningHands = game.openingHands.map((player) =>
    player.id === viewerPlayerId ? player : { ...player, hand: maskHandForViewer(player.hand) }
  );

  const filteredActiveRound = game.activeRound
    ? {
        ...game.activeRound,
        players: game.activeRound.players.map((player: PlayerState) =>
          player.id === viewerPlayerId ? player : { ...player, hand: maskHandForViewer(player.hand) }
        ),
      }
    : null;

  return {
    gameId: game.gameId,
    tableId: game.tableId,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    stage: game.stage,
    roundNumber: game.roundNumber,
    players: game.players,
    bidding: game.bidding,
    openingHands: filteredOpeningHands,
    trumpSuit: game.trumpSuit,
    activeRound: filteredActiveRound,
    winnerTeam: game.winnerTeam,
  };
}
