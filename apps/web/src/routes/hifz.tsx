/**
 * Hıfz (Ezber Takibi) — /hifz
 * Discover altından erişilen tam sayfa ezber durumu.
 */

import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "~/lib/seo";

const HifzStatus = lazy(() =>
  import("~/components/profile/HifzStatus").then((m) => ({ default: m.HifzStatus }))
);

export const Route = createFileRoute("/hifz")({
  head: () => staticHead("hifz"),
  component: HifzPage,
});

function HifzPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-24">
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">...</div>}>
        <HifzStatus />
      </Suspense>
    </div>
  );
}
