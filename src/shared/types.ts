export interface Sample {
  down: number;
  interfaceName: string;
  timestamp: number;
  up: number;
}

export interface WidgetState {
  error: string | null;
  interfaceName: string | null;
  lastUpdated: number | null;
  samples: Sample[];
}

export interface CommandEvent {
  error?: string;
  output?: string;
}

export interface ViewConfig {
  compact: boolean;
  configDir: string;
  height: number;
  left: string;
  lineWidth: number;
  showAxisLabels: boolean;
  showTimeLabels: boolean;
  top: string;
  width: number;
  widgetDir: string;
}
