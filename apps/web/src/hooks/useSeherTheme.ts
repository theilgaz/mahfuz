/**
 * Seher teması otomatik/manuel geçiş yöneticisi.
 *
 * - seherOverride === "auto"  → konum bazlı gün doğumu/batımı hesabı
 * - seherOverride === "light" → her zaman aydın (şafak)
 * - seherOverride === "dark"  → her zaman gece (mürdüm)
 *
 * Konum yoksa önce OS dark-mode tercihini kullanır,
 * arka planda geolocation izni ister ve alınca yeniden hesaplar.
 */

import { useEffect } from "react";
import { isDaytime, nextTransition } from "~/lib/solar";
import { useSettingsStore } from "~/stores/settings.store";

export function useSeherTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const seherOverride = useSettingsStore((s) => s.seherOverride);
  const seherLocation = useSettingsStore((s) => s.seherLocation);
  const setSeherLocation = useSettingsStore((s) => s.setSeherLocation);

  // Geolocation isteği — yalnızca Seher + auto + konum yoksa
  useEffect(() => {
    if (theme !== "seher" || seherOverride !== "auto" || seherLocation !== null) return;
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => setSeherLocation(pos.coords.latitude, pos.coords.longitude),
      () => {}, // kullanıcı reddederse sessizce devam et
      { timeout: 8000, maximumAge: 3_600_000 },
    );
  }, [theme, seherOverride, seherLocation, setSeherLocation]);

  // Mod uygula + sonraki geçişe zamanlayıcı kur
  useEffect(() => {
    if (theme !== "seher") {
      document.documentElement.removeAttribute("data-seher");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function applyAndSchedule() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      let mode: "light" | "dark";

      if (seherOverride !== "auto") {
        // Manuel override — zamanlayıcı gerekmez
        mode = seherOverride;
      } else if (seherLocation) {
        const { lat, lon } = seherLocation;
        mode = isDaytime(lat, lon) ? "light" : "dark";

        // Sonraki geçişte yeniden hesapla
        const next = nextTransition(lat, lon);
        const delay = Math.max(1000, next.getTime() - Date.now());
        timeoutId = setTimeout(applyAndSchedule, delay + 2000); // +2s buffer
      } else {
        // Konum yok — OS tercihine bak
        mode = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }

      document.documentElement.setAttribute("data-seher", mode);
    }

    applyAndSchedule();

    // OS dark-mode değişirse (konum yoksa) yeniden uygula
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMqChange = () => {
      if (seherOverride === "auto" && !seherLocation) applyAndSchedule();
    };
    mq.addEventListener("change", onMqChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      mq.removeEventListener("change", onMqChange);
    };
  }, [theme, seherOverride, seherLocation]);
}
