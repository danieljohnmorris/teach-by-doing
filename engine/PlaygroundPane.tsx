"use client";

import { useEffect, useState } from "react";

/** Point at any editor that accepts `?code=` as URL-encoded source. */
const BASE = "https://play.rust-lang.org/?edition=2021";

export function PlaygroundPane() {
  const [src, setSrc] = useState(BASE);

  useEffect(() => {
    const onLoad = (e: Event) => {
      const code = (e as CustomEvent<string>).detail;
      setSrc(`${BASE}&code=${encodeURIComponent(code)}`);
    };
    window.addEventListener("tbd:playground", onLoad);
    return () => window.removeEventListener("tbd:playground", onLoad);
  }, []);

  return <iframe src={src} title="Code playground" className="h-full w-full bg-white" />;
}
