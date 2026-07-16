import { defaultViewConfig } from "./src/view-config.jsx";
import { createTsushinWidget } from "./src/widget.jsx";

const overrides = require("./config.json");

const widget = createTsushinWidget({
  ...defaultViewConfig,
  ...overrides,
  configDir: defaultViewConfig.widgetDir,
});

export const className = widget.className;
export const command = widget.command;
export const initialState = widget.initialState;
export const refreshFrequency = widget.refreshFrequency;
export const render = widget.render;
export const updateState = widget.updateState;
