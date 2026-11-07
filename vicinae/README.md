# vicinae (hypatia fork)

Custom downstream build of the [Vicinae desktop launcher](https://github.com/vicinaehq/vicinae) for Arch Linux / Niri.

---

## Applied Patches: `hide-footer.patch`

In stock Vicinae, the bottom status bar and actions footer (`Footer.qml`) is hardcoded to be visible whenever the launcher displays search items or results.

This patch introduces a first-class configuration toggle:

1. **`config.hpp`**: Adds `bool showStatusBar = true;` to `WindowConfig`. Maps directly to `"show_status_bar"` in `~/.config/vicinae/settings.json`.
2. **`config-bridge.hpp`**: Exposes `Config.showStatusBar` to Qt Quick / QML.
3. **`LauncherWindow.qml`**:
   - Collapses `floatingStatusBar` height to `0` and unloads its component when `show_status_bar = false`.
   - The search results list view expands to fill the entire bottom edge without empty margins.
   - Preserves action menus: `ActionPanelPopover` and `footerMenuPopover` cleanly fall back to `root` with dynamic positioning, so pressing `Ctrl+B` still pops open the actions menu at the bottom-right corner of the window.
4. **`AppearanceSettingsPage.qml`**: Adds a GUI toggle under Settings → Appearance.

---

## Configuration

In `~/.config/vicinae/settings.json`:

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
   }
}
```

---

## Building

```bash
cd ~/Projects/hypatia-packages/vicinae
makepkg -si
```
*(Builds with `cmake -G Ninja -j 2` to prevent out-of-memory lockups on 8-core CPUs).*
