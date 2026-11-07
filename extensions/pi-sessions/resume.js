"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/resume.tsx
var resume_exports = {};
__export(resume_exports, {
  default: () => ResumeCommand
});
module.exports = __toCommonJS(resume_exports);
var import_api = require("@vicinae/api");
var import_react = require("react");

// src/scanner.ts
var import_node_fs2 = __toESM(require("node:fs"));
var import_node_path2 = __toESM(require("node:path"));
var import_node_os2 = __toESM(require("node:os"));
var import_node_readline = __toESM(require("node:readline"));

// src/cache.ts
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var import_node_os = __toESM(require("node:os"));
var CACHE_DIR = import_node_path.default.join(import_node_os.default.homedir(), ".cache", "vicinae");
var CACHE_FILE = import_node_path.default.join(CACHE_DIR, "pi-sessions-cache.json");
var CACHE_VERSION = 2;
function loadCache() {
  try {
    if (!import_node_fs.default.existsSync(CACHE_FILE)) return {};
    const raw = import_node_fs.default.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.version !== CACHE_VERSION || !parsed.sessions) return {};
    return parsed.sessions;
  } catch {
    return {};
  }
}
function saveCache(sessionsMap) {
  try {
    if (!import_node_fs.default.existsSync(CACHE_DIR)) {
      import_node_fs.default.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const data = {
      version: CACHE_VERSION,
      sessions: sessionsMap
    };
    import_node_fs.default.writeFileSync(CACHE_FILE, JSON.stringify(data), "utf-8");
  } catch (err) {
    console.error("Failed to save pi sessions cache:", err);
  }
}

// src/scanner.ts
var SESSIONS_DIR = import_node_path2.default.join(import_node_os2.default.homedir(), ".pi", "agent", "sessions");
function extractTokens(text) {
  if (!text) return [];
  const words = text.toLowerCase().match(/[a-z0-9_\-\.]{3,35}/g);
  return words || [];
}
async function parseSingleSession(filePath) {
  const fileStream = import_node_fs2.default.createReadStream(filePath);
  const rl = import_node_readline.default.createInterface({ input: fileStream, crlfDelay: Infinity });
  let sessionObj = null;
  let sessionName = null;
  let firstPrompt = null;
  let compactionGoal = null;
  const keywordsSet = /* @__PURE__ */ new Set();
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
        const text = Array.isArray(content) ? content.map((c) => c.text || "").join(" ").trim() : typeof content === "string" ? content.trim() : "";
        if (text) {
          if (!firstPrompt) firstPrompt = text;
          for (const token of extractTokens(text)) {
            keywordsSet.add(token);
          }
        }
      }
    } catch {
    }
  }
  const stat = import_node_fs2.default.statSync(filePath);
  const fallbackId = import_node_path2.default.basename(filePath, ".jsonl");
  if (sessionObj?.id) {
    keywordsSet.add(sessionObj.id.toLowerCase());
  }
  return {
    id: sessionObj?.id || fallbackId,
    cwd: sessionObj?.cwd || import_node_os2.default.homedir(),
    filePath,
    name: sessionName,
    firstPrompt: firstPrompt ? firstPrompt.slice(0, 100).replace(/\s+/g, " ") : null,
    compactionGoal,
    userMsgCount,
    mtime: stat.mtimeMs,
    keywords: Array.from(keywordsSet)
  };
}
async function getSessions(forceRefresh = false) {
  if (!import_node_fs2.default.existsSync(SESSIONS_DIR)) return [];
  const cache = forceRefresh ? {} : loadCache();
  const nextCache = {};
  const entries = import_node_fs2.default.readdirSync(SESSIONS_DIR, { withFileTypes: true });
  const projectDirs = entries.filter(
    (d) => d.isDirectory() && d.name.startsWith("--") && d.name.endsWith("--")
  );
  const filePaths = [];
  for (const dir of projectDirs) {
    const dirFullPath = import_node_path2.default.join(SESSIONS_DIR, dir.name);
    try {
      const files = import_node_fs2.default.readdirSync(dirFullPath);
      for (const f of files) {
        if (f.endsWith(".jsonl")) {
          filePaths.push(import_node_path2.default.join(dirFullPath, f));
        }
      }
    } catch {
    }
  }
  const toParse = [];
  const results = [];
  for (const p of filePaths) {
    try {
      const stat = import_node_fs2.default.statSync(p);
      const cached = cache[p];
      if (cached && Math.abs(cached.mtime - stat.mtimeMs) < 1e3) {
        results.push(cached);
        nextCache[p] = cached;
      } else {
        toParse.push(p);
      }
    } catch {
    }
  }
  if (toParse.length > 0) {
    const parsed = await Promise.all(toParse.map(parseSingleSession));
    for (const item of parsed) {
      results.push(item);
      nextCache[item.filePath] = item;
    }
  }
  saveCache(nextCache);
  results.sort((a, b) => b.mtime - a.mtime);
  return results;
}

// src/launcher.ts
var import_node_child_process = require("node:child_process");
var import_node_path3 = __toESM(require("node:path"));
function launchPiSession(session) {
  const windowName = session.name || import_node_path3.default.basename(session.cwd) || "pi";
  (0, import_node_child_process.execFile)("tmux", ["has-session", "-t", "pi"], (err) => {
    if (!err) {
      (0, import_node_child_process.execFile)(
        "tmux",
        [
          "new-window",
          "-a",
          "-t",
          "pi:",
          "-c",
          session.cwd,
          "-n",
          windowName,
          `pi --session "${session.filePath}"`
        ],
        (winErr) => {
          if (winErr) {
            console.error("Failed to create tmux window:", winErr);
          }
          (0, import_node_child_process.execFile)("tmux", ["list-clients", "-t", "pi"], (clientErr, stdout) => {
            if (!clientErr && stdout.trim().length > 0) {
              (0, import_node_child_process.execFile)("niri", ["msg", "action", "focus-window", "--app-id", "com.mitchellh.ghostty"], () => {
              });
            } else {
              const ghostty = (0, import_node_child_process.spawn)("ghostty", ["-e", "tmux", "attach-session", "-t", "pi"], {
                detached: true,
                stdio: "ignore"
              });
              ghostty.unref();
            }
          });
        }
      );
    } else {
      const ghostty = (0, import_node_child_process.spawn)(
        "ghostty",
        [
          "-e",
          "tmux",
          "new-session",
          "-s",
          "pi",
          "-c",
          session.cwd,
          "-n",
          windowName,
          `pi --session "${session.filePath}"`
        ],
        {
          detached: true,
          stdio: "ignore"
        }
      );
      ghostty.unref();
    }
  });
}

// src/utils.ts
function formatTimeAgo(timestampMs) {
  const diffSec = Math.floor((Date.now() - timestampMs) / 1e3);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  const d = new Date(timestampMs);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// src/resume.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function ResumeCommand() {
  const [sessions, setSessions] = (0, import_react.useState)([]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const loadData = (0, import_react.useCallback)(async (force = false) => {
    setLoading(true);
    try {
      const list = await getSessions(force);
      setSessions(list);
    } catch (err) {
      console.error("Failed to load pi sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);
  (0, import_react.useEffect)(() => {
    loadData();
  }, [loadData]);
  const handleSelect = (0, import_react.useCallback)((session) => {
    (0, import_api.closeMainWindow)();
    launchPiSession(session);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_api.List,
    {
      isLoading: loading,
      searchBarPlaceholder: "Search pi sessions by name, goal, or keywords...",
      filtering: true,
      children: sessions.map((session) => {
        const title = session.name || session.compactionGoal || session.firstPrompt || `Session ${session.id.slice(0, 8)}`;
        const cleanCwd = session.cwd.replace(process.env.HOME || "", "~");
        const accessories = [
          { text: formatTimeAgo(session.mtime) }
        ];
        if (session.name) {
          accessories.unshift({
            tag: { value: "Named", color: import_api.Color.Green }
          });
        }
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api.List.Item,
          {
            title,
            subtitle: cleanCwd,
            keywords: session.keywords,
            icon: "icon.png",
            accessories,
            actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.ActionPanel, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Resume in tmux",
                  icon: import_api.Icon.Terminal,
                  onAction: () => handleSelect(session)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action.CopyToClipboard,
                {
                  title: "Copy Resume Command",
                  content: `pi --session "${session.filePath}"`
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action.CopyToClipboard,
                {
                  title: "Copy Session Path",
                  content: session.filePath
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action.CopyToClipboard,
                {
                  title: "Copy Session ID",
                  content: session.id
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action.CopyToClipboard,
                {
                  title: "Copy Working Directory",
                  content: session.cwd
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.ActionPanel.Section, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Refresh Sessions",
                  icon: import_api.Icon.ArrowClockwise,
                  shortcut: { modifiers: ["cmd"], key: "r" },
                  onAction: () => loadData(true)
                }
              ) })
            ] })
          },
          session.filePath
        );
      })
    }
  );
}
