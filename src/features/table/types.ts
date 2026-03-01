export type TableConfig = {
  id: string;
  title: string;
  hostName: string;
  seatsTaken: Record<number, string>;
  settings: {
    rounds: number;
    trump: "auto" | "host";
    turnTimeSec: number;
  };
};

export type ChatMessage = {
  id: string;
  from: string;
  text: string;
  timestamp: number;
};
