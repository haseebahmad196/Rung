"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ChatMessage } from "../types";
import { quickEmojiLines, quickTaunts } from "@/features/table/constants";

type TableChatPanelProps = {
  tableId: string;
  playerName: string;
  selectedSeat: number | null;
  seedMessages: ChatMessage[];
};

function storageKey(tableId: string) {
  return `courtpiece-chat-${tableId}`;
}

export function TableChatPanel({
  tableId,
  playerName,
  selectedSeat,
  seedMessages,
}: TableChatPanelProps) {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const channelName = useMemo(() => `courtpiece-${tableId}-chat`, [tableId]);
  const canSend = messageInput.trim().length > 0 && Boolean(selectedSeat);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey(tableId)) : null;

    if (raw) {
      try {
        setMessages(JSON.parse(raw) as ChatMessage[]);
        return;
      } catch {
        setMessages(seedMessages);
      }
    }

    setMessages(seedMessages);
  }, [seedMessages, tableId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(tableId), JSON.stringify(messages));
  }, [messages, tableId]);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel(channelName);
    channel.onmessage = (event: MessageEvent<ChatMessage>) => {
      const incoming = event.data;
      setMessages((prev) => {
        if (prev.some((item) => item.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    };

    return () => {
      channel.close();
    };
  }, [channelName]);

  const sendMessage = () => {
    if (!canSend) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: playerName,
      text: messageInput.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, message]);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(channelName);
      channel.postMessage(message);
      channel.close();
    }

    setMessageInput("");
  };

  const sendQuickMessage = (text: string) => {
    if (!selectedSeat || !playerName) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: playerName,
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, message]);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(channelName);
      channel.postMessage(message);
      channel.close();
    }

    setShowQuickChat(false);
  };

  return (
    <div className="rounded-2xl border border-red-900/90 bg-[linear-gradient(135deg,rgba(28,4,9,0.95),rgba(8,8,10,0.98))] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.5)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold sm:text-lg">Chat</h3>
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className="rounded-full border border-red-700/95 bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400 sm:hidden"
          >
            {isChatOpen ? "Hide" : "Show"}
          </button>
        </div>
        <div className="relative flex items-center gap-2">
          <span className="rounded-full border border-red-900/95 bg-black/85 px-2.5 py-1 text-xs text-red-400/95">
            {selectedSeat ? `Seat ${selectedSeat}` : "Select seat first"}
          </span>
          <button
            type="button"
            onClick={() => setShowQuickChat((prev) => !prev)}
            disabled={!selectedSeat}
            className="rounded-full border border-red-700/95 bg-red-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-400 hover:bg-red-900/70 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Emojis +
          </button>

          {showQuickChat ? (
            <div className="absolute right-0 top-10 z-20 w-64 rounded-2xl border border-red-900/95 bg-[linear-gradient(135deg,rgba(30,4,9,0.98),rgba(8,8,10,0.99))] p-2 shadow-[0_18px_36px_rgba(0,0,0,0.55)]">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-500/95">
                Quick Emojis
              </p>
              <div className="mb-2 grid grid-cols-4 gap-1.5">
                {quickEmojiLines.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => sendQuickMessage(item)}
                    className="rounded-lg border border-red-900/95 bg-black/85 py-1.5 text-lg hover:bg-red-950/50"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-500/95">
                Quick Lines
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {quickTaunts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => sendQuickMessage(item)}
                    className="rounded-lg border border-red-900/95 bg-black/85 px-2 py-1.5 text-left text-[11px] text-red-300 hover:bg-red-950/50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${isChatOpen ? "block" : "hidden"} sm:block`}>
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-red-500/20 bg-black/70 p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-red-100/60">No messages yet.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-lg bg-red-950/35 px-3 py-2">
                <p className="text-xs text-red-300/80">{message.from}</p>
                <p className="text-sm text-red-100">{message.text}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder={
              selectedSeat ? `Message players in ${tableId}...` : "Choose a seat to chat"
            }
            disabled={!selectedSeat}
            className="border-red-500/30 bg-black/70"
          />
          <Button
            variant="primary"
            onClick={sendMessage}
            disabled={!canSend}
            className="bg-red-500 px-5 text-white hover:bg-red-400"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
