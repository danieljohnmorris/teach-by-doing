"use client";

import { useState } from "react";

interface QaProps {
  lesson: string;
  question: string;
}

export function Qa({ lesson, question }: QaProps) {
  const [answer, setAnswer] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!answer.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "grade", lesson, question, answer }),
      });
      const j: { reply?: string } = await res.json();
      const text = j.reply ?? "No reply from tutor.";
      setReply(text);
      const key = `tbd.results.${lesson}`;
      const results = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
      results[`qa-${question.slice(0, 24)}`] = { answer, assessment: text };
      localStorage.setItem(key, JSON.stringify(results));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 my-6 bg-zinc-50/60 dark:bg-zinc-900/60">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Q &amp; A — graded</div>
      <p className="font-medium mb-3">{question}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer, then submit for grading…"
        rows={4}
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-transparent p-3 text-sm focus:outline-none focus:border-zinc-500"
      />
      <button
        type="button"
        onClick={submit}
        disabled={busy || answer.trim().length === 0}
        className="mt-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {busy ? "Grading…" : "Submit for grading"}
      </button>
      {reply && (
        <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-1">Tutor assessment</div>
          <p className="text-sm whitespace-pre-wrap">{reply}</p>
        </div>
      )}
    </div>
  );
}
