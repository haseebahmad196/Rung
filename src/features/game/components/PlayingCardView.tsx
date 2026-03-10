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

export function PlayingCardView({ card, size = "regular" }: PlayingCardViewProps) {
  const isCompact = size === "compact";

  return (
    <div
      className={`glass-card-anim relative rounded-[10px] border border-zinc-200/90 bg-[linear-gradient(170deg,rgba(255,255,255,0.98),rgba(246,246,246,0.96)_55%,rgba(238,238,238,0.95))] p-1 shadow-[0_6px_16px_rgba(0,0,0,0.26)] ${
        isCompact ? "h-[58px] w-[40px] sm:h-[80px] sm:w-[56px]" : "h-24 w-16 sm:h-28 sm:w-20"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[10px] bg-[linear-gradient(130deg,rgba(255,255,255,0.24),rgba(255,255,255,0.03)_54%,rgba(0,0,0,0.02))]" />
      <p className={`font-bold ${suitColor[card.suit]} ${isCompact ? "text-[8px] sm:text-[10px]" : "text-[11px] sm:text-xs"}`}>
        {card.rank}
        {suitSymbol[card.suit]}
      </p>

      <div className="absolute inset-0 grid place-items-center">
        <span className={`${suitColor[card.suit]} ${isCompact ? "text-sm sm:text-lg" : "text-xl sm:text-2xl"}`}>
          {suitSymbol[card.suit]}
        </span>
      </div>

      <p
        className={`absolute bottom-1 right-1 rotate-180 font-bold ${suitColor[card.suit]} ${isCompact ? "text-[8px] sm:text-[10px]" : "text-[11px] sm:text-xs"}`}
      >
        {card.rank}
        {suitSymbol[card.suit]}
      </p>
    </div>
  );
}
