"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  applyBidDecision,
  canCurrentPlayerPass,
  createBiddingState,
  dealOpeningHands,
  getAllowedBidValues,
  getCurrentPlayer,
  type BidValue,
  type BiddingState,
  type Card as GameCard,
  type PlayerState,
  type Suit,
} from "@/features/game";
import { buildPresetPlayers } from "@/features/game/helpers/players";
import { PlayingCardView } from "./PlayingCardView";
import { TurnProfileStrip } from "./TurnProfileStrip";

type GameStartPresetPanelProps = {
  localPlayerName: string;
  localSeatNumber: number;
  takenSeats: Record<number, string>;
  onTrumpSelected?: (card: GameCard) => void;
  onHighestBidChange?: (bid: BidValue | null) => void;
};

export function GameStartPresetPanel({
  localPlayerName,
  localSeatNumber,
  takenSeats,
  onTrumpSelected,
  onHighestBidChange,
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

  const occupiedSeatSet = useMemo(() => {
    const seatSet = new Set(Object.keys(takenSeats).map((value) => Number(value)));
    seatSet.add(localSeatNumber);
    return seatSet;
  }, [takenSeats, localSeatNumber]);

  const isSeatsFull = occupiedSeatSet.size === 4;

  useEffect(() => {
    setBiddingState(createBiddingState(players));
    setOpeningHands(null);
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
  const currentTurnHandPlayer = currentPlayer
    ? openingHands?.find((player) => player.id === currentPlayer.id) ?? null
    : null;
  const localPlayer = openingHands?.find((player) => player.seat === (localSeatNumber - 1)) ?? null;
  
  const winner = biddingState.winnerPlayerId
    ? players.find((player) => player.id === biddingState.winnerPlayerId)
    : null;
  const winnerHandPlayer = winner
    ? openingHands?.find((player) => player.id === winner.id) ?? null
    : null;
  const cardsToDisplay = biddingState.isComplete ? winnerHandPlayer : currentTurnHandPlayer;

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

  const handleTrumpCardClick = (card: GameCard) => {
    if (!biddingState.isComplete || confirmedTrump) return;
    if (!winnerHandPlayer) return;

    const existsInWinnerHand = winnerHandPlayer.hand.some((winnerCard) => winnerCard.id === card.id);
    if (!existsInWinnerHand) return;

    setSelectedTrumpCardId(card.id);
    setConfirmedTrump(card.suit);
    onTrumpSelected?.(card);
  };

  const confirmTrump = () => {
    if (!biddingState.isComplete) return;
    if (!winner || !openingHands || !localPlayer) return;

    // Get the winner's hand - if local player is winner, use their hand directly
    const isLocalPlayerWinner = winner.seat === (localSeatNumber - 1);
    const handToCheck = isLocalPlayerWinner 
      ? localPlayer.hand
      : openingHands.find((player) => player.id === winner.id)?.hand ?? [];
    
    const pickedCard = handToCheck.find((card) => card.id === selectedTrumpCardId);
    if (!pickedCard) return;

    setConfirmedTrump(pickedCard.suit);
    onTrumpSelected?.(pickedCard);
  };

  const isBidPhase = isSeatsFull && Boolean(openingHands) && !biddingState.isComplete;
  const isTrumpPhase = isSeatsFull && biddingState.isComplete && !confirmedTrump;

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
    <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-red-900/85 bg-[linear-gradient(145deg,rgba(18,6,9,0.88),rgba(8,8,10,0.78))] p-3 shadow-[0_24px_55px_rgba(0,0,0,0.52)] backdrop-blur-md sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-black uppercase tracking-[0.12em] text-red-400">On Table</div>
        <div className="rounded-full border border-red-800/90 bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-300/95">
          Turn order: Top → Right → Bottom → Left
        </div>
      </div>

      {!isSeatsFull ? (
        <div className="mt-4 rounded-2xl border border-red-900/90 bg-black/70 p-4 text-sm text-red-300/90">
          Waiting for all seats to fill before dealing cards.
        </div>
      ) : null}

      {isSeatsFull && cardsToDisplay ? (
        <div className="mt-4 rounded-2xl border border-red-900/90 bg-black/75 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-red-500/95">
            {biddingState.isComplete ? `${cardsToDisplay.name} Cards (Winner)` : `${cardsToDisplay.name} Cards`}
          </p>
          <div className="flex flex-wrap gap-2">
            {cardsToDisplay.hand.map((card) => {
              const isRungSelectionPhase = biddingState.isComplete && !confirmedTrump;
              const canSelectRung = isRungSelectionPhase;
              const isSelected = selectedTrumpCardId === card.id;
              
              if (canSelectRung) {
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleTrumpCardClick(card)}
                    className={`rounded-xl transition ${
                      isSelected
                        ? "ring-2 ring-red-500 ring-offset-2 ring-offset-black"
                        : "hover:ring-2 hover:ring-red-700"
                    }`}
                  >
                    <PlayingCardView card={card} />
                  </button>
                );
              }
              
              return <PlayingCardView key={card.id} card={card} />;
            })}
          </div>
        </div>
      ) : null}

      {isSeatsFull && openingHands && !biddingState.isComplete ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-red-900/90 bg-black/70 p-4">
              <TurnProfileStrip
                players={players}
                activePlayerId={currentPlayer?.id ?? null}
                secondsLeft={turnSecondsLeft}
              />

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-400/95 sm:text-xs">
              Step 1 · Pick Bid or Decline
            </p>
            <div className="flex flex-wrap gap-2">
              {[7, 9, 11, 13].map((bidValue) => {
                const isAllowed = allowedBids.includes(bidValue as BidValue);
                return (
                  <Button
                    key={bidValue}
                    variant="primary"
                    className="min-w-12 bg-red-700 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-500"
                    disabled={!isAllowed}
                    onClick={() => handleBid(bidValue as BidValue)}
                  >
                    {bidValue}
                  </Button>
                );
              })}

              <Button
                variant="secondary"
                className="border-red-900/95 bg-black/80 text-red-300 hover:bg-red-950/40"
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
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-red-800/90 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            Highest bidder: <span className="font-bold">{winner?.name ?? "Winner"}</span>
          </div>

          <div className="rounded-2xl border border-red-900/90 bg-black/70 p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-400/95 sm:text-xs">
              Select Rung Color
            </p>
            <TurnProfileStrip
              players={players}
              activePlayerId={winner?.id ?? null}
              secondsLeft={turnSecondsLeft}
            />
            
            <div className="mt-3">
              <p className="mb-2 text-xs text-red-300/80">
                Tap winner card above to set rung suit
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
