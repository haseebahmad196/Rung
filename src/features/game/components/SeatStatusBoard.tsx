type SeatStatusBoardProps = {
  players: Array<{ id: string; name: string; seat: number }>;
  activePlayerId: string | null;
  localSeatNumber: number;
  handsByPlayerId?: Record<string, number>;
  className?: string;
}

export function SeatStatusBoard({
  players,
  activePlayerId,
  localSeatNumber,
  handsByPlayerId,
  className,
}: SeatStatusBoardProps) {
  return null;
}
