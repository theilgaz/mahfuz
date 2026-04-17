/**
 * Shared error fallback for route-level error boundaries.
 * TanStack Router calls this with { error, reset }.
 */

import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useSettingsStore } from "~/stores/settings.store";

interface RouteErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export function RouteErrorFallback({ error, reset }: RouteErrorFallbackProps) {
  // RootDocument may not render when this is the root error boundary,
  // so apply the theme directly to ensure correct styling
  useEffect(() => {
    try {
      const theme = useSettingsStore.getState().theme;
      document.documentElement.setAttribute("data-theme", theme);
    } catch {}
  }, []);

  let t: ReturnType<typeof useTranslation>["t"];
  try {
    ({ t } = useTranslation());
  } catch {
    // If translation hook fails, use hardcoded English fallback
    t = {
      error: {
        generic: "Something went wrong",
        genericDesc: "An unexpected error occurred while loading the page.",
        retry: "Try Again",
        goHome: "Home",
      },
    } as any;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8V12" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" />
        </svg>
      </div>
      <p className="text-lg font-medium mb-1">{t.error.generic}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">
        {t.error.genericDesc}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t.error.retry}
        </button>
        <Link
          to="/"
          className="px-4 py-2 rounded border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
        >
          {t.error.goHome}
        </Link>
      </div>
    </div>
  );
}
