/**
 * Okuma takibi hook'u — sayfa gezildikçe oturumu loglar.
 * Debounce ile çalışır: kullanıcı bir sayfada en az 10 saniye kaldıysa sayar.
 */

import { useEffect, useRef } from "react";
import { useLogReading } from "./useHabitQuery";

const MIN_READING_SECONDS = 10;
const ANON_USER = "anonymous";

export function useReadingTracker(pageNumber: number) {
  const logReading = useLogReading(ANON_USER);
  const enteredAt = useRef(Date.now());
  const lastLoggedPage = useRef(-1);

  useEffect(() => {
    enteredAt.current = Date.now();

    return () => {
      const seconds = Math.floor((Date.now() - enteredAt.current) / 1000);

      // Minimum süre kontrolü ve aynı sayfayı tekrar loglama
      if (seconds >= MIN_READING_SECONDS && pageNumber !== lastLoggedPage.current) {
        lastLoggedPage.current = pageNumber;
        logReading.mutate({
          pagesRead: 1,
          ayahsRead: 0,
          durationSeconds: seconds,
          startPage: pageNumber,
          endPage: pageNumber,
        });
      }
    };
  }, [pageNumber]); // eslint-disable-line react-hooks/exhaustive-deps
}
