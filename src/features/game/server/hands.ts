import type { PlayerState } from "@/features/game";

export function toOpeningHands(fullHands: PlayerState[]) {
  return fullHands.map((player) => ({
    ...player,
    hand: player.hand.slice(0, 5),
  }));
}

export function cloneHands(players: PlayerState[]) {
  return players.map((player) => ({
    ...player,
    hand: [...player.hand],
  }));
}
