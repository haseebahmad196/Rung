import type { BidValue, Card as GameCard } from "@/features/game";

export type PublicGamePlayer = {
  id: string;
  name: string;
  seat: number;
  team: "A" | "B";
};

export type GameStartPresetPanelProps = {
  tableId: string;
  localPlayerId: string;
  localPlayerName: string;
  localSeatNumber: number;
  takenSeats: Record<number, string>;
  onTrumpSelected?: (card: GameCard) => void;
  onHighestBidChange?: (bid: BidValue | null) => void;
  onActiveSeatChange?: (seatNumber: number | null) => void;
};
