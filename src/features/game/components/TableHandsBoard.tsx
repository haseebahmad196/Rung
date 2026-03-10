import type { Card as GameCard, PlayerState } from "@/features/game";
import { PlayingCardView } from "./PlayingCardView";

type PublicPlayer = {
  id: string;
  name: string;
  seat: number;
  team: "A" | "B";
};

type TableHandsBoardProps = {
  players: PublicPlayer[];
  openingHands: PlayerState[];
  localSeatNumber: number;
  revealAllCards?: boolean;
  clickablePlayerId?: string | null;
  selectedCardId: string | null;
  onCardClick: (playerId: string, card: GameCard) => void;
  className?: string;
};

const seatOrder = [0, 1, 2, 3] as const;

function seatPositionClass(seat: number) {
  if (seat === 0) return "absolute left-1/2 top-[7%] -translate-x-1/2";
  if (seat === 1) return "absolute right-[1%] top-1/2 -translate-y-1/2";
  if (seat === 2) return "absolute bottom-[7%] left-1/2 -translate-x-1/2";
  return "absolute left-[1%] top-1/2 -translate-y-1/2";
}

function seatBlockClass(seat: number) {
  if (seat === 0) return "flex flex-col items-center scale-[0.72] sm:scale-100";
  if (seat === 1) return "flex flex-col items-end scale-[0.52] sm:scale-[0.82] lg:scale-100";
  if (seat === 2) return "flex flex-col items-center scale-[0.94] sm:scale-100";
  return "flex flex-col items-start scale-[0.52] sm:scale-[0.82] lg:scale-100";
}

function cardBack(index: number) {
  return (
    <div
      key={`back-${index}`}
      className="h-[44px] w-[30px] rounded-md border border-red-800/70 bg-[linear-gradient(135deg,rgba(55,8,14,0.95),rgba(10,8,12,0.98))] sm:h-[58px] sm:w-[40px]"
    />
  );
}

function cardsWrapClass() {
  return "flex -space-x-5 sm:-space-x-5 md:-space-x-4";
}

function toVisualSeat(playerSeat: number, localSeatNumber: number) {
  const localSeat = localSeatNumber - 1;
  return ((playerSeat - localSeat + 2 + 4) % 4) as 0 | 1 | 2 | 3;
}

export function TableHandsBoard({
  players,
  openingHands,
  localSeatNumber,
  revealAllCards = false,
  clickablePlayerId = null,
  selectedCardId,
  onCardClick,
  className,
}: TableHandsBoardProps) {
  const handByPlayerId = openingHands.reduce<Record<string, GameCard[]>>((acc, player) => {
    acc[player.id] = player.hand;
    return acc;
  }, {});

  const playerBySeat = players.reduce<Record<number, PublicPlayer>>((acc, player) => {
    acc[player.seat] = player;
    return acc;
  }, {});

  return (
    <div className={className ?? ""}>
      <div className="relative h-full w-full">
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative aspect-square w-full max-w-[23rem] sm:aspect-[21/10] sm:max-w-[84rem]">
            {seatOrder.map((seat) => {
              const player = playerBySeat[seat];
              if (!player) return null;

              const hand = handByPlayerId[player.id] ?? [];
              const isLocal = player.seat + 1 === localSeatNumber;
              const visualSeat = toVisualSeat(player.seat, localSeatNumber);
              const canClickThisSeat = clickablePlayerId === player.id;
              const showFaceCards = revealAllCards || isLocal || canClickThisSeat;

              return (
                <div
                  key={player.id}
                  className={`${seatPositionClass(visualSeat)} relative z-20`}
                >
                  <div className={seatBlockClass(visualSeat)}>
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
