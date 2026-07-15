interface CommonAttrs {
  className?: string;
  style?: Record<string, string | number>;
  key?: string | number;
  children?: unknown;
}

interface SvgTextAttrs extends CommonAttrs {
  x?: number | string;
  y?: number | string;
  fill?: string;
  fontSize?: number | string;
  textAnchor?: "start" | "middle" | "end";
  dominantBaseline?: string;
}

declare namespace JSX {
  interface IntrinsicElements {
    div: CommonAttrs;
    span: CommonAttrs;
    strong: CommonAttrs;
    svg: CommonAttrs & {
      width?: number | string;
      height?: number | string;
      viewBox?: string;
      xmlns?: string;
    };
    line: CommonAttrs & {
      x1?: number | string;
      y1?: number | string;
      x2?: number | string;
      y2?: number | string;
      stroke?: string;
      strokeWidth?: number | string;
      strokeDasharray?: string;
    };
    polyline: CommonAttrs & {
      points?: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: number | string;
      strokeLinecap?: "butt" | "round" | "square";
      strokeLinejoin?: "miter" | "round" | "bevel";
    };
    text: SvgTextAttrs;
  }
}
