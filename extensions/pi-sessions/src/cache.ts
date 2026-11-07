import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SessionCacheData, SessionEntry } from "./types";

const CACHE_DIR = path.join(os.homedir(), ".cache", "vicinae");
const CACHE_FILE = path.join(CACHE_DIR, "pi-sessions-cache.json");
const CACHE_VERSION = 2;

export function loadCache(): Record<string, SessionEntry> {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed: SessionCacheData = JSON.parse(raw);
    if (parsed.version !== CACHE_VERSION || !parsed.sessions) return {};
    return parsed.sessions;
  } catch {
    return {};
  }
}

export function saveCache(sessionsMap: Record<string, SessionEntry>): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const data: SessionCacheData = {
      version: CACHE_VERSION,
      sessions: sessionsMap,
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), "utf-8");
  } catch (err) {
    console.error("Failed to save pi sessions cache:", err);
  }
}

export function removeFromCache(filePath: string): void {
  try {
    const current = loadCache();
    if (current[filePath]) {
      delete current[filePath];
      saveCache(current);
    }
  } catch (err) {
    console.error("Failed to remove from cache:", err);
  }
}
