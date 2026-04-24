/**
 * Mushaf çerçeve komponenti registry.
 * Lazy-load ile sadece aktif stil yüklenir.
 */

import { lazy, type ComponentType } from "react";
import type { MushafStyleId } from "~/lib/mushaf-styles";

interface FrameProps {
  surahName?: string;
  juzInfo?: string;
  pageNumber?: number;
}

const frameComponents: Record<MushafStyleId, React.LazyExoticComponent<ComponentType<FrameProps>>> = {
  medine: lazy(() => import("./MedineFrame").then((m) => ({ default: m.MedineFrame }))),
  beirut: lazy(() => import("./BeirutFrame").then((m) => ({ default: m.BeirutFrame }))),
  turkish: lazy(() => import("./TurkishFrame").then((m) => ({ default: m.TurkishFrame }))),
};

export function getFrameComponent(styleId: MushafStyleId) {
  return frameComponents[styleId];
}

export type { FrameProps };
