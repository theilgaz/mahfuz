/**
 * Route hata bileşeni — veri yükleme veya render hatalarında gösterilir.
 * i18n destekli — locale store'dan doğrudan okur.
 */

import { Link, useRouter } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";

export function RouteError({ error }: { error: Error }) {
  const router = useRouter();

  // useTranslation might fail in error boundary, fallback to Turkish
  let t: any;
  try {
    t = useTranslation().t;
  } catch {
    t = null;
  }

  const title = t?.error?.generic ?? "Bir hata oluştu";
  const desc = error.message || (t?.error?.genericDesc ?? "Sayfa yüklenirken beklenmeyen bir hata oluştu.");
  const retry = t?.error?.retry ?? "Tekrar Dene";
  const home = t?.error?.goHome ?? "Ana Sayfa";

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <p className="text-4xl mb-4">:(</p>
      <p className="text-lg font-medium mb-2">{title}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm">
        {desc}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => router.invalidate()}
          className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {retry}
        </button>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
        >
          {home}
        </Link>
      </div>
    </div>
  );
}
