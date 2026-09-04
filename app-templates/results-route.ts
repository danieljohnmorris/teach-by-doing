import { NextRequest, NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// Server-side result store. Lives beside the app so the course (content) is
// untouched. node:sqlite is built into Node >= 22.5; the app pins Node >= 24
// via Next 16, so no extra dep is required.
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "results.db");

interface Row {
  id: number;
  ts: number;
  lesson: string;
  widget: string;
  widget_id: string | null;
  value: string;
}

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      lesson TEXT NOT NULL,
      widget TEXT NOT NULL,
      widget_id TEXT,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS results_lesson_idx ON results(lesson, ts);
  `);
  return db;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    lesson?: string;
    widget?: string;
    widgetId?: string;
    value?: unknown;
  } | null;
  if (!body?.lesson || !body?.widget) {
    return NextResponse.json({ error: "lesson + widget required" }, { status: 400 });
  }
  const value = typeof body.value === "string" ? body.value : JSON.stringify(body.value ?? null);
  getDb()
    .prepare(
      "INSERT INTO results (ts, lesson, widget, widget_id, value) VALUES (?, ?, ?, ?, ?)"
    )
    .run(Date.now(), body.lesson, body.widget, body.widgetId ?? null, value);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const lesson = req.nextUrl.searchParams.get("lesson");
  const limit = Math.min(500, Number(req.nextUrl.searchParams.get("limit") ?? 100));
  const stmt = lesson
    ? getDb().prepare(
        "SELECT id, ts, lesson, widget, widget_id, value FROM results WHERE lesson = ? ORDER BY id DESC LIMIT ?"
      )
    : getDb().prepare(
        "SELECT id, ts, lesson, widget, widget_id, value FROM results ORDER BY id DESC LIMIT ?"
      );
  const rows = (lesson ? stmt.all(lesson, limit) : stmt.all(limit)) as unknown as Row[];
  return NextResponse.json({ rows });
}

export const dynamic = "force-dynamic";
