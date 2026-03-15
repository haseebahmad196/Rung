"use client";

import { useEffect, useMemo, useState } from "react";
import { recordPlayerActivity } from "./stats";
import {
  claimSeatForPlayer,
  getSeatNameMap,
  readTableState,
  releaseSeatForPlayer,
  tableChannelName,
  touchTableMember,
  upsertTableMember,
} from "./tableState";
import type { LocalIdentity, SeatNumber, TableRealtimeState } from "./types";

type UseRealtimeTableParams = {
  tableId: string;
  identity: LocalIdentity | null;
};

export function useRealtimeTable({ tableId, identity }: UseRealtimeTableParams) {
  const [state, setState] = useState<TableRealtimeState>(() => readTableState(tableId));

  useEffect(() => {
    setState(readTableState(tableId));
  }, [tableId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (!event.key || !event.key.endsWith(`:${tableId}`)) return;
      setState(readTableState(tableId));
    };

    window.addEventListener("storage", onStorage);

    if (!("BroadcastChannel" in window)) {
      return () => window.removeEventListener("storage", onStorage);
    }

    const channel = new BroadcastChannel(tableChannelName(tableId));
    channel.onmessage = (event: MessageEvent<TableRealtimeState>) => {
      setState(event.data);
    };

    return () => {
      channel.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [tableId]);

  useEffect(() => {
    if (!identity) return;

    const next = upsertTableMember(tableId, identity);
    setState(next);
    recordPlayerActivity(identity.playerId, identity.displayName, Date.now());

    const timer = window.setInterval(() => {
      const updated = touchTableMember(tableId, identity.playerId);
      setState(updated);
      recordPlayerActivity(identity.playerId, identity.displayName, Date.now());
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, [tableId, identity]);

  const selectedSeat = useMemo(() => {
    if (!identity) return null;

    const hit = (Object.entries(state.seats) as Array<[string, string | null]>).find(
      ([, playerId]) => playerId === identity.playerId
    );

    return hit ? Number(hit[0]) : null;
  }, [identity, state.seats]);

  const takenSeatNames = useMemo(() => getSeatNameMap(state), [state]);

  const claimSeat = (seat: number) => {
    if (!identity) return false;

    const next = claimSeatForPlayer(tableId, identity.playerId, seat as SeatNumber);
    setState(next.state);
    recordPlayerActivity(identity.playerId, identity.displayName, Date.now());
    return next.success;
  };

  const releaseSeat = () => {
    if (!identity) return;
    const next = releaseSeatForPlayer(tableId, identity.playerId);
    setState(next);
  };

  return {
    tableState: state,
    takenSeatNames,
    selectedSeat,
    claimSeat,
    releaseSeat,
  };
}
