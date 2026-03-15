import { useEffect, useMemo, useState } from "react";
import type {
  DashboardSnapshot,
  DuoHighlight,
  MatchResultPayload,
  PlayerStandingRow,
  TeamStandingRow,
} from "./types";

type PlayerAggregate = {
  playerId: string;
  name: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winningPoints: number;
  mvpScore: number;
  lastActiveAt: number;
};

type TeamAggregate = {
  teamKey: string;
  label: string;
  wins: number;
  losses: number;
};

type DuoAggregate = {
  duoKey: string;
  label: string;
  wins: number;
  losses: number;
};

type DashboardStore = {
  matches: Record<string, MatchResultPayload>;
  players: Record<string, PlayerAggregate>;
  teams: Record<string, TeamAggregate>;
  duos: Record<string, DuoAggregate>;
  updatedAt: number;
};

const DASHBOARD_STORAGE_KEY = "courtpiece-dashboard-v1";
const DASHBOARD_CHANNEL = "courtpiece-dashboard-sync";
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function toWinRate(wins: number, games: number) {
  if (games <= 0) return 0;
  return Number(((wins / games) * 100).toFixed(1));
}

function baseStore(): DashboardStore {
  return {
    matches: {},
    players: {},
    teams: {},
    duos: {},
    updatedAt: Date.now(),
  };
}

function readStore() {
  if (!canUseStorage()) return baseStore();
  const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
  if (!raw) return baseStore();

  try {
    const parsed = JSON.parse(raw) as DashboardStore;
    return {
      matches: parsed.matches ?? {},
      players: parsed.players ?? {},
      teams: parsed.teams ?? {},
      duos: parsed.duos ?? {},
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    return baseStore();
  }
}

function writeStore(next: DashboardStore) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(next));
}

function broadcastStore(next: DashboardStore) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  const channel = new BroadcastChannel(DASHBOARD_CHANNEL);
  channel.postMessage(next);
  channel.close();
}

function mutateStore(mutator: (previous: DashboardStore) => DashboardStore) {
  const previous = readStore();
  const next = mutator(previous);
  writeStore(next);
  broadcastStore(next);
  return next;
}

function duoKeyFromNames(a: string, b: string) {
  return [a, b].sort((x, y) => x.localeCompare(y)).join(" + ");
}

function duoKeyFromIds(a: string, b: string) {
  return [a, b].sort((x, y) => x.localeCompare(y)).join("::");
}

function teamKey(players: Array<{ playerId: string }>) {
  return players
    .map((player) => player.playerId)
    .sort((a, b) => a.localeCompare(b))
    .join("::");
}

function updatePlayer(
  players: DashboardStore["players"],
  payload: {
    playerId: string;
    name: string;
    didWin: boolean;
    winningPoints: number;
    mvpIncrement: number;
    at: number;
  }
) {
  const previous = players[payload.playerId];

  const next: PlayerAggregate = {
    playerId: payload.playerId,
    name: payload.name,
    gamesPlayed: (previous?.gamesPlayed ?? 0) + 1,
    gamesWon: (previous?.gamesWon ?? 0) + (payload.didWin ? 1 : 0),
    gamesLost: (previous?.gamesLost ?? 0) + (payload.didWin ? 0 : 1),
    winningPoints: (previous?.winningPoints ?? 0) + payload.winningPoints,
    mvpScore: (previous?.mvpScore ?? 0) + payload.mvpIncrement,
    lastActiveAt: payload.at,
  };

  players[payload.playerId] = next;
}

function updateTeam(
  teams: DashboardStore["teams"],
  members: Array<{ playerId: string; name: string }>,
  won: boolean
) {
  const key = teamKey(members);
  const label = members.map((member) => member.name).join(" + ");
  const previous = teams[key];

  teams[key] = {
    teamKey: key,
    label,
    wins: (previous?.wins ?? 0) + (won ? 1 : 0),
    losses: (previous?.losses ?? 0) + (won ? 0 : 1),
  };
}

function updateDuo(duos: DashboardStore["duos"], members: Array<{ playerId: string; name: string }>, won: boolean) {
  if (members.length < 2) return;
  const first = members[0];
  const second = members[1];
  const key = duoKeyFromIds(first.playerId, second.playerId);
  const label = duoKeyFromNames(first.name, second.name);
  const previous = duos[key];

  duos[key] = {
    duoKey: key,
    label,
    wins: (previous?.wins ?? 0) + (won ? 1 : 0),
    losses: (previous?.losses ?? 0) + (won ? 0 : 1),
  };
}

export function recordPlayerActivity(playerId: string, name: string, timestamp = Date.now()) {
  mutateStore((previous) => {
    const next = {
      ...previous,
      players: { ...previous.players },
      updatedAt: Date.now(),
    };

    const existing = next.players[playerId];
    next.players[playerId] = {
      playerId,
      name,
      gamesPlayed: existing?.gamesPlayed ?? 0,
      gamesWon: existing?.gamesWon ?? 0,
      gamesLost: existing?.gamesLost ?? 0,
      winningPoints: existing?.winningPoints ?? 0,
      mvpScore: existing?.mvpScore ?? 0,
      lastActiveAt: timestamp,
    };

    return next;
  });
}

export function recordMatchResult(payload: MatchResultPayload) {
  mutateStore((previous) => {
    if (previous.matches[payload.matchId]) return previous;

    const next: DashboardStore = {
      matches: {
        ...previous.matches,
        [payload.matchId]: payload,
      },
      players: { ...previous.players },
      teams: { ...previous.teams },
      duos: { ...previous.duos },
      updatedAt: Date.now(),
    };

    const didTeamAWin = payload.winnerTeam === "A";
    const winners = didTeamAWin ? payload.teamAPlayers : payload.teamBPlayers;
    const losers = didTeamAWin ? payload.teamBPlayers : payload.teamAPlayers;

    winners.forEach((player) => {
      updatePlayer(next.players, {
        playerId: player.playerId,
        name: player.name,
        didWin: true,
        winningPoints: 1,
        mvpIncrement: 8,
        at: payload.endedAt,
      });
    });

    losers.forEach((player) => {
      updatePlayer(next.players, {
        playerId: player.playerId,
        name: player.name,
        didWin: false,
        winningPoints: 0,
        mvpIncrement: 2,
        at: payload.endedAt,
      });
    });

    updateTeam(next.teams, payload.teamAPlayers, didTeamAWin);
    updateTeam(next.teams, payload.teamBPlayers, !didTeamAWin);
    updateDuo(next.duos, payload.teamAPlayers, didTeamAWin);
    updateDuo(next.duos, payload.teamBPlayers, !didTeamAWin);

    return next;
  });
}

function toPlayerRows(store: DashboardStore): PlayerStandingRow[] {
  return Object.values(store.players)
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      gamesPlayed: player.gamesPlayed,
      gamesWon: player.gamesWon,
      gamesLost: player.gamesLost,
      winRate: toWinRate(player.gamesWon, player.gamesPlayed),
      winningPoints: player.winningPoints,
      mvpScore: player.mvpScore,
      lastActiveAt: player.lastActiveAt,
    }))
    .sort((left, right) => {
      if (right.winningPoints !== left.winningPoints) {
        return right.winningPoints - left.winningPoints;
      }
      return right.winRate - left.winRate;
    });
}

function toTeamRows(store: DashboardStore): TeamStandingRow[] {
  return Object.values(store.teams)
    .map((team) => {
      const gamesPlayed = team.wins + team.losses;
      return {
        teamKey: team.teamKey,
        label: team.label,
        gamesPlayed,
        wins: team.wins,
        losses: team.losses,
        winRate: toWinRate(team.wins, gamesPlayed),
      };
    })
    .sort((left, right) => {
      if (right.wins !== left.wins) return right.wins - left.wins;
      return right.winRate - left.winRate;
    });
}

function toDuoHighlights(store: DashboardStore) {
  const duoRows = Object.values(store.duos)
    .map((duo) => {
      const gamesPlayed = duo.wins + duo.losses;
      return {
        duoKey: duo.duoKey,
        label: duo.label,
        wins: duo.wins,
        losses: duo.losses,
        winRate: toWinRate(duo.wins, gamesPlayed),
        gamesPlayed,
      } as DuoHighlight;
    })
    .filter((duo) => duo.gamesPlayed > 0);

  const bestDuo = duoRows
    .filter((duo) => duo.gamesPlayed >= 1)
    .sort((left, right) => {
      if (right.winRate !== left.winRate) return right.winRate - left.winRate;
      return right.gamesPlayed - left.gamesPlayed;
    })[0] ?? null;

  const badDuo = duoRows
    .filter((duo) => duo.gamesPlayed >= 1)
    .sort((left, right) => {
      if (left.winRate !== right.winRate) return left.winRate - right.winRate;
      return right.gamesPlayed - left.gamesPlayed;
    })[0] ?? null;

  return {
    bestDuo,
    badDuo,
  };
}

export function getDashboardSnapshot(): DashboardSnapshot {
  const store = readStore();
  const players = toPlayerRows(store);
  const teamStandings = toTeamRows(store);
  const mvp = [...players].sort((left, right) => right.mvpScore - left.mvpScore);
  const { bestDuo, badDuo } = toDuoHighlights(store);

  const activePlayers = players
    .filter((player) => Date.now() - player.lastActiveAt <= ACTIVE_WINDOW_MS)
    .sort((left, right) => right.lastActiveAt - left.lastActiveAt);

  return {
    players,
    teamStandings,
    mvp,
    bestDuo,
    badDuo,
    activePlayers,
  };
}

export function useDashboardSnapshot() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(() => getDashboardSnapshot());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DASHBOARD_STORAGE_KEY) return;
      setSnapshot(getDashboardSnapshot());
    };

    window.addEventListener("storage", onStorage);

    if (!("BroadcastChannel" in window)) {
      return () => {
        window.removeEventListener("storage", onStorage);
      };
    }

    const channel = new BroadcastChannel(DASHBOARD_CHANNEL);
    channel.onmessage = () => {
      setSnapshot(getDashboardSnapshot());
    };

    return () => {
      channel.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return useMemo(() => snapshot, [snapshot]);
}
