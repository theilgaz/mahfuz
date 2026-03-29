/**
 * GitHub katkıda bulunanlar — açık kaynak vitrin bölümü.
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

interface RepoInfo {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  description: string;
}

const REPO = "theilgaz/mahfuz";

interface StatsContributor {
  author: { login: string; avatar_url: string; html_url: string };
  total: number;
}

function useContributors() {
  return useQuery({
    queryKey: ["github", "contributors"],
    queryFn: async (): Promise<Contributor[]> => {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/stats/contributors`,
      );
      // 202 = GitHub is computing stats, retry later
      if (res.status === 202 || !res.ok) throw new Error("GitHub API error");
      const stats: StatsContributor[] = await res.json();
      return stats
        .map((s) => ({
          login: s.author.login,
          avatar_url: s.author.avatar_url,
          html_url: s.author.html_url,
          contributions: s.total,
        }))
        .sort((a, b) => b.contributions - a.contributions);
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}

function useRepoInfo() {
  return useQuery({
    queryKey: ["github", "repo"],
    queryFn: async (): Promise<RepoInfo> => {
      const res = await fetch(`https://api.github.com/repos/${REPO}`);
      if (!res.ok) throw new Error("GitHub API error");
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}

/** Rank rozeti renkleri */
const RANK_STYLES = [
  "bg-amber-500 text-white",       // 1 — altın
  "bg-gray-400 text-white",        // 2 — gümüş
  "bg-amber-700 text-white",       // 3 — bronz
] as const;

function getRankStyle(i: number) {
  return RANK_STYLES[i] ?? "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]";
}

export function GitHubContributors() {
  const { t } = useTranslation();
  const c = t.hub.contributors;
  const { data: contributors, isError } = useContributors();
  const { data: repo } = useRepoInfo();

  if (isError || !contributors || contributors.length === 0) return null;

  const totalCommits = contributors.reduce((s, x) => s + x.contributions, 0);

  return (
    <section className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Header — gradient banner */}
      <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-[var(--color-accent)]/8 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/12 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                {c.title}
              </h3>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                open source
              </p>
            </div>
          </div>
          <a
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8 transition-colors flex items-center gap-1"
          >
            {c.viewOnGithub}
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 1h7v7M11 1L5 7" />
            </svg>
          </a>
        </div>

        {/* Stat chips */}
        {repo && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <StatChip
              icon={<svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z" /></svg>}
              value={totalCommits}
              label={c.commits}
            />
            <StatChip
              icon={<svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" /></svg>}
              value={repo.stargazers_count}
              label="stars"
            />
            <StatChip
              icon={<svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg>}
              value={repo.forks_count}
              label="forks"
            />
          </div>
        )}
      </div>

      {/* Stacked avatar bar — tüm avatarlar üst üste */}
      <div className="px-4 py-3 border-t border-[var(--color-border)]/50">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {contributors.map((user) => (
              <img
                key={user.login}
                src={`${user.avatar_url}&s=64`}
                alt={user.login}
                width={28}
                height={28}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="rounded-full ring-2 ring-[var(--color-surface)]"
              />
            ))}
          </div>
          <span className="text-[11px] text-[var(--color-text-secondary)]">
            {contributors.length} {c.title.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Contributor kartları */}
      <div className="px-3 pb-3">
        {contributors.map((user, i) => {
          const pct = Math.max(1, Math.round((user.contributions / totalCommits) * 100));
          return (
            <a
              key={user.login}
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-accent)]/5 transition-colors ${
                i === 0 ? "bg-[var(--color-accent)]/4" : ""
              }`}
            >
              {/* Rank + Avatar */}
              <div className="relative shrink-0">
                <img
                  src={`${user.avatar_url}&s=80`}
                  alt={user.login}
                  width={i === 0 ? 40 : 34}
                  height={i === 0 ? 40 : 34}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className={`rounded-full ${i === 0 ? "ring-2 ring-[var(--color-accent)]/25" : ""}`}
                />
                <span className={`absolute -bottom-0.5 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full text-[8px] font-bold flex items-center justify-center leading-none ${getRankStyle(i)}`}>
                  {i + 1}
                </span>
              </div>

              {/* İsim + istatistik */}
              <div className="flex-1 min-w-0">
                <span className={`font-medium text-[var(--color-text-primary)] truncate block ${i === 0 ? "text-[13px]" : "text-xs"}`}>
                  {user.login}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[var(--color-text-secondary)]">
                    {user.contributions.toLocaleString()} {c.commits}
                  </span>
                </div>
              </div>

              {/* Yüzde + mini bar */}
              <div className="shrink-0 flex flex-col items-end gap-1 w-16">
                <span className={`text-xs font-semibold ${i === 0 ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}>
                  {pct}%
                </span>
                <div className="w-full h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${i === 0 ? "bg-[var(--color-accent)]" : "bg-[var(--color-text-secondary)]/40"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-bg)]/60 text-[var(--color-text-secondary)]">
      {icon}
      <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">{value.toLocaleString()}</span>
      <span className="text-[10px]">{label}</span>
    </div>
  );
}
