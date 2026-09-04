"use client";

import { useState } from "react";

interface QuizProps {
  id?: string;
  question: string;
  choices: string[];
  answer: number;
  explain?: string;
}

interface Card {
  front: string;
  back: string;
}

async function recordResult(widget: string, id: string | undefined, value: unknown) {
  const lesson = window.location.pathname.split("/").filter(Boolean).pop() ?? "unknown";
  try {
    await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson, widget, widgetId: id, value }),
    });
  } catch {
    // Network or server down — keep going; result is non-critical.
  }
}

export function Quiz({ id, question, choices, answer, explain }: QuizProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === answer;
  const show = picked !== null;

  return (
    <div className="widget rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 my-6 bg-zinc-50/60 dark:bg-zinc-900/60">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Quiz</div>
      <p className="font-medium mb-3">{question}</p>
      <div className="grid gap-2">
        {choices.map((opt, i) => {
          const cls = !show
            ? "hover:border-zinc-400 dark:hover:border-zinc-500"
            : i === answer
              ? "border-emerald-500 bg-emerald-500/10"
              : i === picked
                ? "border-red-400 bg-red-400/10"
                : "opacity-60";
          return (
            <button
              key={i}
              onClick={() => {
                if (show) return;
                setPicked(i);
                void recordResult("quiz", id, { choice: i, correct: i === answer });
              }}
              className={`rounded-lg border px-4 py-2 transition ${cls}`}
            >
              <span className="font-mono text-xs mr-2 text-zinc-400">{String.fromCharCode(97 + i)})</span>
              {opt}
            </button>
          );
        })}
      </div>
      {show && (
        <div className={`mt-3 text-sm ${correct ? "text-emerald-600" : "text-red-500"}`}>
          {correct ? <b>Correct. </b> : <b>Not quite. </b>}
          {explain}
        </div>
      )}
    </div>
  );
}

export function Flashcards({ id, cards }: { id?: string; cards: Card[] }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState(0);
  const done = i >= cards.length;

  const respond = (known: boolean) => {
    if (known) setKnew((k) => k + 1);
    setFlipped(false);
    if (i + 1 >= cards.length) void recordResult("flashcards", id, { knew: knew + (known ? 1 : 0), total: cards.length });
    setI(i + 1);
  };

  return (
    <div className="widget rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 my-6 bg-zinc-50/60 dark:bg-zinc-900/60">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Flashcards</div>
      {done ? (
        <div className="text-center py-4">
          <div className="text-2xl font-bold">
            {knew} / {cards.length}
          </div>
          <div className="text-sm text-zinc-500">known — recorded</div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full min-h-24 rounded-lg border border-zinc-300 dark:border-zinc-600 p-4 font-medium hover:border-zinc-500 transition text-center"
          >
            {flipped ? cards[i].back : cards[i].front}
            <div className="text-xs text-zinc-400 mt-2">{flipped ? "" : "click to flip"}</div>
          </button>
          {flipped && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => respond(false)} className="flex-1 rounded-lg border border-red-400 text-red-500 py-2 text-sm">
                Didn't know
              </button>
              <button onClick={() => respond(true)} className="flex-1 rounded-lg border border-emerald-400 text-emerald-600 py-2 text-sm">
                Knew it
              </button>
            </div>
          )}
          <div className="text-xs text-zinc-400 mt-2 text-center">
            {i + 1} / {cards.length}
          </div>
        </>
      )}
    </div>
  );
}
