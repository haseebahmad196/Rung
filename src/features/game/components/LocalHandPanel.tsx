import type { Card as GameCard } from "@/features/game";
import { PlayingCardView } from "./PlayingCardView";

type LocalHandPanelProps = {
  cards: GameCard[];
  canPickTrump?: boolean;
  selectedCardId?: string | null;
  onCardClick?: (card: GameCard) => void;
};

export function LocalHandPanel({
  cards,
  canPickTrump = false,
  selectedCardId = null,
  onCardClick,
}: LocalHandPanelProps) {
  return (
    <div className="mt-2 rounded-xl border border-zinc-800/80 bg-[rgba(24,24,24,0.82)] p-2 sm:mt-3">
      <div className="flex items-end overflow-x-auto pb-1">
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;
          const cardClass = "-ml-2 first:ml-0 sm:-ml-3";

          if (canPickTrump && onCardClick) {
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onCardClick(card)}
                className={`${cardClass} rounded-xl transition ${
                  isSelected
                    ? "ring-2 ring-yellow-300 ring-offset-2 ring-offset-black"
                    : "hover:-translate-y-1"
                }`}
              >
                <PlayingCardView card={card} size="regular" />
              </button>
            );
          }

          return (
            <div key={card.id} className={`${cardClass} transition hover:-translate-y-1`}>
              <PlayingCardView card={card} size="regular" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
