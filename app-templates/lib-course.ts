import fs from "node:fs";
import path from "node:path";

const LESSONS_DIR = path.join(process.cwd(), "src/app/lessons");

export function listLessons(): string[] {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  return fs
    .readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(LESSONS_DIR, e.name, "page.mdx")))
    .map((e) => e.name)
    .sort();
}
