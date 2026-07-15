import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = resolve(rootDir, ".build");
const sharedDir = resolve(buildDir, "shared");
const samplerSource = resolve(rootDir, "src", "shared", "tsushin.sh");

const widgets = [
  {
    entryFile: resolve(buildDir, "entries", "regular.jsx"),
    widgetDir: resolve(rootDir, "tsushin.widget"),
  },
  {
    entryFile: resolve(buildDir, "entries", "small.jsx"),
    widgetDir: resolve(rootDir, "tsushin_small.widget"),
  },
];

if (!existsSync(sharedDir)) {
  throw new Error("Missing compiled shared modules. Run the TypeScript build first.");
}

for (const widget of widgets) {
  if (!existsSync(widget.entryFile)) {
    throw new Error(`Missing compiled widget entry: ${widget.entryFile}`);
  }

  rmSync(resolve(widget.widgetDir, "src"), { force: true, recursive: true });
  rmSync(resolve(widget.widgetDir, "tsushin.jsx"), { force: true });

  mkdirSync(resolve(widget.widgetDir, "src"), { recursive: true });
  cpSync(sharedDir, resolve(widget.widgetDir, "src"), { recursive: true });
  copyFileSync(widget.entryFile, resolve(widget.widgetDir, "src", "view-config.jsx"));
  copyFileSync(samplerSource, resolve(widget.widgetDir, "tsushin.sh"));
  chmodSync(resolve(widget.widgetDir, "tsushin.sh"), 0o755);
  writeFileSync(
    resolve(widget.widgetDir, "tsushin.jsx"),
    [
      'import { defaultViewConfig } from "./src/view-config.jsx";',
      'import { createTsushinWidget } from "./src/widget.jsx";',
      "",
      'const overrides = require("./config.json");',
      "",
      "const widget = createTsushinWidget({",
      "  ...defaultViewConfig,",
      "  ...overrides,",
      "});",
      "",
      "export const className = widget.className;",
      "export const command = widget.command;",
      "export const initialState = widget.initialState;",
      "export const refreshFrequency = widget.refreshFrequency;",
      "export const render = widget.render;",
      "export const updateState = widget.updateState;",
      "",
    ].join("\n")
  );
}
