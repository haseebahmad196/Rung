import { EventEmitter } from "node:events";
import type { LocalIdentity, SeatNumber, TableMember, TableRealtimeState } from "../types";

const seatNumbers: SeatNumber[] = [1, 2, 3, 4];
const PLAYER_STALE_MS = 30_000;

function now() {
  return Date.now();
}

function createDefaultState(tableId: string): TableRealtimeState {
  return {
    tableId,
    seats: {
      1: null,
      2: null,
      3: null,
      4: null,
    },
    members: {},
    updatedAt: now(),
  };
}

function cloneState(state: TableRealtimeState): TableRealtimeState {
  return {
    tableId: state.tableId,
    seats: { ...state.seats },
    members: Object.fromEntries(
      Object.entries(state.members).map(([playerId, member]) => [playerId, { ...member }])
    ),
    updatedAt: state.updatedAt,
  };
}

function createPlayerId() {
  return crypto.randomUUID();
}

class PresenceStore {
  private readonly tables = new Map<string, TableRealtimeState>();

  private readonly emitter = new EventEmitter();

  private getTable(tableId: string) {
    const existing = this.tables.get(tableId);
    if (existing) return existing;

    const created = createDefaultState(tableId);
    this.tables.set(tableId, created);
    return created;
  }

  private emitTableUpdate(tableId: string) {
    this.emitter.emit(this.eventName(tableId), this.getSnapshot(tableId));
  }

  private eventName(tableId: string) {
    return `table:${tableId}`;
  }

  private cleanupStaleMembers(tableId: string) {
    const table = this.getTable(tableId);
    const threshold = now() - PLAYER_STALE_MS;

    const stalePlayerIds = Object.values(table.members)
      .filter((member) => member.lastSeenAt < threshold)
      .map((member) => member.playerId);

    if (stalePlayerIds.length === 0) return;

    stalePlayerIds.forEach((playerId) => {
      delete table.members[playerId];
      seatNumbers.forEach((seatNo) => {
        if (table.seats[seatNo] === playerId) {
          table.seats[seatNo] = null;
        }
      });
    });

    table.updatedAt = now();
    this.emitTableUpdate(tableId);
  }

  getSnapshot(tableId: string) {
    this.cleanupStaleMembers(tableId);
    return cloneState(this.getTable(tableId));
  }

  join(tableId: string, payload: { displayName: string; playerId?: string | null }) {
    const table = this.getTable(tableId);
    const existingById = payload.playerId ? table.members[payload.playerId] : null;
    const playerId = existingById?.playerId ?? payload.playerId ?? createPlayerId();

    const member: TableMember = {
      playerId,
      displayName: payload.displayName,
      joinedAt: existingById?.joinedAt ?? now(),
      lastSeenAt: now(),
    };

    table.members[playerId] = member;
    table.updatedAt = now();

    this.cleanupStaleMembers(tableId);
    this.emitTableUpdate(tableId);

    const identity: LocalIdentity = {
      playerId,
      displayName: member.displayName,
      createdAt: member.joinedAt,
      updatedAt: now(),
    };

    return {
      identity,
      state: cloneState(table),
    };
  }

  heartbeat(tableId: string, playerId: string) {
    const table = this.getTable(tableId);
    const member = table.members[playerId];
    if (!member) return { ok: false, state: this.getSnapshot(tableId) };

    table.members[playerId] = {
      ...member,
      lastSeenAt: now(),
    };
    table.updatedAt = now();
    this.emitTableUpdate(tableId);

    return {
      ok: true,
      state: cloneState(table),
    };
  }

  claimSeat(tableId: string, playerId: string, seat: SeatNumber) {
    const table = this.getTable(tableId);
    if (!table.members[playerId]) {
      return {
        success: false,
        reason: "Player is not joined to this table",
        state: this.getSnapshot(tableId),
      };
    }

    const takenBy = table.seats[seat];
    if (takenBy && takenBy !== playerId) {
      return {
        success: false,
        reason: "Seat already taken",
        state: this.getSnapshot(tableId),
      };
    }

    seatNumbers.forEach((seatNo) => {
      if (table.seats[seatNo] === playerId) {
        table.seats[seatNo] = null;
      }
    });

    table.seats[seat] = playerId;
    table.updatedAt = now();
    this.emitTableUpdate(tableId);

    return {
      success: true,
      state: cloneState(table),
    };
  }

  releaseSeat(tableId: string, playerId: string) {
    const table = this.getTable(tableId);

    seatNumbers.forEach((seatNo) => {
      if (table.seats[seatNo] === playerId) {
        table.seats[seatNo] = null;
      }
    });

    table.updatedAt = now();
    this.emitTableUpdate(tableId);

    return cloneState(table);
  }

  subscribe(tableId: string, listener: (nextState: TableRealtimeState) => void) {
    const event = this.eventName(tableId);
    this.emitter.on(event, listener);

    return () => {
      this.emitter.off(event, listener);
    };
  }
}

declare global {
  var courtpiecePresenceStore: PresenceStore | undefined;
}

export function getPresenceStore() {
  if (!globalThis.courtpiecePresenceStore) {
    globalThis.courtpiecePresenceStore = new PresenceStore();
  }

  return globalThis.courtpiecePresenceStore;
}
