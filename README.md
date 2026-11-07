# hypatia-packages

Downstream custom packages and surgical hardware/workflow patches for Arch Linux on `hypatia`.

Maintained by [@nooroid](https://github.com/nooroid).

---

## Packages

| Package | Upstream | Version | Key Enhancements |
| :--- | :--- | :--- | :--- |
| **`vicinae`** | [vicinaehq/vicinae](https://github.com/vicinaehq/vicinae) | `0.29.2` | Native `"show_status_bar": false` toggle, independent popover anchor for Ctrl+B actions menu, fixed clipboard copy bug for deeplinks/calculator, and custom per-command icon/emoji overrides in `settings.json`. |
| **`ytm-player`** | [peternaame-boop/ytm-player](https://github.com/peternaame-boop/ytm-player) | `2.1.0` | YouTube CDN `available_at` activation delay fix (stops 403 Forbidden / "stream failed twice"), Ghostty/Kitty shift-key normalizer, native Ataraxia green palette, and `python-dbus-fast` hard dependency. |
| **`tldraw-offline`** | [tldraw/tldraw-offline](https://github.com/tldraw/tldraw-offline) | `1.23.1` | Native PP Neue Montreal sans and IBM Plex Mono typography, plus FigJam-style multi-directional free resizing for sticky notes. |

---

## Vicinae Extensions

| Extension | Path | Description |
| :--- | :--- | :--- |
| **`pi-sessions`** | `extensions/pi-sessions` | Deep-search session resume tool for Pi coding agent. Indexes compaction goals, prompts, and keywords from `~/.pi/agent/sessions/`, with instant launch into Ghostty + tmux. |

---

## Installation & Building

Each package directory contains a standalone `PKGBUILD` and its patch. To build and install any package on Arch Linux:

```bash
cd vicinae      # or cd ytm-player or cd tldraw-offline
makepkg -si
```

* `makepkg -s` automatically installs all official build and runtime dependencies via `pacman`.
* `makepkg -i` registers the compiled package into your system's `pacman` database (`pacman -Q <pkg>`).

---

## Preventing `yay` / `pacman` From Overwriting Builds

To prevent automatic `yay -Syu` or `pacman -Syu` upgrades from replacing your customized packages with unpatched upstream versions, add them to `IgnorePkg` in `/etc/pacman.conf`:

```ini
# /etc/pacman.conf
[options]
IgnorePkg = vicinae ytm-player tldraw-offline-bin
```

Now `yay` will print a warning and preserve your custom builds until you decide to upgrade them manually.

---

## How to Upgrade When Upstream Releases a New Version

When upstream releases an update (e.g., Vicinae `0.35.0` or ytm-player `3.0.0`):

1. **Open the package directory:**
   ```bash
   cd ~/Projects/hypatia-packages/vicinae
   ```

2. **Update `pkgver`:**
   Edit `PKGBUILD` and bump `pkgver` to the new version:
   ```bash
   pkgver=0.35.0
   pkgrel=1
   ```

3. **Auto-update checksums with `updpkgsums`:**
   ```bash
   updpkgsums
   ```
   *`updpkgsums` automatically downloads the new upstream release tarball and refreshes all SHA-256 sums.*

4. **Compile and test the patch:**
   ```bash
   makepkg -si
   ```

#### If a patch fails to apply on a major release:
1. Check the `.rej` file created in `src/` to see what lines changed.
2. Update the patch:
   ```bash
   diff -Naur a/path b/path > your-patch.patch
   ```
3. Run `updpkgsums && makepkg -si`.
