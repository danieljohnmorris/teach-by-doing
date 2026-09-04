import { listLessons } from "@/lib/course";
import { ChatPane } from "@/components/ChatPane";
import { PlaygroundPane } from "@/components/PlaygroundPane";
import { SplitPane } from "@/components/SplitPane";
import { LessonNav } from "@/components/LessonNav";
import fs from "node:fs";
import path from "node:path";

export const COURSE_NAME = "{{COURSE_NAME}}";

function frontmatter(slug: string): { title: string; commit: string } {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "src/app/lessons", slug, "page.mdx"),
    "utf8"
  );
  const title = raw.match(/^title:\s*"(.*)"/m)?.[1] ?? slug;
  const commit = raw.match(/^commit:\s*"(.*)"/m)?.[1] ?? "";
  return { title, commit };
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  const lessons = listLessons().map((slug) => ({ slug, ...frontmatter(slug) }));
  return (
    <div className="flex h-screen">
      <LessonNav courseName={COURSE_NAME} lessons={lessons.map((l) => ({ slug: l.slug, title: l.title }))} />
            <SplitPane
        storageKey="tbd.split.lesson.v4"
        defaultRight={900}
        minRight={600}
        maxRight={1200}
        left={
          <main className="flex h-full flex-col overflow-hidden">
            <article className="prose min-h-0 flex-1 overflow-y-auto p-8">{children}</article>
          </main>
        }
        right={
          <SplitPane
            storageKey="tbd.split.side.v4"
            defaultRight={380}
            minRight={260}
            maxRight={700}
            left={
              <div className="h-full min-w-0">
                <PlaygroundPane />
              </div>
            }
            right={<ChatPane />}
          />
        }
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
