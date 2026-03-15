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
      className={`glass-card-anim relative rounded-xl border border-red-200/60 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(246,246,246,0.9))] p-1 shadow-[0_12px_24px_rgba(0,0,0,0.3)] ${
        isCompact ? "h-14 w-10 sm:h-20 sm:w-14" : "h-24 w-16 sm:h-28 sm:w-20"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(130deg,rgba(255,255,255,0.3),rgba(255,255,255,0.02)_52%,rgba(180,20,40,0.08))]" />
      <p className={`font-bold ${suitColor[card.suit]} ${isCompact ? "text-[9px] sm:text-[10px]" : "text-[11px] sm:text-xs"}`}>
        {card.rank}
        {suitSymbol[card.suit]}
      </p>

      <div className="absolute inset-0 grid place-items-center">
        <span className={`${suitColor[card.suit]} ${isCompact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"}`}>
          {suitSymbol[card.suit]}
        </span>
      </div>

      <p
        className={`absolute bottom-1 right-1 rotate-180 font-bold ${suitColor[card.suit]} ${isCompact ? "text-[9px] sm:text-[10px]" : "text-[11px] sm:text-xs"}`}
      >
        {card.rank}
        {suitSymbol[card.suit]}
      </p>
    </div>
  );
}
