"use client";

import { useEffect, useState } from "react";

export function Exercise({
  task,
  starter,
  answer,
  language,
}: {
  task: string;
  starter: string;
  answer: string;
  /** Code language label. Also gates the "Load in playground" button (Rust only). */
  language?: "rust" | "python" | "javascript" | "typescript" | "other";
}) {
  const [show, setShow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // The first exercise on the page owns the playground: its starter code
  // appears in the editor without a click. Later exercises load on demand
  // via the button below.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("tbd:playground", { detail: starter }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadInPlayground() {
    window.dispatchEvent(new CustomEvent("tbd:playground", { detail: starter }));
    setLoaded(true);
    setTimeout(() => setLoaded(false), 2000);
  }

  return (
    <div className="widget exercise">
      <div className="widget-label">
        {language && <span>{language}</span>}
        <span>exercise</span>
      </div>
      <p className="exercise-task">{task}</p>
      <pre className="widget-code">
        <code>{starter}</code>
      </pre>
      <div className="widget-actions">
        {language === "rust" && (
          <button className="btn btn-secondary" onClick={loadInPlayground}>
            {loaded ? "Loaded" : "Load in playground"}
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => setShow(!show)}>
          {show ? "Hide reference answer" : "Show reference answer"}
        </button>
      </div>
      {show && (
        <div className="exercise-answer">
          <pre className="widget-code">
            <code>{answer}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
