import type { PlayerState } from "../types";
import { createStandardDeck, shuffleDeck } from "./deck";

export function dealOpeningHands(
  players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>,
  random = Math.random
): PlayerState[] {
  return dealHands(players, 5, random);
}

export function dealFullHands(
  players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>,
  random = Math.random
): PlayerState[] {
  return dealHands(players, 13, random);
}

export function dealRemainingToFullHands(
  openingHands: PlayerState[],
  random = Math.random
): PlayerState[] {
  if (openingHands.length !== 4) {
    throw new Error("Deal requires exactly 4 players.");
  }

  const hasInvalidOpening = openingHands.some((player) => player.hand.length !== 5);
  if (hasInvalidOpening) {
    throw new Error("Opening deal must provide exactly 5 cards to each player.");
  }

  const dealtCardIds = new Set(openingHands.flatMap((player) => player.hand.map((card) => card.id)));
  if (dealtCardIds.size !== 20) {
    throw new Error("Opening deal contains duplicate cards.");
  }

  const remainingDeck = shuffleDeck(createStandardDeck(), random).filter(
    (card) => !dealtCardIds.has(card.id)
  );

  const sortedPlayers = [...openingHands]
    .sort((left, right) => left.seat - right.seat)
    .map((player) => ({ ...player, hand: [...player.hand] }));

  let deckIndex = 0;
  for (let round = 0; round < 8; round += 1) {
    for (let playerIndex = 0; playerIndex < sortedPlayers.length; playerIndex += 1) {
      const card = remainingDeck[deckIndex];
      if (!card) {
        throw new Error("Not enough cards to complete full hands.");
      }
      sortedPlayers[playerIndex].hand.push(card);
      deckIndex += 1;
    }
  }

  const allIds = sortedPlayers.flatMap((player) => player.hand.map((card) => card.id));
  if (new Set(allIds).size !== 52) {
    throw new Error("Final deal produced duplicate cards.");
  }

  const invalidFinalHand = sortedPlayers.find((player) => player.hand.length !== 13);
  if (invalidFinalHand) {
    throw new Error("Final deal must provide 13 cards to each player.");
  }

  return sortedPlayers;
}

function dealHands(
  players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>,
  handSize: number,
  random = Math.random
): PlayerState[] {
  if (players.length !== 4) {
    throw new Error("Deal requires exactly 4 players.");
  }

  const shuffled = shuffleDeck(createStandardDeck(), random);
  if (handSize * players.length > shuffled.length) {
    throw new Error("Not enough cards to complete deal.");
  }

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
    throw new Error("Deal produced duplicate cards.");
  }

  const invalidHand = next.find((player) => player.hand.length !== handSize);
  if (invalidHand) {
    throw new Error(`Deal failed to give ${handSize} cards to each player.`);
  }

  return next;
}
