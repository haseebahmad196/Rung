import type {
  BidValue,
  BiddingState,
  PlayerId,
  PlayerState,
} from "../types";

type BidDecision =
  | {
      type: "pass";
    }
  | {
      type: "bid";
      bid: BidValue;
    };

function bySeatOrder(players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>) {
  return [...players].sort((left, right) => left.seat - right.seat);
}

export function createBiddingState(
  players: Array<Pick<PlayerState, "id" | "name" | "seat" | "team">>
): BiddingState {
  if (players.length !== 4) {
    throw new Error("Bidding requires exactly 4 players.");
  }

  const ordered = bySeatOrder(players);
  const starterOffset = 0;
  const turnOrder = ordered
    .slice(starterOffset)
    .concat(ordered.slice(0, starterOffset))
    .map((player) => player.id);

  return {
    players: ordered,
    turnOrder,
    currentTurnOffset: 0,
    starterPlayerId: turnOrder[0],
    highestBid: null,
    passesSinceLastBid: 0,
    passesWithoutBid: 0,
    history: [],
    isComplete: false,
    winnerPlayerId: null,
  };
}

export function getCurrentTurnPlayerId(state: BiddingState): PlayerId {
  if (state.currentTurnOffset >= state.turnOrder.length) {
    return state.turnOrder[state.turnOrder.length - 1];
  }
  return state.turnOrder[state.currentTurnOffset];
}

export function getCurrentPlayer(state: BiddingState) {
  const playerId = getCurrentTurnPlayerId(state);
  return state.players.find((player) => player.id === playerId) ?? null;
}

export function canCurrentPlayerPass(state: BiddingState): boolean {
  if (state.highestBid) return true;
  return state.passesWithoutBid < 3;
}

export function getAllowedBidValues(state: BiddingState): BidValue[] {
  if (!state.highestBid) {
    if (state.passesWithoutBid >= 3) {
      return [7];
    }
    return [9, 11, 13];
  }

  if (state.highestBid.bid === 9) return [11, 13];
  if (state.highestBid.bid === 11) return [13];
  return [];
}

export function applyBidDecision(
  state: BiddingState,
  playerId: PlayerId,
  decision: BidDecision
): BiddingState {
  if (state.isComplete) {
    throw new Error("Bidding is already complete.");
  }

  if (getCurrentTurnPlayerId(state) !== playerId) {
    throw new Error("It is not this player's bidding turn.");
  }

  if (decision.type === "pass") {
    if (!canCurrentPlayerPass(state)) {
      throw new Error("Current player cannot pass at this step.");
    }

    const passesSinceLastBid = state.passesSinceLastBid + 1;
    const passesWithoutBid = state.passesWithoutBid + 1;

    const nextOffset = state.currentTurnOffset + 1;

    if (state.highestBid && (passesSinceLastBid >= 3 || nextOffset >= state.turnOrder.length)) {
      return {
        ...state,
        history: [...state.history, { playerId, action: "pass" }],
        passesSinceLastBid,
        passesWithoutBid,
        currentTurnOffset: nextOffset,
        isComplete: true,
        winnerPlayerId: state.highestBid.playerId,
      };
    }

    return {
      ...state,
      history: [...state.history, { playerId, action: "pass" }],
      passesSinceLastBid,
      passesWithoutBid,
      currentTurnOffset: nextOffset,
    };
  }

  const allowedBids = getAllowedBidValues(state);
  if (!allowedBids.includes(decision.bid)) {
    throw new Error("This bid is not allowed at current step.");
  }

  const nextHighest = {
    playerId,
    bid: decision.bid,
  };

  const isTerminalBid = decision.bid === 13 || decision.bid === 7;
  const nextOffset = state.currentTurnOffset + 1;

  const shouldComplete =
    isTerminalBid || nextOffset >= state.turnOrder.length;

  return {
    ...state,
    highestBid: nextHighest,
    history: [
      ...state.history,
      {
        playerId,
        action: "bid",
        bid: decision.bid,
      },
    ],
    passesSinceLastBid: 0,
    passesWithoutBid: 0,
    currentTurnOffset: shouldComplete ? nextOffset : nextOffset,
    isComplete: shouldComplete,
    winnerPlayerId: shouldComplete ? nextHighest.playerId : null,
  };
}
