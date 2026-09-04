# teach-by-doing

An agent skill for teaching topics with graded practice built into the page. Lessons do not stop at explanation. They verify understanding where the learner reads.

Inspired by [Matt Pocock's teach skill](https://www.aihero.dev/learn-anything-with-my-teach-skill) for Claude Code. That skill defines the teaching workspace contract: MISSION, GLOSSARY, learning-records, ZPD-driven lessons, reuse-first components. teach-by-doing extends it with a self-contained, reproducible course engine: a packaged set of React components plus shell scripts that scaffold a full Next.js course app from any topic.

## What a course looks like

Each course workspace has two cleanly separated layers:

```
course/
├── MISSION.md, GLOSSARY.md, NOTES.md, RESOURCES.md     # content (teach contract)
├── learning-records/                                   # content (durable progress)
├── lessons/NNNN-slug/page.mdx                          # content (the lessons themselves)
└── app/                                                # engine (generated, no edits)
    └── src/components/{ChatPane,Quiz,Exercise,Qa,Flashcards,SplitPane,...}.tsx
```

Content is what makes the course yours. Engine is the machinery any course reuses. The upgrade path (`bin/upgrade.sh`) pulls new engine versions into an existing course without touching content.

## The four doing widgets

Every lesson can embed four widget types, each mapping to a different retrieval mode:

| Widget | Mechanism |
|---|---|
| **Quiz** | Multiple choice, correctness feedback, optional explanation |
| **Exercise** | Code or written task with starter, revealable reference answer, optional playground integration |
| **Graded Q&A** | Free-text answers routed to a tutor backend for grading |
| **Flashcards** | Flip-and-track cards with knew/it counts |

All widgets take flat props (`question=`, `choices=`, `answer=`), not nested `data={}` objects.

## Tutor backends, no API credits

The chat route is provider-agnostic. Set `TUTOR_PROVIDER`:

- `ollama` (default) — local models via Ollama, free
- `claude` — the `claude -p` CLI, rides a Claude Code subscription
- `pi` — local pi runtime
- `zai` — z.ai coding plan via the claude CLI

Pick the one you have. No provider touches pay-per-token API credits.

## Quickstart

```bash
# inside a Claude Code session
/teach-by-doing rust
# or directly:
~/.claude/skills/teach-by-doing/bin/scaffold.sh ~/code/my-course/app "My Topic"
cd ~/code/my-course/app && npm install && npm run dev
```

Then author lessons in `app/src/app/lessons/NNNN-slug/page.mdx` using the format from `templates/lesson-template.mdx`.

Later, when the engine improves: `bin/upgrade.sh ~/code/my-course/app` refreshes the machinery without touching your lessons.

## Layout

- **SKILL.md** — the skill contract agents read (invocation, workflow, engine/content boundary)
- **PITFALLS.md** — known traps from live courses (MDX brace escaping, pointer-events on drag, storage key versioning)
- **engine/** — the React components, copied verbatim into courses
- **app-templates/** — Next.js wiring (config, MDX components, chat route, tsconfig)
- **templates/** — lesson starter and package.json
- **bin/scaffold.sh, bin/upgrade.sh** — generation and upgrade scripts

## License

MIT
