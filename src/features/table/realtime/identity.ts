import type { LocalIdentity } from "./types";

const IDENTITY_STORAGE_KEY = "courtpiece-identity-v1";

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function createRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `player-${Math.random().toString(36).slice(2, 10)}`;
}

export function getStoredIdentity(): LocalIdentity | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(IDENTITY_STORAGE_KEY);
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

  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}
