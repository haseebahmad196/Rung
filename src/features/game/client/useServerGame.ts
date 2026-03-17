"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchServerGame } from "./serverGameApi";
import type { ServerGameSnapshot } from "./serverGameTypes";

type UseServerGameParams = {
  tableId: string;
  playerId: string | null;
};

export function useServerGame({ tableId, playerId }: UseServerGameParams) {
  const [game, setGame] = useState<ServerGameSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSnapshotAtRef = useRef(0);
  const lastStreamEventAtRef = useRef(0);

  const applySnapshot = useCallback((nextGame: ServerGameSnapshot | null) => {
    setGame((current) => {
      if (!nextGame) {
        lastSnapshotAtRef.current = 0;
        return null;
      }

      if (!current) {
        lastSnapshotAtRef.current = nextGame.updatedAt;
        return nextGame;
      }

      if (nextGame.updatedAt >= current.updatedAt) {
        lastSnapshotAtRef.current = nextGame.updatedAt;
        return nextGame;
      }

      return current;
    });
  }, []);

  useEffect(() => {
    setGame(null);
    setError(null);
    lastSnapshotAtRef.current = 0;
    lastStreamEventAtRef.current = 0;
  }, [tableId, playerId]);

  useEffect(() => {
    if (!playerId) return;

    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const nextGame = await fetchServerGame(tableId, playerId);
        if (!active) return;
        applySnapshot(nextGame);
        lastStreamEventAtRef.current = Date.now();
        setError(null);
      } catch (nextError) {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to fetch game state.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [tableId, playerId, applySnapshot]);

  useEffect(() => {
    if (!playerId) return;

    const eventSource = new EventSource(
      `/api/realtime/stream?tableId=${encodeURIComponent(tableId)}&playerId=${encodeURIComponent(playerId)}`
    );

    eventSource.addEventListener("game", (event) => {
      const message = event as MessageEvent<string>;

      try {
        const nextGame = JSON.parse(message.data) as ServerGameSnapshot | null;
        applySnapshot(nextGame);
        lastStreamEventAtRef.current = Date.now();
        setError(null);
      } catch {
        // Ignore malformed stream payloads.
      }
    });

    eventSource.onerror = () => {
      setError((current) => current ?? "Realtime game connection dropped.");
    };

    return () => {
      eventSource.close();
    };
  }, [tableId, playerId, applySnapshot]);

  useEffect(() => {
    if (!playerId) return;

    let active = true;

    const sync = async () => {
      const streamQuietFor = Date.now() - lastStreamEventAtRef.current;
      if (lastStreamEventAtRef.current !== 0 && streamQuietFor < 5000) {
        return;
      }

      try {
        const nextGame = await fetchServerGame(tableId, playerId);
        if (!active) return;
        if (nextGame && nextGame.updatedAt >= lastSnapshotAtRef.current) {
          applySnapshot(nextGame);
        }
      } catch {
        // Keep stream-driven updates as primary source if polling fails.
      }
    };

    const timer = setInterval(() => {
      void sync();
    }, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tableId, playerId, applySnapshot]);

  return useMemo(
    () => ({
      game,
      loading,
      error,
      setGame,
      setError,
    }),
    [error, game, loading]
  );
}
