type TurnProfileStripProps = {
  players: Array<{ id: string; name: string; seat: number }>;
  activePlayerId: string | null;
  secondsLeft: number;
  totalSeconds?: number;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function TurnProfileStrip({
  players,
  activePlayerId,
  secondsLeft,
  totalSeconds = 8,
}: TurnProfileStripProps) {
  const clamped = Math.max(0, Math.min(secondsLeft, totalSeconds));
  const progress = (clamped / totalSeconds) * 100;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {players.map((player) => {
        const isActive = player.id === activePlayerId;
        return (
          <div
            key={player.id}
            className={`relative rounded-xl border p-2 ${
              isActive
                ? "border-red-500/80 bg-red-950/45"
                : "border-red-900/90 bg-black/75"
            }`}
          >
            {isActive ? (
              <div
                className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full p-[2px]"
                style={{
                  background: `conic-gradient(rgba(248,113,113,1) ${progress}%, rgba(69,10,10,0.9) ${progress}% 100%)`,
                }}
              >
                <div className="h-full w-full rounded-full border border-red-800/90 bg-black/80" />
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-red-800/85 bg-black text-xs font-black text-red-300">
                {initials(player.name)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-red-200">{player.name}</p>
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
