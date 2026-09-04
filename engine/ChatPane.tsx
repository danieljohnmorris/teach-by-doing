"use client";

import { useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "tutor";
  text: string;
}

export function ChatPane() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "tutor", text: data.reply ?? "(no reply)" }]);
    } catch {
      setMessages((m) => [...m, { role: "tutor", text: "*stopped*" }]);
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
      setBusy(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            Ask about the lesson, or answer a question widget and say
            &ldquo;grade my answer&rdquo; here.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-left text-sm ${
                m.role === "user"
                  ? "bg-zinc-800 text-zinc-100"
                  : "bg-amber-950/50 text-zinc-200"
              }`}
            >
              <div className="chatmd whitespace-pre-wrap">
                <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2">
            <p className="text-sm text-zinc-500">tutor is typing…</p>
            <button
              onClick={stop}
              className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:border-red-500 hover:text-red-400"
            >
              stop
            </button>
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-zinc-800 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask the tutor…"
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
