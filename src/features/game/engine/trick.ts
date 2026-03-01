import type { Card, GameRules, Suit, TrickPlay, TrickState } from "../types";

function rankValue(card: Card, rules: GameRules): number {
  return rules.rankOrderLowToHigh.indexOf(card.rank);
}

export function canPlayCard(
  hand: Card[],
  card: Card,
  leadSuit: Suit | null,
  rules: GameRules
): boolean {
  const hasCard = hand.some((item) => item.id === card.id);
  if (!hasCard) return false;

  if (!rules.mustFollowSuit || !leadSuit) return true;

  const hasLeadSuit = hand.some((item) => item.suit === leadSuit);
  if (!hasLeadSuit) return true;

  return card.suit === leadSuit;
}

export function buildNextTrickState(
  current: TrickState,
  play: TrickPlay,
  trumpSuit: Suit | null,
  rules: GameRules
): TrickState {
  const leadSuit = current.leadSuit ?? play.card.suit;
  const plays = [...current.plays, play];
  const winnerPlayerId = plays.length === 4 ? getTrickWinner(plays, leadSuit, trumpSuit, rules) : null;

  return {
    leadSuit,
    plays,
    winnerPlayerId,
  };
}

export function getTrickWinner(
  plays: TrickPlay[],
  leadSuit: Suit,
  trumpSuit: Suit | null,
  rules: GameRules
): string {
  if (plays.length === 0) {
    throw new Error("Cannot resolve winner with empty plays.");
  }

  const trumpCards = trumpSuit
    ? plays.filter((play) => play.card.suit === trumpSuit)
    : [];
  const candidates = trumpCards.length > 0 ? trumpCards : plays.filter((play) => play.card.suit === leadSuit);

  return candidates.reduce((best, next) =>
    rankValue(next.card, rules) > rankValue(best.card, rules) ? next : best
  ).playerId;
}
