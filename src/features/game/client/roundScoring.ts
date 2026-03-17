import type { BidValue, RoundState } from "@/features/game";

type TeamPlayer = {
  id: string;
  team: "A" | "B";
};

export type RoundStats = {
  teamAPoints: number;
  teamBPoints: number;
  trickCount: number;
};

export function calculateRoundStats(roundState: RoundState | null, players: TeamPlayer[]): RoundStats {
  if (!roundState) {
    return {
      teamAPoints: 0,
      teamBPoints: 0,
      trickCount: 0,
    };
  }

  const teamByPlayerId = players.reduce<Record<string, "A" | "B">>((acc, player) => {
    acc[player.id] = player.team;
    return acc;
  }, {});

  const checkpoints = [
    { trick: 5, points: 5 },
    { trick: 8, points: 3 },
    { trick: 13, points: 5 },
  ] as const;

  let teamAPoints = 0;
  let teamBPoints = 0;
  const pendingCheckpoints: Array<(typeof checkpoints)[number]> = [];
  let nextCheckpointIndex = 0;

  for (let trickIndex = 0; trickIndex < roundState.completedTricks.length; trickIndex += 1) {
    const trickNumber = trickIndex + 1;

    while (
      nextCheckpointIndex < checkpoints.length &&
      checkpoints[nextCheckpointIndex].trick <= trickNumber
    ) {
      pendingCheckpoints.push(checkpoints[nextCheckpointIndex]);
      nextCheckpointIndex += 1;
    }

    if (trickIndex === 0 || pendingCheckpoints.length === 0) {
      continue;
    }

    const currentTrick = roundState.completedTricks[trickIndex];
    const previousTrick = roundState.completedTricks[trickIndex - 1];

    if (!currentTrick?.winnerPlayerId || !previousTrick?.winnerPlayerId) {
      continue;
    }

    const currentWinnerTeam = teamByPlayerId[currentTrick.winnerPlayerId];
    const previousWinnerTeam = teamByPlayerId[previousTrick.winnerPlayerId];

    if (!currentWinnerTeam || currentWinnerTeam !== previousWinnerTeam) {
      continue;
    }

    const awardedPoints = pendingCheckpoints.reduce((sum, checkpoint) => sum + checkpoint.points, 0);

    if (currentWinnerTeam === "A") {
      teamAPoints += awardedPoints;
    } else {
      teamBPoints += awardedPoints;
    }

    pendingCheckpoints.length = 0;
  }

  return {
    teamAPoints,
    teamBPoints,
    trickCount: roundState.completedTricks.length,
  };
}

export function resolveRoundAward(params: {
  winnerPlayerId: string | null;
  highestBid: BidValue | null;
  players: TeamPlayer[];
  roundStats: RoundStats;
}) {
  const bidderPlayer = params.players.find((player) => player.id === params.winnerPlayerId);
  if (!bidderPlayer || !params.highestBid) return null;

  const bidAmount = params.highestBid;
  const bidderTeam = bidderPlayer.team;
  const bidderTeamAchievedBid =
    (bidderTeam === "A" && params.roundStats.teamAPoints >= bidAmount) ||
    (bidderTeam === "B" && params.roundStats.teamBPoints >= bidAmount);

  const pointsToAdd = bidderTeamAchievedBid ? bidAmount : bidAmount * 2;
  const awardToTeam = bidderTeamAchievedBid ? bidderTeam : bidderTeam === "A" ? "B" : "A";

  return {
    awardToTeam,
    pointsToAdd,
  };
}
