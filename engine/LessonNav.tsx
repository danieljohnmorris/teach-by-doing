"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function LessonNav({
  courseName,
  lessons,
}: {
  courseName: string;
  lessons: { slug: string; title: string }[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tbd.nav-collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("tbd.nav-collapsed", String(next));
  }

  if (collapsed) {
    return (
      <aside className="w-10 shrink-0 border-r border-zinc-800 flex flex-col items-center py-3">
        <button
          onClick={toggle}
          title="Show lessons"
          className="text-zinc-500 hover:text-zinc-200 text-sm leading-none"
        >
          »
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-52 shrink-0 border-r border-zinc-800 p-4 text-sm flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {courseName}
        </h1>
        <button
          onClick={toggle}
          title="Hide lessons"
          className="text-zinc-500 hover:text-zinc-200 text-sm leading-none"
        >
          «
        </button>
      </div>
      <ul className="space-y-1">
        {lessons.map((l) => {
          const active = pathname === `/lessons/${l.slug}`;
          return (
            <li key={l.slug}>
              <Link
                href={`/lessons/${l.slug}`}
                aria-current={active ? "page" : undefined}
                className={`block rounded-md px-2 py-1.5 ${
                  active
                    ? "bg-sky-950/70 text-sky-200 font-medium"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {l.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
