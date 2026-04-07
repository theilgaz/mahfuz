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
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-xl">
          📖
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
              <div className="text-4xl mb-3">🕌</div>
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
            <div className="space-y-2">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  to="/hatim/$groupId"
                  params={{ groupId: g.id }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-lg shrink-0">
                    {g.scopeType === "full" ? "📗" : g.scopeType === "juz" ? "📋" : "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {g.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {g.scopeType === "full" ? "Tam Hatim" : g.scopeType === "juz" ? "Cüz Hatmi" : "Sayfa Aralığı"}
                      {" · "}
                      <span className={`font-medium ${g.status === "active" ? "text-green-600" : "text-[var(--color-text-secondary)]"}`}>
                        {g.status === "active" ? "Aktif" : "Tamamlandı"}
                      </span>
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
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
                  <div className="text-lg mb-0.5">{s === "full" ? "📗" : "📋"}</div>
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
