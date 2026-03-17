type SeatRingProps = {
  title: string;
  selectedSeat: number | null;
  activeSeat?: number | null;
  takenSeats: Record<number, string>;
  onSeatSelect: (seatId: number) => void;
};

const seatLayout = [
  {
    id: 1,
    position: "top-2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  },
  {
    id: 2,
    position: "top-1/2 right-1.5 translate-x-1/2 -translate-y-1/2",
  },
  {
    id: 3,
    position: "bottom-2 left-1/2 -translate-x-1/2 translate-y-1/2",
  },
  {
    id: 4,
    position: "top-1/2 left-1.5 -translate-x-1/2 -translate-y-1/2",
  },
];

function teamMetaForSeat(seatId: number) {
  const isTeamA = seatId % 2 === 1;
  return {
    borderClass: isTeamA ? "border-red-600/95" : "border-amber-500/95",
    hoverBorderClass: isTeamA ? "hover:border-red-400" : "hover:border-amber-300",
    textClass: isTeamA ? "text-red-100" : "text-amber-100",
    bgClass: isTeamA
      ? "bg-[radial-gradient(circle_at_35%_30%,rgba(120,14,30,0.88),rgba(14,8,10,0.96))]"
      : "bg-[radial-gradient(circle_at_35%_30%,rgba(125,82,18,0.84),rgba(14,8,10,0.96))]",
  };
}

export function SeatRing({
  title,
  selectedSeat,
  activeSeat = null,
  takenSeats,
  onSeatSelect,
}: SeatRingProps) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[23rem] rounded-[999px] border border-red-900/95 bg-[radial-gradient(circle_at_50%_45%,rgba(130,18,32,0.48),rgba(52,7,15,0.8)_40%,rgba(8,8,10,0.98)_100%)] shadow-[inset_0_0_72px_rgba(0,0,0,0.68),0_20px_36px_rgba(0,0,0,0.55)] sm:aspect-[21/10] sm:max-w-[84rem]">
      <div className="absolute inset-2 rounded-[999px] border border-red-800/70" />
      <div className="absolute inset-6 rounded-[999px] border border-red-950/65" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="rounded-full border border-red-700/70 bg-black/70 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-300 shadow-[0_8px_18px_rgba(0,0,0,0.45)] sm:text-xs">
          {title}
        </div>
      </div>

      {seatLayout.map((seat) => {
        const teamMeta = teamMetaForSeat(seat.id);
        const selectedByCurrent = selectedSeat === seat.id;
        const isTurnSeat = activeSeat === seat.id;
        const isTakenByOthers = Boolean(takenSeats[seat.id]) && !selectedByCurrent;
        const seatStatus = selectedByCurrent ? "You" : isTakenByOthers ? "Taken" : "Open";

        return (
          <button
            key={seat.id}
            type="button"
            onClick={() => onSeatSelect(seat.id)}
            disabled={isTakenByOthers}
            className={`absolute ${seat.position} flex h-16 w-16 flex-col items-center justify-center rounded-full border p-1.5 text-center transition sm:h-24 sm:w-24 ${
              selectedByCurrent
                ? "bg-[radial-gradient(circle_at_35%_30%,rgba(164,20,38,0.82),rgba(25,8,12,0.95))] shadow-[0_10px_22px_rgba(75,10,22,0.55)]"
                : isTakenByOthers
                ? "cursor-not-allowed border-red-950/95 bg-[radial-gradient(circle_at_35%_30%,rgba(42,8,14,0.95),rgba(12,8,10,0.98))] opacity-85"
                : `${teamMeta.bgClass} shadow-[0_14px_32px_rgba(0,0,0,0.42)] ${teamMeta.hoverBorderClass}`
            } ${teamMeta.borderClass} ${teamMeta.textClass} ${isTurnSeat ? "turn-seat-beat shadow-[0_0_0_2px_rgba(255,255,255,0.28),0_20px_44px_rgba(120,10,26,0.58)]" : ""}`}
            style={undefined}
          >
            <div className="mb-1 grid h-6 w-6 place-items-center rounded-full border border-white/15 bg-black/55 text-[10px] font-black shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] sm:h-7 sm:w-7 sm:text-xs">
              {seat.id}
            </div>
            <p className="mt-0.5 text-[10px] font-semibold sm:text-[11px]">
              {seatStatus}
            </p>
          </button>
        );
      })}
    </div>
  );
}