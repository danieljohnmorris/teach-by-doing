# teach-by-doing

Teach-with-doing as an agent skill: lessons don't stop at explanation — they verify understanding inside the page.

Inspired by the `teach` skill (Matt Pocock), which defines the teaching workspace contract (MISSION / GLOSSARY / learning-records, ZPD-driven lessons, reuse-first components). **teach-by-doing** extends that contract with a self-contained, reproducible course engine: a packaged set of React components + shell scripts that scaffold a full Next.js course app from a lesson you describe.

## What a course looks like

Each course is a workspace directory with two cleanly-separated layers:

- **Content** (owned by the course author): `MISSION.md`, `GLOSSARY.md`, `NOTES.md`, `learning-records/`, and `app/src/app/lessons/NNNN-name/page.mdx` — the actual teaching material, written in MDX.
- **Engine** (owned by this skill): `app/src/components/` — reusable components the lesson author never edits, upgraded via `./engine.sh upgrade` when the skill ships a fix.

The split means: content can be upgraded without forking the engine, and the engine can be improved without breaking content.

## Lessons have four "doing" widgets

Inside `page.mdx`, the engine provides:

| Widget | What it does |
|---|---|
| `Quiz` | Multiple-choice with inline feedback |
| `Exercise` | Syntax-highlighted starter code + revealable reference answer |
| `Qa` | Free-text answer graded by an LLM (posts to `/api/chat`) |
| `Flashcards` | Flip-card deck with spaced repetition tracking |

All four run client-side, record to `localStorage` under `tbd.results.<lesson>`.

## The chat pane talks to the tutor

Every lesson gets a chat pane at the bottom, backed by an AI provider with zero API-credit dependence:

```bash
TUTOR_PROVIDER=ollama          # free, local, default — needs a model pulled
TUTOR_PROVIDER=claude          # uses your Claude Code subscription
TUTOR_PROVIDER=pi              # uses your local omp/pi agent runtime
TUTOR_PROVIDER=zai             # uses z.ai coding plan (ZAI_API_KEY)
```

The tutor reads the lesson file as context, so it answers in-domain.

## Scaffolding a new course

From this skill:

```bash
~/.claude/skills/teach-by-doing/bin/scaffold.sh ~/code/my-course/app "My Course"
cd ~/code/my-course/app
npm install
npm run dev
```

Open `http://localhost:3000/lessons/0001`. The scaffold ships one lesson at `app/src/app/lessons/0001/page.mdx` as a starting point. Teach it in any subject — the engine doesn't care what the topic is.

To upgrade the engine later (new components, bug fixes) without re-scaffolding:

```bash
~/.claude/skills/teach-by-doing/bin/upgrade.sh ~/code/my-course/app
```

## Layout

Each lesson page is a three-column layout:

- **Left** — Collapsible lesson nav (current lesson highlighted)
- **Center** — Lesson content (MDX), scrollable, with the chat pinned below it
- **Right** — Playground iframe (default: Rust Playground, override via `NEXT_PUBLIC_PLAYGROUND_URL`)

Both dividers are draggable; widths persist in `localStorage` under versioned keys (`tbd.split.*.v4`) so stale layouts never leak across versions.

## Files

```
SKILL.md                    — what this skill does, when to use it, the engine/content contract
PITFALLS.md                 — known traps documented (MDX props, storage keys, iframe events)
engine/                     — the React components + stylesheet (verbatim copies of the working course)
app-templates/              — next.config.ts, chat route, mdx-components.tsx, lib-course.ts
templates/                  — package.json, tsconfig.json, lesson-template.mdx
bin/scaffold.sh             — create a course from the engine
bin/upgrade.sh              — refresh engine files in an existing course
```

## License

MIT
