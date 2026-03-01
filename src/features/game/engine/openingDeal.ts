import type { PlayerState } from "../types";
import { createStandardDeck, shuffleDeck } from "./deck";

export function dealOpeningHands(
  players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>,
  random = Math.random
): PlayerState[] {
  if (players.length !== 4) {
    throw new Error("Opening deal requires exactly 4 players.");
  }

  const shuffled = shuffleDeck(createStandardDeck(), random);
  const handSize = 5;
  const sortedPlayers = [...players].sort((left, right) => left.seat - right.seat);

  const next = sortedPlayers.map((player) => ({ ...player, hand: [] as PlayerState["hand"] }));

  for (let round = 0; round < handSize; round += 1) {
    for (let playerIndex = 0; playerIndex < next.length; playerIndex += 1) {
      const deckIndex = round * next.length + playerIndex;
      const card = shuffled[deckIndex];
      next[playerIndex].hand.push(card);
    }
  }

  const dealtIds = next.flatMap((player) => player.hand.map((card) => card.id));
  const uniqueIds = new Set(dealtIds);
  if (dealtIds.length !== uniqueIds.size) {
    throw new Error("Opening deal produced duplicate cards.");
  }

  const invalidHand = next.find((player) => player.hand.length !== handSize);
  if (invalidHand) {
    throw new Error("Opening deal failed to give 5 cards to each player.");
  }

  return next;
}
