/**
 * Route hata bileşeni — veri yükleme veya render hatalarında gösterilir.
 * i18n destekli + Twitter'dan bildir butonu.
 * CSS değişkenleri yüklenmemiş olabilir — fallback renkleri sabit.
 */

import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";

export function RouteError({ error }: { error: Error }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  let t: any;
  try {
    t = useTranslation().t;
  } catch {
    t = null;
  }

  const title = t?.error?.generic ?? "Something went wrong";
  const desc = error.message || (t?.error?.genericDesc ?? "An unexpected error occurred while loading the page.");
  const retry = t?.error?.retry ?? "Try Again";
  const home = t?.error?.goHome ?? "Home";
  const report = t?.error?.report ?? "Report";

  const shortError = error.message?.slice(0, 80) || "Unknown error";
  const tweetText = `@theilgaz mahfuz.ilg.az${pathname} sayfasında hata oluştu:\n\n"${shortError}"`;
  const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", padding: "1rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>:(</p>
      <p style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text-primary, #333)" }}>{title}</p>
      <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary, #888)", marginBottom: "1.5rem", maxWidth: "24rem" }}>{desc}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
        <button
          onClick={() => router.invalidate()}
          style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--color-accent, #4a7c59)", color: "#fff", border: "none", cursor: "pointer" }}
        >
          {retry}
        </button>
        <Link
          to="/"
          style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, border: "1px solid var(--color-border, #ccc)", color: "var(--color-text-primary, #333)", textDecoration: "none" }}
        >
          {home}
        </Link>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, border: "1px solid var(--color-border, #ccc)", color: "var(--color-text-primary, #333)", textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {report}
        </a>
      </div>
    </div>
  );
}
