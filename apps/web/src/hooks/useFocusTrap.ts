/**
 * Focus trap hook — traps Tab/Shift+Tab inside a container,
 * closes on Escape, and restores focus on unmount.
 */

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose?: () => void,
) {
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen || !ref.current) return;

    // Save current focus
    previousFocusRef.current = document.activeElement;

    // Focus first focusable element inside container
    const container = ref.current;
    const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore previous focus
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, ref, onClose]);
}
