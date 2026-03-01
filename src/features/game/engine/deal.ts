import type { Card, PlayerState } from "../types";

export function dealCardsToPlayers(
  deck: Card[],
  players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>
): PlayerState[] {
  if (players.length !== 4) {
    throw new Error("Court Piece requires exactly 4 players.");
  }

  if (deck.length !== 52) {
    throw new Error("A standard 52-card deck is required.");
  }

  const playerStates: PlayerState[] = players.map((player) => ({
    ...player,
    hand: [],
  }));

  for (let cardIndex = 0; cardIndex < deck.length; cardIndex += 1) {
    const playerIndex = cardIndex % 4;
    playerStates[playerIndex].hand.push(deck[cardIndex]);
  }

  return playerStates;
}
