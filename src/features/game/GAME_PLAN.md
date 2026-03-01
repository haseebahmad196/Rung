# Court Piece Game Plan (Modular)

## Architecture Decision

- Authoritative logic should run on backend service.
- Frontend should only render state and send user intents.
- Shared types and pure engine functions can be reused by backend and frontend.

## Phase 1: Rules Lock

- Finalize card rank order.
- Finalize trump behavior.
- Finalize trick winner rules.
- Finalize round score and game-end conditions.

Deliverable:

- A fixed `GameRules` object versioned as v1.

## Phase 2: Engine Core

- Deck creation and shuffle.
- Deal to four players.
- Card legality checks.
- Trick winner resolver.
- Round progression reducer.

Deliverable:

- Pure deterministic engine with zero UI dependencies.

## Phase 3: State Contract

- Define transport-safe payloads for:
  - Join table
  - Start round
  - Play card
  - Round end
  - Game end

Deliverable:

- Typed event contract and shared DTOs.

## Phase 4: Multiplayer Backend

- Host/room lifecycle.
- Authoritative turn validation.
- Broadcast state updates.
- Reconnect and resync logic.

Deliverable:

- Backend game session manager with server-validated actions.

## Phase 5: Frontend Gameplay UI

- Card visuals.
- Hand interaction.
- Turn indicators.
- Trick animation.
- Scoreboard and round tracker.

Deliverable:

- Frontend that consumes backend state only.

## Phase 6: Hardening

- Edge-case tests for legality and winner logic.
- Latency and reconnect behavior tests.
- Abuse/invalid action handling.

Deliverable:

- Stable production-ready gameplay flow.
