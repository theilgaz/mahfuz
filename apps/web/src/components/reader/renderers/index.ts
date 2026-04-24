/**
 * Mushaf renderer registry.
 * Lazy-load ile sadece aktif renderer yuklenir.
 */

import { lazy, type ComponentType } from "react";
import type { MushafRenderingEngine, MushafRendererProps } from "~/lib/mushaf-renderers";

const renderers: Record<MushafRenderingEngine, React.LazyExoticComponent<ComponentType<MushafRendererProps>>> = {
  "v0-text": lazy(() => import("./V0TextRenderer").then((m) => ({ default: m.V0TextRenderer }))),
  "v1-images": lazy(() => import("./V1ImageRenderer").then((m) => ({ default: m.V1ImageRenderer }))),
  "v2-qcf-fonts": lazy(() => import("./V2QcfRenderer").then((m) => ({ default: m.V2QcfRenderer }))),
  "v3-canvas": lazy(() => import("./V3CanvasRenderer").then((m) => ({ default: m.V3CanvasRenderer }))),
};

export function getRenderer(engine: MushafRenderingEngine) {
  return renderers[engine];
}
