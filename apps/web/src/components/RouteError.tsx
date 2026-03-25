/**
 * Route hata bileşeni — veri yükleme veya render hatalarında gösterilir.
 */

import { Link, useRouter } from "@tanstack/react-router";

export function RouteError({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <p className="text-4xl mb-4">:(</p>
      <p className="text-lg font-medium mb-2">Bir hata oluştu</p>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm">
        {error.message || "Sayfa yüklenirken beklenmeyen bir hata oluştu."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => router.invalidate()}
          className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Tekrar Dene
        </button>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
        >
          Ana Sayfa
        </Link>
      </div>
    </div>
  );
}
