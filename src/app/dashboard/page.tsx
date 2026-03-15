"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { useDashboardSnapshot } from "@/features/table/realtime";

function formatTime(timestamp: number) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table") ?? "main";
  const snapshot = useDashboardSnapshot();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgb(65_12_18),rgb(10_6_8)_42%,rgb(0_0_0)_100%)] text-red-100">
      <Container className="max-w-7xl px-3 pb-8 pt-6 sm:px-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-red-400">Court Piece Dashboard</p>
            <h1 className="text-2xl font-black text-red-100 sm:text-3xl">Live Standings</h1>
            <p className="text-xs text-red-300/80 sm:text-sm">Table {tableId}</p>
          </div>
          <Link
            href={`/?table=${tableId}`}
            className="rounded-xl border border-red-700/80 bg-black/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 hover:bg-red-950/55"
          >
            Back To Table
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-red-900/90 bg-black/65 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-red-500">Active Players</p>
            <p className="mt-2 text-3xl font-black text-red-200">{snapshot.activePlayers.length}</p>
          </Card>
          <Card className="border-red-900/90 bg-black/65 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-red-500">Registered Players</p>
            <p className="mt-2 text-3xl font-black text-red-200">{snapshot.players.length}</p>
          </Card>
          <Card className="border-red-900/90 bg-black/65 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-red-500">Best Duo</p>
            <p className="mt-2 text-sm font-semibold text-red-200">{snapshot.bestDuo?.label ?? "-"}</p>
            <p className="mt-1 text-xs text-red-400/90">{snapshot.bestDuo ? `${snapshot.bestDuo.winRate}% (${snapshot.bestDuo.wins}-${snapshot.bestDuo.losses})` : "No games yet"}</p>
          </Card>
          <Card className="border-red-900/90 bg-black/65 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-red-500">Bad Duo</p>
            <p className="mt-2 text-sm font-semibold text-red-200">{snapshot.badDuo?.label ?? "-"}</p>
            <p className="mt-1 text-xs text-red-400/90">{snapshot.badDuo ? `${snapshot.badDuo.winRate}% (${snapshot.badDuo.wins}-${snapshot.badDuo.losses})` : "No games yet"}</p>
          </Card>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <Card className="border-red-900/90 bg-black/65 p-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-red-400">Individual Standings</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-xs">
                <thead className="text-red-500">
                  <tr>
                    <th className="px-2 py-2">Player</th>
                    <th className="px-2 py-2">Winning Pts</th>
                    <th className="px-2 py-2">Won</th>
                    <th className="px-2 py-2">Lost</th>
                    <th className="px-2 py-2">Win Rate</th>
                    <th className="px-2 py-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.players.length === 0 ? (
                    <tr>
                      <td className="px-2 py-3 text-red-300/70" colSpan={6}>
                        No standings yet. Finish one match to start stats.
                      </td>
                    </tr>
                  ) : (
                    snapshot.players.map((player) => (
                      <tr key={player.playerId} className="border-t border-red-900/60">
                        <td className="px-2 py-2 font-semibold text-red-200">{player.name}</td>
                        <td className="px-2 py-2 text-red-100">{player.winningPoints}</td>
                        <td className="px-2 py-2 text-red-100">{player.gamesWon}</td>
                        <td className="px-2 py-2 text-red-100">{player.gamesLost}</td>
                        <td className="px-2 py-2 text-red-100">{player.winRate}%</td>
                        <td className="px-2 py-2 text-red-300/90">{formatTime(player.lastActiveAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-red-900/90 bg-black/65 p-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-red-400">Team Standings</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-xs">
                <thead className="text-red-500">
                  <tr>
                    <th className="px-2 py-2">Team</th>
                    <th className="px-2 py-2">Played</th>
                    <th className="px-2 py-2">Won</th>
                    <th className="px-2 py-2">Lost</th>
                    <th className="px-2 py-2">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.teamStandings.length === 0 ? (
                    <tr>
                      <td className="px-2 py-3 text-red-300/70" colSpan={5}>
                        No team standings yet.
                      </td>
                    </tr>
                  ) : (
                    snapshot.teamStandings.map((team) => (
                      <tr key={team.teamKey} className="border-t border-red-900/60">
                        <td className="px-2 py-2 font-semibold text-red-200">{team.label}</td>
                        <td className="px-2 py-2 text-red-100">{team.gamesPlayed}</td>
                        <td className="px-2 py-2 text-red-100">{team.wins}</td>
                        <td className="px-2 py-2 text-red-100">{team.losses}</td>
                        <td className="px-2 py-2 text-red-100">{team.winRate}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <Card className="border-red-900/90 bg-black/65 p-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-red-400">MVP Ranking</h2>
            <div className="mt-3 space-y-2">
              {snapshot.mvp.length === 0 ? (
                <p className="text-xs text-red-300/70">No MVP data yet.</p>
              ) : (
                snapshot.mvp.slice(0, 8).map((player, index) => (
                  <div key={player.playerId} className="flex items-center justify-between rounded-lg border border-red-900/75 bg-red-950/25 px-3 py-2 text-xs">
                    <p className="font-semibold text-red-200">#{index + 1} {player.name}</p>
                    <p className="font-bold text-red-300">{player.mvpScore}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border-red-900/90 bg-black/65 p-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-red-400">Active Players</h2>
            <div className="mt-3 space-y-2">
              {snapshot.activePlayers.length === 0 ? (
                <p className="text-xs text-red-300/70">No active players right now.</p>
              ) : (
                snapshot.activePlayers.slice(0, 8).map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between rounded-lg border border-red-900/75 bg-red-950/25 px-3 py-2 text-xs">
                    <p className="font-semibold text-red-200">{player.name}</p>
                    <p className="text-red-300/90">{formatTime(player.lastActiveAt)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
