export type SeatNumber = 1 | 2 | 3 | 4;

export type LocalIdentity = {
  playerId: string;
  displayName: string;
  createdAt: number;
  updatedAt: number;
};

export type TableMember = {
  playerId: string;
  displayName: string;
  joinedAt: number;
  lastSeenAt: number;
};

export type TableSeats = Record<SeatNumber, string | null>;

export type TableRealtimeState = {
  tableId: string;
  seats: TableSeats;
  members: Record<string, TableMember>;
  updatedAt: number;
};

export type MatchPlayer = {
  playerId: string;
  name: string;
};

export type MatchResultPayload = {
  matchId: string;
  tableId: string;
  endedAt: number;
  winnerTeam: "A" | "B";
  targetScore: number;
  score: {
    teamA: number;
    teamB: number;
  };
  teamAPlayers: MatchPlayer[];
  teamBPlayers: MatchPlayer[];
};

export type PlayerStandingRow = {
  playerId: string;
  name: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  winningPoints: number;
  mvpScore: number;
  lastActiveAt: number;
};

export type TeamStandingRow = {
  teamKey: string;
  label: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
};

export type DuoHighlight = {
  duoKey: string;
  label: string;
  wins: number;
  losses: number;
  winRate: number;
  gamesPlayed: number;
};

export type DashboardSnapshot = {
  players: PlayerStandingRow[];
  teamStandings: TeamStandingRow[];
  mvp: PlayerStandingRow[];
  bestDuo: DuoHighlight | null;
  badDuo: DuoHighlight | null;
  activePlayers: PlayerStandingRow[];
};
