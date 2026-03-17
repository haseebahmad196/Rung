"use client";

import { useEffect, useMemo, useState } from "react";
import { recordPlayerActivity } from "./stats";
import { getSeatNameMap } from "./tableState";
import type { LocalIdentity, TableRealtimeState } from "./types";

type UseRealtimeTableParams = {
  tableId: string;
  identity: LocalIdentity | null;
};

function createEmptyState(tableId: string): TableRealtimeState {
  return {
    tableId,
    seats: {
      1: null,
      2: null,
      3: null,
      4: null,
    },
    members: {},
    updatedAt: Date.now(),
  };
}

async function postJson<TResponse>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as TResponse;
}

export function useRealtimeTable({ tableId, identity }: UseRealtimeTableParams) {
  const [state, setState] = useState<TableRealtimeState>(() => createEmptyState(tableId));

  useEffect(() => {
    setState(createEmptyState(tableId));
  }, [tableId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const response = await fetch(`/api/realtime/table?tableId=${encodeURIComponent(tableId)}`, {
        cache: "no-store",
      });

      if (!response.ok || !active) return;

      const data = (await response.json()) as { state: TableRealtimeState };
      setState(data.state);
    };

    void load();

    return () => {
      active = false;
    };
  }, [tableId]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/realtime/stream?tableId=${encodeURIComponent(tableId)}`);

    eventSource.addEventListener("state", (event) => {
      const message = event as MessageEvent<string>;

      try {
        const next = JSON.parse(message.data) as TableRealtimeState;
        setState(next);
      } catch {
        // ignore malformed payloads
      }
    });

    return () => {
      eventSource.close();
    };
  }, [tableId]);

  useEffect(() => {
    if (!identity) return;

    let active = true;

    const join = async () => {
      const data = await postJson<{ state: TableRealtimeState }>("/api/realtime/join", {
        tableId,
        displayName: identity.displayName,
        playerId: identity.playerId,
      });

      if (!data || !active) return;

      setState(data.state);
      recordPlayerActivity(identity.playerId, identity.displayName, Date.now());
    };

    void join();

    const timer = window.setInterval(() => {
      void postJson<{ state: TableRealtimeState }>("/api/realtime/heartbeat", {
        tableId,
        playerId: identity.playerId,
      });

      recordPlayerActivity(identity.playerId, identity.displayName, Date.now());
    }, 10000);

    return () => {
      active = false;
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

  const claimSeat = async (seat: number) => {
    if (!identity) return false;

    const memberExists = Boolean(state.members[identity.playerId]);
    if (!memberExists) {
      const joined = await postJson<{ state: TableRealtimeState }>("/api/realtime/join", {
        tableId,
        displayName: identity.displayName,
        playerId: identity.playerId,
      });

      if (!joined) return false;
      setState(joined.state);
    }

    const next = await postJson<{ success: boolean; state: TableRealtimeState }>(
      "/api/realtime/seat/claim",
      {
        tableId,
        playerId: identity.playerId,
        seat,
      }
    );

    if (!next) return false;

    setState(next.state);
    recordPlayerActivity(identity.playerId, identity.displayName, Date.now());
    return next.success;
  };

  const releaseSeat = async () => {
    if (!identity) return;

    const next = await postJson<{ state: TableRealtimeState }>("/api/realtime/seat/release", {
      tableId,
      playerId: identity.playerId,
    });

    if (!next) return;
    setState(next.state);
  };

  return {
    tableState: state,
    takenSeatNames,
    selectedSeat,
    claimSeat,
    releaseSeat,
  };
}
