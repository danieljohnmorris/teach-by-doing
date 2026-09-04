import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// All providers ride subscriptions or local models — no API credits.
// ollama: local model. claude/zai: claude CLI (subscription / z.ai coding plan).
// pi: the omp agent runtime.
const provider = process.env.TUTOR_PROVIDER ?? "ollama";

const SYSTEM = `You are a Rust tutor for the teach-rust course, walking the ilo-lang project.
The learner is practicing in the "question / free-text answer" widget. Grade their answer:
- Say whether it's correct, partially correct, or wrong, and why.
- Be terse: 1-3 sentences, then at most one follow-up probe.
- Never just repeat the expected answer text; assess what they actually wrote.
If the message has mode 'chat', answer as a tutor normally.`;

async function askOllama(prompt: string): Promise<string> {
  const ollama = createOpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
  const { text } = await generateText({
    model: ollama(process.env.TUTOR_OLLAMA_MODEL ?? "kimi-k3:cloud"),
    system: SYSTEM,
    prompt,
  });
  return text;
}

interface CliSpec {
  command: string;
  args: string[];
  extraEnv?: Record<string, string>;
}

function cliSpec(prompt: string): CliSpec {
  const full = `${SYSTEM}\n\n${prompt}`;
  if (provider === "pi") {
    return { command: "pi", args: ["-p", full] };
  }
  if (provider === "zai") {
    // claude CLI against z.ai's Anthropic-compatible endpoint (coding plan).
    return {
      command: "claude",
      args: ["-p", full],
      extraEnv: {
        ANTHROPIC_BASE_URL: "https://api.z.ai/api/anthropic",
        ANTHROPIC_AUTH_TOKEN: process.env.ZAI_API_KEY ?? "",
      },
    };
  }
  return { command: "claude", args: ["-p", full] };
}

async function askCli(prompt: string): Promise<string> {
  const spec = cliSpec(prompt);
  const { stdout } = await execFileAsync(spec.command, spec.args, {
    env: { ...process.env, ...spec.extraEnv },
    maxBuffer: 4 * 1024 * 1024,
    timeout: 120_000,
  });
  return stdout.trim();
}

async function ask(prompt: string): Promise<string> {
  if (provider === "ollama") {
    return askOllama(prompt);
  }
  return askCli(prompt);
}

export async function POST(req: Request) {
  const body = await req.json();
  const prompt =
    body.mode === "grade"
      ? `Lesson: ${body.lesson}\nQuestion: ${body.question}\nLearner's answer: ${body.answer}\n\nGrade it.`
      : body.message;

  try {
    const reply = await ask(prompt);
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { reply: `Tutor backend (${provider}) failed: ${message}` },
      { status: 502 },
    );
  }
}
