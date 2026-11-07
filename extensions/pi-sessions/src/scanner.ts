import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import { SessionEntry } from "./types";
import { loadCache, saveCache } from "./cache";

const SESSIONS_DIR = path.join(os.homedir(), ".pi", "agent", "sessions");

function extractTokens(text: string): string[] {
  if (!text) return [];
  const words = text.toLowerCase().match(/[a-z0-9_\-\.]{3,35}/g);
  return words || [];
}

async function parseSingleSession(filePath: string): Promise<SessionEntry> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let sessionObj: { id?: string; cwd?: string; timestamp?: string } | null = null;
  let sessionName: string | null = null;
  let firstPrompt: string | null = null;
  let compactionGoal: string | null = null;
  const keywordsSet = new Set<string>();
  let userMsgCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      if (data.type === "session") {
        sessionObj = data;
        if (data.cwd) {
          const parts = data.cwd.split("/").filter(Boolean);
          for (const p of parts) {
            keywordsSet.add(p.toLowerCase());
          }
        }
      } else if (data.type === "session_info" && data.name) {
        sessionName = data.name;
        for (const token of extractTokens(data.name)) {
          keywordsSet.add(token);
        }
      } else if (data.type === "compaction" && data.summary) {
        const goalMatch = data.summary.match(/## Goal\n([^\n]+)/);
        if (goalMatch) {
          compactionGoal = goalMatch[1].trim();
        }
        for (const token of extractTokens(data.summary)) {
          keywordsSet.add(token);
        }
      } else if (data.type === "message" && data.message?.role === "user") {
        userMsgCount++;
        const content = data.message.content;
        const text = Array.isArray(content)
          ? content.map((c: { text?: string }) => c.text || "").join(" ").trim()
          : typeof content === "string"
          ? content.trim()
          : "";

        if (text) {
          if (!firstPrompt) firstPrompt = text;
          for (const token of extractTokens(text)) {
            keywordsSet.add(token);
          }
        }
      }
    } catch {}
  }

  const stat = fs.statSync(filePath);
  const fallbackId = path.basename(filePath, ".jsonl");

  if (sessionObj?.id) {
    keywordsSet.add(sessionObj.id.toLowerCase());
  }

  return {
    id: sessionObj?.id || fallbackId,
    cwd: sessionObj?.cwd || os.homedir(),
    filePath,
    name: sessionName,
    firstPrompt: firstPrompt ? firstPrompt.slice(0, 100).replace(/\s+/g, " ") : null,
    compactionGoal,
    userMsgCount,
    mtime: stat.mtimeMs,
    keywords: Array.from(keywordsSet),
  };
}

export async function getSessions(forceRefresh = false): Promise<SessionEntry[]> {
  if (!fs.existsSync(SESSIONS_DIR)) return [];

  const cache = forceRefresh ? {} : loadCache();
  const nextCache: Record<string, SessionEntry> = {};

  const entries = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true });
  const projectDirs = entries.filter(
    (d) => d.isDirectory() && d.name.startsWith("--") && d.name.endsWith("--")
  );

  const filePaths: string[] = [];
  for (const dir of projectDirs) {
    const dirFullPath = path.join(SESSIONS_DIR, dir.name);
    try {
      const files = fs.readdirSync(dirFullPath);
      for (const f of files) {
        if (f.endsWith(".jsonl")) {
          filePaths.push(path.join(dirFullPath, f));
        }
      }
    } catch {}
  }

  const toParse: string[] = [];
  const results: SessionEntry[] = [];

  for (const p of filePaths) {
    try {
      const stat = fs.statSync(p);
      const cached = cache[p];
      if (cached && Math.abs(cached.mtime - stat.mtimeMs) < 1000) {
        results.push(cached);
        nextCache[p] = cached;
      } else {
        toParse.push(p);
      }
    } catch {}
  }

  if (toParse.length > 0) {
    const parsed = await Promise.all(toParse.map(parseSingleSession));
    for (const item of parsed) {
      results.push(item);
      nextCache[item.filePath] = item;
    }
  }

  // Save updated cache
  saveCache(nextCache);

  // Sort descending by last modified
  results.sort((a, b) => b.mtime - a.mtime);
  return results;
}
