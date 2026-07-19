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
  height: number;
  left: string;
  lineWidth: number;
  showAxisLabels: boolean;
  showTimeLabels: boolean;
  top: string;
  width: number;
  widgetDir: string;
  windowMinutes: number;
}
