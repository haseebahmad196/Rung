import { memo } from "react";
import type { Card } from "../types";

const suitSymbol: Record<Card["suit"], string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const suitColor: Record<Card["suit"], string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-zinc-900",
  spades: "text-zinc-900",
};

type PlayingCardViewProps = {
  card: Card;
  size?: "regular" | "compact";
};

function PlayingCardViewComponent({ card, size = "regular" }: PlayingCardViewProps) {
  const isCompact = size === "compact";

  return (
    <div
      className={`relative rounded-lg border border-zinc-300 bg-white p-1 shadow-[0_6px_12px_rgba(0,0,0,0.28)] ${
        isCompact ? "h-14 w-10 sm:h-[72px] sm:w-[52px]" : "h-[88px] w-[62px] sm:h-[102px] sm:w-[72px]"
      }`}
    >
      <p className={`font-bold ${suitColor[card.suit]} ${isCompact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"}`}>
        {card.rank}
        {suitSymbol[card.suit]}
      </p>

      <div className="absolute inset-0 grid place-items-center">
        <span className={`${suitColor[card.suit]} ${isCompact ? "text-lg sm:text-xl" : "text-2xl sm:text-[30px]"}`}>
          {suitSymbol[card.suit]}
        </span>
      </div>

      <p
        className={`absolute bottom-1 right-1 rotate-180 font-bold ${suitColor[card.suit]} ${isCompact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"}`}
      >
        {card.rank}
        {suitSymbol[card.suit]}
      </p>
    </div>
  );
}

export const PlayingCardView = memo(PlayingCardViewComponent);
