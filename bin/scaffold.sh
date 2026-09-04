#!/usr/bin/env bash
# teach-by-doing scaffold: create a self-contained course app from the skill's engine.
# Usage: scaffold.sh <target-app-dir> "<course display name>"
set -euo pipefail

TARGET="${1:?target app dir required}"
COURSE_NAME="${2:?course display name required}"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PKG_NAME=$(basename "$TARGET")

mkdir -p "$TARGET/src/components" \
         "$TARGET/src/lib" \
         "$TARGET/src/app/lessons" \
         "$TARGET/src/app/api/chat" \
         "$TARGET/src/app/api/results"

cp "$SKILL_DIR"/engine/*.tsx "$TARGET/src/components/"
# layout.tsx gets its display name injected
sed "s|{{COURSE_NAME}}|$COURSE_NAME|g" "$SKILL_DIR/engine/lessons-layout.tsx" \
  > "$TARGET/src/components/lessons-layout.tsx"

mkdir -p "$TARGET/src/app/lessons/0001"
sed "s|{{COURSE_NAME}}|$COURSE_NAME|g" "$SKILL_DIR/templates/lesson-template.mdx" \
  > "$TARGET/src/app/lessons/0001/page.mdx"

sed "s|{{PKG_NAME}}|$PKG_NAME|g" "$SKILL_DIR/templates/package.json" \
  > "$TARGET/package.json"

cp "$SKILL_DIR/templates/tsconfig.json" "$TARGET/tsconfig.json"
cp "$SKILL_DIR/engine/globals.css" "$TARGET/src/app/globals.css"
cp "$SKILL_DIR/templates/.gitignore" "$TARGET/.gitignore"
cp "$SKILL_DIR/app-templates/next.config.ts" "$TARGET/next.config.ts"
cp "$SKILL_DIR/app-templates/mdx-components.tsx" "$TARGET/src/mdx-components.tsx"
cp "$SKILL_DIR/app-templates/chat-route.ts" "$TARGET/src/app/api/chat/route.ts"
cp "$SKILL_DIR/app-templates/results-route.ts" "$TARGET/src/app/api/results/route.ts"
cp "$SKILL_DIR/app-templates/lib-course.ts" "$TARGET/src/lib/course.ts"

cat > "$TARGET/src/app/lessons/layout.tsx" <<'LAYOUT'
import EngineLessonLayout from "@/components/lessons-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EngineLessonLayout>{children}</EngineLessonLayout>;
}

export const dynamic = "force-dynamic";
LAYOUT

echo "Scaffolded teach-by-doing course at $TARGET"
echo "Next: cd $TARGET && npm install && npm run dev"
