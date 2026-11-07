import { spawn, execFile } from "node:child_process";
import { SessionEntry } from "./types";

export function launchPiSession(session: SessionEntry): void {
  // Check if tmux session 'pi' is already running
  execFile("tmux", ["has-session", "-t", "pi"], (err) => {
    if (!err) {
      // Session 'pi' exists: create a new window with this session and attach Ghostty
      execFile(
        "tmux",
        ["new-window", "-t", "pi", "-c", session.cwd, `pi --session "${session.filePath}"`],
        (winErr) => {
          if (winErr) {
            console.error("Failed to create tmux window:", winErr);
          }
          // Launch or bring up Ghostty attached to session pi
          const ghostty = spawn("ghostty", ["-e", "tmux", "attach-session", "-t", "pi"], {
            detached: true,
            stdio: "ignore",
          });
          ghostty.unref();
        }
      );
    } else {
      // Session 'pi' does not exist: create it in the target cwd and run pi
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
