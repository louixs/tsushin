import { existsSync, rmSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const widgetDirs = [
  resolve(rootDir, "tsushin.widget"),
  resolve(rootDir, "tsushin_small.widget"),
];

// Explicit, known-good file set. Never glob the live directory: a dev
// checkout can carry untracked local junk (.DS_Store, .tsushin-state, the
// runtime state file Übersicht writes at run time) that must not ship in
// the distributable zip.
const expectedEntries = ["assets", "src", "tsushin.jsx", "tsushin.sh", "config.json"];

for (const widgetDir of widgetDirs) {
  if (!existsSync(widgetDir)) {
    throw new Error(`Missing widget directory: ${widgetDir}`);
  }

  for (const entry of expectedEntries) {
    const entryPath = resolve(widgetDir, entry);
    if (!existsSync(entryPath)) {
      throw new Error(`Missing expected file in ${widgetDir}: ${entry}`);
    }
  }

  const widgetName = basename(widgetDir);
  const zipPath = resolve(rootDir, `${widgetName}.zip`);

  rmSync(zipPath, { force: true });

  execFileSync(
    "zip",
    ["-r", `${widgetName}.zip`, ...expectedEntries.map((entry) => `${widgetName}/${entry}`)],
    { cwd: rootDir, stdio: "inherit" }
  );
}
