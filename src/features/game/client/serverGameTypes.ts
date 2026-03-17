import type { BiddingState, BidValue, PlayerState, RoundState, Suit } from "@/features/game";

export type ServerGameStage = "waiting" | "bidding" | "selecting-trump" | "playing" | "completed";

export type PublicServerPlayer = {
  id: string;
  name: string;
  seat: number;
  team: "A" | "B";
};

export type ServerGameSnapshot = {
  gameId: string;
  tableId: string;
  createdAt: number;
  updatedAt: number;
  stage: ServerGameStage;
  roundNumber: number;
  players: PublicServerPlayer[];
  bidding: BiddingState;
  openingHands: PlayerState[];
  trumpSuit: Suit | null;
  activeRound: RoundState | null;
  winnerTeam: "A" | "B" | null;
};

export type BidActionPayload =
  | {
      action: "pass";
    }
  | {
      action: "bid";
      bid: BidValue;
    };
