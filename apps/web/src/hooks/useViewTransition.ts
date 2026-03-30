/**
 * View Transitions API hook — wraps navigation in a smooth crossfade.
 * Falls back to instant navigation on unsupported browsers.
 */

import { useCallback } from "react";
import { useRouter } from "@tanstack/react-router";

/** Check if View Transitions API is available */
function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * Returns a `navigateWithTransition` function that wraps
 * TanStack Router navigation in a View Transition.
 */
export function useViewTransition() {
  const router = useRouter();
  const isSupported = supportsViewTransitions();

  const navigateWithTransition = useCallback(
    (opts: Parameters<typeof router.navigate>[0]) => {
      if (!isSupported) {
        router.navigate(opts);
        return;
      }

      (document as any).startViewTransition(() => {
        router.navigate(opts);
      });
    },
    [router, isSupported],
  );

  return { navigateWithTransition, supportsViewTransitions: isSupported };
}
