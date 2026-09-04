---
name: teach-by-doing
description: "Teach a topic with embedded graded practice — 'teach with doing'. Extends the teach skill: same workspace contract (MISSION/GLOSSARY/NOTES/learning-records), plus a packaged Next.js engine (SplitPane + LessonNav + PlaygroundPane + ChatPane + four doing widgets) and scaffold/upgrade scripts. Use when a course should be reproducible and lessons embed verification in the page, not just explanation."
user-invocable: true
---

# Teach By Doing

Teach any topic via a course that embeds practice. Lessons are MDX files; graded interaction (quiz / exercise / Q&A / flashcards) lives in the page; the chat tutor rides existing subscriptions (no API credits).

## Architecture

```
~/.claude/skills/teach-by-doing/
├── SKILL.md                     ← this file (engine + content boundary)
├── PITFALLS.md                  ← engine details that trip first-time users
├── engine/                      ← course runtime (copied at scaffold)
│   ├── SplitPane.tsx            ← resizable two-pane layout (versioned storage keys)
│   ├── LessonNav.tsx            ← collapsible sidebar, courseName prop
│   ├── ChatPane.tsx             ← tutor chat with stop button, markdown rendering
│   ├── PlaygroundPane.tsx       ← topic playground iframe (Rust default, overridable)
│   ├── Exercise.tsx             ← code exercise with Load-in-playground / Show answer
│   ├── Qa.tsx                   ← free-text Q&A, graded by tutor backend
│   ├── widgets.tsx              ← Quiz + Flashcards
│   ├── globals.css              ← Tailwind v4 + .chatmd markdown styles
│   └── lessons-layout.tsx       ← course shell (uses `{{COURSE_NAME}}` placeholder)
├── app-templates/               ← per-course Next.js wiring
│   ├── next.config.ts           ← MDX + frontmatter + pageExtensions
│   ├── mdx-components.tsx       ← maps <Quiz>/<Exercise>/etc to engine components
│   ├── chat-route.ts            ← AI SDK tutor route with TUTOR_PROVIDER flag
│   └── lib-course.ts            ← listLessons(): scan lessons/ for NNNN/page.mdx
├── templates/
│   └── lesson-template.mdx      ← starting point for authors; {{COURSE_NAME}} placeholder
└── bin/
    ├── scaffold.sh              ← create a new course app from the engine
    └── upgrade.sh               ← pull newer engine into an existing course
```

## Engine vs content

**Engine** (shared, topic-neutral): everything in `engine/` + `app-templates/`. The layout, widgets, chat, playground, styling. You never edit this per course; you upgrade it via `bin/upgrade.sh`.

**Content** (per course, topic-specific): `MISSION.md`, `GLOSSARY.md`, `NOTES.md`, `learning-records/`, `app/src/app/lessons/**/*.mdx`. Authored by the agent from the topic material. This is what teach-by-doing does *on top of* teach: same workspace contract, plus the lesson files.

## Scaffolding a new course

```bash
bash ~/.claude/skills/teach-by-doing/bin/scaffold.sh <target-app-dir> "<course display name>"
# e.g. scaffold.sh ~/code/teach-linear-calc "Linear Algebra"
```

This copies the engine into `<target-app-dir>`, injects the course name into the layout, seeds lesson 0001 from `templates/lesson-template.mdx`, and wires the Next.js templates.

Then install deps once:

```bash
cd <target-app-dir>
npm install next react react-dom ai @ai-sdk/openai @ai-sdk/anthropic @next/mdx react-markdown remark-gfm remark-frontmatter rehype-highlight tailwindcss @tailwindcss/postcss typescript @types/react @types/node
npm run dev   # → http://localhost:3000/lessons/0001
```

## Upgrading the engine (existing course)

```bash
bash ~/.claude/skills/teach-by-doing/bin/upgrade.sh <target-app-dir>
```

Pulls the latest engine components into the course. Course content (`lessons/*.mdx`, `MISSION.md`, etc.) and the injected course name are untouched.

## Tutor provider (no API credits)

`app-templates/chat-route.ts` reads `TUTOR_PROVIDER` from the course's environment:

| Value | Backend | Cost | When |
|-------|---------|------|------|
| `ollama` *(default)* | Local ollama at `localhost:11434` | None | Published template, offline |
| `claude` | `claude -p` (Claude Code CLI) | Subscription | When you have Claude Code |
| `pi` | `pi` CLI / omp agent | Local | When the harness drives it |
| `anthropic` | `@ai-sdk/anthropic` direct API | **Credits** | Only if the user explicitly accepts costs |

Set in the course's `.env.local`: `TUTOR_PROVIDER=claude` etc. The default (`ollama`) assumes *no* credits.

## Widget contracts (MDX props)

All four widgets use **flat props** (no nested `data` object). This is the authoring API:

```mdx
<Quiz
  question="Why X?"
  choices={["option A", "option B", "option C", "option D"]}
  answer={1}
  explain="why B is right"
/>

<Exercise
  language="rust"
  task="what to write"
  starter={"fn main() {\n  // …\n}"}
  answer="fn main() { /* result */ } — with explanation"
/>

<Qa lesson="0001" question="In your own words: …" />

<Flashcards cards={[{ front: "term", back: "definition" }]} />
```

Prop rules: `choices` is an array, `answer` is a 0-based index int, `starter`/`answer`/`question`/`explain` are strings. **No nested objects.**

## PITFALLS (engine mechanics most likely to trip you)

See `PITFALLS.md` for the full list. The ones that bite every first use:

1. **MDX JSX braces**: never use backtick template literals in props. Backticks + `{`/`}` inside props are parsed as JSX expressions and blow up with "Expected '</', got 'jsx text'". Use plain double-quoted strings with `\n` escapes instead.
2. **pageExtensions**: the course's `next.config.ts` must set `pageExtensions: ["mdx", "ts", "tsx"]` or `.mdx` routes 404.
3. **Iframe pointer drag**: when the playground iframe is in the right pane, it swallows `mousemove` events. `SplitPane` disables iframe pointer events during drag; don't remove that code.
4. **Storage key versioning**: `SplitPane` and `LessonNav` persist state in localStorage under `tbd.split.<pane>.vN`. When changing layout shape, bump the `vN` or stale widths break the new layout.
5. **Lesson routing**: lessons live at `src/app/lessons/NNNN/page.mdx`. `NNNN` zero-padded 4 digits. The `pageExtensions` + `listLessons()` in `lib-course.ts` discover them automatically.
6. **Chat provider**: never default to `anthropic` — that burns API credits. Default is `ollama`; only reach API-key providers if the user asks.

## Relationship to other skills

- **Extends `teach`** — teach gives the workspace contract + pedagogy; teach-doing adds the "doing in the page" layer.
- **`rust-by-doing`** — a *content* skill (walk ilo-lang commits). teach-by-doing is the *presentation* layer such a course can be delivered through. teach-rust (`~/code/teach-rust`) is the running example: rust-by-doing content, teach-by-doing machinery.
