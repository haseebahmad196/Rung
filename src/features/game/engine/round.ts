import type { GameRules, PlayerState, RoundState, Team, TrickPlay } from "../types";
import { buildNextTrickState, canPlayCard } from "./trick";

function emptyTrick() {
  return {
    leadSuit: null,
    plays: [],
    winnerPlayerId: null,
  };
}

export function createRoundState(input: {
  roundId: number;
  dealerPlayerId: string;
  firstTurnPlayerId: string;
  players: PlayerState[];
  trumpSuit: RoundState["trumpSuit"];
}): RoundState {
  return {
    id: input.roundId,
    dealerPlayerId: input.dealerPlayerId,
    currentTurnPlayerId: input.firstTurnPlayerId,
    trumpSuit: input.trumpSuit,
    players: input.players,
    currentTrick: emptyTrick(),
    completedTricks: [],
    score: { teamA: 0, teamB: 0 },
    isComplete: false,
  };
}

export function playCardInRound(
  round: RoundState,
  playerId: string,
  cardId: string,
  rules: GameRules
): RoundState {
  if (round.isComplete) {
    throw new Error("Round is complete.");
  }

  if (round.currentTurnPlayerId !== playerId) {
    throw new Error("It is not this player's turn.");
  }

  const player = round.players.find((item) => item.id === playerId);
  if (!player) throw new Error("Player not found.");

  const card = player.hand.find((item) => item.id === cardId);
  if (!card) throw new Error("Card not found in player's hand.");

  if (!canPlayCard(player.hand, card, round.currentTrick.leadSuit, rules)) {
    throw new Error("Illegal play for current trick.");
  }

  const updatedPlayers = round.players.map((item) =>
    item.id === playerId
      ? { ...item, hand: item.hand.filter((handCard) => handCard.id !== cardId) }
      : item
  );

  const nextTrick = buildNextTrickState(
    round.currentTrick,
    { playerId, card } as TrickPlay,
    round.trumpSuit,
    rules
  );

  if (nextTrick.plays.length < 4) {
    return {
      ...round,
      players: updatedPlayers,
      currentTrick: nextTrick,
      currentTurnPlayerId: getNextPlayerId(round.players, playerId),
    };
  }

  const winnerPlayerId = nextTrick.winnerPlayerId;
  if (!winnerPlayerId) throw new Error("Trick winner could not be resolved.");

  const winner = round.players.find((item) => item.id === winnerPlayerId);
  if (!winner) throw new Error("Winner not found.");

  const isFinalTrick = updatedPlayers.every((item) => item.hand.length === 0);

  return {
    ...round,
    players: updatedPlayers,
    completedTricks: [...round.completedTricks, nextTrick],
    currentTrick: emptyTrick(),
    currentTurnPlayerId: winnerPlayerId,
    score: addTrickPoint(round.score, winner.team, rules.pointsPerTrick),
    isComplete: isFinalTrick,
  };
}

function getNextPlayerId(players: PlayerState[], currentPlayerId: string): string {
  const ordered = [...players].sort((a, b) => a.seat - b.seat);
  const index = ordered.findIndex((item) => item.id === currentPlayerId);
  if (index === -1) throw new Error("Current player seat not found.");
  return ordered[(index + 1) % ordered.length].id;
}

function addTrickPoint(
  score: RoundState["score"],
  winnerTeam: Team,
  pointsPerTrick: number
) {
  return winnerTeam === "A"
    ? { teamA: score.teamA + pointsPerTrick, teamB: score.teamB }
    : { teamA: score.teamA, teamB: score.teamB + pointsPerTrick };
}
