/**
 * Hatim Grubu Dashboard — üyeler, ilerleme, davet kodu.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getGroupDashboard,
  getMyProgress,
  markSectionComplete,
  unmarkSectionComplete,
} from "~/lib/hatim-group-service";

export const Route = createFileRoute("/khatm/$groupId")({
  component: GroupDashboardPage,
});

function GroupDashboardPage() {
  const { groupId } = Route.useParams();
  const [inviteCopied, setInviteCopied] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["hatim-dashboard", groupId],
    queryFn: () => getGroupDashboard({ data: groupId }),
  });

  const { data: myCompletedSections = [] } = useQuery({
    queryKey: ["hatim-my-progress", groupId],
    queryFn: () => getMyProgress({ data: groupId }),
  });

  const completedSet = new Set(myCompletedSections);

  const toggleJuz = useMutation({
    mutationFn: async (juz: number) => {
      const sectionId = `juz:${juz}`;
      if (completedSet.has(sectionId)) {
        await unmarkSectionComplete({ data: { groupId, sectionId } });
      } else {
        await markSectionComplete({ data: { groupId, sectionId } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hatim-my-progress", groupId] });
      qc.invalidateQueries({ queryKey: ["hatim-dashboard", groupId] });
    },
  });

  const copyInviteCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.group.inviteCode);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 text-center">
        <p className="text-[var(--color-text-secondary)]">Grup bulunamadı.</p>
        <Link to="/khatm/" className="mt-4 inline-block text-[var(--color-accent)] text-sm">
          ← Geri dön
        </Link>
      </div>
    );
  }

  const { group, members, totalProgress, totalSections } = data;
  const overallPct = totalSections > 0 ? Math.round((totalProgress / totalSections) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link to="/khatm/" className="mt-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{group.name}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {group.scopeType === "full" ? "Tam Hatim" : group.scopeType === "juz" ? "Cüz Hatmi" : "Sayfa Aralığı"}
            {" · "}
            {members.length} üye
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            group.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-[var(--color-border)] text-[var(--color-text-secondary)]"
          }`}
        >
          {group.status === "active" ? "Aktif" : "Tamamlandı"}
        </span>
      </div>

      {/* Genel İlerleme */}
      <div className="py-3 px-1 border-b border-[var(--color-border)] mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Genel İlerleme</span>
          <span className="text-sm font-bold text-[var(--color-accent)]">%{overallPct}</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
          {totalProgress} / {totalSections} bölüm tamamlandı
        </p>
      </div>

      {/* Üyeler */}
      <div className="mb-5">
        <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          Üyeler ({members.length})
        </h2>
        <div>
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)]"
            >
              {m.userImage ? (
                <img src={m.userImage} alt={m.userName ?? ""} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-semibold text-[var(--color-accent)] shrink-0">
                  {(m.userName ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {m.userName ?? "Kullanıcı"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)] tabular-nums shrink-0">
                    {m.completedCount}/{m.totalSections}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-[var(--color-accent)] shrink-0">
                %{m.percentage}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cüz İlerleme */}
      {group.status === "active" && (
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            Cüz İlerlemem
          </h2>
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
              const done = completedSet.has(`juz:${juz}`);
              return (
                <button
                  key={juz}
                  onClick={() => toggleJuz.mutate(juz)}
                  disabled={toggleJuz.isPending}
                  className={`relative aspect-square rounded text-sm font-semibold transition-all ${
                    done
                      ? "bg-[var(--color-accent)] text-white shadow-sm"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50"
                  }`}
                >
                  {juz}
                  {done && (
                    <svg className="absolute top-0.5 right-0.5 w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--color-text-secondary)] mt-2 text-center">
            Tamamladığınız cüze dokunun
          </p>
        </div>
      )}

      {/* Davet Kodu */}
      <div className="py-3 px-1 border-b border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-secondary)] mb-2">Davet Kodu</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-2xl font-mono font-bold tracking-[0.2em] text-[var(--color-text-primary)]">
            {group.inviteCode}
          </span>
          <button
            onClick={copyInviteCode}
            className="px-3.5 py-2 rounded bg-[var(--color-accent)] text-white text-xs font-semibold transition-all"
          >
            {inviteCopied ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Kopyalandı
              </span>
            ) : "Kopyala"}
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-text-secondary)] mt-1.5">
          Bu kodu arkadaşlarınızla paylaşın
        </p>
      </div>
    </div>
  );
}
