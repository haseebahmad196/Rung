import { useMemo } from "react";

type SeatRingProps = {
  title: string;
  selectedSeat: number | null;
  playerName: string;
  takenSeats: Record<number, string>;
  onSeatSelect: (seatId: number) => void;
};

const seatLayout = [
  {
    id: 1,
    position: "top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-2",
  },
  {
    id: 2,
    position: "top-1/2 right-1 translate-x-1/2 -translate-y-1/2 rotate-2",
  },
  {
    id: 3,
    position: "bottom-2 left-1/2 -translate-x-1/2 translate-y-1/2 -rotate-1",
  },
  {
    id: 4,
    position: "top-1/2 left-1 -translate-x-1/2 -translate-y-1/2 rotate-1",
  },
];

const funnySpots = [
  "🛵 Madni Scooter",
  "🔫 Shooter",
  "🪑 Charpai Stool",
  "🍵 Dhabba Chai Seat",
  "🥒 Kheera Throne",
  "🚜 Tractor Seat",
  "🧯 Jugaari Boost",
  "🥭 Aam Rider",
  "🚗 Car",
  "🛺 Rickshaw",
  "🛹 Skate",
  "🛵 Scooty",
  "🧺 Basket",
  "🪵 Log",
];

export function SeatRing({
  title,
  selectedSeat,
  playerName,
  takenSeats,
  onSeatSelect,
}: SeatRingProps) {
  const seatNames = useMemo(() => {
    const pool = [...funnySpots].sort(() => Math.random() - 0.5);
    return seatLayout.reduce<Record<number, string>>((acc, seat, index) => {
      acc[seat.id] = pool[index] ?? `Spot ${seat.id}`;
      return acc;
    }, {});
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[23rem] rounded-[999px] border border-red-900/95 bg-[radial-gradient(circle_at_50%_42%,rgba(160,18,38,0.52),rgba(70,6,18,0.78)_43%,rgba(6,4,8,0.98)_100%)] shadow-[inset_0_0_140px_rgba(0,0,0,0.78),0_42px_90px_rgba(28,2,8,0.85)] backdrop-blur-md sm:aspect-[21/10] sm:max-w-[84rem]">
      <div className="absolute inset-2 rounded-[999px] border border-red-800/80 bg-[linear-gradient(135deg,rgba(120,10,26,0.35),rgba(24,8,12,0.12))]" />
      <div className="absolute inset-6 rounded-[999px] border border-red-900/55" />
      <div className="absolute inset-x-12 top-3 h-8 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,80,80,0.22),transparent)] blur-sm" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="rounded-full border border-red-700/70 bg-[linear-gradient(135deg,rgba(60,4,12,0.9),rgba(10,8,10,0.9))] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400 shadow-[0_10px_24px_rgba(0,0,0,0.45)] sm:text-xs">
          {title}
        </div>
      </div>

      {seatLayout.map((seat) => {
        const selectedByCurrent = selectedSeat === seat.id;
        const occupiedBy = selectedByCurrent ? playerName : takenSeats[seat.id] ?? null;
        const isTakenByOthers = Boolean(occupiedBy) && !selectedByCurrent;
        const isOpenSeat = !occupiedBy;
        const avatarChar = occupiedBy ? occupiedBy.charAt(0).toUpperCase() : "?";

        return (
          <button
            key={seat.id}
            type="button"
            onClick={() => onSeatSelect(seat.id)}
            disabled={isTakenByOthers}
            className={`absolute ${seat.position} flex h-24 w-24 flex-col items-center justify-center rounded-full border p-2 text-center transition sm:h-36 sm:w-36 ${
              selectedByCurrent
                ? "border-red-500/95 bg-[radial-gradient(circle_at_35%_30%,rgba(190,20,44,0.85),rgba(30,6,10,0.95))] shadow-[0_16px_40px_rgba(100,8,24,0.55)]"
                : isTakenByOthers
                ? "cursor-not-allowed border-red-950/95 bg-[radial-gradient(circle_at_35%_30%,rgba(45,8,14,0.95),rgba(12,8,10,0.98))] opacity-90"
                : "border-red-800/85 bg-[radial-gradient(circle_at_35%_30%,rgba(88,10,22,0.78),rgba(14,8,10,0.95))] shadow-[0_14px_32px_rgba(0,0,0,0.42)] hover:border-red-600/95 hover:shadow-[0_16px_36px_rgba(90,8,22,0.48)]"
            }`}
            style={
              isOpenSeat
                ? {
                    animation: `seat-bob ${2.1 + seat.id * 0.15}s ease-in-out infinite`,
                    animationDelay: `${seat.id * 0.25}s`,
                  }
                : undefined
            }
          >
            <div className="mb-1 grid h-7 w-7 place-items-center rounded-full border border-red-700/75 bg-black/70 text-[11px] font-black text-red-300 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] sm:h-9 sm:w-9 sm:text-sm">
              {avatarChar}
            </div>
            <p className="text-[9px] uppercase tracking-[0.12em] text-red-500/90 sm:text-[10px]">
              {seatNames[seat.id]}
            </p>
            <p className="mt-1 text-[11px] font-bold text-red-200 sm:text-xs">
              {occupiedBy ? occupiedBy : "Open"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
