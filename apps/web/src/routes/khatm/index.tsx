/**
 * Hatim Grubu — gruplarım, yeni grup, davet kodu ile katıl.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
import { staticHead } from "~/lib/seo";
  getMyHatimGroups,
  createHatimGroup,
  joinHatimGroup,
} from "~/lib/hatim-group-service";

export const Route = createFileRoute("/khatm/")({
  head: () => staticHead("khatm"),
  component: HatimPage,
});

function HatimPage() {
  const { t: tr } = useTranslation();
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
      navigate({ to: "/khatm/$groupId", params: { groupId: id } });
    },
    onError: (e) => setError(e.message.includes("Giriş") ? tr.khatm.loginRequired : e.message),
  });

  const joinMutation = useMutation({
    mutationFn: () => joinHatimGroup({ data: joinCode.trim().toUpperCase() }),
    onSuccess: ({ groupId }) => {
      qc.invalidateQueries({ queryKey: ["hatim-groups"] });
      navigate({ to: "/khatm/$groupId", params: { groupId } });
    },
    onError: (e) => setError(e.message.includes("Giriş") ? tr.khatm.loginRequired : e.message),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{tr.khatm.title}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {tr.khatm.subtitle}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-[var(--color-surface)] rounded p-1 mb-5 border border-[var(--color-border)]">
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
            {t === "groups" ? tr.khatm.tabGroups : t === "create" ? tr.khatm.tabCreate : tr.khatm.tabJoin}
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
                <div key={i} className="h-20 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3 text-[var(--color-text-secondary)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18M5 21V10l7-7 7 7v11M9 21v-6h6v6"/>
              </svg>
            </div>
              <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                {tr.khatm.noGroupsYet}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setTab("create")}
                  className="px-4 py-2 rounded bg-[var(--color-accent)] text-white text-sm font-medium"
                >
                  {tr.khatm.createGroup}
                </button>
                <button
                  onClick={() => setTab("join")}
                  className="px-4 py-2 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm"
                >
                  {tr.khatm.join}
                </button>
              </div>
            </div>
          ) : (
            <div>
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
              {tr.khatm.groupName}
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={tr.khatm.groupNamePlaceholder}
              className="w-full px-3.5 py-2.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
              {tr.khatm.scope}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["full", "juz"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setCreateScope(s)}
                  className={`px-4 py-3 rounded border text-sm font-medium transition-all text-left ${
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
                  <div>{s === "full" ? tr.khatm.fullKhatm : tr.khatm.selectedJuz}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">
                    {s === "full" ? tr.khatm.fullKhatmDesc : tr.khatm.selectedJuzDesc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => createMutation.mutate()}
            disabled={!createName.trim() || createMutation.isPending}
            className="w-full py-3 rounded bg-[var(--color-accent)] text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
          >
            {createMutation.isPending ? tr.khatm.creating : tr.khatm.createGroup}
          </button>
        </div>
      )}

      {/* Katıl */}
      {tab === "join" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
              {tr.khatm.inviteCode}
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              className="w-full px-3.5 py-2.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-mono text-center tracking-widest text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 uppercase"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 text-center">
              {tr.khatm.inviteCodeHint}
            </p>
          </div>

          <button
            onClick={() => joinMutation.mutate()}
            disabled={joinCode.trim().length !== 8 || joinMutation.isPending}
            className="w-full py-3 rounded bg-[var(--color-accent)] text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
          >
            {joinMutation.isPending ? tr.khatm.joining : tr.khatm.joinGroup}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Grup Kartı ────────────────────────────────────────

function GroupCard({ group: g }: { group: { id: string; name: string; scopeType: string; status: string } }) {
  const { t: tr } = useTranslation();
  return (
    <Link
      to="/khatm/$groupId"
      params={{ groupId: g.id }}
      className="flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
    >
      <div className="w-10 h-10 rounded bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
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
          {g.scopeType === "full" ? tr.khatm.fullKhatm : g.scopeType === "juz" ? tr.khatm.juzKhatm : tr.khatm.pageRange}
          {" · "}
          <span className={`font-medium ${g.status === "active" ? "text-green-600" : "text-[var(--color-text-secondary)]"}`}>
            {g.status === "active" ? tr.khatm.active : tr.khatm.completed}
          </span>
        </p>
      </div>
      <svg className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
