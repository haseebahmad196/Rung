import { NextResponse } from "next/server";
import { getPresenceStore } from "@/features/table/realtime/server/presenceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JoinBody = {
  tableId?: string;
  displayName?: string;
  playerId?: string;
};

function sanitizeName(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 20);
}

export async function POST(request: Request) {
  const body = (await request.json()) as JoinBody;
  const tableId = body.tableId?.trim();
  const displayName = body.displayName ? sanitizeName(body.displayName) : "";

  if (!tableId) {
    return NextResponse.json({ error: "tableId is required" }, { status: 400 });
  }

  if (displayName.length < 2) {
    return NextResponse.json({ error: "displayName must be at least 2 characters" }, { status: 400 });
  }

  const store = getPresenceStore();
  const result = store.join(tableId, {
    displayName,
    playerId: body.playerId,
  });

  return NextResponse.json(result, { status: 200 });
}
