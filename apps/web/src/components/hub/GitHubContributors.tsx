/**
 * GitHub katkıda bulunanlar şeridi — avatar + istatistik.
 * Public API, 24h cache, hata durumunda gizlenir.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "~/hooks/useTranslation";

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

const REPO = "theilgaz/mahfuz";

function useContributors() {
  return useQuery({
    queryKey: ["github", "contributors"],
    queryFn: async (): Promise<Contributor[]> => {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/contributors?per_page=30`,
      );
      if (!res.ok) throw new Error("GitHub API error");
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}

export function GitHubContributors() {
  const { t } = useTranslation();
  const c = t.hub.contributors;
  const { data: contributors, isError } = useContributors();

  if (isError || !contributors || contributors.length === 0) return null;

  const totalCommits = contributors.reduce((s, x) => s + x.contributions, 0);

  return (
    <section className="mt-8 pt-5 border-t border-[var(--color-border)]">
      {/* Başlık satırı */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[var(--color-text-secondary)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
            {c.title}
          </h3>
        </div>
        <a
          href={`https://github.com/${REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[var(--color-accent)] hover:underline"
        >
          {c.viewOnGithub}
        </a>
      </div>

      {/* Avatar şeridi */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {contributors.map((user) => (
          <a
            key={user.login}
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${user.login} · ${user.contributions} ${c.commits}`}
            className="shrink-0 group relative"
          >
            <img
              src={`${user.avatar_url}&s=64`}
              alt={user.login}
              width={36}
              height={36}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="rounded-full border-2 border-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors"
            />
            {/* Katkı sayısı badge */}
            <span className="absolute -bottom-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[var(--color-accent)] text-white text-[8px] font-bold flex items-center justify-center leading-none">
              {user.contributions > 999 ? "1k+" : user.contributions}
            </span>
          </a>
        ))}
      </div>

      {/* İstatistik satırı */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-secondary)]">
        <span>
          {contributors.length} {c.title.toLowerCase()}
        </span>
        <span>·</span>
        <span>
          {totalCommits.toLocaleString()} {c.totalCommits}
        </span>
      </div>
    </section>
  );
}
