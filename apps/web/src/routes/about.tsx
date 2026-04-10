/**
 * Uygulama Hakkında — /about
 * Sürüm, açık kaynak katkıcılar, krediler.
 */

import { Suspense, lazy } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Credits } from "~/components/hub/Credits";
import { useTranslation } from "~/hooks/useTranslation";

const GitHubContributors = lazy(() =>
  import("~/components/hub/GitHubContributors").then((m) => ({ default: m.GitHubContributors }))
);

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/profile"
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-secondary)]"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">{t.about.title}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">mahfuz.ilg.az</p>
        </div>
      </div>

      {/* App kimlik kartı */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
          <svg width="32" height="32" viewBox="118 152 93 138" fill="var(--color-accent)">
            <path d="M177,156.577c-8.706,1.423-15.241,6.257-17.357,8.65-2.167,2.441-6.147,6.7-7.332,16.905a22.5,22.5,0,0,0-6.146,1.177C141.051,185,133.3,188.382,128.5,196.9c-6.245,10.51-6.639,18.538-4.918,29.366a107.479,107.479,0,0,0,6.079,21.233,170.644,170.644,0,0,0,11.662,23.951c9,15.2,15.162,11.33,15.162,11.33s3.214-1.5,2.608-7.314c-.787-7.318-4.208-15.237-7.753-25.458-3.676-10.615-9.41-28.628-9.161-43.646a15.176,15.176,0,0,1,6.914.213c2.977.638,13.827,6.267,18.231,8.775,4.389,2.485,9.157,5.248,10.66,6s9.584,5.142,17.985,1.4c8.5-3.8,11.39-16.2,10.992-21.94-.426-5.931-9.2-26.056-12.387-31.049-2.946-4.645-7.724-13.344-15.709-13.344a10.621,10.621,0,0,0-1.863.158m-3,33.554c-2.086-1.209-5.535-3.129-5.535-3.129a39.562,39.562,0,0,1,2.981-18.02c.822.526,9.23,8.512,14.269,28.126-2.914-1.713-9.637-5.758-11.715-6.977" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-[var(--color-text-primary)]">Mahfuz</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
            Dikkat dağıtmadan Kuran okuma ve öğrenme uygulaması
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium border border-[var(--color-accent)]/20">
              Açık Kaynak
            </span>
            <a
              href="https://github.com/theilgaz/mahfuz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* GitHub katkıcılar */}
      <Suspense fallback={
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }>
        <GitHubContributors />
      </Suspense>

      {/* Krediler */}
      <Credits />
    </div>
  );
}
