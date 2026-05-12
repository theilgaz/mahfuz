/**
 * Meclis girişi — yeni meclis aç ya da koduyla katıl.
 * Açık (public) meclisler aşağıda listelenir; şifreliler asma kilit
 * ikonu taşır ve tıklayınca şifre sorulur.
 */

import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createMeclis, joinMeclis, listPublicMeclises } from "~/lib/meclis-service";

export const Route = createFileRoute("/meclis/")({
  component: MeclisLanding,
  validateSearch: (search: Record<string, unknown>): { code?: string } => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
});

type Tab = "create" | "join";

function MeclisLanding() {
  const navigate = useNavigate();
  const { session } = useRouteContext({ from: "__root__" });
  const { code: incomingCode } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(incomingCode ? "join" : "create");

  const [code, setCode] = useState((incomingCode ?? "").toUpperCase());
  const [joinPassword, setJoinPassword] = useState("");
  const [joinPasswordRequired, setJoinPasswordRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [publicPwdFor, setPublicPwdFor] = useState<string | null>(null);
  const [publicPwd, setPublicPwd] = useState("");

  const publicQuery = useQuery({
    queryKey: ["meclis-public"],
    queryFn: () => listPublicMeclises(),
    refetchInterval: 5_000,
    enabled: !!session?.user,
  });

  const createMutation = useMutation({
    mutationFn: () => createMeclis({ data: {} }),
    onSuccess: ({ code }) => navigate({ to: "/meclis/$code", params: { code } }),
    onError: (e: Error) => setError(e.message),
  });

  const joinMutation = useMutation({
    mutationFn: (input: { code: string; password?: string }) =>
      joinMeclis({ data: { code: input.code, password: input.password } }),
    onSuccess: ({ code }) => navigate({ to: "/meclis/$code", params: { code } }),
    onError: (e: Error) => {
      if (e.message.includes("Şifre")) {
        setJoinPasswordRequired(true);
        setError("Bu meclis şifreli — 4 haneli şifreyi gir.");
      } else {
        setError(e.message);
      }
    },
  });

  const publicJoinMutation = useMutation({
    mutationFn: (input: { code: string; password?: string }) =>
      joinMeclis({ data: { code: input.code, password: input.password } }),
    onSuccess: ({ code }) => navigate({ to: "/meclis/$code", params: { code } }),
    onError: (e: Error) => setError(e.message),
  });

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <h1 className="mu-display" style={{ marginBottom: 12 }}>Meclis</h1>
        <p className="mu-muted" style={{ marginBottom: 16 }}>
          Meclise katılmak için giriş yapman gerekiyor.
        </p>
        <a href="/auth/login" className="mu-btn primary">Giriş yap</a>
      </div>
    );
  }

  const publicList = publicQuery.data ?? [];

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <p className="mu-eyebrow">
        <span className="mu-eb-line" />
        Meclis
      </p>
      <h1 className="mu-display" style={{ marginBottom: 8 }}>
        Birlikte oynayalım
      </h1>
      <p className="mu-lede" style={{ marginBottom: 24 }}>
        Bir meclis aç, davet koduyla arkadaşlarınla oyna. Ayarları lobide yaparsın.
      </p>

      <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] mb-5">
        {([
          { id: "create" as const, label: "Yeni Meclis" },
          { id: "join" as const, label: "Kodla Katıl" },
        ]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setError(null); setJoinPasswordRequired(false); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-all ${tab === id ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <button
          onClick={() => { setError(null); createMutation.mutate(); }}
          disabled={createMutation.isPending}
          className="mu-btn primary w-full disabled:opacity-50"
        >
          {createMutation.isPending ? "Açılıyor..." : "Meclisi Aç"}
        </button>
      )}

      {tab === "join" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Davet Kodu</label>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setJoinPasswordRequired(false); }}
              placeholder="MAH741"
              maxLength={6}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-bold tracking-widest text-center uppercase"
              style={{ fontFamily: "var(--mu-ff-mono)" }}
            />
          </div>
          {joinPasswordRequired && (
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">4 haneli şifre</label>
              <input
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
                maxLength={4}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-bold tracking-widest text-center"
                style={{ fontFamily: "var(--mu-ff-mono)" }}
              />
            </div>
          )}
          <button
            onClick={() => {
              setError(null);
              if (code.length === 6) {
                joinMutation.mutate({ code, password: joinPassword || undefined });
              }
            }}
            disabled={code.length !== 6 || joinMutation.isPending || (joinPasswordRequired && joinPassword.length !== 4)}
            className="mu-btn primary w-full disabled:opacity-50"
          >
            {joinMutation.isPending ? "Katılıyor..." : "Mecliste yer al"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
      )}

      {publicList.length > 0 && (
        <section className="mt-10">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
            Açık Meclisler ({publicList.length})
          </p>
          <div className="space-y-2">
            {publicList.map((r) => {
              const isPwdMode = publicPwdFor === r.code;
              return (
                <div key={r.code} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      if (r.hasPassword) {
                        setPublicPwdFor(isPwdMode ? null : r.code);
                        setPublicPwd("");
                      } else {
                        publicJoinMutation.mutate({ code: r.code });
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:border-[var(--color-accent)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-base font-bold tabular-nums tracking-widest text-[var(--mu-accent)]" style={{ fontFamily: "var(--mu-ff-mono)" }}>
                        {r.code}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                        {r.hasPassword && (
                          <span aria-label="Şifreli" title="Şifreli" className="text-[var(--mu-accent)]">
                            <LockIcon />
                          </span>
                        )}
                        <span className="tabular-nums">{r.playerCount}/{r.maxPlayers}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                      <span className="truncate">Mihmandar: {r.hostName}</span>
                      <span>{r.gameCount} el · {r.difficulty === "hard" ? "Zor" : "Normal"}</span>
                    </div>
                  </button>
                  {isPwdMode && (
                    <div className="px-4 pb-3 pt-1 flex gap-2">
                      <input
                        autoFocus
                        value={publicPwd}
                        onChange={(e) => setPublicPwd(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && publicPwd.length === 4) {
                            publicJoinMutation.mutate({ code: r.code, password: publicPwd });
                          }
                        }}
                        placeholder="0000"
                        inputMode="numeric"
                        maxLength={4}
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-base font-bold tracking-widest text-center"
                        style={{ fontFamily: "var(--mu-ff-mono)" }}
                      />
                      <button
                        onClick={() => publicJoinMutation.mutate({ code: r.code, password: publicPwd })}
                        disabled={publicPwd.length !== 4 || publicJoinMutation.isPending}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--mu-accent)] text-white disabled:opacity-50"
                      >
                        Katıl
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
