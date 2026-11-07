import { spawn, execFile } from "node:child_process";
import path from "node:path";
import { SessionEntry } from "./types";

export function launchPiSession(session: SessionEntry): void {
  const windowName = session.name || path.basename(session.cwd) || "pi";

  execFile("tmux", ["has-session", "-t", "pi"], (err) => {
    if (!err) {
      // Session 'pi' exists: create a new window in the session
      execFile(
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
          `pi --session "${session.filePath}"`,
        ],
        (winErr) => {
          if (winErr) {
            console.error("Failed to create tmux window:", winErr);
          }
          // Check if any client is already attached to session 'pi'
          execFile("tmux", ["list-clients", "-t", "pi"], (clientErr, stdout) => {
            if (!clientErr && stdout.trim().length > 0) {
              // A terminal is already viewing 'pi': focus it in Niri
              execFile("niri", ["msg", "action", "focus-window", "--app-id", "com.mitchellh.ghostty"], () => {});
            } else {
              // No terminal attached: spawn a new Ghostty attached to 'pi'
              const ghostty = spawn("ghostty", ["-e", "tmux", "attach-session", "-t", "pi"], {
                detached: true,
                stdio: "ignore",
              });
              ghostty.unref();
            }
          });
        }
      );
    } else {
      // Session 'pi' does not exist: create it in target cwd and run pi
      const ghostty = spawn(
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
          `pi --session "${session.filePath}"`,
        ],
        {
          detached: true,
          stdio: "ignore",
        }
      );
      ghostty.unref();
    }
  });
}
