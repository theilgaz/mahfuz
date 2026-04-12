/**
 * Okuma takibi hook'u — sayfa gezildikçe oturumu loglar.
 * Debounce ile çalışır: kullanıcı bir sayfada en az 10 saniye kaldıysa sayar.
 * Ayrıca cüz bittiğinde aktif hatim gruplarına otomatik ilerleme kaydeder.
 */

import { useEffect, useRef } from "react";
import { useLogReading } from "./useHabitQuery";
import { useQueryClient } from "@tanstack/react-query";
import { getJuzForPage, getPagesForJuz } from "@mahfuz/shared";
import {
  getMyActiveGroupIds,
  markSectionComplete,
} from "~/lib/hatim-group-service";

const MIN_READING_SECONDS = 10;
const ANON_USER = "anonymous";

export function useReadingTracker(pageNumber: number) {
  const logReading = useLogReading(ANON_USER);
  const qc = useQueryClient();
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

        // Cüzün son sayfasıysa hatim grubuna otomatik kaydet
        const juz = getJuzForPage(pageNumber);
        const [, lastPage] = getPagesForJuz(juz);
        if (pageNumber === lastPage) {
          autoMarkJuz(juz, qc);
        }
      }
    };
  }, [pageNumber]); // eslint-disable-line react-hooks/exhaustive-deps
}

async function autoMarkJuz(juz: number, qc: ReturnType<typeof useQueryClient>) {
  try {
    const groupIds = await getMyActiveGroupIds();
    const sectionId = `juz:${juz}`;
    await Promise.all(
      groupIds.map((groupId) =>
        markSectionComplete({ data: { groupId, sectionId } })
      )
    );
    if (groupIds.length > 0) {
      qc.invalidateQueries({ queryKey: ["hatim-my-progress"] });
      qc.invalidateQueries({ queryKey: ["hatim-dashboard"] });
    }
  } catch {
    // Sessiz hata — kullanıcı giriş yapmamış olabilir
  }
}
