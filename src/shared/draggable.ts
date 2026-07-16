import { writeFileSync } from "fs";

export interface DraggablePosition {
  left: string;
  top: string;
}

export interface DraggableOptions {
  configPath: string;
  initial: DraggablePosition;
  onPositionChange?: (position: DraggablePosition) => void;
}

/**
 * Wires up mousedown/mousemove/mouseup handlers on `el` so dragging it moves
 * the widget's positioned ancestor (the DOM node Übersicht actually applies
 * `top`/`left` to — see `findPositionedAncestor`), then persists the final
 * position to `configPath` as `{ left, top }` percent strings.
 *
 * Returns a cleanup function that detaches all listeners.
 */
export function attachDragHandle(el: HTMLElement, options: DraggableOptions): () => void {
  const { configPath, initial, onPositionChange } = options;

  let target: HTMLElement | null = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let targetStartLeftPx = 0;
  let targetStartTopPx = 0;

  function handleMouseDown(event: MouseEvent): void {
    event.preventDefault();

    target = findPositionedAncestor(el);
    const rect = target.getBoundingClientRect();

    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    targetStartLeftPx = rect.left;
    targetStartTopPx = rect.top;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent): void {
    if (!target) {
      return;
    }

    const nextLeftPx = targetStartLeftPx + (event.clientX - pointerStartX);
    const nextTopPx = targetStartTopPx + (event.clientY - pointerStartY);
    const position = pxToPercent(nextLeftPx, nextTopPx);

    target.style.left = position.left;
    target.style.top = position.top;
  }

  function handleMouseUp(): void {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    if (!target) {
      return;
    }

    const position: DraggablePosition = {
      left: target.style.left || initial.left,
      top: target.style.top || initial.top,
    };

    target = null;

    try {
      writeFileSync(configPath, JSON.stringify(position, null, 2));
    } catch (error) {
      console.error(`attachDragHandle: failed to persist position to ${configPath}`, error);
    }

    if (onPositionChange) {
      onPositionChange(position);
    }
  }

  el.addEventListener("mousedown", handleMouseDown);

  return () => {
    el.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}

/**
 * Übersicht renders `render()`'s returned element as a child of a DOM node it
 * creates and owns (id = widget id, class "widget"), which carries the
 * `position: absolute; top: ...; left: ...;` rule generated from the widget's
 * `className` export (see `buildClassName` in widget.tsx). Our own render
 * root is `position: relative`, and the grip handle itself is
 * `position: absolute`, so a naive single-hop `el.offsetParent` lookup from
 * the grip resolves to our own render root — not Übersicht's container.
 *
 * Walk up the real ancestor chain looking for the first element whose
 * computed `position` is `absolute`/`fixed`, which skips our own
 * `position: relative` render root and lands on Übersicht's container.
 */
function findPositionedAncestor(el: HTMLElement): HTMLElement {
  let node = el.parentElement;

  while (node) {
    const position = window.getComputedStyle(node).position;

    if (position === "absolute" || position === "fixed") {
      return node;
    }

    node = node.parentElement;
  }

  if (el.offsetParent instanceof HTMLElement) {
    return el.offsetParent;
  }

  throw new Error("attachDragHandle: could not find a positioned ancestor to drag");
}

function pxToPercent(leftPx: number, topPx: number): DraggablePosition {
  const leftPercent = (leftPx / window.innerWidth) * 100;
  const topPercent = (topPx / window.innerHeight) * 100;

  return {
    left: `${clampPercent(leftPercent).toFixed(2)}%`,
    top: `${clampPercent(topPercent).toFixed(2)}%`,
  };
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
