/**
 * Hatim Grubu — gruplarım, yeni grup, davet kodu ile katıl.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyHatimGroups,
  createHatimGroup,
  joinHatimGroup,
  getMyProgress,
  markSectionComplete,
  unmarkSectionComplete,
} from "~/lib/hatim-group-service";

export const Route = createFileRoute("/hatim/")({
  component: HatimPage,
});

function HatimPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"groups" | "create" | "join">("groups");
  const [createName, setCreateName] = useState("");
  const [createScope, setCreateScope] = useState<"full" | "juz">("full");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["hatim-groups"],
    queryFn: () => getMyHatimGroups(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createHatimGroup({ data: { name: createName, scopeType: createScope } }),
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ["hatim-groups"] });
      navigate({ to: "/hatim/$groupId", params: { groupId: id } });
    },
    onError: (e) => setError(e.message),
  });

  const joinMutation = useMutation({
    mutationFn: () => joinHatimGroup({ data: joinCode.trim().toUpperCase() }),
    onSuccess: ({ groupId }) => {
      qc.invalidateQueries({ queryKey: ["hatim-groups"] });
      navigate({ to: "/hatim/$groupId", params: { groupId } });
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Hatim Grubu</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Beraber hatim yapın, ilerlemeyi takip edin
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-[var(--color-surface)] rounded-xl p-1 mb-5 border border-[var(--color-border)]">
        {(["groups", "create", "join"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
              tab === t
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {t === "groups" ? "Gruplarım" : t === "create" ? "Yeni Grup" : "Katıl"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Gruplarım */}
      {tab === "groups" && (
        <div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3 text-[var(--color-text-secondary)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18M5 21V10l7-7 7 7v11M9 21v-6h6v6"/>
              </svg>
            </div>
              <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                Henüz bir hatim grubuna üye değilsiniz
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setTab("create")}
                  className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium"
                >
                  Grup Oluştur
                </button>
                <button
                  onClick={() => setTab("join")}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm"
                >
                  Katıl
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Yeni Grup */}
      {tab === "create" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
              Grup Adı
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="örn. Aile Hatmi 2025"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
              Kapsam
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["full", "juz"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setCreateScope(s)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    createScope === s
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  <div className="mb-1 text-[var(--color-accent)]">
                    {s === "full" ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>
                      </svg>
                    )}
                  </div>
                  <div>{s === "full" ? "Tam Hatim" : "Seçili Cüzler"}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">
                    {s === "full" ? "30 cüz, tüm Kuran" : "Belirli cüzler"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => createMutation.mutate()}
            disabled={!createName.trim() || createMutation.isPending}
            className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
          >
            {createMutation.isPending ? "Oluşturuluyor..." : "Grup Oluştur"}
          </button>
        </div>
      )}

      {/* Katıl */}
      {tab === "join" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
              Davet Kodu
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-mono text-center tracking-widest text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 uppercase"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 text-center">
              Grup kurucusundan 8 haneli davet kodunu alın
            </p>
          </div>

          <button
            onClick={() => joinMutation.mutate()}
            disabled={joinCode.trim().length !== 8 || joinMutation.isPending}
            className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
          >
            {joinMutation.isPending ? "Katılınıyor..." : "Gruba Katıl"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Grup Kartı + Cüz Beyanı ────────────────────────────

function GroupCard({ group: g }: { group: { id: string; name: string; scopeType: string; status: string } }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: myCompleted = [] } = useQuery({
    queryKey: ["hatim-my-progress", g.id],
    queryFn: () => getMyProgress({ data: g.id }),
    enabled: open,
  });

  const completedSet = new Set(myCompleted);

  const toggleJuz = useMutation({
    mutationFn: async (juz: number) => {
      const sectionId = `juz:${juz}`;
      if (completedSet.has(sectionId)) {
        await unmarkSectionComplete({ data: { groupId: g.id, sectionId } });
      } else {
        await markSectionComplete({ data: { groupId: g.id, sectionId } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hatim-my-progress", g.id] });
      qc.invalidateQueries({ queryKey: ["hatim-dashboard", g.id] });
    },
  });

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <Link
        to="/hatim/$groupId"
        params={{ groupId: g.id }}
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--color-accent)]/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
          {g.scopeType === "full" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{g.name}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {g.scopeType === "full" ? "Tam Hatim" : g.scopeType === "juz" ? "Cuz Hatmi" : "Sayfa Araligi"}
            {" · "}
            <span className={`font-medium ${g.status === "active" ? "text-green-600" : "text-[var(--color-text-secondary)]"}`}>
              {g.status === "active" ? "Aktif" : "Tamamlandi"}
            </span>
          </p>
        </div>
        <svg className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {g.status === "active" && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); setOpen(!open); }}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--color-accent)] border-t border-[var(--color-border)] hover:bg-[var(--color-accent)]/5 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Cuz Beyani
          </button>

          {open && (
            <div className="px-4 pb-4 pt-1">
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                  const done = completedSet.has(`juz:${juz}`);
                  return (
                    <button
                      key={juz}
                      onClick={() => toggleJuz.mutate(juz)}
                      disabled={toggleJuz.isPending}
                      className={`relative aspect-square rounded-lg text-xs font-semibold transition-all ${
                        done
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50"
                      }`}
                    >
                      {juz}
                      {done && (
                        <svg className="absolute top-0 right-0 w-2.5 h-2.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-2 text-center">
                {completedSet.size} / 30 cuz tamamlandi
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
