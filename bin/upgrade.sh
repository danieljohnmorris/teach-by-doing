#!/usr/bin/env bash
# upgrade: pull a newer engine into an existing teach-by-doing course app.
# Usage: upgrade.sh <target-app-dir>
set -euo pipefail

TARGET="${1:?target app dir required}"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

for f in ChatPane Exercise LessonNav PlaygroundPane SplitPane widgets Qa; do
  cp "$SKILL_DIR/engine/$f.tsx" "$TARGET/src/components/$f.tsx"
done
cp "$SKILL_DIR/engine/globals.css" "$TARGET/src/app/globals.css"

# lessons-layout.tsx holds the course name — preserve the existing one unless absent
if [ ! -f "$TARGET/src/components/lessons-layout.tsx" ]; then
  cp "$SKILL_DIR/engine/lessons-layout.tsx" "$TARGET/src/components/lessons-layout.tsx"
fi

echo "Engine upgraded at $TARGET. Course name + templates untouched."
