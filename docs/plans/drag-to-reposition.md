# Drag-to-reposition widgets

Status: planned, not started
Applies to: tsushin (this repo), then port to ubersicht_google_calendar, then ubersicht_gmail

## Problem

Widget position is set via `left`/`top` in the installed widget's `config.json`
(under `~/Library/Application Support/Übersicht/widgets/<widget>/config.json`),
edited by hand. There's no way to reposition a widget from the desktop itself.

## Why this is feasible with low complexity

Übersicht widgets run with full Node integration, not a sandboxed browser context.
Proof: `tsushin.widget/tsushin.jsx` already does `const overrides = require("./config.json")`
at module load time. This means a widget's own JS can also *write* to that file with
`fs.writeFileSync` — no shell-command roundtrip, no IPC, no extra permissions.

That collapses "drag-to-reposition" into two independent, well-understood pieces:

1. Client-side drag: standard mousedown/mousemove/mouseup, updating the widget's
   on-screen position live (CSS, not React state, so it's smooth at 60fps and
   independent of Übersicht's `refreshFrequency` poll cycle).
2. Persistence: on mouseup, write the final `{ left, top }` back into `config.json`
   with `fs.writeFileSync`, so it survives the next Übersicht reload/refresh.

No architecture change. No visual/design change to the widget itself — this is
purely an added interaction affordance on top of the existing static-position model.

## Design

### New module: `src/shared/draggable.ts`

Framework-agnostic, dependency-free (just `fs`/`path` from Node). Exports one function:

```ts
interface DraggableOptions {
  configPath: string;       // absolute path to the installed widget's config.json
  initial: { left: string; top: string }; // current position, e.g. "30%", "63%"
  onPositionChange?: (pos: { left: string; top: string }) => void; // optional live callback
}

function attachDragHandle(el: HTMLElement, options: DraggableOptions): () => void;
// returns a cleanup/detach function
```

Behavior:
- `mousedown` on `el` starts tracking; records the widget's current screen rect and
  pointer offset.
- `mousemove` (attached to `window`, removed on `mouseup`) updates `el.style.left` /
  `el.style.top` directly via the DOM — convert pixel delta into the same unit
  (`%` of screen width/height, matching the existing `ViewConfig.left`/`top` format)
  so the persisted value round-trips through the same config shape Übersicht already
  expects.
- `mouseup` computes the final `{ left, top }`, calls
  `fs.writeFileSync(configPath, JSON.stringify({ left, top }, null, 2))`, and detaches
  the window listeners. If `onPositionChange` is provided, call it too (lets the
  widget update its own in-memory config immediately rather than waiting for the
  next Übersicht reload).

Percent-based left/top means dragging near a screen edge naturally behaves sensibly
across different monitor sizes — keep that unit, don't switch to px.

### Wiring into `src/shared/widget.tsx`

- Add a small drag handle element to the rendered widget (e.g. a ~16x16 grip icon in
  a corner, `opacity: 0` by default, `opacity: 0.6` on widget `:hover`) so dragging is
  discoverable but doesn't visually clutter the chart. This is the only DOM addition;
  it does not touch chart rendering, colors, or layout logic.
- In `createTsushinWidget(config)`, after mount (Übersicht calls `render` repeatedly,
  so attach the listener via a `ref`/DOM query on the grip element inside `render`,
  guarding against re-attaching listeners on every refresh cycle — e.g. a
  `data-drag-bound` attribute check before calling `attachDragHandle` again).
- Pass `configPath` as `path.join(widgetDir, "config.json")` — `widgetDir` is already
  in `ViewConfig`.

### Config plumbing

No changes needed to `ViewConfig`, `install.sh`, or the build script — dragging only
ever mutates the *installed* `config.json`, which is exactly the file `install.sh`
already treats as user data to preserve across reinstalls (see `install_widget`'s
existing `preserved_config` logic). This plan doesn't change that contract.

### Reuse across the other two widgets

Once proven in tsushin:
- Copy `src/shared/draggable.ts` verbatim into `ubersicht_google_calendar` (already
  on the same TS/JSX + `config.json` pattern) and wire it the same way.
- Do the same for `ubersicht_gmail` once its CoffeeScript→TS/JSX migration lands.
- Keep it a copy-paste module for now (3 small personal repos, not a published
  library) rather than publishing an npm package — revisit only if the same bug
  needs fixing in more than one repo more than once.

## Out of scope

- No visual redesign of any widget.
- No settings UI beyond the drag handle itself (no numeric input, no snap-to-grid).
- No multi-monitor-specific logic beyond what percent-based positioning already gives.
- No undo/redo for position changes — dragging again fixes a bad drop.

## Implementation steps

1. Write `src/shared/draggable.ts` with `attachDragHandle`, unit-agnostic pixel↔percent
   conversion helpers, and a small manual test harness note (see Verification below) — no
   automated test framework exists in this repo yet, so keep the module simple enough to
   verify by hand.
2. Add the grip handle + wiring to `src/shared/widget.tsx` (`renderWidget`), gated so
   listeners attach once per DOM node, not once per refresh tick.
3. `pnpm run build && ./install.sh both`, reload Übersicht, verify drag on the
   regular widget.
4. Confirm `config.json` in the installed widget directory updates after drop, and that
   a subsequent `./install.sh regular` (reinstall) preserves the new position (this
   already works today for hand-edited config.json, per `install_widget`'s preserve logic
   — just confirm dragging doesn't break that path).
5. Port to `tsushin_small.widget` (same module, same wiring point, smaller grip).
6. Port `draggable.ts` + wiring to `ubersicht_google_calendar`.
7. Once `ubersicht_gmail` is TS/JSX-converted, port there too.

## Verification (manual — no CI/telemetry in this project)

- Drag regular widget to a new position; confirm it lands where the cursor released it.
- Reload Übersicht; confirm the widget stays at the dragged position (not reset to
  `defaultViewConfig`).
- Reinstall (`./install.sh regular`); confirm the dragged position survives (via the
  existing config-preservation logic in `install.sh`).
- Resize/rotate display (or test on a second monitor if available); confirm percent-based
  position still looks reasonable rather than off-screen.
- Confirm the drag handle doesn't interfere with normal widget rendering when not
  being dragged (no layout shift, no stray pointer-events blocking).
