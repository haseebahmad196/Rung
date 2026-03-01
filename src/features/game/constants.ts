import type { GameRules, Rank, Suit } from "./types";

export const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

export const ranksLowToHigh: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

export const defaultGameRules: GameRules = {
  maxRounds: 7,
  rankOrderLowToHigh: ranksLowToHigh,
  mustFollowSuit: true,
  pointsPerTrick: 1,
};
