"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { canCurrentPlayerPass, getAllowedBidValues, getCurrentPlayer, type BidValue, type Card as GameCard } from "@/features/game";
import { calculateRoundStats, resolveRoundAward } from "@/features/game/client/roundScoring";
import {
  postServerBidAction,
  postServerPlayCard,
  postServerTrumpSelection,
  startServerGame,
} from "@/features/game/client/serverGameApi";
import { useServerGame } from "@/features/game/client/useServerGame";
import { LocalHandPanel } from "./LocalHandPanel";
import { PlayingCardView } from "./PlayingCardView";
import { TableHandsBoard } from "./TableHandsBoard";
import { BiddingControls } from "./preset/BiddingControls";
import { GameStatsOverlay } from "./preset/GameStatsOverlay";

type GameStartPresetPanelProps = {
  tableId: string;
  localPlayerId: string;
  localSeatNumber: number | null;
  takenSeats: Record<number, string>;
  onSeatSelect?: (seatId: number) => void;
};

type PublicPlayer = {
  id: string;
  name: string;
  seat: number;
  team: "A" | "B";
  isBot?: boolean;
};

function buildDisplayPlayers(
  localPlayerId: string,
  localSeatNumber: number | null,
  takenSeats: Record<number, string>,
  gamePlayers?: PublicPlayer[]
) {
  return [1, 2, 3, 4].map((seat) => {
    const existing = gamePlayers?.find((player) => player.seat === seat - 1);
    if (existing) {
      return existing;
    }

    if (takenSeats[seat]) {
      return {
        id: (localSeatNumber !== null && seat === localSeatNumber) ? localPlayerId : `seat-${seat}`,
        name: takenSeats[seat] ?? `Player ${seat}`,
        seat: seat - 1,
        team: seat % 2 === 1 ? ("A" as const) : ("B" as const),
        isBot: false,
      };
    }

    return {
      id: `bot-seat-${seat}`,
      name: "Bot",
      seat: seat - 1,
      team: seat % 2 === 1 ? ("A" as const) : ("B" as const),
      isBot: true,
    };
  });
}

export function GameStartPresetPanel({
  tableId,
  localPlayerId,
  localSeatNumber,
  takenSeats,
  onSeatSelect,
}: GameStartPresetPanelProps) {
  const { game, loading, error, setError, setGame } = useServerGame({ tableId, playerId: localPlayerId });
  const [pending, setPending] = useState(false);
  const [selectedTrumpCardId, setSelectedTrumpCardId] = useState<string | null>(null);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);

  const players = useMemo<PublicPlayer[]>(
    () => buildDisplayPlayers(localPlayerId, localSeatNumber, takenSeats, game?.players),
    [game?.players, localPlayerId, localSeatNumber, takenSeats]
  );
  const occupiedSeats = useMemo(() => Object.keys(takenSeats).map(Number), [takenSeats]);
  const humanPlayerCount = occupiedSeats.length;
  const shouldFillBots = humanPlayerCount < 4;
  const canStartGame = !game && localSeatNumber !== null && humanPlayerCount >= 2;

  const biddingState = game?.bidding ?? null;
  const roundState = game?.activeRound ?? null;
  const currentBidPlayer = biddingState ? getCurrentPlayer(biddingState) : null;
  const localOpeningHand = useMemo(
    () => game?.openingHands.find((player) => player.id === localPlayerId)?.hand ?? [],
    [game?.openingHands, localPlayerId]
  );
  const localRoundHand = useMemo(
    () => roundState?.players.find((player) => player.id === localPlayerId)?.hand ?? [],
    [localPlayerId, roundState?.players]
  );
  const pendingPlayCard = useMemo(
    () => localRoundHand.find((card) => card.id === pendingCardId) ?? null,
    [localRoundHand, pendingCardId]
  );
  const boardHands = useMemo(
    () => roundState?.players ?? game?.openingHands ?? [],
    [game?.openingHands, roundState?.players]
  );
  const allowedBids = biddingState ? getAllowedBidValues(biddingState) : [];
  const canPass = biddingState ? canCurrentPlayerPass(biddingState) : false;
  const isLocalBidTurn = currentBidPlayer?.id === localPlayerId;
  const isLocalTrumpTurn = game?.stage === "selecting-trump" && biddingState?.winnerPlayerId === localPlayerId;
  const isLocalPlayTurn = roundState?.currentTurnPlayerId === localPlayerId;
  const activeTurnPlayerId = game?.stage === "playing"
    ? roundState?.currentTurnPlayerId ?? null
    : game?.stage === "selecting-trump"
    ? biddingState?.winnerPlayerId ?? null
    : game?.stage === "bidding"
    ? currentBidPlayer?.id ?? null
    : null;

  const centerPlays = useMemo(() => roundState?.currentTrick.plays ?? [], [roundState?.currentTrick.plays]);
  const latestCenterPlay = centerPlays.length > 0 ? centerPlays[centerPlays.length - 1] : null;
  const [lastCenterCard, setLastCenterCard] = useState<GameCard | null>(null);
  const roundStats = useMemo(() => calculateRoundStats(roundState ?? null, players), [players, roundState]);
  const roundAward = useMemo(
    () =>
      resolveRoundAward({
        winnerPlayerId: biddingState?.winnerPlayerId ?? null,
        highestBid: biddingState?.highestBid?.bid ?? null,
        players,
        roundStats,
      }),
    [biddingState?.highestBid?.bid, biddingState?.winnerPlayerId, players, roundStats]
  );
  const boardDisplayMode = game?.stage === "playing" ? "playing" : "opening";

  useEffect(() => {
    const latest = latestCenterPlay?.card ?? pendingPlayCard ?? null;
    if (latest) {
      setLastCenterCard(latest);
    }
  }, [latestCenterPlay, pendingPlayCard]);

  const runAction = async <TGame,>(action: () => Promise<TGame>) => {
    setPending(true);
    setError(null);

    try {
      const nextGame = await action();
      setGame((current) => {
        const snapshot = nextGame as typeof game;
        if (!snapshot) return null;
        if (!current) return snapshot;
        return snapshot.updatedAt >= current.updatedAt ? snapshot : current;
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Game action failed.");
    } finally {
      setPending(false);
    }
  };

  const startMatch = async () => {
    await runAction(() => startServerGame(tableId, localPlayerId, shouldFillBots));
  };

  const submitBid = async (action: "pass" | "bid", bid?: BidValue) => {
    await runAction(() => postServerBidAction(tableId, localPlayerId, action, bid));
  };

  const selectTrump = async (card: GameCard) => {
    setSelectedTrumpCardId(card.id);
    await runAction(() => postServerTrumpSelection(tableId, localPlayerId, card.id));
  };

  const playCard = async (card: GameCard) => {
    setPendingCardId(card.id);
    await runAction(() => postServerPlayCard(tableId, localPlayerId, card.id));
    setPendingCardId(null);
  };

  return (
    <div className="pointer-events-none relative h-full min-h-[22rem] w-full sm:min-h-[28rem]">


      {players.length > 0 ? (
        <TableHandsBoard
          players={players}
          openingHands={boardHands}
          localSeatNumber={localSeatNumber}
          activePlayerId={activeTurnPlayerId}
          displayMode={boardDisplayMode}
          revealAllCards={false}
          clickablePlayerId={null}
          selectedCardId={selectedTrumpCardId ?? pendingCardId}
          onCardClick={() => undefined}
          onSeatSelect={localSeatNumber === null ? onSeatSelect : undefined}
          className="pointer-events-auto absolute inset-0 z-10"
        />
      ) : null}

      {latestCenterPlay || pendingPlayCard || lastCenterCard ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
          <PlayingCardView card={(latestCenterPlay?.card ?? pendingPlayCard ?? lastCenterCard)!} size="regular" />
        </div>
      ) : null}

      <GameStatsOverlay
        roundStats={roundStats}
        currentRound={game?.roundNumber ?? 1}
        trumpSuit={game?.trumpSuit ?? null}
      />

      {!game ? (
        localSeatNumber !== null ? (
        <div className="pointer-events-auto absolute left-1/2 top-1/2 z-30 w-[min(92%,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-900/90 bg-black/75 p-4 text-sm text-red-200">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-400">Start Match</p>
          <p className="mt-2 text-red-200/90">
            {humanPlayerCount === 4
              ? "All four seats are occupied and ready."
              : `Start is available now with ${humanPlayerCount} occupied seat${humanPlayerCount === 1 ? "" : "s"}.`}
          </p>
          <p className="mt-1 text-red-300/80">At least two seats must be occupied. Once started, all browsers follow the same server state.</p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="primary"
              className="bg-red-700 text-white hover:bg-red-600 disabled:bg-zinc-900 disabled:text-zinc-500"
              disabled={!canStartGame || pending || loading}
              onClick={startMatch}
            >
              {shouldFillBots ? "Start With Bots" : "Start Match"}
            </Button>
          </div>
        </div>
        ) : null
      ) : null}

      {game?.stage === "bidding" && isLocalBidTurn ? (
        <BiddingControls
          allowedBids={allowedBids}
          canPass={canPass}
          pending={pending}
          onBid={(bid) => submitBid("bid", bid)}
          onPass={() => submitBid("pass")}
        />
      ) : null}

      {game?.stage === "selecting-trump" && isLocalTrumpTurn ? (
        <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 sm:inset-x-4 sm:bottom-4">
          <div className="rounded-lg bg-black/60 p-3 text-xs uppercase tracking-[0.12em] text-red-300">
            Select the trump suit from your opening hand.
          </div>
          <LocalHandPanel
            cards={localOpeningHand}
            canPickTrump={!pending}
            selectedCardId={selectedTrumpCardId}
            onCardClick={selectTrump}
          />
        </div>
      ) : null}

      {game?.stage === "playing" ? (
        <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 sm:inset-x-4 sm:bottom-3">
          <LocalHandPanel
            cards={localRoundHand}
            canPickTrump={Boolean(isLocalPlayTurn && !pending)}
            selectedCardId={pendingCardId}
            onCardClick={isLocalPlayTurn ? playCard : undefined}
          />
        </div>
      ) : null}

      {game?.stage === "completed" ? (
        <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 rounded-lg bg-black/60 p-3 text-xs text-red-300 sm:inset-x-4 sm:bottom-4">
          <p className="font-semibold uppercase tracking-[0.12em] text-red-300">Round complete</p>
          {roundAward ? (
            <p className="mt-1">Side {roundAward.awardToTeam === "A" ? "1" : "2"} wins {roundAward.pointsToAdd} match points.</p>
          ) : (
            <p className="mt-1">Round completed.</p>
          )}
        </div>
      ) : null}

      {loading || pending || error ? (
        <div className="pointer-events-none absolute right-1 top-1 z-30 rounded-xl border border-red-900/90 bg-black/75 px-3 py-2 text-[10px] text-red-300 sm:right-4 sm:top-4 sm:text-xs">
          {error ? error : pending ? "Updating game..." : "Loading game..."}
        </div>
      ) : null}
    </div>
  );
}
