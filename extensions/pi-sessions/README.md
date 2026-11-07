# pi-sessions (Vicinae Extension)

A deep-search session resume extension for [Pi](https://github.com/earendil-works/pi) and [Vicinae](https://github.com/vicinaehq/vicinae) on Arch Linux / Niri.

---

## Features

- **Deep Context Indexing**:
  - Bypasses subagent clutter (`artifacts/` and `.subagents/`) to scan raw user sessions in `~/.pi/agent/sessions/--*--/*.jsonl`.
  - Indexes explicit session names (`pi -n` / `/name`), compaction summaries (`## Goal...`), initial user prompts, and conversation tokens.
  - Queries like `rtw88`, `easyeffects`, `bluetooth`, or `ataraxia` match even when buried deep in past session context.
- **Sub-10ms Startup**:
  - Persists session metadata to `~/.cache/vicinae/pi-sessions-cache.json`.
  - Evaluates file `mtime` so only newly modified or created sessions are parsed on launch.
- **Tmux & Ghostty Integration**:
  - **Enter**: Immediately closes Vicinae:
    - If session `'pi'` is already running and attached to a terminal, appends a new window (`tmux new-window -a -t pi:`) running `pi --session '<path>'` and instructs Niri to focus your active Ghostty window.
    - If session `'pi'` is running but detached, appends the window and spawns Ghostty attached to `'pi'`.
    - If session `'pi'` is not active, spawns Ghostty creating `tmux new-session -s pi -c '<cwd>' 'pi --session <path>'`.
- **Action Panel Utilities (`control+L` / `control+B`)**:
  - Copy Resume Command (`pi --session ...`)
  - Copy Session File Path
  - Copy Session ID
  - Copy Working Directory
  - Force Refresh Sessions Cache

---

## Installation & Linking

To install or link into Vicinae:

```bash
mkdir -p ~/.local/share/vicinae/extensions
ln -s ~/Projects/hypatia-packages/extensions/pi-sessions ~/.local/share/vicinae/extensions/store.vicinae.pi-sessions
```

---

## Building from Source

```bash
cd ~/Projects/hypatia-packages/extensions/pi-sessions
npm install
npm run build
```

---

## Vicinae Configuration

In `~/.config/vicinae/settings.json`:

```json
{
   "favorites": [
      "@nooroid/store.vicinae.pi-sessions:resume"
   ],
   "providers": {
      "@nooroid/store.vicinae.pi-sessions": {
         "entrypoints": {
            "resume": {
               "alias": "p"
            }
         }
      }
   }
}
```
*(Typing `p ` in Vicinae jumps directly into session search).*
