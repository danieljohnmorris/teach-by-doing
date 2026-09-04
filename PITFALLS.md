# teach-by-doing — Engine Pitfalls

Mistakes that broke real lessons in teach-rust. Each lists the symptom, root cause, and fix so a new course doesn't re-hit it.

---

## 1. MDX "Expected '</', got 'jsx text'" at build

**Symptom:** `next build` fails with `Expected '</', got 'jsx text'` or loader errors referencing `mdx-js-loader.js`.

**Cause:** In MDX, JSX props written as backtick template literals with literal `{`/`}` in the string are parsed by the MDX compiler as nested JSX expressions, not strings. Code blocks like

```mdx
<Exercise starter={`fn main() { println!("x"); }`} />
```

blow up because the compiler reads the inner `{` as "start JSX expression."

**Fix:** author all code-bearing props as plain double-quoted strings with newline escapes:

```mdx
<Exercise starter={"fn main() {\n  println!(\"x\");\n}"} />
```

The template in `templates/lesson-template.mdx` uses this shape — copy it.

---

## 2. Lesson routes 404 despite existing files

**Symptom:** `src/app/lessons/0001/page.mdx` exists, but `/lessons/0001` returns 404.

**Cause:** Next.js doesn't recognize `.mdx` as a routable page extension by default.

**Fix:** `next.config.ts` must include:

```ts
const nextConfig = {
  pageExtensions: ["mdx", "ts", "tsx"],
};
export default withMDX(nextConfig);
```

`app-templates/next.config.ts` includes this — don't remove it during engine upgrade.

---

## 3. Split-pane drag freezes when cursor enters the iframe

**Symptom:** dragging the divider between lesson and playground works until the pointer goes over the playground iframe, then the divider stops following the mouse.

**Cause:** iframes create a separate browsing context. Mouse events inside the iframe don't bubble to the parent document, so the parent's `mousemove` listener stops firing.

**Fix:** during drag, disable pointer events on all iframes so mouse events continue to fire in the parent document. `engine/SplitPane.tsx` does this:

```ts
for (const iframe of document.querySelectorAll("iframe")) {
  iframe.style.pointerEvents = "none";
}
// …on mouseup:
iframe.style.pointerEvents = "";
```

Don't remove this. If you add a new resizable pane containing iframes, the shielding mechanism must be preserved.

---

## 4. Old column widths / nav state break new layouts

**Symptom:** after upgrading the engine or editing the layout, the lesson renders with a broken split — e.g. the right column is unreasonably narrow — but only on Dan's browser, not on a fresh profile.

**Cause:** `SplitPane` and `LessonNav` persist state to `localStorage` under keys like `tbd.split.lesson.v3`. Old values linger after the layout changes shape.

**Fix:** bump the storage key version whenever the layout geometry changes. In `engine/lessons-layout.tsx`:

```tsx
storageKey="tbd.split.lesson.v4"   // was v3 before the three-column change
```

Same for the side split (`tbd.split.side.v4`). Versioning the key isolates stale layout state. Do not "fix" stored values by clamping; key versioning is the correct pattern and prevents silent regressions on old browsers.

---

## 5. `qwen3:32b was retired`, `Tutor backend (ollama) failed: …`

**Symptom:** chat answers 500 with an ollama error naming a retired or missing model; the Q&A widget returns "graded" errors that aren't tutoring responses.

**Cause:** ollama `:cloud` models move fast — a model that exists this month may be removed next. The course template defaulted to a specific `:cloud` tag that later vanished.

**Fix:** default to a generic model present on the *user's* ollama install, and expose an override:

```ts
model: ollama(process.env.TUTOR_OLLAMA_MODEL ?? "kimi-k3:cloud"),
```

The default is a strong general tutor; `TUTOR_OLLAMA_MODEL` lets a course owner pin to whatever their ollama has. Document locally-available models in the course's NOTES.

Never default to `anthropic` — that's the only path that costs API credits.

---

## 6. Chat pane "not visible" after layout refactor

**Symptom:** user reports "no chat" after the layout was moved into the lesson column.

**Cause:** chat was rendered *in-flow* under the `<article>`, below the fold. The lesson column scrolled; the chat followed the article content instead of staying pinned.

**Fix:** the lesson column becomes a height-constrained flex column; the article scrolls internally, the chat stays pinned:

```tsx
<main className="flex h-full flex-col overflow-hidden">
  <article className="prose min-h-0 flex-1 overflow-y-auto p-8">{children}</article>
  <div className="h-72 shrink-0 border-t border-zinc-800">
    <ChatPane />
  </div>
</main>
```

`flex-1` alone doesn't constrain a child to the viewport — `h-full` (or an explicit height) on the main is required so the child article has a bounded box to scroll within.

---

## 7. Widget 500s: `Cannot read properties of undefined (reading 'answer')`

**Symptom:** quiz/flashcard crashes at runtime with `undefined` prop access.

**Cause:** props in MDX were nested (`data={...}`) but the component expected flat props (`question=`, `choices=`). Engine and content disagreed about the shape.

**Fix:** the authoring API is flat. All widgets accept flat props; if you change one side, check the other. The lesson template is the reference — MDX must match it exactly.

---

## 8. `recordResult` writes to the wrong lesson

**Symptom:** quiz results appear under the previous lesson, or disappear.

**Cause:** `window.location.pathname.split("/").pop()` runs at render time; on a client-side navigation between lessons, the pathname updates mid-render and the wrong key is used.

**Fix:** pass the lesson slug explicitly as a prop if you add new widgets that write to storage:

```tsx
<Quiz id="q3" question="..." choices={...} answer={1} />
// `id` is the storage key, not derived from the URL
```

The `id` prop exists for this reason. Use it.

---

# Summary

Before shipping a lesson, run this mental checklist:

- [ ] Code props in MDX use `{"..."}` shape, not backticks
- [ ] Course `next.config.ts` has `pageExtensions: ["mdx", "ts", "tsx"]`
- [ ] New draggable panes preserve the iframe pointer-events shield
- [ ] Storage keys bumped if layout geometry changed
- [ ] `TUTOR_PROVIDER` is *not* anthropic unless you intend to burn credits
- [ ] Chat is pinned (not in-flow under the article) if it should always be visible
- [ ] Widget props match the flat shape in `templates/lesson-template.mdx`
