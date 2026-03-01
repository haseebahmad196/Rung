"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { getTableByLink, seedChatByTable } from "@/features/table/data";
import { SeatRing } from "@/features/table/components/SeatRing";
import { TableChatPanel } from "@/features/table/components/TableChatPanel";
import { TableNavbar } from "@/features/table/components/TableNavbar";
import { JoinGateCard } from "@/features/table/components/JoinGateCard";
import { RulesPanel } from "@/features/table/components/RulesPanel";
import { GameStartPresetPanel } from "@/features/game/components/GameStartPresetPanel";
import type { Card as GameCard } from "@/features/game";

export default function Home() {
  const searchParams = useSearchParams();
  const [nameInput, setNameInput] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [tableTrumpCard, setTableTrumpCard] = useState<GameCard | null>(null);

  const tableId = searchParams.get("table") ?? searchParams.get("t");
  const selectedTable = useMemo(() => getTableByLink(tableId), [tableId]);
  const selectedTableTakenSeats = useMemo(
    () => selectedTable.seatsTaken,
    [selectedTable.seatsTaken]
  );

  const canEnterLobby = nameInput.trim().length > 1;

  const enterLobby = () => {
    if (!canEnterLobby) return;
    setPlayerName(nameInput.trim());
  };

  const seatPlayer = (seatId: number) => {
    if (selectedTableTakenSeats[seatId]) return;
    setSelectedSeat(seatId);
    setTableTrumpCard(null);
  };

  const goHome = () => {
    setPlayerName("");
    setSelectedSeat(null);
    setShowRules(false);
    setTableTrumpCard(null);
  };

  const trumpSymbol =
    tableTrumpCard?.suit === "spades"
      ? "♠"
      : tableTrumpCard?.suit === "hearts"
      ? "♥"
      : tableTrumpCard?.suit === "diamonds"
      ? "♦"
      : tableTrumpCard?.suit === "clubs"
      ? "♣"
      : "";

  const trumpLabel =
    tableTrumpCard?.suit === "spades"
      ? "Spades"
      : tableTrumpCard?.suit === "hearts"
      ? "Hearts"
      : tableTrumpCard?.suit === "diamonds"
      ? "Diamonds"
      : tableTrumpCard?.suit === "clubs"
      ? "Clubs"
      : "";

  const trumpTextColorClass =
    tableTrumpCard?.suit === "hearts" || tableTrumpCard?.suit === "diamonds"
      ? "text-red-300"
      : "text-zinc-100";

  const focusJoin = () => {
    const input = document.getElementById("join-name-input") as HTMLInputElement | null;
    input?.focus();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgb(91_14_23),rgb(12_6_8)_40%,rgb(0_0_0)_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 left-4 text-7xl text-red-400/10">♠</div>
        <div className="absolute top-20 right-6 text-6xl text-red-300/10">♥</div>
        <div className="absolute bottom-16 left-8 text-6xl text-red-500/10">♦</div>
        <div className="absolute bottom-8 right-5 text-7xl text-red-400/10">♣</div>
      </div>

      <Container className="relative max-w-7xl px-3 py-4 sm:px-4 sm:py-8">
        <TableNavbar
          isMuted={isMuted}
          showMenu={showMenu}
          onToggleMenu={() => setShowMenu((prev) => !prev)}
          onHome={goHome}
          onJoinFocus={focusJoin}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          statusText={
            selectedSeat
              ? `${playerName} selected seat ${selectedSeat} at ${selectedTable.id}.`
              : `Select an open seat at ${selectedTable.id} to continue.`
          }
          onCloseMenu={() => setShowMenu(false)}
        />

        {!playerName ? (
          <JoinGateCard
            tableId={selectedTable.id}
            nameInput={nameInput}
            canEnterLobby={canEnterLobby}
            onNameChange={setNameInput}
            onEnterLobby={enterLobby}
          />
        ) : (
          <div className="space-y-4">
            <Card className="relative border-transparent bg-[linear-gradient(135deg,rgba(40,6,10,0.55),rgba(0,0,0,0.6))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-7">
              <RulesPanel
                showRules={showRules}
                onToggleRules={() => setShowRules((prev) => !prev)}
              />

              <SeatRing
                title={selectedTable.title}
                selectedSeat={selectedSeat}
                playerName={playerName}
                takenSeats={selectedTableTakenSeats}
                onSeatSelect={seatPlayer}
              />

              {tableTrumpCard ? (
                <div className="pointer-events-none absolute left-2 top-[73%] z-20 -translate-y-1/2 text-center sm:left-4 sm:top-[70%]">
                  <div className="flex w-[64px] flex-col items-center rounded-xl border border-red-800/90 bg-[linear-gradient(145deg,rgba(16,16,20,0.92),rgba(0,0,0,0.96))] px-2 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.5)] sm:w-[72px]">
                    <span className={`text-2xl font-black leading-none sm:text-3xl ${trumpTextColorClass}`}>
                      {trumpSymbol}
                    </span>
                    <span className={`mt-1 text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px] ${trumpTextColorClass}`}>
                      {trumpLabel}
                    </span>
                  </div>
                </div>
              ) : null}

              {tableTrumpCard ? (
                <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-red-500/85 bg-[linear-gradient(145deg,rgba(130,16,28,0.9),rgba(18,8,10,0.95))] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-red-100 shadow-[0_10px_24px_rgba(0,0,0,0.45)] sm:top-4 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.14em]">
                  Rung Courtpiece
                </div>
              ) : null}

              {selectedSeat && !tableTrumpCard ? (
                <div className="absolute inset-0 z-30 grid place-items-center p-2 sm:p-3">
                  <div className="max-h-[82%] w-full overflow-auto px-1 sm:max-h-[88%] sm:w-[min(96%,48rem)]">
                    <GameStartPresetPanel
                      localPlayerName={playerName}
                      localSeatNumber={selectedSeat}
                      takenSeats={selectedTableTakenSeats}
                      onTrumpSelected={setTableTrumpCard}
                    />
                  </div>
                </div>
              ) : null}
            </Card>

            <TableChatPanel
              tableId={selectedTable.id}
              playerName={playerName}
              selectedSeat={selectedSeat}
              seedMessages={seedChatByTable[selectedTable.id] ?? []}
            />
          </div>
        )}
      </Container>
    </main>
  );
}