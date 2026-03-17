type TurnProfileStripProps = {
  players: Array<{ id: string; name: string; seat: number }>;
  activePlayerId: string | null;
  secondsLeft: number;
  totalSeconds?: number;
  className?: string;
}

export function TurnProfileStrip({
  players,
  activePlayerId,
  secondsLeft,
  totalSeconds = 8,
  className,
}: TurnProfileStripProps) {
  const clamped = Math.max(0, Math.min(secondsLeft, totalSeconds));

  return (
    <div className={className ?? "grid grid-cols-2 gap-2 sm:grid-cols-4"}>
      {players.map((player) => {
        const isActive = player.id === activePlayerId;
        return (
          <div
            key={player.id}
            className={`relative min-w-[8.2rem] rounded-xl border p-2 ${
              isActive
                ? "border-red-500/80 bg-red-950/45"
                : "border-red-900/90 bg-black/75"
            }`}
          >
            {isActive ? (
              <div className="absolute -right-1 -top-1 rounded-full border border-red-700/80 bg-black/90 px-1.5 py-[2px] text-[9px] font-bold text-red-200">
                {clamped}s
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-red-800/85 bg-black text-xs font-black text-red-300">
                {player.seat + 1}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.1em] text-red-500/90">
                  Seat {player.seat + 1}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
