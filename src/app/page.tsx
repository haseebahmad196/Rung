"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { getTableByLink } from "@/features/table/data";
import { TableNavbar } from "@/features/table/components/TableNavbar";
import { JoinGateCard } from "@/features/table/components/JoinGateCard";
import { RulesPanel } from "@/features/table/components/RulesPanel";
import { getStoredIdentity, saveIdentity, useRealtimeTable } from "@/features/table/realtime";
import type { LocalIdentity } from "@/features/table/realtime";
import { GameStartPresetPanel } from "@/features/game/components/GameStartPresetPanel";

function HomeContent() {
  const searchParams = useSearchParams();
  const [nameInput, setNameInput] = useState("");
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const tableId = searchParams.get("table") ?? searchParams.get("t");
  const selectedTable = useMemo(() => getTableByLink(tableId), [tableId]);
  const playerName = identity?.displayName ?? "";
  const { takenSeatNames, selectedSeat, claimSeat, releaseSeat } = useRealtimeTable({
    tableId: selectedTable.id,
    identity,
  });

  const seat1 = takenSeatNames[1] ?? null;
  const seat2 = takenSeatNames[2] ?? null;
  const seat3 = takenSeatNames[3] ?? null;
  const seat4 = takenSeatNames[4] ?? null;

  const stableTakenSeatNames = useMemo(() => {
    const next: Record<number, string> = {};
    if (seat1) next[1] = seat1;
    if (seat2) next[2] = seat2;
    if (seat3) next[3] = seat3;
    if (seat4) next[4] = seat4;
    return next;
  }, [seat1, seat2, seat3, seat4]);

  const canEnterLobby = nameInput.trim().length > 1;

  useEffect(() => {
    const stored = getStoredIdentity();
    if (stored?.displayName) {
      setNameInput(stored.displayName);
    }
  }, []);

  const enterLobby = () => {
    if (!canEnterLobby) return;
    const nextIdentity = saveIdentity(nameInput.trim());
    setIdentity(nextIdentity);
  };

  const seatPlayer = async (seatId: number) => {
    const success = await claimSeat(seatId);
    if (!success) return;
  };

  const goHome = () => {
    void releaseSeat();
    setIdentity(null);
    setShowRules(false);
  };

  const focusJoin = () => {
    const input = document.getElementById("join-name-input") as HTMLInputElement | null;
    input?.focus();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgb(91_14_23),rgb(12_6_8)_40%,rgb(0_0_0)_100%)]">
      <Container className="relative max-w-7xl px-3 pb-4 pt-14 sm:px-4 sm:py-8">
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

        {!identity ? (
          <JoinGateCard
            tableId={selectedTable.id}
            nameInput={nameInput}
            canEnterLobby={canEnterLobby}
            onNameChange={setNameInput}
            onEnterLobby={enterLobby}
          />
        ) : (
          <div>
            <Card className="relative min-h-[74vh] overflow-hidden border border-red-950/60 bg-black p-0 shadow-[0_24px_60px_rgba(0,0,0,0.52)] sm:min-h-[78vh]">
              <RulesPanel
                showRules={showRules}
                onToggleRules={() => setShowRules((prev) => !prev)}
              />

              <div className="absolute inset-0 z-10">
                <GameStartPresetPanel
                  tableId={selectedTable.id}
                  localPlayerId={identity.playerId}
                  localSeatNumber={selectedSeat}
                  takenSeats={stableTakenSeatNames}
                  onSeatSelect={seatPlayer}
                />
              </div>
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgb(91_14_23),rgb(12_6_8)_40%,rgb(0_0_0)_100%)]">
          <Container className="relative max-w-7xl px-3 pb-4 pt-14 sm:px-4 sm:py-8">
            <Card className="border-transparent bg-black/50 p-4 text-sm text-red-200/90">
              Loading table...
            </Card>
          </Container>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}