import { ranksLowToHigh, suits } from "../constants";
import type { Card } from "../types";

export function createStandardDeck(): Card[] {
  return suits.flatMap((suit) =>
    ranksLowToHigh.map((rank) => ({
      id: `${rank}-${suit}`,
      suit,
      rank,
    }))
  );
}

export function shuffleDeck(cards: Card[], random = Math.random): Card[] {
  const clone = [...cards];
  const hasCrypto =
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function";

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = hasCrypto
      ? secureRandomIndex(index + 1)
      : Math.floor(random() * (index + 1));
    const temp = clone[index];
    clone[index] = clone[swapIndex];
    clone[swapIndex] = temp;
  }

  return clone;
}

function secureRandomIndex(maxExclusive: number): number {
  if (maxExclusive <= 0) {
    throw new Error("maxExclusive must be greater than zero.");
  }

  const maxUint32 = 0x1_0000_0000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const buffer = new Uint32Array(1);

  while (true) {
    globalThis.crypto.getRandomValues(buffer);

    if (buffer[0] < limit) {
      return buffer[0] % maxExclusive;
    }
  }
}
