import { EventEmitter } from "node:events";
import {
  applyBidDecision,
  canCurrentPlayerPass,
  canPlayCard,
  createBiddingState,
  createRoundState,
  dealFullHands,
  defaultGameRules,
  getAllowedBidValues,
  getCurrentTurnPlayerId,
  playCardInRound,
  type BidValue,
  type BiddingState,
  type PlayerState,
} from "@/features/game";
import type { TableRealtimeState } from "@/features/table/realtime/types";
import { cloneHands, toOpeningHands } from "./hands";
import type { ServerGamePlayerSlot, ServerGameState } from "./types";
import { buildGameView } from "./viewMasking";

type ServerBidAction =
  | {
      type: "pass";
    }
  | {
      type: "bid";
      bid: BidValue;
    };

function chooseBotBidAction(state: BiddingState): ServerBidAction {
  const canPass = canCurrentPlayerPass(state);
  if (canPass) {
    return { type: "pass" };
  }

  const allowedBids = getAllowedBidValues(state);
  const firstAllowed = allowedBids[0];
  if (!firstAllowed) {
    return { type: "pass" };
  }

  return {
    type: "bid",
    bid: firstAllowed,
  };
}

function advanceBotBiddingTurns(game: ServerGameState) {
  let nextState = game;

  while (nextState.stage === "bidding") {
    const turnPlayerId = getCurrentTurnPlayerId(nextState.bidding);
    const turnPlayer = nextState.players.find((player) => player.id === turnPlayerId);

    if (!turnPlayer?.isBot) {
      break;
    }

    const botAction = chooseBotBidAction(nextState.bidding);
    const nextBidding = applyBidDecision(nextState.bidding, turnPlayerId, botAction);
    nextState = {
      ...nextState,
      bidding: nextBidding,
      stage: nextBidding.isComplete ? "selecting-trump" : "bidding",
      updatedAt: now(),
    };
  }

  return nextState;
}

function getWinnerOpeningHand(game: ServerGameState) {
  const winnerPlayerId = game.bidding.winnerPlayerId;
  if (!winnerPlayerId) return null;
  return game.openingHands.find((player) => player.id === winnerPlayerId) ?? null;
}

function pickBotTrumpCardId(game: ServerGameState) {
  const winnerHand = getWinnerOpeningHand(game);
  if (!winnerHand || winnerHand.hand.length === 0) return null;
  return winnerHand.hand[0].id;
}

function pickBotPlayableCardId(game: ServerGameState) {
  const round = game.activeRound;
  if (!round) return null;

  const turnPlayer = round.players.find((player) => player.id === round.currentTurnPlayerId);
  if (!turnPlayer || turnPlayer.hand.length === 0) return null;

  const legalCard = turnPlayer.hand.find((card) =>
    canPlayCard(turnPlayer.hand, card, round.currentTrick.leadSuit, defaultGameRules)
  );

  return legalCard?.id ?? null;
}

function applyTrumpSelection(game: ServerGameState, playerId: string, cardId: string) {
  if (game.stage !== "selecting-trump") {
    throw new Error("Trump selection is not active for this game.");
  }

  const winnerPlayerId = game.bidding.winnerPlayerId;
  if (!winnerPlayerId) {
    throw new Error("Cannot select trump before bidding winner is resolved.");
  }

  if (winnerPlayerId !== playerId) {
    throw new Error("Only the bidding winner can select trump.");
  }

  const winnerOpeningHand = game.openingHands.find((player) => player.id === winnerPlayerId);
  if (!winnerOpeningHand) {
    throw new Error("Winner opening hand not found.");
  }

  const selectedCard = winnerOpeningHand.hand.find((card) => card.id === cardId);
  if (!selectedCard) {
    throw new Error("Selected trump card must exist in winner opening hand.");
  }

  const fullHands = cloneHands(game.fullHands);
  const nextRound = createRoundState({
    roundId: game.roundNumber,
    dealerPlayerId: winnerPlayerId,
    firstTurnPlayerId: winnerPlayerId,
    players: fullHands,
    trumpSuit: selectedCard.suit,
  });

  return {
    ...game,
    trumpSuit: selectedCard.suit,
    activeRound: nextRound,
    stage: "playing" as const,
    updatedAt: now(),
  };
}

function applyRoundPlay(game: ServerGameState, playerId: string, cardId: string) {
  if (game.stage !== "playing" || !game.activeRound) {
    throw new Error("Round play is not active for this game.");
  }

  const nextRound = playCardInRound(game.activeRound, playerId, cardId, defaultGameRules);
  return {
    ...game,
    activeRound: nextRound,
    stage: nextRound.isComplete ? ("completed" as const) : game.stage,
    updatedAt: now(),
  };
}

function advanceBotPlayingTurns(game: ServerGameState) {
  let nextState = game;

  while (nextState.stage === "playing" && nextState.activeRound && !nextState.activeRound.isComplete) {
    const turnPlayer = nextState.players.find(
      (player) => player.id === nextState.activeRound?.currentTurnPlayerId
    );

    if (!turnPlayer?.isBot) {
      break;
    }

    const cardId = pickBotPlayableCardId(nextState);
    if (!cardId) {
      break;
    }

    nextState = applyRoundPlay(nextState, turnPlayer.id, cardId);
  }

  return nextState;
}

function autoAdvanceBots(game: ServerGameState) {
  let nextState = advanceBotBiddingTurns(game);

  while (true) {
    if (nextState.stage === "selecting-trump") {
      const winnerPlayer = nextState.players.find((player) => player.id === nextState.bidding.winnerPlayerId);
      if (!winnerPlayer?.isBot) {
        break;
      }

      const trumpCardId = pickBotTrumpCardId(nextState);
      if (!trumpCardId || !nextState.bidding.winnerPlayerId) {
        break;
      }

      nextState = applyTrumpSelection(nextState, nextState.bidding.winnerPlayerId, trumpCardId);
      nextState = advanceBotPlayingTurns(nextState);
      continue;
    }

    if (nextState.stage === "playing") {
      const progressed = advanceBotPlayingTurns(nextState);
      if (progressed === nextState) {
        break;
      }
      nextState = progressed;
      continue;
    }

    break;
  }

  return nextState;
}

function now() {
  return Date.now();
}

function createGameId() {
  return crypto.randomUUID();
}

function teamForSeat(seatNumber: number) {
  return seatNumber % 2 === 1 ? "A" : "B";
}

function buildPlayerSlots(tableState: TableRealtimeState, fillBots: boolean) {
  const seatNumbers = [1, 2, 3, 4] as const;

  const slots: ServerGamePlayerSlot[] = [];

  for (const seatNumber of seatNumbers) {
    const playerId = tableState.seats[seatNumber];
    const member = playerId ? tableState.members[playerId] : null;

    if (member) {
      slots.push({
        id: member.playerId,
        name: member.displayName,
        seat: (seatNumber - 1) as PlayerState["seat"],
        team: teamForSeat(seatNumber),
        isBot: false,
        isConnected: true,
      });
      continue;
    }

    if (!fillBots) {
      continue;
    }

    slots.push({
      id: `bot-seat-${seatNumber}`,
      name: `Bot ${seatNumber}`,
      seat: (seatNumber - 1) as PlayerState["seat"],
      team: teamForSeat(seatNumber),
      isBot: true,
      isConnected: false,
    });
  }

  return slots.sort((left, right) => left.seat - right.seat);
}

function assertStartablePlayers(players: ServerGamePlayerSlot[]) {
  const humanCount = players.filter((player) => !player.isBot).length;

  if (humanCount < 2) {
    throw new Error("At least two seats must be occupied before starting.");
  }

  if (players.length !== 4) {
    throw new Error("Game start requires four occupied seats or bot fill enabled.");
  }
}

class ServerMatchManager {
  private readonly games = new Map<string, ServerGameState>();

  private readonly emitter = new EventEmitter();

  private eventName(tableId: string) {
    return `game:${tableId}`;
  }

  private emitGameUpdate(tableId: string) {
    this.emitter.emit(this.eventName(tableId), this.getGame(tableId));
  }

  startGame(tableState: TableRealtimeState, options?: { fillBots?: boolean }) {
    const existing = this.games.get(tableState.tableId);
    if (existing) {
      return existing;
    }

    const fillBots = options?.fillBots ?? false;
    const players = buildPlayerSlots(tableState, fillBots);
    assertStartablePlayers(players);

    const fullHands = dealFullHands(players);
    const openingHands = toOpeningHands(fullHands);
    const bidding = createBiddingState(players);

    const nextState: ServerGameState = {
      gameId: createGameId(),
      tableId: tableState.tableId,
      createdAt: now(),
      updatedAt: now(),
      stage: "bidding",
      roundNumber: 1,
      players,
      fullHands,
      openingHands,
      bidding,
      trumpSuit: null,
      activeRound: null,
      winnerTeam: null,
    };

    const advanced = autoAdvanceBots(nextState);
    this.games.set(tableState.tableId, advanced);
    this.emitGameUpdate(tableState.tableId);
    return advanced;
  }

  getGame(tableId: string) {
    return this.games.get(tableId) ?? null;
  }

  applyBidAction(tableId: string, playerId: string, action: ServerBidAction) {
    const current = this.games.get(tableId);

    if (!current) {
      throw new Error("Game has not been started for this table yet.");
    }

    if (current.stage !== "bidding") {
      throw new Error("Bidding is not active for this game.");
    }

    const nextBidding = applyBidDecision(current.bidding, playerId, action);
    const nextState: ServerGameState = {
      ...current,
      bidding: nextBidding,
      stage: nextBidding.isComplete ? "selecting-trump" : current.stage,
      updatedAt: now(),
    };

    const advanced = autoAdvanceBots(nextState);
    this.games.set(tableId, advanced);
    this.emitGameUpdate(tableId);
    return advanced;
  }

  selectTrump(tableId: string, playerId: string, cardId: string) {
    const current = this.games.get(tableId);

    if (!current) {
      throw new Error("Game has not been started for this table yet.");
    }

    const nextState = applyTrumpSelection(current, playerId, cardId);
    const advanced = autoAdvanceBots(nextState);
    this.games.set(tableId, advanced);
    this.emitGameUpdate(tableId);
    return advanced;
  }

  playCard(tableId: string, playerId: string, cardId: string) {
    const current = this.games.get(tableId);

    if (!current) {
      throw new Error("Game has not been started for this table yet.");
    }

    const nextState = applyRoundPlay(current, playerId, cardId);
    const advanced = autoAdvanceBots(nextState);
    this.games.set(tableId, advanced);
    this.emitGameUpdate(tableId);
    return advanced;
  }

  getGameView(tableId: string, viewerPlayerId: string) {
    const game = this.games.get(tableId);
    if (!game) return null;

    return buildGameView(game, viewerPlayerId);
  }

  subscribe(tableId: string, listener: (game: ServerGameState | null) => void) {
    const event = this.eventName(tableId);
    this.emitter.on(event, listener);

    return () => {
      this.emitter.off(event, listener);
    };
  }
}

declare global {
  var courtpieceServerMatchManager: ServerMatchManager | undefined;
}

export function getServerMatchManager() {
  if (!globalThis.courtpieceServerMatchManager) {
    globalThis.courtpieceServerMatchManager = new ServerMatchManager();
  }

  return globalThis.courtpieceServerMatchManager;
}