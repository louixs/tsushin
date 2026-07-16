# tsushin (通信)

`tsushin` is an [Übersicht](https://tracesof.net/uebersicht/) widget that shows live network throughput on macOS.

It samples the active network interface, calculates download and upload throughput in `kB/s`, and renders a bounded rolling chart so the graph stays responsive over long runtimes.

Regular widget:

![Tsushin regular](docs/media/screenshot.png)

Small widget:

![Tsushin small](docs/media/screenshot_small.png)

Animated previews:

![Tsushin regular animation](docs/media/tsushin.gif)

![Tsushin small animation](docs/media/tsushin_small.gif)

## What is included

- `tsushin.widget`: regular version, default size `400 x 250`
- `tsushin_small.widget`: compact version, default size `200 x 50`
- `scripts/install-widgets.mjs` (via `pnpm run deploy`): installs one or both generated widgets into your local Übersicht widgets folder
- `src/`: TypeScript source used to generate the shipped `.jsx` widgets

## Features

- Rolling 1-hour graph window
- Automatic active-interface detection
- Download and upload lines rendered locally with SVG
- No external chart library or CDN dependency
- Drag-to-reposition: grab the grip handle in the corner to move the widget on screen
- Local `config.json` file for simple on-screen positioning
- Shared TypeScript implementation for both widget sizes

## Install

You do not need Node.js just to use the shipped widgets. The generated widget folders are already included in the repo.

From this repo:

```bash
pnpm run deploy
```

That installs the regular widget into the default Übersicht widgets folder if it can be detected.

Other options (pnpm requires `--` before extra arguments so they are forwarded to the script instead of being parsed by pnpm itself):

```bash
pnpm run deploy -- small
pnpm run deploy -- both
pnpm run deploy -- regular "$HOME/Library/Application Support/Übersicht/widgets"
```

After installation, reload Übersicht or restart the app.

Typical widget location:

```text
~/Library/Application Support/Übersicht/widgets/
```

## Move the widget

Grab the small grip handle in the widget's top-right corner and drag it to reposition. The new position is written back to the widget's `config.json` automatically, so it persists across refreshes and reinstalls.

You can also position the widget by hand: edit the local `config.json` inside the installed widget folder.

Regular widget:

```text
~/Library/Application Support/Übersicht/widgets/tsushin.widget/config.json
```

Small widget:

```text
~/Library/Application Support/Übersicht/widgets/tsushin_small.widget/config.json
```

Example:

```json
{
  "left": "40px",
  "top": "80px"
}
```

You can use pixel values or percentages.

The installer preserves your local `config.json` when you reinstall updated widget files.

## Read the graph

- Blue line: download throughput
- Yellow line: upload throughput

The widget scales the Y axis automatically based on recent traffic.

## Choose between regular and small

Use `tsushin.widget` if you want axis labels, time labels, and a larger chart area.

Use `tsushin_small.widget` if you want a compact status-style widget near an edge of the screen.

## Develop

The editable source is in `src/`. The checked-in `.widget` folders contain generated files for Übersicht.

Install dependencies:

```bash
pnpm install
```

Build generated widget output:

```bash
pnpm run build
```

Type-check only:

```bash
pnpm run typecheck
```

Reinstall locally after a rebuild:

```bash
pnpm run deploy -- regular
pnpm run deploy -- small
pnpm run deploy -- both
```

## Project layout

```text
src/
  entries/         widget-specific defaults
  shared/
    widget.tsx      shared TypeScript widget logic
    types.ts        shared type definitions
    tsushin.sh      shell sampler
  types/           TypeScript ambient type declarations (jsx.d.ts)
scripts/
  build-widgets.mjs
  install-widgets.mjs
tsushin.widget/
  tsushin.jsx      generated Übersicht entry
  config.json      local position override
  src/             generated shared runtime
  tsushin.sh       shell sampler
tsushin_small.widget/
  ...
```

## Customize beyond position

For size and default layout changes, edit:

- `src/entries/regular.tsx`
- `src/entries/small.tsx`

Then rebuild:

```bash
pnpm run build
```

For shared chart behavior, edit:

- `src/shared/widget.tsx`
- `src/shared/tsushin.sh`

## Package zip files

To rebuild both distributable zips:

```bash
pnpm run package
```

This runs the TypeScript build, regenerates both widget directories, and
zips `tsushin.widget/` and `tsushin_small.widget/` into
`tsushin.widget.zip` and `tsushin_small.widget.zip` at the repo root. Only
the known-good widget files (`assets/`, `src/`, `tsushin.jsx`, `tsushin.sh`,
`config.json`) are included, so local junk like `.DS_Store` or the
`.tsushin-state` runtime file never ends up in the zip.

If you only need to re-zip an already-built widget (no source changes),
run `pnpm run zip` instead.

## Troubleshooting

If the widget does not appear:

1. Make sure the widget folder exists under `~/Library/Application Support/Übersicht/widgets/`.
2. Reload Übersicht after installing.
3. Check that `tsushin.jsx`, `config.json`, `tsushin.sh`, and the `src/` folder are all present inside the installed widget directory.
4. If you changed source files in this repo, run `pnpm run build` before reinstalling.

If you want to start clean, delete the installed widget folder and run `pnpm run deploy` again.

## Notes

`tsushin` means "communication" in Japanese.
