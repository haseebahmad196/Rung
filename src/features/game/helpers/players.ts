import type { PlayerState } from "../types";

export function buildPresetPlayers(params: {
  localPlayerName: string;
  localSeatNumber: number;
  takenSeats: Record<number, string>;
}) {
  const seatNumbers = [1, 2, 3, 4] as const;

  const players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">> = seatNumbers.map(
    (seatNumber) => {
      const isLocal = seatNumber === params.localSeatNumber;
      const fallbackName = `Player ${seatNumber}`;
      const name = isLocal
        ? params.localPlayerName
        : params.takenSeats[seatNumber] ?? fallbackName;

      return {
        id: `player-seat-${seatNumber}`,
        name,
        seat: (seatNumber - 1) as PlayerState["seat"],
        team: seatNumber % 2 === 1 ? "A" : "B",
      };
    }
  );

  return players;
}
