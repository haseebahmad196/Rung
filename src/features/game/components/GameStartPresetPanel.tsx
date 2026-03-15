"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  applyBidDecision,
  canCurrentPlayerPass,
  createBiddingState,
  createRoundState,
  defaultGameRules,
  dealRemainingToFullHands,
  dealOpeningHands,
  getAllowedBidValues,
  getCurrentPlayer,
  playCardInRound,
  type BidValue,
  type BiddingState,
  type Card as GameCard,
  type PlayerState,
  type RoundState,
  type Suit,
} from "@/features/game";
import { buildPresetPlayers } from "@/features/game/helpers/players";
import { PlayingCardView } from "./PlayingCardView";
import { TableHandsBoard } from "./TableHandsBoard";

type GameStartPresetPanelProps = {
  localPlayerName: string;
  localSeatNumber: number;
  takenSeats: Record<number, string>;
  onTrumpSelected?: (card: GameCard) => void;
  onHighestBidChange?: (bid: BidValue | null) => void;
  onActiveSeatChange?: (seatNumber: number | null) => void;
};

export function GameStartPresetPanel({
  localPlayerName,
  localSeatNumber,
  takenSeats,
  onTrumpSelected,
  onHighestBidChange,
  onActiveSeatChange,
}: GameStartPresetPanelProps) {
  const players = useMemo(
    () =>
      buildPresetPlayers({
        localPlayerName,
        localSeatNumber,
        takenSeats,
      }),
    [localPlayerName, localSeatNumber, takenSeats]
  );

  const [selectedTrumpCardId, setSelectedTrumpCardId] = useState<string | null>(null);
  const [confirmedTrump, setConfirmedTrump] = useState<Suit | null>(null);
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(8);
  const [biddingState, setBiddingState] = useState<BiddingState>(() =>
    createBiddingState(players)
  );
  const [openingHands, setOpeningHands] = useState<PlayerState[] | null>(null);
  const [fullHands, setFullHands] = useState<PlayerState[] | null>(null);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [matchScoreTeamA, setMatchScoreTeamA] = useState(0);
  const [matchScoreTeamB, setMatchScoreTeamB] = useState(0);
  const [lastSettledRoundId, setLastSettledRoundId] = useState<number | null>(null);

  const occupiedSeatSet = useMemo(() => {
    const seatSet = new Set(Object.keys(takenSeats).map((value) => Number(value)));
    seatSet.add(localSeatNumber);
    return seatSet;
  }, [takenSeats, localSeatNumber]);

  const isSeatsFull = occupiedSeatSet.size === 4;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBiddingState(createBiddingState(players));
    setOpeningHands(null);
    setFullHands(null);
    setRoundState(null);
    setRoundNumber(1);
    setConfirmedTrump(null);
    setTurnSecondsLeft(8);
    onHighestBidChange?.(null);
  }, [players, onHighestBidChange]);

  useEffect(() => {
    if (!isSeatsFull) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpeningHands(null);
      return;
    }

    if (!openingHands) {
      setOpeningHands(dealOpeningHands(players));
    }
  }, [isSeatsFull, openingHands, players]);

  const currentPlayer = getCurrentPlayer(biddingState);
  const allowedBids = getAllowedBidValues(biddingState);
  const canPass = canCurrentPlayerPass(biddingState);
  const activeHands = fullHands ?? openingHands;

  const winner = biddingState.winnerPlayerId
    ? players.find((player) => player.id === biddingState.winnerPlayerId)
    : null;

  const centerPlays = useMemo(() => {
    if (!roundState) return [] as Array<{ playerId: string; seat: number; card: GameCard }>;
    return roundState.currentTrick.plays.map((play) => ({
      playerId: play.playerId,
      seat: players.find((player) => player.id === play.playerId)?.seat ?? 0,
      card: play.card,
    }));
  }, [roundState, players]);

  const handlePass = useCallback(() => {
    if (!currentPlayer) return;

    const next = applyBidDecision(biddingState, currentPlayer.id, { type: "pass" });
    setBiddingState(next);
    onHighestBidChange?.(next.highestBid?.bid ?? null);
    setTurnSecondsLeft(8);
  }, [biddingState, currentPlayer, onHighestBidChange]);

  const handleBid = useCallback((bid: BidValue) => {
    if (!currentPlayer) return;

    const next = applyBidDecision(biddingState, currentPlayer.id, {
      type: "bid",
      bid,
    });
    setBiddingState(next);
    onHighestBidChange?.(next.highestBid?.bid ?? null);
    setTurnSecondsLeft(8);
  }, [biddingState, currentPlayer, onHighestBidChange]);

  const handleTableCardClick = (playerId: string, card: GameCard) => {
    if (!winner) return;

    if (isTrumpPhase) {
      if (winner.id !== playerId) return;
      if (!openingHands) return;

      const winnerOpeningHand = openingHands?.find((player) => player.id === winner.id)?.hand ?? [];
      const existsInWinnerOpeningHand = winnerOpeningHand.some((winnerCard) => winnerCard.id === card.id);
      if (!existsInWinnerOpeningHand) return;

      const dealt = dealRemainingToFullHands(openingHands);
      const nextRound = createRoundState({
        roundId: roundNumber,
        dealerPlayerId: winner.id,
        firstTurnPlayerId: winner.id,
        players: dealt,
        trumpSuit: card.suit,
      });
      setSelectedTrumpCardId(card.id);
      setConfirmedTrump(card.suit);
      setRoundState(nextRound);
      setFullHands(nextRound.players);
      onTrumpSelected?.(card);
      return;
    }

    if (!confirmedTrump || !roundState || roundState.isComplete) return;

    try {
      const nextRound = playCardInRound(roundState, playerId, card.id, defaultGameRules);
      setRoundState(nextRound);
      setFullHands(nextRound.players);
    } catch {
      return;
    }
  };

  const isBidPhase = isSeatsFull && Boolean(openingHands) && !biddingState.isComplete;
  const isTrumpPhase = isSeatsFull && biddingState.isComplete && !confirmedTrump;
  const isRoundPhase = Boolean(confirmedTrump && roundState && !roundState.isComplete);

  // Pile-claim scoring: identify which team has won piles based on consecutive-senior-side rule
  const roundStats = useMemo(() => {
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

    // Award checkpoints requested by game flow:
    // trick 5 awards 5 points, trick 8 awards 3 points, trick 13 awards 5 points.
    const checkpoints = [
      { trick: 5, points: 5 },
      { trick: 8, points: 3 },
      { trick: 13, points: 5 },
    ] as const;

    let teamAPoints = 0;
    let teamBPoints = 0;

    for (const checkpoint of checkpoints) {
      const checkpointIndex = checkpoint.trick - 1;
      const previousIndex = checkpointIndex - 1;

      const checkpointTrick = roundState.completedTricks[checkpointIndex];
      const previousTrick = roundState.completedTricks[previousIndex];

      if (!checkpointTrick || !previousTrick) continue;
      if (!checkpointTrick.winnerPlayerId || !previousTrick.winnerPlayerId) continue;

      const checkpointWinnerTeam = teamByPlayerId[checkpointTrick.winnerPlayerId];
      const previousWinnerTeam = teamByPlayerId[previousTrick.winnerPlayerId];
      if (!checkpointWinnerTeam || !previousWinnerTeam) continue;

      const isConsecutiveSeniorSideWin = checkpointWinnerTeam === previousWinnerTeam;
      if (!isConsecutiveSeniorSideWin) continue;

      const winnerTeam = checkpointWinnerTeam;
      if (winnerTeam === "A") {
        teamAPoints += checkpoint.points;
      } else if (winnerTeam === "B") {
        teamBPoints += checkpoint.points;
      }
    }

    const trickCount = roundState.completedTricks.length;

    return {
      teamAPoints,
      teamBPoints,
      trickCount,
    };
  }, [roundState, players]);

  const activeTurnPlayerId = isRoundPhase
    ? roundState?.currentTurnPlayerId ?? null
    : isTrumpPhase
    ? winner?.id ?? null
    : isBidPhase
    ? currentPlayer?.id ?? null
    : null;

  useEffect(() => {
    if (!isSeatsFull) {
      onActiveSeatChange?.(null);
      return;
    }

    if (!activeTurnPlayerId) {
      onActiveSeatChange?.(null);
      return;
    }

    const activePlayer = players.find((player) => player.id === activeTurnPlayerId);
    onActiveSeatChange?.(activePlayer ? activePlayer.seat + 1 : null);
  }, [isSeatsFull, activeTurnPlayerId, players, onActiveSeatChange]);

  useEffect(() => {
    if (!isBidPhase && !isTrumpPhase) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTurnSecondsLeft(8);
  }, [isBidPhase, isTrumpPhase, biddingState.currentTurnOffset, biddingState.history.length]);

  useEffect(() => {
    if (!isBidPhase && !isTrumpPhase) return;

    const timer = setInterval(() => {
      setTurnSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isBidPhase, isTrumpPhase]);

  useEffect(() => {
    if (!roundState?.isComplete) return;
    if (lastSettledRoundId === roundNumber) return;

    const bidderPlayer = players.find((p) => p.id === biddingState.winnerPlayerId);
    if (!bidderPlayer || !biddingState.highestBid) return;

    const bidAmount = biddingState.highestBid.bid;
    const bidderTeam = bidderPlayer.team;
    const bidderTeamAchievedBid =
      (bidderTeam === "A" && roundStats.teamAPoints >= bidAmount) ||
      (bidderTeam === "B" && roundStats.teamBPoints >= bidAmount);

    const pointsToAdd = bidderTeamAchievedBid ? bidAmount : bidAmount * 2;
    const awardToTeam = bidderTeamAchievedBid ? bidderTeam : (bidderTeam === "A" ? "B" : "A");

    // Use a microtask to defer state updates
    Promise.resolve().then(() => {
      setLastSettledRoundId(roundNumber);
      if (awardToTeam === "A") {
        setMatchScoreTeamA((prev) => prev + pointsToAdd);
      } else {
        setMatchScoreTeamB((prev) => prev + pointsToAdd);
      }
    });
  }, [roundState?.isComplete, roundState?.id, roundStats, biddingState.winnerPlayerId, biddingState.highestBid, lastSettledRoundId, roundNumber, players]);

  useEffect(() => {
    if (!roundState?.isComplete) return;

    // Auto-reset round after delay if match not over
    const timer = setTimeout(() => {
      // Check if match is over based on current match scores
      // We need to recalculate based on the latest scores
      setRoundNumber((prev) => prev + 1);
      setBiddingState(createBiddingState(players));
      setOpeningHands(null);
      setFullHands(null);
      setRoundState(null);
      setConfirmedTrump(null);
      setSelectedTrumpCardId(null);
      setTurnSecondsLeft(8);
      onHighestBidChange?.(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [roundState?.isComplete, roundState?.id, players, onHighestBidChange]);

  useEffect(() => {
    if (turnSecondsLeft > 0) return;

    if (isBidPhase) {
      if (canPass) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handlePass();
        return;
      }

      if (allowedBids.length > 0) {
        handleBid(allowedBids[0]);
        return;
      }
    }

    if (isTrumpPhase) {
      return;
    }
  }, [turnSecondsLeft, isBidPhase, isTrumpPhase, canPass, allowedBids, handlePass, handleBid]);

  return (
    <div className="pointer-events-none relative h-full min-h-[22rem] w-full sm:min-h-[28rem]">
      {!isSeatsFull ? (
        <div className="pointer-events-auto absolute left-1/2 top-10 w-[min(92%,28rem)] -translate-x-1/2 rounded-2xl border border-red-900/90 bg-black/70 p-4 text-sm text-red-300/90">
          Waiting for all seats to fill before dealing cards.
        </div>
      ) : null}

      {isSeatsFull && activeHands ? (
        <TableHandsBoard
          players={players}
          openingHands={activeHands}
          localSeatNumber={localSeatNumber}
          revealAllCards={Boolean(confirmedTrump)}
          clickablePlayerId={isTrumpPhase ? winner?.id ?? null : isRoundPhase ? roundState?.currentTurnPlayerId ?? null : null}
          selectedCardId={selectedTrumpCardId}
          onCardClick={handleTableCardClick}
          className="pointer-events-auto absolute inset-0 z-10"
        />
      ) : null}

      {centerPlays.length > 0 ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1 rounded-xl bg-black/45 p-1.5">
            {centerPlays.map((play) => (
              <PlayingCardView key={`${play.playerId}-${play.card.id}`} card={play.card} size="compact" />
            ))}
          </div>
        </div>
      ) : null}

      {roundState ? (
        <div className="pointer-events-none absolute left-1/2 top-2 z-30 w-[min(92vw,19rem)] -translate-x-1/2 rounded-xl border border-red-900/90 bg-black/70 p-2 text-[10px] text-red-200 sm:left-4 sm:top-4 sm:w-64 sm:translate-x-0 sm:text-xs">
          <p className="font-semibold uppercase tracking-[0.12em] text-red-300">Points This Round</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-red-950/35 px-2 py-1">Side 1: {roundStats.teamAPoints}</div>
            <div className="rounded-lg bg-red-950/35 px-2 py-1">Side 2: {roundStats.teamBPoints}</div>
          </div>
          <p className="mt-2 uppercase tracking-[0.1em] text-red-300">Match Score</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-red-950/35 px-2 py-1">Side 1: {matchScoreTeamA}</div>
            <div className="rounded-lg bg-red-950/35 px-2 py-1">Side 2: {matchScoreTeamB}</div>
          </div>
          <p className="mt-2 uppercase tracking-[0.1em] text-red-300">Tricks: {roundStats.trickCount}/13</p>
        </div>
      ) : null}

      {isSeatsFull && openingHands && !biddingState.isComplete ? (
        <div className="pointer-events-auto absolute inset-x-1 bottom-1 z-30 space-y-2 rounded-xl bg-black/55 p-2 sm:inset-x-4 sm:bottom-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300 sm:text-xs">
              First bid
            </p>
            <div className="flex flex-wrap gap-2">
              {[7, 9, 11, 13].map((bidValue) => {
                const isAllowed = allowedBids.includes(bidValue as BidValue);
                return (
                  <Button
                    key={bidValue}
                    variant="primary"
                    className="min-w-10 bg-red-700 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-500"
                    disabled={!isAllowed}
                    onClick={() => handleBid(bidValue as BidValue)}
                  >
                    {bidValue}
                  </Button>
                );
              })}

              <Button
                variant="secondary"
                className="border-red-900/95 bg-black/70 text-red-300 hover:bg-red-950/40"
                disabled={!canPass}
                onClick={handlePass}
              >
                Decline
              </Button>
            </div>
          </div>

        </div>
      ) : null}

      {isSeatsFull && biddingState.isComplete && !confirmedTrump ? (
        <div className="pointer-events-auto absolute inset-x-1 bottom-1 z-30 rounded-xl bg-black/55 p-2 sm:inset-x-4 sm:bottom-4">
          <p className="text-xs uppercase tracking-[0.12em] text-red-300">
            Select rung (winner)
          </p>
        </div>
      ) : null}

      {confirmedTrump ? (
        <div className="pointer-events-none absolute inset-x-1 bottom-1 z-30 rounded-xl bg-black/45 p-2 text-center text-[11px] uppercase tracking-[0.12em] text-red-300 sm:inset-x-4 sm:bottom-4">
          Play starts: highest bidder throws first
        </div>
      ) : null}
    </div>
  );
}
