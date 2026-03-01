export type PlayerId = string;

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
};

export type Team = "A" | "B";

export type PlayerSeat = 0 | 1 | 2 | 3;

export type PlayerState = {
  id: PlayerId;
  name: string;
  seat: PlayerSeat;
  team: Team;
  hand: Card[];
};

export type TrickPlay = {
  playerId: PlayerId;
  card: Card;
};

export type TrickState = {
  leadSuit: Suit | null;
  plays: TrickPlay[];
  winnerPlayerId: PlayerId | null;
};

export type RoundScore = {
  teamA: number;
  teamB: number;
};

export type RoundState = {
  id: number;
  dealerPlayerId: PlayerId;
  currentTurnPlayerId: PlayerId;
  trumpSuit: Suit | null;
  players: PlayerState[];
  currentTrick: TrickState;
  completedTricks: TrickState[];
  score: RoundScore;
  isComplete: boolean;
};

export type GameScore = {
  teamA: number;
  teamB: number;
};

export type GameState = {
  gameId: string;
  tableId: string;
  players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>;
  roundNumber: number;
  maxRounds: number;
  rounds: RoundState[];
  totalScore: GameScore;
  winnerTeam: Team | null;
};

export type GameRules = {
  maxRounds: number;
  rankOrderLowToHigh: Rank[];
  mustFollowSuit: boolean;
  pointsPerTrick: number;
};

export type BidValue = 7 | 9 | 11 | 13;

export type BiddingEntry = {
  playerId: PlayerId;
  bid: BidValue;
};

export type BiddingHistoryItem =
  | {
      playerId: PlayerId;
      action: "pass";
    }
  | {
      playerId: PlayerId;
      action: "bid";
      bid: BidValue;
    };

export type BiddingState = {
  players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>;
  turnOrder: PlayerId[];
  currentTurnOffset: number;
  starterPlayerId: PlayerId;
  highestBid: BiddingEntry | null;
  passesSinceLastBid: number;
  passesWithoutBid: number;
  history: BiddingHistoryItem[];
  isComplete: boolean;
  winnerPlayerId: PlayerId | null;
};

