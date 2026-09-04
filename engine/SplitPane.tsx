"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  storageKey: string;
  defaultRight?: number;
  minRight?: number;
  maxRight?: number;
}

export function SplitPane({
  left,
  right,
  storageKey,
  defaultRight = 420,
  minRight = 300,
  maxRight = 700,
}: SplitPaneProps) {
  const [rightW, setRightW] = useState(defaultRight);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      const n = Number(stored);
      if (!Number.isNaN(n)) setRightW(n);
    }
  }, [storageKey]);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const clamped = Math.min(maxRight, Math.max(minRight, newWidth));
      setRightW(clamped);
    },
    [minRight, maxRight]
  );

  const onMouseUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    for (const iframe of document.querySelectorAll("iframe")) {
      iframe.style.pointerEvents = "";
    }
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    localStorage.setItem(storageKey, String(rightW));
  }, [rightW, storageKey]);

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    for (const iframe of document.querySelectorAll("iframe")) {
      iframe.style.pointerEvents = "none";
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div ref={containerRef} className="flex h-full min-w-0 flex-1">
      <div className="min-w-0 min-h-0 flex-1 overflow-hidden">{left}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={onMouseDown}
        className="w-1.5 shrink-0 cursor-col-resize bg-zinc-800 transition-colors hover:bg-zinc-600 active:bg-sky-500"
      />
      <div className="shrink-0 overflow-hidden" style={{ width: rightW, minWidth: minRight, maxWidth: maxRight }}>
        {right}
      </div>
    </div>
  );
}
