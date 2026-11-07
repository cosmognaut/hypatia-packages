export interface SessionEntry {
  id: string;
  cwd: string;
  filePath: string;
  name: string | null;
  firstPrompt: string | null;
  compactionGoal: string | null;
  userMsgCount: number;
  mtime: number;
  keywords: string[];
}

export interface SessionCacheData {
  version: number;
  sessions: Record<string, SessionEntry>;
}
