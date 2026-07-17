import { existsSync, cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  console.log(`Usage: pnpm run deploy [-- ] [regular|small|both] [widgets-dir]

Installs generated Übersicht widget folders from this repo into your local widgets directory.

Examples:
  pnpm run deploy
  pnpm run deploy -- small
  pnpm run deploy -- both
  pnpm run deploy -- regular "$HOME/Library/Application Support/Uebersicht/widgets"

Environment:
  WIDGETS_DIR   Override the destination widgets directory.

Note: pnpm requires "--" before extra arguments so they are forwarded to
this script instead of being parsed by pnpm itself.`);
}

// Reimplementation of the awk-based config.js -> config.json converter that
// used to live in install.sh. Matches simple `key: value,` lines (JS object
// literal shorthand), stripping a trailing comma/whitespace from the value.
function convertJsConfigToJson(sourceFile) {
  const contents = readFileSync(sourceFile, "utf8");
  const lines = contents.split(/\r?\n/);
  const entries = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[\s]*/, "");
    if (!/^[A-Za-z0-9_]+[\s]*:/.test(line)) {
      continue;
    }

    const colonIndex = line.indexOf(":");
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1);
    value = value.replace(/^[\s]*/, "");
    value = value.replace(/[\s]*,?[\s]*$/, "");

    entries.push(`  "${key}": ${value}`);
  }

  return `{\n${entries.join(",\n")}\n}\n`;
}

function detectWidgetsDir() {
  const candidates = [
    process.env.WIDGETS_DIR,
    join(homedir(), "Library", "Application Support", "Übersicht", "widgets"),
    join(homedir(), "Library", "Application Support", "Uebersicht", "widgets"),
  ];

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  if (process.env.WIDGETS_DIR) {
    return process.env.WIDGETS_DIR;
  }

  return undefined;
}

function installWidget(sourceDir, destinationRoot) {
  const widgetName = basename(sourceDir);
  const destinationDir = join(destinationRoot, widgetName);

  if (!existsSync(sourceDir)) {
    console.error(`Missing widget directory: ${sourceDir}`);
    process.exit(1);
  }

  let preservedConfig;
  const destConfigJson = join(destinationDir, "config.json");
  const destConfigJs = join(destinationDir, "config.js");

  if (existsSync(destConfigJson)) {
    preservedConfig = readFileSync(destConfigJson, "utf8");
  } else if (existsSync(destConfigJs)) {
    preservedConfig = convertJsConfigToJson(destConfigJs);
  }

  let preservedState;
  const destState = join(destinationDir, ".tsushin-state");
  if (existsSync(destState)) {
    preservedState = readFileSync(destState);
  }

  rmSync(destinationDir, { recursive: true, force: true });
  cpSync(sourceDir, destinationDir, { recursive: true });

  if (preservedConfig !== undefined) {
    writeFileSync(join(destinationDir, "config.json"), preservedConfig);
  }

  rmSync(join(destinationDir, ".tsushin-state"), { force: true });
  if (preservedState !== undefined) {
    writeFileSync(join(destinationDir, ".tsushin-state"), preservedState);
  }

  console.log(`Installed ${widgetName} -> ${destinationDir}`);
}

// When explicitly deploying a single variant, remove any other variant that
// was previously installed so it doesn't keep running alongside the one the
// user asked for. Deploying "both" is the explicit opt-in to keep them both.
function removeOtherWidget(sourceDir, destinationRoot) {
  const widgetName = basename(sourceDir);
  const destinationDir = join(destinationRoot, widgetName);

  if (existsSync(destinationDir)) {
    rmSync(destinationDir, { recursive: true, force: true });
    console.log(`Removed ${widgetName} -> ${destinationDir} (not requested)`);
  }
}

// installWidget deletes and recreates the whole widget folder, which can
// drop Übersicht's file watcher lock on it (live-reload expects in-place
// edits, not a directory replaced wholesale) — so it can keep rendering the
// previously loaded version instead of picking up the new one. Force a
// refresh via Übersicht's AppleScript API rather than relying on the user to
// notice and reload by hand.
function refreshUebersicht() {
  const result = spawnSync("osascript", [
    "-e",
    'tell application id "tracesOf.Uebersicht" to refresh',
  ]);

  if (result.error || result.status !== 0) {
    console.log("Reload Übersicht to pick up the updated widget files.");
  } else {
    console.log("Refreshed Übersicht.");
  }
}

const args = process.argv.slice(2).filter((arg) => arg !== "--");

if (args.includes("--help") || args.includes("-h")) {
  usage();
  process.exit(0);
}

const target = args[0] ?? "regular";
const widgetsDir = args[1] ?? detectWidgetsDir();

if (!widgetsDir) {
  console.error("Could not find your Übersicht widgets directory.");
  console.error("Pass it explicitly, for example:");
  console.error(
    '  pnpm run deploy -- regular "$HOME/Library/Application Support/Übersicht/widgets"'
  );
  process.exit(1);
}

mkdirSync(widgetsDir, { recursive: true });

switch (target) {
  case "regular":
    installWidget(resolve(rootDir, "tsushin.widget"), widgetsDir);
    removeOtherWidget(resolve(rootDir, "tsushin_small.widget"), widgetsDir);
    break;
  case "small":
    installWidget(resolve(rootDir, "tsushin_small.widget"), widgetsDir);
    removeOtherWidget(resolve(rootDir, "tsushin.widget"), widgetsDir);
    break;
  case "both":
    installWidget(resolve(rootDir, "tsushin.widget"), widgetsDir);
    installWidget(resolve(rootDir, "tsushin_small.widget"), widgetsDir);
    break;
  default:
    usage();
    process.exit(1);
}

refreshUebersicht();
