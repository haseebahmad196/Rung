import { useMemo } from "react";
import { type Card as GameCard, type PlayerState } from "@/features/game";
import { PlayingCardView } from "./PlayingCardView";

type PublicPlayer = {
  id: string;
  name: string;
  seat: number;
  team: "A" | "B";
  isBot?: boolean;
};

type TableHandsBoardProps = {
  players: PublicPlayer[];
  openingHands: PlayerState[];
  localSeatNumber: number | null;
  activePlayerId?: string | null;
  displayMode?: "opening" | "playing";
  revealAllCards?: boolean;
  clickablePlayerId?: string | null;
  selectedCardId: string | null;
  onCardClick: (playerId: string, card: GameCard) => void;
  className?: string;
  onSeatSelect?: (seatNumber: number) => void;
};

const seatOrder = [0, 1, 2, 3] as const;

function seatPositionClass(seat: number) {
  if (seat === 0) return "absolute left-1/2 top-[1%] -translate-x-1/2";
  if (seat === 1) return "absolute right-0 top-1/2 -translate-y-1/2";
  if (seat === 2) return "absolute bottom-0 left-1/2 -translate-x-1/2";
  return "absolute left-0 top-1/2 -translate-y-1/2";
}

function seatBlockClass(seat: number) {
  if (seat === 0) return "flex flex-col items-center gap-1.5 scale-[0.9] sm:scale-[1]";
  if (seat === 1) return "flex flex-row-reverse items-center gap-2 scale-[0.85] sm:scale-[0.95]";
  if (seat === 2) return "flex flex-col-reverse items-center gap-1.5 scale-[0.95] sm:scale-[1.06]";
  return "flex flex-row items-center gap-2 scale-[0.85] sm:scale-[0.95]";
}

function cardBack(index: number) {
  return (
    <div
      key={`back-${index}`}
      className="h-[44px] w-[30px] rounded-md border border-red-900/85 bg-[linear-gradient(145deg,rgba(55,10,16,0.95),rgba(16,10,12,0.98))] sm:h-[58px] sm:w-[40px]"
    />
  );
}

function cardsWrapClass() {
  return "flex -space-x-4 sm:-space-x-4 md:-space-x-3";
}

function compactSeatStack(cardsLeft: number) {
  const normalized = Math.max(cardsLeft, 0);
  return (
    <div className="relative h-[30px] w-[24px] sm:h-[40px] sm:w-[30px]">
      <div className="absolute left-[4px] top-0 h-[30px] w-[20px] rounded-md border border-red-800/50 bg-[linear-gradient(135deg,rgba(55,8,14,0.85),rgba(10,8,12,0.95))] sm:left-[5px] sm:h-[40px] sm:w-[26px]" />
      <div className="absolute left-[2px] top-[2px] h-[30px] w-[20px] rounded-md border border-red-700/60 bg-[linear-gradient(135deg,rgba(65,10,16,0.9),rgba(10,8,12,0.96))] sm:left-[2px] sm:h-[40px] sm:w-[26px]" />
      <div className="absolute left-0 top-[4px] h-[30px] w-[20px] rounded-md border border-red-600/80 bg-[linear-gradient(135deg,rgba(75,12,18,0.95),rgba(10,8,12,0.98))] sm:h-[40px] sm:w-[26px]" />
      <div className="absolute -right-4 -top-2 rounded-full border border-red-800/80 bg-black/90 px-1.5 py-0.5 text-[9px] font-bold text-red-200 sm:text-[10px]">
        {normalized}
      </div>
    </div>
  );
}

function seatCircleClass({
  isActive,
  isLocal,
  team,
}: {
  isActive: boolean;
  isLocal: boolean;
  team: "A" | "B";
}) {
  const teamTone =
    team === "A"
      ? "border-red-600/90 bg-[radial-gradient(circle_at_35%_30%,rgba(147,24,24,0.92),rgba(38,9,9,0.96)_78%)] text-red-100"
      : "border-amber-500/90 bg-[radial-gradient(circle_at_35%_30%,rgba(146,95,28,0.92),rgba(40,24,8,0.96)_78%)] text-amber-100";

  if (isActive) {
    return `${teamTone} turn-seat-beat ring-2 ring-white/85 shadow-[0_0_36px_rgba(248,113,113,0.45)]`;
  }

  if (isLocal) {
    return `${teamTone} ring-2 ring-white/70 shadow-[0_0_18px_rgba(255,255,255,0.12)]`;
  }

  return `${teamTone} shadow-[0_10px_24px_rgba(0,0,0,0.22)]`;
}

function playerMonogram(player: PublicPlayer) {
  const cleaned = player.name.trim();
  if (!cleaned) {
    return `P${player.seat + 1}`;
  }

  const initials = cleaned
    .split(/\s+/)
    .slice(0, 1)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || `P${player.seat + 1}`;
}

function toVisualSeat(playerSeat: number, localSeatNumber: number | null) {
  const localSeat = (localSeatNumber ?? 3) - 1;
  return ((playerSeat - localSeat + 2 + 4) % 4) as 0 | 1 | 2 | 3;
}

export function TableHandsBoard({
  players,
  openingHands,
  localSeatNumber,
  activePlayerId = null,
  displayMode = "opening",
  revealAllCards = false,
  clickablePlayerId = null,
  selectedCardId,
  onCardClick,
  className,
  onSeatSelect,
}: TableHandsBoardProps) {
  const handByPlayerId = useMemo(
    () =>
      openingHands.reduce<Record<string, GameCard[]>>((acc, player) => {
        acc[player.id] = player.hand;
        return acc;
      }, {}),
    [openingHands]
  );

  const playerBySeat = players.reduce<Record<number, PublicPlayer>>((acc, player) => {
    acc[player.seat] = player;
    return acc;
  }, {});

  return (
    <div className={className ?? ""}>
      <div className="relative h-full w-full">
        <div className="absolute inset-x-3 top-3 bottom-[7.25rem] sm:inset-x-6 sm:top-5 sm:bottom-[8.75rem]">
          <div className="absolute inset-x-[4%] top-[9%] bottom-[10%] rounded-[999px] border border-red-900/70 bg-[radial-gradient(circle_at_50%_45%,rgba(116,16,30,0.8),rgba(60,10,18,0.93)_54%,rgba(7,5,10,0.98)_100%)] shadow-[0_18px_30px_rgba(0,0,0,0.42)]">
            <div className="absolute inset-[2.2%] rounded-[999px] border border-white/8" />
            <div className="absolute inset-[6.5%] rounded-[999px] border border-black/25" />
            <div className="absolute left-1/2 top-1/2 h-[32%] w-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 bg-black/10" />
          </div>
          {seatOrder.map((seat) => {
              const player = playerBySeat[seat];
              if (!player) return null;

              const hand = handByPlayerId[player.id] ?? [];
              const isLocal = player.seat + 1 === localSeatNumber;
              const visualSeat = toVisualSeat(player.seat, localSeatNumber);
              const canClickThisSeat = clickablePlayerId === player.id;
              const showFaceCards =
                displayMode === "opening" && (revealAllCards || isLocal || canClickThisSeat);
              const cardsLeft = hand.length;
              const isActive = activePlayerId === player.id;
              const seatCircleSize = visualSeat === 2 ? "h-16 w-16 sm:h-20 sm:w-20" : "h-14 w-14 sm:h-16 sm:w-16";
              const canSelectSeat = Boolean(onSeatSelect) && Boolean(player.isBot);
              return (
                <div
                  key={player.id}
                  className={`${seatPositionClass(visualSeat)} relative z-20`}
                >
                  <div className={seatBlockClass(visualSeat)}>
                    <div
                      role={canSelectSeat ? "button" : undefined}
                      tabIndex={canSelectSeat ? 0 : undefined}
                      onClick={canSelectSeat ? () => onSeatSelect!(player.seat + 1) : undefined}
                      onKeyDown={canSelectSeat ? (e) => { if (e.key === "Enter" || e.key === " ") onSeatSelect!(player.seat + 1); } : undefined}
                      className={`relative grid ${seatCircleSize} shrink-0 place-items-center rounded-full border text-[9px] font-semibold uppercase tracking-[0.12em] ${seatCircleClass({
                        isActive,
                        isLocal,
                        team: player.team,
                      })} ${visualSeat === 2 ? "text-[10px] sm:text-[11px]" : "sm:text-[10px]"} ${isActive ? "scale-125 sm:scale-[1.34]" : ""} ${canSelectSeat ? "cursor-pointer hover:ring-2 hover:ring-red-300/80 transition-transform hover:scale-105" : ""}`}
                    >
                      <div className="absolute inset-[8%] rounded-full border border-white/10" />
                      <span className="relative text-[10px] font-black tracking-[0.18em] sm:text-xs">
                        {playerMonogram(player)}
                      </span>
                    </div>
                    {displayMode === "playing" ? (
                      compactSeatStack(cardsLeft)
                    ) : (
                      <div className={cardsWrapClass()}>
                        {showFaceCards
                          ? hand.map((card) => {
                              const isSelected = selectedCardId === card.id;

                              if (canClickThisSeat) {
                                return (
                                  <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => onCardClick(player.id, card)}
                                    className={`rounded-lg transition ${
                                      isSelected
                                        ? "ring-2 ring-red-500 ring-offset-2 ring-offset-black"
                                        : "hover:ring-2 hover:ring-red-700"
                                    }`}
                                  >
                                    <PlayingCardView card={card} size="compact" />
                                  </button>
                                );
                              }

                              return <PlayingCardView key={card.id} card={card} size="compact" />;
                            })
                          : Array.from({ length: hand.length }).map((_, index) => cardBack(index))}
                      </div>
                    )}
                  </div>
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
}
