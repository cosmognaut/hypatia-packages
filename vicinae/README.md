# vicinae (hypatia fork)

Custom downstream build of the [Vicinae desktop launcher](https://github.com/vicinaehq/vicinae) for Arch Linux / Niri.

---

## Applied Patches: `hide-footer.patch`

This unified downstream patch delivers four core architectural enhancements and fixes to Vicinae:

### 1. Native `"show_status_bar": false` & Clean Edge Expansion
* **Upstream Problem:** In stock Vicinae, the bottom status bar and keybinding footer (`Footer.qml`) is hardcoded to be visible on any launcher search.
* **Downstream Solution:**
  - Adds `bool showStatusBar = true;` to `WindowConfig` in `src/server/src/config/config.hpp`.
  - Exposes `Config.showStatusBar` to Qt Quick / QML via `config-bridge.hpp`.
  - When `show_status_bar: false` is configured, `LauncherWindow.qml` unloads the footer component, collapses its height to `0`, and expands the results list view flush to the bottom window margin without blank padding.
  - Adds a GUI toggle under **Settings → Appearance**.

### 2. Independent Action Popover Anchor (Ctrl+B & Menu Fix)
* **Upstream Problem:** Stock `ActionPanelPopover` parented itself to `floatingStatusBar`. When the status bar is hidden (`visible = false`), Qt Quick's scene graph culls all child items, making the Ctrl+B actions popover and footer menu completely invisible.
* **Downstream Solution:**
  - Implements an independent `popoverAnchor` at the bottom-right corner of the window.
  - When `show_status_bar = false`, popovers dynamically re-parent to `popoverAnchor`, floating 6px above the content area aligned flush with the right padding.
  - When `show_status_bar = true`, popovers seamlessly anchor to the status bar footer.

### 3. Clipboard History Drop Bug Fix (`copyText`)
* **Upstream Problem:** Upstream mistakenly declared `copyText` with default parameter `options = {.concealed = true}` in `clipboard-service.hpp` (unlike `copyHtml`, `copyFile`, and `copyUrls` which defaulted to `false`). Because `concealed = true` marks the Wayland selection with MIME type `vicinae/concealed`, `vicinae-data-control-server` deliberately dropped the event. Copying deeplinks, calculator results, or dmenu items copied to the system clipboard but were barred from entering Vicinae's own `clipboard.db` history.
* **Downstream Solution:**
  - Fixed `copyText` default parameter to `{.concealed = false}`. All Vicinae copy actions now immediately index into clipboard history (`mod+P`).

### 4. Custom Entrypoint Icons & Emojis in `settings.json`
* **Upstream Problem:** All built-in commands (Clipboard History, Calculator, Settings, etc.) had their icons hardcoded in C++ (such as Clipboard History's red badge). Users had no way to change icons without recompiling.
* **Downstream Solution:**
  - Added `std::optional<std::string> icon;` to `ProviderItemData` in `src/server/src/config/config.hpp`.
  - `RootItemManager` extracts `itemConfig->icon` and resolves it dynamically across all search sections (`RootFavoritesSection`, `RootResultsSection`, `RootFallbackSection`, and `ProviderSearchSection`).
  - Accepts any UTF-8 emoji (e.g. `"📋"`, `"🧮"`, `"👻"`), `"none"` (to hide the icon box completely), local image paths, or built-in icon glyphs.
  - Supports live reloading: changes in `settings.json` apply instantly without restarting the server.

---

## Configuration (`~/.config/vicinae/settings.json`)

Here is an example demonstrating the new configuration options:

```json
{
   "launcher_window": {
      "client_side_decorations": {
         "enabled": false
      },
      "compact_mode": {
         "enabled": false
      },
      "show_status_bar": false
   },
   "providers": {
      "clipboard": {
         "entrypoints": {
            "history": {
               "icon": "📋"
            }
         }
      },
      "calculator": {
         "entrypoints": {
            "index": {
               "icon": "🧮"
            }
         }
      },
      "applications": {
         "entrypoints": {
            "org.ghostty.Ghostty": {
               "icon": "👻"
            }
         }
      }
   }
}
```

### Supported Values for `"icon"`:
| Value | Result |
| :--- | :--- |
| `"📋"`, `"🔥"`, `"⭐"` | Renders the native emoji using system font (`Noto Color Emoji` / `Twemoji` / `$EMOJI_FONT`). |
| `"none"` or `""` | Completely removes the icon, collapsing the row to a clean text-only layout. |
| `"copy-clipboard"`, `"terminal"` | Uses a Vicinae built-in vector icon. |
| `"/path/to/icon.png"` | Renders any local PNG/SVG image file. |

---

## Building & Installing

To compile and install with the new patch:

```bash
cd ~/Projects/hypatia-packages/vicinae
makepkg -sfi --nodeps
```

Once installed, restart the background daemon:

```bash
systemctl --user restart vicinae.service
```
*(Compilation uses `cmake -G Ninja -j 2` in `PKGBUILD` to prevent OOM errors).*
