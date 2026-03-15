import type { LocalIdentity } from "./types";

const IDENTITY_STORAGE_KEY = "courtpiece-identity-v1";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `player-${Math.random().toString(36).slice(2, 10)}`;
}

export function getStoredIdentity(): LocalIdentity | null {
  if (!canUseBrowserStorage()) return null;

  const raw = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalIdentity;
  } catch {
    return null;
  }
}

export function saveIdentity(displayName: string): LocalIdentity {
  const now = Date.now();
  const previous = getStoredIdentity();

  const next: LocalIdentity = {
    playerId: previous?.playerId ?? createRandomId(),
    displayName,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}
