import type { RoundStats } from "@/features/game/client/roundScoring";
import type { Suit } from "@/features/game";

type RoundAward = { awardToTeam: "A" | "B"; pointsToAdd: number } | null;

type GameStatsOverlayProps = {
  roundStats: RoundStats;
  currentRound: number;
  trumpSuit?: Suit | null;
};

export function GameStatsOverlay({ roundStats, currentRound, trumpSuit }: GameStatsOverlayProps) {
  const trumpSymbol =
    trumpSuit === "spades"
      ? "♠"
      : trumpSuit === "hearts"
      ? "♥"
      : trumpSuit === "diamonds"
      ? "♦"
      : trumpSuit === "clubs"
      ? "♣"
      : "-";

  return (
    <div className="pointer-events-none absolute bottom-[8.1rem] right-3 z-30 w-[9.25rem] rounded-2xl border border-red-900/75 bg-black/78 p-2.5 text-[10px] text-red-200 shadow-[0_10px_24px_rgba(0,0,0,0.34)] sm:bottom-[9.25rem] sm:right-5 sm:w-[10.5rem] sm:text-xs">
      <p className="font-semibold uppercase tracking-[0.12em] text-red-300">Round {currentRound}</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <div className="rounded-md border border-red-900/60 bg-red-950/25 px-2 py-1 text-red-200">Red: {roundStats.teamAPoints}</div>
        <div className="rounded-md border border-yellow-800/60 bg-yellow-950/25 px-2 py-1 text-yellow-200">Yellow: {roundStats.teamBPoints}</div>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-2 py-1.5">
        <span className="text-red-300/90">Trump</span>
        <span className="text-base font-black leading-none text-red-100">{trumpSymbol}</span>
      </div>
      <p className="mt-2 text-red-300/80">Tricks: {roundStats.trickCount}/13</p>
    </div>
  );
}
