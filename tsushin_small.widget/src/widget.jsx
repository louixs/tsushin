const REFRESH_FREQUENCY = 2000;
const MIN_SCALE_KB = 32;
const GRID_LINES = 4;
const DOWN_COLOR = "#6fc3df";
const UP_COLOR = "#ffe64d";
const SURFACE_COLOR = "rgba(2, 12, 18, 0.46)";
const BORDER_COLOR = "rgba(111, 195, 223, 0.34)";
const GRID_COLOR = "rgba(111, 195, 223, 0.16)";
const MUTED_COLOR = "rgba(176, 230, 245, 0.72)";
const numberFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
});
const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
});
export function createTsushinWidget(config) {
    return {
        className: buildClassName(config),
        command: buildCommand(config.widgetDir),
        initialState: {
            error: null,
            interfaceName: null,
            lastUpdated: null,
            samples: [],
        },
        refreshFrequency: REFRESH_FREQUENCY,
        render: (state) => renderWidget(state, config),
        updateState: (event, previousState) => updateWidgetState(event, previousState, config),
    };
}
function buildClassName(config) {
    return `
    top: ${config.top};
    left: ${config.left};
    color: ${DOWN_COLOR};
    font-family: hack, "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
    font-weight: 400;
    text-shadow: 0 0 1px rgba(0, 0, 0, 0.45);
    white-space: normal;
    @font-face {
      font-family: "hack";
      src: url("assets/hack.ttf");
    }
  `;
}
function buildCommand(widgetDir) {
    return `
    if [ -e "$PWD/tsushin.sh" ]; then
      "$PWD/tsushin.sh"
    else
      "$PWD/${widgetDir}/tsushin.sh"
    fi
  `;
}
function updateWidgetState(event, previousState, config) {
    if (event.error) {
        return {
            ...previousState,
            error: `Sampler failed: ${event.error.trim()}`,
        };
    }
    if (!event.output) {
        return {
            ...previousState,
            error: "Sampler returned no output.",
        };
    }
    try {
        const sample = parseSample(event.output);
        return {
            error: null,
            interfaceName: sample.interfaceName,
            lastUpdated: sample.timestamp,
            samples: appendSample(previousState.samples, sample, config),
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to parse sampler output.";
        return {
            ...previousState,
            error: message,
        };
    }
}
function parseSample(output) {
    const parsed = JSON.parse(output.trim());
    if (typeof parsed.interfaceName !== "string" ||
        typeof parsed.down !== "number" ||
        typeof parsed.up !== "number" ||
        Number.isNaN(parsed.down) ||
        Number.isNaN(parsed.up)) {
        throw new Error(`Invalid sampler payload: ${output.trim()}`);
    }
    return {
        down: Math.max(0, parsed.down),
        interfaceName: parsed.interfaceName,
        timestamp: Date.now(),
        up: Math.max(0, parsed.up),
    };
}
function appendSample(samples, sample, config) {
    const windowMs = config.windowMinutes * 60 * 1000;
    const cutoff = sample.timestamp - windowMs;
    const nextSamples = [...samples, sample].filter((entry) => entry.timestamp >= cutoff);
    return nextSamples;
}
function renderWidget(state, config) {
    const latest = state.samples[state.samples.length - 1] ?? null;
    const headerHeight = config.compact ? 18 : 54;
    const footerHeight = config.showTimeLabels ? 24 : 0;
    const chartLeft = config.showAxisLabels ? 38 : 8;
    const chartRight = config.compact ? 8 : 12;
    const chartTop = headerHeight;
    const chartBottom = footerHeight + (config.compact ? 6 : 12);
    const chartWidth = Math.max(config.width - chartLeft - chartRight, 1);
    const chartHeight = Math.max(config.height - chartTop - chartBottom, 1);
    const maxRate = getMaxRate(state.samples);
    const downLine = buildPolyline(state.samples, "down", chartLeft, chartTop, chartWidth, chartHeight, maxRate);
    const upLine = buildPolyline(state.samples, "up", chartLeft, chartTop, chartWidth, chartHeight, maxRate);
    const gridValues = Array.from({ length: GRID_LINES + 1 }, (_, index) => {
        const ratio = index / GRID_LINES;
        const value = maxRate - maxRate * ratio;
        const y = chartTop + chartHeight * ratio;
        return { value, y };
    });
    const firstSample = state.samples[0] ?? null;
    const lastSample = latest;
    return (<div style={{
            backdropFilter: "blur(12px)",
            background: SURFACE_COLOR,
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: config.compact ? 9 : 14,
            boxSizing: "border-box",
            height: config.height,
            overflow: "hidden",
            padding: config.compact ? "6px 8px 4px" : "14px 16px 10px",
            position: "relative",
            width: config.width,
        }}>
      {config.compact ? (<div style={{
                alignItems: "center",
                display: "flex",
                fontSize: 8,
                justifyContent: "space-between",
                letterSpacing: 0.5,
                marginBottom: 4,
                position: "relative",
                zIndex: 1,
            }}>
          <span style={{ color: MUTED_COLOR }}>
            {state.interfaceName ?? "Detecting interface"}
          </span>
          <span>
            <strong style={{ color: DOWN_COLOR, fontWeight: 600 }}>D {formatRate(latest?.down ?? 0)}</strong>
            <strong style={{ color: UP_COLOR, fontWeight: 600, marginLeft: 8 }}>U {formatRate(latest?.up ?? 0)}</strong>
          </span>
        </div>) : (<div style={{
                alignItems: "flex-start",
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                position: "relative",
                zIndex: 1,
            }}>
          <div>
            <div style={{
                color: MUTED_COLOR,
                fontSize: 10,
                letterSpacing: 1.8,
                marginBottom: 6,
            }}>
              TSUSHIN
            </div>
            <div style={{ fontSize: 12 }}>
              {state.interfaceName ?? "Detecting active interface"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {renderMetric("Down", latest?.down ?? 0, DOWN_COLOR)}
            {renderMetric("Up", latest?.up ?? 0, UP_COLOR)}
          </div>
        </div>)}

      <svg height={chartTop + chartHeight + chartBottom} style={{ left: 0, position: "absolute", top: 0 }} width={config.width}>
        {gridValues.map((gridValue) => (<line key={`grid-${gridValue.y}`} stroke={GRID_COLOR} strokeWidth={1} x1={chartLeft} x2={chartLeft + chartWidth} y1={gridValue.y} y2={gridValue.y}/>))}
        {config.showAxisLabels
            ? gridValues.map((gridValue) => (<text key={`label-${gridValue.y}`} dominantBaseline="middle" fill={MUTED_COLOR} fontSize={10} textAnchor="end" x={chartLeft - 8} y={gridValue.y}>
                {formatAxisLabel(gridValue.value)}
              </text>))
            : null}
        {downLine ? (<polyline fill="none" points={downLine} stroke={DOWN_COLOR} strokeLinecap="round" strokeLinejoin="round" strokeWidth={config.lineWidth}/>) : null}
        {upLine ? (<polyline fill="none" points={upLine} stroke={UP_COLOR} strokeLinecap="round" strokeLinejoin="round" strokeWidth={config.lineWidth}/>) : null}
        {config.showTimeLabels && firstSample && lastSample ? (<text fill={MUTED_COLOR} fontSize={10} textAnchor="start" x={chartLeft} y={config.height - 8}>
            {timeFormatter.format(firstSample.timestamp)}
          </text>) : null}
        {config.showTimeLabels && firstSample && lastSample ? (<text fill={MUTED_COLOR} fontSize={10} textAnchor="end" x={chartLeft + chartWidth} y={config.height - 8}>
            {timeFormatter.format(lastSample.timestamp)}
          </text>) : null}
      </svg>

      {state.samples.length === 0 ? (<div style={{
                color: MUTED_COLOR,
                fontSize: config.compact ? 8 : 12,
                left: chartLeft,
                position: "absolute",
                top: chartTop + chartHeight / 2 - (config.compact ? 6 : 8),
            }}>
          Sampling network throughput…
        </div>) : null}

      {state.error ? (<div style={{
                background: "rgba(255, 86, 86, 0.12)",
                border: "1px solid rgba(255, 86, 86, 0.28)",
                borderRadius: 8,
                bottom: config.compact ? 4 : 10,
                color: "#ffc5c5",
                fontSize: config.compact ? 7 : 10,
                left: config.compact ? 8 : 16,
                maxWidth: config.width - (config.compact ? 16 : 32),
                padding: config.compact ? "3px 5px" : "6px 8px",
                position: "absolute",
            }}>
          {state.error}
        </div>) : null}
    </div>);
}
function renderMetric(label, value, color) {
    return (<div style={{ minWidth: 86 }}>
      <div style={{
            color: MUTED_COLOR,
            fontSize: 10,
            letterSpacing: 1,
            marginBottom: 6,
            textTransform: "uppercase",
        }}>
        {label}
      </div>
      <div style={{ color, fontSize: 16, fontWeight: 600 }}>{formatRate(value)}</div>
    </div>);
}
function getMaxRate(samples) {
    const peak = samples.reduce((currentMax, sample) => {
        return Math.max(currentMax, sample.down, sample.up);
    }, 0);
    return Math.max(MIN_SCALE_KB, roundUpForScale(peak * 1.15));
}
function roundUpForScale(value) {
    if (value <= 0) {
        return MIN_SCALE_KB;
    }
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    if (normalized <= 1) {
        return 1 * magnitude;
    }
    if (normalized <= 2) {
        return 2 * magnitude;
    }
    if (normalized <= 5) {
        return 5 * magnitude;
    }
    return 10 * magnitude;
}
function buildPolyline(samples, key, chartLeft, chartTop, chartWidth, chartHeight, maxRate) {
    if (samples.length === 0) {
        return "";
    }
    if (samples.length === 1) {
        const y = chartTop + chartHeight - (samples[0][key] / maxRate) * chartHeight;
        const x = chartLeft + chartWidth;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }
    const firstTimestamp = samples[0].timestamp;
    const lastTimestamp = samples[samples.length - 1].timestamp;
    const timeRange = Math.max(lastTimestamp - firstTimestamp, 1);
    return samples
        .map((sample) => {
        const x = chartLeft + ((sample.timestamp - firstTimestamp) / timeRange) * chartWidth;
        const y = chartTop + chartHeight - (sample[key] / maxRate) * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
        .join(" ");
}
function formatRate(value) {
    if (value >= 1024) {
        return `${numberFormatter.format(value / 1024)} MB/s`;
    }
    return `${numberFormatter.format(value)} kB/s`;
}
function formatAxisLabel(value) {
    if (value >= 1024) {
        return `${numberFormatter.format(value / 1024)}M`;
    }
    return `${numberFormatter.format(value)}k`;
}
