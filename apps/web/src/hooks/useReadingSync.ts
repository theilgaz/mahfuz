/**
 * Reading position sync hook.
 * Giriş yapılmışsa:
 *   - Açılışta DB'den okuma konumlarını yükle
 *   - Konum değiştiğinde DB'ye debounced kaydet
 */

import { useEffect, useRef } from "react";
import { useReadingStore } from "~/stores/reading.store";
import { getReadingPositions, saveReadingPosition } from "~/lib/reading-service";
import type { Session } from "~/lib/auth";

const SAVE_DEBOUNCE_MS = 3000;

export function useReadingSync(session: Session | null) {
  const userId = session?.user?.id;
  const recentPositions = useReadingStore((s) => s.recentPositions);
  const dbLoaded = useReadingStore((s) => s._dbLoaded);
  const loadFromDb = useReadingStore((s) => s._loadFromDb);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevPositionRef = useRef<string>("");

  // Load from DB on mount (once per session)
  useEffect(() => {
    if (!userId || dbLoaded) return;

    getReadingPositions({ data: userId }).then((positions) => {
      if (positions.length > 0) {
        loadFromDb(positions);
      }
    }).catch(() => {
      // Silently fail — localStorage fallback is fine
    });
  }, [userId, dbLoaded, loadFromDb]);

  // Save to DB on change (debounced)
  useEffect(() => {
    if (!userId) return;

    const latest = recentPositions[0];
    if (!latest) return;

    // Skip if same as last saved
    const key = `${latest.surahId}:${latest.ayahNumber}:${latest.pageNumber}`;
    if (key === prevPositionRef.current) return;
    prevPositionRef.current = key;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveReadingPosition({
        data: {
          userId,
          surahId: latest.surahId,
          ayahNumber: latest.ayahNumber,
          pageNumber: latest.pageNumber,
        },
      }).catch(() => {
        // Silently fail
      });
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [userId, recentPositions]);
}
