import type { ChatMessage, TableConfig } from "./types";

export const tableConfigs: TableConfig[] = [
  {
    id: "T-101",
    title: "Rung Courtpiece",
    hostName: "Rayan",
    seatsTaken: { 2: "Rayan", 3: "Usman", 4: "Hira" },
    settings: { rounds: 7, trump: "host", turnTimeSec: 20 },
  },
  {
    id: "T-205",
    title: "Red Kings",
    hostName: "Fatima",
    seatsTaken: { 1: "Fatima", 2: "Hassan", 4: "Areeba" },
    settings: { rounds: 5, trump: "auto", turnTimeSec: 15 },
  },
  {
    id: "T-310",
    title: "Black Aces",
    hostName: "Usman",
    seatsTaken: { 3: "Usman" },
    settings: { rounds: 9, trump: "host", turnTimeSec: 25 },
  },
];

export const seedChatByTable: Record<string, ChatMessage[]> = {
  "T-101": [
    {
      id: "seed-1",
      from: "Rayan",
      text: "Seat 1 is open, join fast.",
      timestamp: Date.now() - 120000,
    },
  ],
  "T-205": [
    {
      id: "seed-2",
      from: "Fatima",
      text: "Quick round, be ready.",
      timestamp: Date.now() - 90000,
    },
  ],
  "T-310": [],
};

export function getTableByLink(tableId: string | null | undefined): TableConfig {
  if (!tableId) return tableConfigs[0];
  return (
    tableConfigs.find((table) => table.id.toLowerCase() === tableId.toLowerCase()) ??
    tableConfigs[0]
  );
}
