"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  type Team,
} from "@/features/game";
import { buildPresetPlayers } from "@/features/game/helpers/players";
import { PlayingCardView } from "./PlayingCardView";
import { TableHandsBoard } from "./TableHandsBoard";

type GameStartPresetPanelProps = {
  localPlayerName: string;
  localSeatNumber: number;
  takenSeats: Record<number, string>;
  onTrumpSelected?: (card: GameCard | null) => void;
  onHighestBidChange?: (bid: BidValue | null) => void;
  onActiveSeatChange?: (seatNumber: number | null) => void;
};

const MATCH_TARGET_POINTS = 60;
const SIDE_A_LABEL = "Side 1";
const SIDE_B_LABEL = "Side 2";

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
  const [matchScore, setMatchScore] = useState<{ teamA: number; teamB: number }>({ teamA: 0, teamB: 0 });
  const [matchWinner, setMatchWinner] = useState<Team | null>(null);
  const [lastRoundSummary, setLastRoundSummary] = useState<string | null>(null);
  const processedRoundIdRef = useRef<number | null>(null);

  const occupiedSeatSet = useMemo(() => {
    const seatSet = new Set(Object.keys(takenSeats).map((value) => Number(value)));
    seatSet.add(localSeatNumber);
    return seatSet;
  }, [takenSeats, localSeatNumber]);

  const isSeatsFull = occupiedSeatSet.size === 4;

  useEffect(() => {
    setBiddingState(createBiddingState(players));
    setOpeningHands(null);
    setFullHands(null);
    setRoundState(null);
    setRoundNumber(1);
    setMatchScore({ teamA: 0, teamB: 0 });
    setMatchWinner(null);
    setLastRoundSummary(null);
    processedRoundIdRef.current = null;
    setConfirmedTrump(null);
    setSelectedTrumpCardId(null);
    setTurnSecondsLeft(8);
    onTrumpSelected?.(null);
    onHighestBidChange?.(null);
  }, [players]);

  useEffect(() => {
    if (!isSeatsFull) {
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

  const handlePass = () => {
    if (!currentPlayer) return;

    const next = applyBidDecision(biddingState, currentPlayer.id, { type: "pass" });
    setBiddingState(next);
    onHighestBidChange?.(next.highestBid?.bid ?? null);
    setTurnSecondsLeft(8);
  };

  const handleBid = (bid: BidValue) => {
    if (!currentPlayer) return;

    const next = applyBidDecision(biddingState, currentPlayer.id, {
      type: "bid",
      bid,
    });
    setBiddingState(next);
    onHighestBidChange?.(next.highestBid?.bid ?? null);
    setTurnSecondsLeft(8);
  };

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
  const completedTricks = roundState?.completedTricks.length ?? 0;
  const scoring = useMemo(() => {
    if (!roundState) {
      return {
        teamAPoints: 0,
        teamBPoints: 0,
      };
    }

    const teamByPlayerId = players.reduce<Record<string, "A" | "B">>((acc, player) => {
      acc[player.id] = player.team;
      return acc;
    }, {});

    // First claim needs 5 accumulated tricks, then each next claim needs 3.
    let requiredPile = 5;
    let accumulatedPile = 0;
    let previousWinnerPlayerId: string | null = null;
    let teamAPoints = 0;
    let teamBPoints = 0;

    for (let trickIndex = 0; trickIndex < roundState.completedTricks.length; trickIndex += 1) {
      const winnerPlayerId = roundState.completedTricks[trickIndex].winnerPlayerId;
      accumulatedPile += 1;

      const isConsecutiveBySameSenior = Boolean(
        winnerPlayerId && previousWinnerPlayerId && winnerPlayerId === previousWinnerPlayerId
      );

      if (isConsecutiveBySameSenior && accumulatedPile >= requiredPile) {
        const winnerTeam = teamByPlayerId[winnerPlayerId as string] ?? null;
        if (winnerTeam === "A") {
          teamAPoints += accumulatedPile;
        } else if (winnerTeam === "B") {
          teamBPoints += accumulatedPile;
        }

        accumulatedPile = 0;
        requiredPile = 3;
      }

      previousWinnerPlayerId = winnerPlayerId ?? null;
    }

    return {
      teamAPoints,
      teamBPoints,
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
    if (!roundState || !roundState.isComplete) return;
    if (matchWinner) return;
    if (processedRoundIdRef.current === roundState.id) return;

    const bidderPlayerId = biddingState.highestBid?.playerId;
    const bidValue = biddingState.highestBid?.bid;
    if (!bidderPlayerId || !bidValue) return;

    const bidder = players.find((player) => player.id === bidderPlayerId);
    if (!bidder) return;

    const bidderTeamPoints = bidder.team === "A" ? scoring.teamAPoints : scoring.teamBPoints;
    const bidderWonBid = bidderTeamPoints >= bidValue;
    const awardedTeam: Team = bidderWonBid ? bidder.team : bidder.team === "A" ? "B" : "A";
    const awardedPoints = bidderWonBid ? bidValue : bidValue * 2;
    processedRoundIdRef.current = roundState.id;

    setMatchScore((prev) => {
      const next =
        awardedTeam === "A"
          ? { teamA: prev.teamA + awardedPoints, teamB: prev.teamB }
          : { teamA: prev.teamA, teamB: prev.teamB + awardedPoints };

      if (next.teamA >= MATCH_TARGET_POINTS || next.teamB >= MATCH_TARGET_POINTS) {
        setMatchWinner(next.teamA >= MATCH_TARGET_POINTS ? "A" : "B");
      }

      return next;
    });

    setLastRoundSummary(
      bidderWonBid
        ? `Bidder ${bidder.team === "A" ? SIDE_A_LABEL : SIDE_B_LABEL} made ${bidValue} and earned +${awardedPoints}.`
        : `Bidder ${bidder.team === "A" ? SIDE_A_LABEL : SIDE_B_LABEL} failed ${bidValue}. ${awardedTeam === "A" ? SIDE_A_LABEL : SIDE_B_LABEL} earned +${awardedPoints}.`
    );
  }, [roundState, scoring.teamAPoints, scoring.teamBPoints, biddingState.highestBid, players, matchWinner]);

  useEffect(() => {
    if (!roundState || !roundState.isComplete) return;
    if (matchWinner) return;

    const timer = setTimeout(() => {
      processedRoundIdRef.current = null;
      setRoundNumber((prev) => prev + 1);
      setBiddingState(createBiddingState(players));
      setOpeningHands(null);
      setFullHands(null);
      setRoundState(null);
      setConfirmedTrump(null);
      setSelectedTrumpCardId(null);
      setTurnSecondsLeft(8);
      onTrumpSelected?.(null);
      onHighestBidChange?.(null);
    }, 1400);

    return () => clearTimeout(timer);
  }, [roundState, matchWinner, players, onTrumpSelected, onHighestBidChange]);

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

  const activeSeniorName = useMemo(() => {
    if (!activeTurnPlayerId) return "-";
    return players.find((player) => player.id === activeTurnPlayerId)?.name ?? "-";
  }, [activeTurnPlayerId, players]);

  useEffect(() => {
    if (!isBidPhase && !isTrumpPhase) return;
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
    if (turnSecondsLeft > 0) return;

    if (isBidPhase) {
      if (canPass) {
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
  }, [turnSecondsLeft, isBidPhase, isTrumpPhase, canPass, allowedBids]);

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
        <div className="pointer-events-none absolute left-1 top-1 z-30 w-[min(13rem,56vw)] rounded-xl border border-red-900/90 bg-black/60 p-2 text-[10px] text-red-200 sm:left-4 sm:top-4 sm:w-56 sm:p-3 sm:text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase tracking-[0.12em] text-red-400">Round Track</span>
            <span className="rounded-full border border-red-900/90 px-2 py-0.5 text-[10px] sm:text-xs">
              {completedTricks}/13
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-red-950/35 px-2 py-1">{SIDE_A_LABEL}: {scoring.teamAPoints}</div>
            <div className="rounded-lg bg-red-950/35 px-2 py-1">{SIDE_B_LABEL}: {scoring.teamBPoints}</div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-black/55 px-2 py-1">Match {SIDE_A_LABEL}: {matchScore.teamA}</div>
            <div className="rounded-lg bg-black/55 px-2 py-1">Match {SIDE_B_LABEL}: {matchScore.teamB}</div>
          </div>

          <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-red-400 sm:text-xs">
            Senior: <span className="text-red-200">{activeSeniorName}</span>
          </p>

          <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-red-500/90 sm:text-xs">
            Round {roundNumber} | Target {MATCH_TARGET_POINTS}
          </p>

          {lastRoundSummary ? (
            <p className="mt-1 text-[10px] text-red-300/95 sm:text-xs">{lastRoundSummary}</p>
          ) : null}

          {matchWinner ? (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-200 sm:text-xs">
              {matchWinner === "A" ? SIDE_A_LABEL : SIDE_B_LABEL} won the match.
            </p>
          ) : null}
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
