import { PlayingCardView } from "../PlayingCardView";
import type { Card as GameCard } from "@/features/game";

type CenterPlay = {
  playerId: string;
  seat: number;
  card: GameCard;
};

type GameCenterPlaysProps = {
  centerPlays: CenterPlay[];
};

export function GameCenterPlays({ centerPlays }: GameCenterPlaysProps) {
  if (centerPlays.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
      <div className="flex items-center gap-1 rounded-xl bg-black/45 p-1.5">
        {centerPlays.map((play) => (
          <PlayingCardView key={`${play.playerId}-${play.card.id}`} card={play.card} size="compact" />
        ))}
      </div>
    </div>
  );
}
