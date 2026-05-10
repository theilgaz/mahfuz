/**
 * Meclis girişi — yeni meclis kur ya da davet koduyla katıl.
 */

import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createMeclis, joinMeclis } from "~/lib/meclis-service";
import type { Difficulty } from "~/lib/game-scoring";

export const Route = createFileRoute("/meclis/")({
  component: MeclisLanding,
  validateSearch: (search: Record<string, unknown>): { code?: string } => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
});

function MeclisLanding() {
  const navigate = useNavigate();
  const { session } = useRouteContext({ from: "__root__" });
  const { code: incomingCode } = Route.useSearch();
  const [tab, setTab] = useState<"create" | "join">(incomingCode ? "join" : "create");
  const [code, setCode] = useState((incomingCode ?? "").toUpperCase());
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createMeclis({ data: { difficulty } }),
    onSuccess: ({ code }) => navigate({ to: "/meclis/$code", params: { code } }),
    onError: (e: Error) => setError(e.message),
  });

  const joinMutation = useMutation({
    mutationFn: (input: { code: string }) => joinMeclis({ data: { code: input.code } }),
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
        Mihmandar bir meclis açar, davet kodunu paylaşır; herkes kendi cihazından girer ve eş zamanlı 3 el oynanır.
      </p>

      <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] mb-5">
        <button
          onClick={() => { setTab("create"); setError(null); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-all ${tab === "create" ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
        >
          Yeni Meclis
        </button>
        <button
          onClick={() => { setTab("join"); setError(null); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-all ${tab === "join" ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
        >
          Kodla Katıl
        </button>
      </div>

      {tab === "create" ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Zorluk</label>
            <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
              {([
                { d: "easy", label: "Normal", dot: "bg-emerald-500" },
                { d: "hard", label: "Zor", dot: "bg-red-500" },
              ] as const).map(({ d, label, dot }) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${difficulty === d ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
                >
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setError(null); createMutation.mutate(); }}
            disabled={createMutation.isPending}
            className="mu-btn primary w-full"
          >
            {createMutation.isPending ? "Açılıyor..." : "Meclisi Aç"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Davet Kodu</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="MAH741"
              maxLength={6}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-bold tracking-widest text-center uppercase"
              style={{ fontFamily: "var(--mu-ff-mono)" }}
            />
          </div>
          <button
            onClick={() => { setError(null); if (code.length === 6) joinMutation.mutate({ code }); }}
            disabled={code.length !== 6 || joinMutation.isPending}
            className="mu-btn primary w-full disabled:opacity-50"
          >
            {joinMutation.isPending ? "Katılıyor..." : "Mecliste yer al"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
