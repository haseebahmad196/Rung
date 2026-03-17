import type { BiddingState, PlayerState, RoundState, Team } from "../types";

export type ServerGameStage = "waiting" | "bidding" | "selecting-trump" | "playing" | "completed";

export type ServerGamePlayerSlot = Pick<PlayerState, "id" | "name" | "seat" | "team"> & {
  isBot: boolean;
  isConnected: boolean;
};

export type ServerGameState = {
  gameId: string;
  tableId: string;
  createdAt: number;
  updatedAt: number;
  stage: ServerGameStage;
  roundNumber: number;
  players: ServerGamePlayerSlot[];
  fullHands: PlayerState[];
  openingHands: PlayerState[];
  bidding: BiddingState;
  trumpSuit: RoundState["trumpSuit"];
  activeRound: RoundState | null;
  winnerTeam: Team | null;
};