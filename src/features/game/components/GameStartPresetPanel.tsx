"use client";

import { useEffect, useMemo, useState } from "react";
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
    setConfirmedTrump(null);
    setTurnSecondsLeft(8);
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
        roundId: 1,
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
