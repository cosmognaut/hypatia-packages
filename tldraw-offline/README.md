# tldraw-offline (hypatia fork)

Custom downstream packaging and patches for [tldraw-offline](https://github.com/tldraw/tldraw-offline) on Arch Linux.

---

## Applied Patches: `tldraw-enhancements.patch`

This unified downstream patch delivers custom typography and FigJam-style sticky note ergonomics to tldraw offline:

### 1. Typography: PP Neue Montreal & IBM Plex Mono
* **`chunk-WESP7CPQ.js`**:
  - Overrides `DefaultFontFamilies.sans` to use `'PP Neue Montreal', sans-serif`.
  - Overrides `DefaultFontFamilies.mono` to use `'IBM Plex Mono', 'tldraw_mono', monospace`.
  - Seamlessly renders local system fonts installed in `~/.local/share/fonts/` without breaking fallback web fonts.

### 2. FigJam-Style Free Sticky Note Resizing (Behavior A)
* **Upstream Problem:** In stock tldraw, sticky notes (`NoteShapeUtil`) have fixed square dimensions (`200x200`) and lock aspect ratio (`isAspectRatioLocked = true`), preventing resizing into rectangles or cards.
* **Downstream Solution:**
  - Adds `growX: validation_exports.positiveNumber.optional()` to `noteShapeProps` in `chunk-WESP7CPQ.js`.
  - Sets `isAspectRatioLocked` and `hideResizeHandles` to `false` in `NoteShapeUtil` (`chunk-3W5KUHKC.js`).
  - Implements multi-directional resizing in `NoteShapeUtil.onResize`:
    - **Side handles (left/right)**: Expand or contract width independently.
    - **Side handles (top/bottom)**: Expand or contract height independently.
    - **Corner handles**: Resize both width and height freely into cards/rectangles.
    - **Holding Shift**: Constrains proportions to square aspect ratio.
  - Dynamically updates text wrap bounds (`measureNoteLabelSize`), selection indicator box (`getIndicatorPath`), and SVG export canvas (`toSvg`) to preserve custom dimensions.

---

## Installation & Building

```bash
cd ~/Projects/hypatia-packages/tldraw-offline
makepkg -si
```
*(Builds and patches directly from the upstream Linux package in ~15 seconds without compiling Electron from source).*

---

## Prevent Updates from Overwriting Customizations

Add `tldraw-offline-bin` to `IgnorePkg` in `/etc/pacman.conf`:

```ini
# /etc/pacman.conf
[options]
IgnorePkg = vicinae ytm-player tldraw-offline-bin
```
