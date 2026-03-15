import type { LocalIdentity, SeatNumber, TableMember, TableRealtimeState, TableSeats } from "./types";

const CHANNEL_PREFIX = "courtpiece-table-sync";
const TABLE_STORAGE_PREFIX = "courtpiece-table-state";

const defaultSeats: TableSeats = {
  1: null,
  2: null,
  3: null,
  4: null,
};

const seatNumbers: SeatNumber[] = [1, 2, 3, 4];

function now() {
  return Date.now();
}

function getStorageKey(tableId: string) {
  return `${TABLE_STORAGE_PREFIX}:${tableId}`;
}

function buildDefaultState(tableId: string): TableRealtimeState {
  return {
    tableId,
    seats: { ...defaultSeats },
    members: {},
    updatedAt: now(),
  };
}

export function tableChannelName(tableId: string) {
  return `${CHANNEL_PREFIX}:${tableId}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readTableState(tableId: string): TableRealtimeState {
  if (!canUseStorage()) return buildDefaultState(tableId);

  const raw = window.localStorage.getItem(getStorageKey(tableId));
  if (!raw) return buildDefaultState(tableId);

  try {
    const parsed = JSON.parse(raw) as TableRealtimeState;
    return {
      tableId,
      seats: { ...defaultSeats, ...parsed.seats },
      members: parsed.members ?? {},
      updatedAt: parsed.updatedAt ?? now(),
    };
  } catch {
    return buildDefaultState(tableId);
  }
}

function writeTableState(state: TableRealtimeState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(getStorageKey(state.tableId), JSON.stringify(state));
}

function broadcastState(state: TableRealtimeState) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

  const channel = new BroadcastChannel(tableChannelName(state.tableId));
  channel.postMessage(state);
  channel.close();
}

function mutateState(tableId: string, mutator: (previous: TableRealtimeState) => TableRealtimeState) {
  const previous = readTableState(tableId);
  const next = mutator(previous);
  writeTableState(next);
  broadcastState(next);
  return next;
}

export function upsertTableMember(tableId: string, identity: LocalIdentity) {
  return mutateState(tableId, (previous) => {
    const existing = previous.members[identity.playerId];
    const member: TableMember = {
      playerId: identity.playerId,
      displayName: identity.displayName,
      joinedAt: existing?.joinedAt ?? now(),
      lastSeenAt: now(),
    };

    return {
      ...previous,
      members: {
        ...previous.members,
        [identity.playerId]: member,
      },
      updatedAt: now(),
    };
  });
}

export function touchTableMember(tableId: string, playerId: string) {
  return mutateState(tableId, (previous) => {
    const existing = previous.members[playerId];
    if (!existing) return previous;

    return {
      ...previous,
      members: {
        ...previous.members,
        [playerId]: {
          ...existing,
          lastSeenAt: now(),
        },
      },
      updatedAt: now(),
    };
  });
}

export function claimSeatForPlayer(tableId: string, playerId: string, seat: SeatNumber) {
  let success = false;

  const state = mutateState(tableId, (previous) => {
    const takenBy = previous.seats[seat];
    if (takenBy && takenBy !== playerId) {
      success = false;
      return previous;
    }

    const nextSeats: TableSeats = { ...previous.seats };
    seatNumbers.forEach((seatNo) => {
      if (nextSeats[seatNo] === playerId) {
        nextSeats[seatNo] = null;
      }
    });

    nextSeats[seat] = playerId;
    success = true;

    return {
      ...previous,
      seats: nextSeats,
      updatedAt: now(),
    };
  });

  return {
    success,
    state,
  };
}

export function releaseSeatForPlayer(tableId: string, playerId: string) {
  return mutateState(tableId, (previous) => {
    const nextSeats: TableSeats = { ...previous.seats };

    seatNumbers.forEach((seatNo) => {
      if (nextSeats[seatNo] === playerId) {
        nextSeats[seatNo] = null;
      }
    });

    return {
      ...previous,
      seats: nextSeats,
      updatedAt: now(),
    };
  });
}

export function getSeatNameMap(state: TableRealtimeState): Record<number, string> {
  const result: Record<number, string> = {};

  seatNumbers.forEach((seatNo) => {
    const playerId = state.seats[seatNo];
    if (!playerId) return;

    const member = state.members[playerId];
    if (!member) return;

    result[Number(seatNo)] = member.displayName;
  });

  return result;
}
