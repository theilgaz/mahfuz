/**
 * Meclis oturumu — state-driven, 2sn polling.
 * Fazlar: lobby → voting → playing → interim → playing → interim → playing → final
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMeclisState,
  toggleMeclisReady,
  setMeclisDifficulty,
  setMeclisVotesVisibility,
  setMeclisTeamMode,
  setMeclisPlayerTeam,
  startMeclisVoting,
  submitMeclisVotes,
  lockMeclisVotes,
  updateMeclisSetup,
  cancelMeclis,
  restartMeclis,
  type MeclisStatePayload,
  type MeclisTeam,
} from "~/lib/meclis-service";

const TEAM_META: Record<MeclisTeam, { label: string; accent: string; soft: string; ring: string }> = {
  green: {
    label: "Yeşil",
    accent: "text-emerald-600",
    soft: "bg-emerald-500/10 border-emerald-500/40",
    ring: "ring-emerald-500/60",
  },
  gold: {
    label: "Altın",
    accent: "text-amber-600",
    soft: "bg-amber-500/10 border-amber-500/40",
    ring: "ring-amber-500/60",
  },
};

type MeclisPlayer = MeclisStatePayload["players"][number];

function VoterStack({ voters, visible, max = 4 }: { voters: MeclisPlayer[]; visible: boolean; max?: number }) {
  if (voters.length === 0) return null;
  if (!visible) {
    return (
      <span className="text-[10px] font-bold tabular-nums text-[var(--mu-accent)] px-1.5 py-0.5 rounded-full bg-[var(--mu-accent-soft)]">
        {voters.length} oy
      </span>
    );
  }
  const shown = voters.slice(0, max);
  const extra = voters.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((v) =>
        v.image ? (
          <img
            key={v.userId}
            src={v.image}
            alt={v.name}
            title={v.name}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-full object-cover ring-2 ring-[var(--color-surface)]"
          />
        ) : (
          <span
            key={v.userId}
            title={v.name}
            className="w-5 h-5 rounded-full ring-2 ring-[var(--color-surface)] bg-[var(--color-border)] text-[var(--color-text-secondary)] text-[9px] font-bold flex items-center justify-center"
          >
            {(v.name?.[0] ?? "?").toUpperCase()}
          </span>
        ),
      )}
      {extra > 0 && (
        <span className="w-5 h-5 rounded-full ring-2 ring-[var(--color-surface)] bg-[var(--color-border)] text-[var(--color-text-secondary)] text-[9px] font-bold flex items-center justify-center">
          +{extra}
        </span>
      )}
    </div>
  );
}
import type { Difficulty } from "~/lib/game-scoring";
import { MeclisGamePlay } from "~/components/meclis/MeclisGamePlay";
import { meclisCodeHead } from "~/lib/seo";

export const Route = createFileRoute("/meclis/$code")({
  head: ({ params }) => meclisCodeHead(params.code),
  component: MeclisSession,
});

const GAME_LABELS: Record<string, { title: string; sub: string }> = {
  "fill-blank": { title: "Kelime Doldurma", sub: "Eksik kelimeyi seçerek ayeti doğru tamamla" },
  "surah-guess": { title: "Sûre Tanıma", sub: "Türkçe anlama bakıp doğru sûreyi seç" },
  "word-meaning": { title: "Kelime Anlamı", sub: "Arapça kelimenin Türkçe anlamını eşleştir" },
  "word-match": { title: "Kelime Eşleştirme", sub: "Türkçe anlamı doğru Arapça kelimeyle eşleştir" },
  "peygamber-kim": { title: "Kim Bu Peygamber?", sub: "3 ipucundan peygamberi tahmin et, erken bilen kazanır" },
  "kari-tahmini": { title: "Kâri Tahmini", sub: "Tilaveti dinle, doğru kâriyi seç" },
  "arapca-secim": { title: "Arapça Seçim", sub: "Türkçe anlama bakıp doğru Arapça kelimeyi seç" },
};

const POLL_FAST = 1500;
const POLL_NORMAL = 2500;

function MeclisSession() {
  const { code } = Route.useParams();

  const stateQuery = useQuery({
    queryKey: ["meclis-state", code],
    queryFn: () => getMeclisState({ data: { code } }),
    refetchInterval: (q) => {
      const s = q.state.data?.session.status;
      if (!s || s === "cancelled") return false;
      // final için slow poll bırak — host restart ettiğinde non-host'lar status değişimini fark etsin
      if (s === "final") return POLL_NORMAL;
      if (s === "interim" || s === "voting") return POLL_FAST;
      return POLL_NORMAL;
    },
  });

  if (stateQuery.isLoading) {
    return <div className="max-w-md mx-auto px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">Yükleniyor…</div>;
  }
  const state = stateQuery.data;
  if (!state) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <p className="mu-muted mb-4">Meclis bulunamadı.</p>
        <Link to="/meclis" className="mu-btn primary">Geri dön</Link>
      </div>
    );
  }

  switch (state.session.status) {
    case "lobby":
      return <LobbyView state={state} />;
    case "voting":
      return <VotingView state={state} />;
    case "playing":
      return <PlayingView state={state} />;
    case "interim":
      return <InterimView state={state} />;
    case "final":
      return <FinalView state={state} />;
    case "cancelled":
      return <CancelledView />;
    default:
      return <div className="text-center py-10 text-sm">Bilinmeyen durum: {state.session.status}</div>;
  }
}

// ── Lobby ────────────────────────────────────────────────

function LobbyView({ state }: { state: MeclisStatePayload }) {
  const qc = useQueryClient();
  const { session, players, isHost, meId } = state;
  const me = players.find((p) => p.userId === meId);
  const readyCount = players.filter((p) => p.ready).length;
  const totalCount = players.length;
  const needsMore = totalCount < 2;
  const greenCount = players.filter((p) => p.team === "green").length;
  const goldCount = players.filter((p) => p.team === "gold").length;
  const teamsBalanced = !session.teamMode || (greenCount > 0 && goldCount > 0);
  const allReady = !needsMore && readyCount === totalCount && teamsBalanced;
  const navigate = useNavigate();

  const readyMutation = useMutation({
    mutationFn: () => toggleMeclisReady({ data: { code: session.code, ready: !(me?.ready ?? false) } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });
  const difficultyMutation = useMutation({
    mutationFn: (d: Difficulty) => setMeclisDifficulty({ data: { code: session.code, difficulty: d } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });
  const visibilityMutation = useMutation({
    mutationFn: (visible: boolean) => setMeclisVotesVisibility({ data: { code: session.code, visible } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });
  const startMutation = useMutation({
    mutationFn: () => startMeclisVoting({ data: { code: session.code } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });
  const cancelMutation = useMutation({
    mutationFn: () => cancelMeclis({ data: { code: session.code } }),
    onSuccess: () => navigate({ to: "/meclis" }),
  });
  const setupMutation = useMutation({
    mutationFn: (input: { gameCount?: number; roundDurationMs?: number; visibility?: "private" | "public"; password?: string | null }) =>
      updateMeclisSetup({ data: { code: session.code, ...input } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });
  const teamModeMutation = useMutation({
    mutationFn: (enabled: boolean) => setMeclisTeamMode({ data: { code: session.code, enabled } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });
  const teamAssignMutation = useMutation({
    mutationFn: (input: { userId: string; team: MeclisTeam }) =>
      setMeclisPlayerTeam({ data: { code: session.code, ...input } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });
  const [pwInput, setPwInput] = useState("");

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <p className="mu-eyebrow"><span className="mu-eb-line" />Meclis Lobisi</p>
      <h1 className="mu-display" style={{ marginBottom: 8 }}>Davet Kodu</h1>

      <div className="text-center my-6">
        <div
          className="text-4xl font-bold tracking-[0.4em] py-4 px-6 rounded-2xl border-2 border-dashed border-[var(--mu-accent)] inline-block"
          style={{ fontFamily: "var(--mu-ff-mono)", color: "var(--mu-accent)" }}
        >
          {session.code}
        </div>
        <InviteShareRow code={session.code} />
      </div>

      {/* Difficulty (host only, editable) */}
      <div className="mb-4">
        <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">
          Zorluk (puanlama) {!isHost && <span className="opacity-60">(mihmandar belirler)</span>}
        </label>
        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
          {([
            { d: "easy", label: "Normal", dot: "bg-emerald-500" },
            { d: "hard", label: "Zor", dot: "bg-red-500" },
          ] as const).map(({ d, label, dot }) => (
            <button
              key={d}
              disabled={!isHost}
              onClick={() => difficultyMutation.mutate(d)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${session.difficulty === d ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"} ${!isHost ? "cursor-default" : ""}`}
            >
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Oyun sayısı */}
      <div className="mb-4">
        <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">
          Oyun sayısı {!isHost && <span className="opacity-60">(mihmandar belirler)</span>}
        </label>
        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
          {([3, 5, 7] as const).map((n) => (
            <button
              key={n}
              disabled={!isHost}
              onClick={() => setupMutation.mutate({ gameCount: n })}
              className={`flex-1 py-2.5 text-xs font-medium transition-all ${session.targetGameCount === n ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"} ${!isHost ? "cursor-default" : ""}`}
            >
              {n} el
            </button>
          ))}
        </div>
      </div>

      {/* El süresi */}
      <div className="mb-4">
        <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">
          El süresi {!isHost && <span className="opacity-60">(mihmandar belirler)</span>}
        </label>
        <div className="grid grid-cols-5 rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
          {([
            { ms: 30_000, label: "30sn" },
            { ms: 45_000, label: "45sn" },
            { ms: 60_000, label: "1dk" },
            { ms: 90_000, label: "1:30" },
            { ms: 120_000, label: "2dk" },
          ] as const).map(({ ms, label }) => (
            <button
              key={ms}
              disabled={!isHost}
              onClick={() => setupMutation.mutate({ roundDurationMs: ms })}
              className={`py-2.5 text-xs font-medium transition-all ${session.roundDurationMs === ms ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"} ${!isHost ? "cursor-default" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Görünürlük */}
      {isHost && (
        <div className="mb-4">
          <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Görünürlük</label>
          <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
            {([
              { v: "private" as const, label: "Özel" },
              { v: "public" as const, label: "Public" },
            ]).map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setupMutation.mutate({ visibility: v })}
                className={`flex-1 py-2.5 text-xs font-medium transition-all ${session.visibility === v ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Şifre (host only) */}
      {isHost && (
        <div className="mb-4">
          <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">
            Şifre {session.hasPassword && <span className="text-[var(--mu-accent)]">(aktif)</span>}
          </label>
          <div className="flex gap-2">
            <input
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={session.hasPassword ? "Değiştir (4 hane)" : "4 haneli (boş = şifresiz)"}
              inputMode="numeric"
              maxLength={4}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-center tracking-widest"
              style={{ fontFamily: "var(--mu-ff-mono)" }}
            />
            {pwInput.length === 4 && (
              <button
                onClick={() => { setupMutation.mutate({ password: pwInput }); setPwInput(""); }}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white"
              >
                Kaydet
              </button>
            )}
            {session.hasPassword && pwInput.length === 0 && (
              <button
                onClick={() => setupMutation.mutate({ password: null })}
                className="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)]"
              >
                Kaldır
              </button>
            )}
          </div>
        </div>
      )}

      {/* Oylama görünürlüğü (mihmandar belirler) */}
      <div className="mb-4">
        <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">
          Oylama {!isHost && <span className="opacity-60">(mihmandar belirler)</span>}
        </label>
        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
          {([
            { v: true, label: "Görünür" },
            { v: false, label: "Gizli (sadece sayı)" },
          ] as const).map(({ v, label }) => (
            <button
              key={String(v)}
              disabled={!isHost}
              onClick={() => visibilityMutation.mutate(v)}
              className={`flex-1 py-2.5 text-xs font-medium transition-all ${session.votesVisible === v ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"} ${!isHost ? "cursor-default" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Takım modu (host only) */}
      <div className="mb-4">
        <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">
          Takım modu {!isHost && <span className="opacity-60">(mihmandar belirler)</span>}
        </label>
        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
          {([
            { v: false, label: "Solo" },
            { v: true, label: "Yeşil vs Altın" },
          ] as const).map(({ v, label }) => (
            <button
              key={String(v)}
              disabled={!isHost}
              onClick={() => teamModeMutation.mutate(v)}
              className={`flex-1 py-2.5 text-xs font-medium transition-all ${session.teamMode === v ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"} ${!isHost ? "cursor-default" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        {session.teamMode && (
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-2 leading-snug">
            Her elde takımın tümü puan yaparsa <strong className="text-[var(--mu-accent)]">+30 combo</strong>. Son el düello: kazanan takıma <strong className="text-[var(--mu-accent)]">+75</strong>.
          </p>
        )}
      </div>

      {session.teamMode ? (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--color-text-secondary)]">Takımlar ({players.length})</p>
            {!teamsBalanced && (
              <span className="text-[10px] font-bold text-red-500">Her takımda en az 1 oyuncu olmalı</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["green", "gold"] as const).map((team) => {
              const meta = TEAM_META[team];
              const members = players.filter((p) => p.team === team);
              return (
                <div key={team} className={`rounded-xl border ${meta.soft} p-2.5 min-h-[120px]`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${meta.accent}`}>{meta.label}</span>
                    <span className="text-[10px] tabular-nums text-[var(--color-text-secondary)]">{members.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {members.map((p) => {
                      const other: MeclisTeam = team === "green" ? "gold" : "green";
                      return (
                        <div key={p.userId} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[var(--color-surface)] text-[11px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${p.ready ? "bg-emerald-500" : "bg-[var(--color-text-secondary)]/40"}`} />
                          <span className="flex-1 truncate font-medium">{p.name}</span>
                          {p.isHost && <span className="text-[9px] uppercase text-[var(--mu-accent)]">M</span>}
                          {isHost && (
                            <button
                              onClick={() => teamAssignMutation.mutate({ userId: p.userId, team: other })}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-border)]/60 hover:bg-[var(--color-border)] transition-colors"
                              title={`${TEAM_META[other].label}'a taşı`}
                            >
                              →
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {members.length === 0 && (
                      <p className="text-[10px] text-[var(--color-text-secondary)] italic text-center py-2">Boş</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
            Katılımcılar ({players.length})
          </p>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <span className={`w-2 h-2 rounded-full ${p.ready ? "bg-emerald-500" : "bg-[var(--color-text-secondary)]/40"}`} />
                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{p.name}</span>
                {p.isHost && <span className="text-[10px] uppercase tracking-wider text-[var(--mu-accent)]">Mihmandar</span>}
                {p.userId === meId && <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">Sen</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {me && (
          <button
            onClick={() => readyMutation.mutate()}
            disabled={readyMutation.isPending}
            className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              me.ready
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/40"
                : "bg-[var(--mu-accent)] text-white hover:opacity-90"
            }`}
          >
            {me.ready ? <><span>✓</span><span>Hazırım</span><span className="opacity-60 text-xs ml-1">— vazgeç</span></> : "Hazırım"}
          </button>
        )}

        {isHost && (
          <button
            onClick={() => startMutation.mutate()}
            disabled={!allReady || startMutation.isPending}
            className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              allReady
                ? "bg-[var(--mu-accent)] text-white hover:opacity-90"
                : "bg-[var(--color-border)] text-[var(--color-text-secondary)] cursor-not-allowed"
            }`}
          >
            {needsMore
              ? "En az 2 katılımcı bekleniyor"
              : !teamsBalanced
              ? "Her takımda en az 1 oyuncu olmalı"
              : allReady
              ? "Meclisi Başlat"
              : `Bekleniyor · ${readyCount}/${totalCount} hazır`}
          </button>
        )}

        {isHost && (
          <button
            onClick={() => { if (confirm("Meclisi iptal etmek istediğine emin misin?")) cancelMutation.mutate(); }}
            className="w-full px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/5 transition-colors"
          >
            Meclisi iptal et
          </button>
        )}
      </div>
    </div>
  );
}

// ── Voting ───────────────────────────────────────────────

const ALL_GAMES = ["fill-blank", "surah-guess", "word-meaning", "word-match", "peygamber-kim", "kari-tahmini", "arapca-secim"] as const;

const SCOPE_OPTIONS: { key: string; label: string; sub: string }[] = [
  { key: "all", label: "Tüm Kuran", sub: "Tüm sure ve ayetlerden" },
  { key: "namaz", label: "Namaz Sureleri", sub: "Fatiha + Fil'den Nas'a (kısa sureler)" },
  { key: "duha-nas", label: "Duha → Nas", sub: "93-114 arası kısa sureler" },
  { key: "amme", label: "Amme Cüzü", sub: "30. cüz (78-114)" },
  { key: "tebareke", label: "Tebareke Cüzü", sub: "29. cüz (67-77)" },
  { key: "yasin", label: "Yâsîn", sub: "Sadece 36. sure" },
  { key: "bakara", label: "Bakara", sub: "Sadece 2. sure" },
];

function VotingView({ state }: { state: MeclisStatePayload }) {
  const qc = useQueryClient();
  const { session, players, meId, isHost } = state;
  const me = players.find((p) => p.userId === meId);
  const locked = me?.votesLockedAt != null;
  const picks = (me?.votes ?? []) as string[];
  const scope = me?.scopeVote ?? "";
  const elapsed = session.roundStartedAt ? Math.floor((Date.now() - session.roundStartedAt) / 1000) : 0;
  const remaining = Math.max(0, 30 - elapsed);
  const votesVisible = session.votesVisible;

  // Canlı oylama: her toggle'da sunucuya yansıt; advance lock'a kadar tetiklenmez.
  const liveSubmitMutation = useMutation({
    mutationFn: ({ nextPicks, nextScope }: { nextPicks: string[]; nextScope: string }) =>
      submitMeclisVotes({ data: { code: session.code, votes: nextPicks, scope: nextScope } }),
    // Refetch'i debounce'lamak için her başarılı yazımdan sonra cache'i invalidate ediyoruz —
    // optimistic update zaten bir sonraki refetchInterval tick'inde gelir
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });

  const lockMutation = useMutation({
    mutationFn: () => lockMeclisVotes({ data: { code: session.code, votes: picks, scope } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });

  const visibilityMutation = useMutation({
    mutationFn: (visible: boolean) => setMeclisVotesVisibility({ data: { code: session.code, visible } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });

  const toggleGame = (g: string) => {
    if (locked) return;
    let nextPicks: string[];
    if (picks.includes(g)) {
      nextPicks = picks.filter((x) => x !== g);
    } else {
      if (picks.length >= 3) return;
      nextPicks = [...picks, g];
    }
    liveSubmitMutation.mutate({ nextPicks, nextScope: scope });
  };

  const pickScope = (sc: string) => {
    if (locked) return;
    liveSubmitMutation.mutate({ nextPicks: picks, nextScope: sc });
  };

  const lockedCount = players.filter((p) => p.votesLockedAt != null).length;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <p className="mu-eyebrow"><span className="mu-eb-line" />Oylama</p>
      <h1 className="mu-display" style={{ marginBottom: 6 }}>Oyun & sure seç</h1>
      <p className="mu-lede" style={{ marginBottom: 18 }}>
        En çok oy alan 3 oyun ve sure kapsamı mecliste oynanır.
      </p>

      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-[var(--color-text-secondary)]">{lockedCount}/{players.length} kilitledi</span>
        <span className="font-bold text-[var(--mu-accent)] tabular-nums">{remaining}sn</span>
      </div>
      {isHost && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => visibilityMutation.mutate(!votesVisible)}
            disabled={visibilityMutation.isPending}
            className="text-[11px] font-medium text-[var(--color-text-secondary)] underline-offset-2 hover:underline disabled:opacity-50"
          >
            {votesVisible ? "Oyları gizle" : "Oyları göster"}
          </button>
        </div>
      )}

      <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
        Oyunlar — 3 tanesini seç ({picks.length}/3)
      </p>
      <div className="space-y-2 mb-5">
        {ALL_GAMES.map((g) => {
          const picked = picks.includes(g);
          const meta = GAME_LABELS[g];
          const voters = players.filter((p) => p.votes.includes(g));
          return (
            <button
              key={g}
              disabled={locked}
              onClick={() => toggleGame(g)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                picked
                  ? "border-[var(--mu-accent)] bg-[var(--mu-accent-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              } ${locked ? "opacity-60 cursor-default" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">{meta?.title ?? g}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{meta?.sub ?? ""}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <VoterStack voters={voters} visible={votesVisible} />
                  <span
                    className={`w-5 h-5 rounded-full border-2 ${
                      picked ? "bg-[var(--mu-accent)] border-[var(--mu-accent)]" : "border-[var(--color-border)]"
                    } flex items-center justify-center`}
                  >
                    {picked && <span className="text-white text-xs">✓</span>}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
        Sure kapsamı — 1 tane seç
      </p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {SCOPE_OPTIONS.map((opt) => {
          const picked = scope === opt.key;
          const voters = players.filter((p) => p.scopeVote === opt.key);
          return (
            <button
              key={opt.key}
              disabled={locked}
              onClick={() => pickScope(opt.key)}
              className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                picked
                  ? "border-[var(--mu-accent)] bg-[var(--mu-accent-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              } ${locked ? "opacity-60 cursor-default" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--color-text-primary)]">{opt.label}</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-tight">{opt.sub}</div>
                </div>
              </div>
              {voters.length > 0 && (
                <div className="mt-1.5">
                  <VoterStack voters={voters} visible={votesVisible} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!locked ? (
        <button
          onClick={() => lockMutation.mutate()}
          disabled={picks.length === 0 || scope === "" || lockMutation.isPending}
          className="mu-btn primary w-full disabled:opacity-50"
        >
          {lockMutation.isPending ? "Kilitleniyor..." : `Kilitle (${picks.length}/3)`}
        </button>
      ) : (
        <p className="text-center text-sm text-[var(--color-text-secondary)]">
          Oyların kilitlendi. Diğerleri bekleniyor…
        </p>
      )}
    </div>
  );
}

// ── Playing ──────────────────────────────────────────────

function PlayingView({ state }: { state: MeclisStatePayload }) {
  const { session } = state;
  const gameId = session.gamePool[session.currentGameIndex] ?? "fill-blank";
  const isDuel = session.teamMode && session.currentGameIndex === session.gamePool.length - 1;
  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <div className="text-center mb-3">
        {isDuel && (
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--mu-accent)] mb-1">
            Düello finali · +75
          </p>
        )}
        <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
          {session.currentGameIndex + 1}. El · {GAME_LABELS[gameId]?.title ?? gameId}
        </p>
      </div>
      <MeclisGamePlay
        code={session.code}
        gameId={gameId}
        difficulty={session.difficulty}
        roundStartedAt={session.roundStartedAt ?? Date.now()}
        roundDurationMs={session.roundDurationMs}
        surahIds={session.surahIds}
      />
      <LiveScoreStrip state={state} />
    </div>
  );
}

function InviteShareRow({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const buildInviteText = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://mahfuz.ilg.az";
    const url = `${origin}/meclis?code=${code}`;
    return `Mahfuz'da bir meclis kurdum, davet kodu: ${code}\n\nKatılmak için: ${url}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildInviteText());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/40 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
        {copied ? "Kopyalandı" : "Kodu kopyala"}
      </button>
      <button
        onClick={handleWhatsApp}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#25D36640] bg-[#25D366]/10 text-xs font-medium text-[#128C7E] hover:bg-[#25D366]/20 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        WhatsApp
      </button>
    </div>
  );
}

function LiveScoreStrip({ state }: { state: MeclisStatePayload }) {
  if (state.session.teamMode) return <LiveTeamStrip state={state} />;
  const sorted = [...state.players].sort((a, b) => (b.totalScore + b.currentScore) - (a.totalScore + a.currentScore));
  return (
    <div className="mt-5 px-3 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Canlı tablo</p>
      <div className="space-y-1.5">
        {sorted.map((p, i) => (
          <div key={p.userId} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-[var(--color-text-secondary)]">{i + 1}.</span>
            <span className="flex-1 truncate">{p.name}</span>
            {p.finishedAt && <span className="text-[10px] text-emerald-500">bitirdi</span>}
            <span className="font-bold tabular-nums">{p.totalScore + p.currentScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function teamTotal(state: MeclisStatePayload, team: MeclisTeam, includeCurrent: boolean) {
  return state.players
    .filter((p) => p.team === team)
    .reduce((sum, p) => sum + p.totalScore + (includeCurrent ? p.currentScore : 0), 0);
}

function LiveTeamStrip({ state }: { state: MeclisStatePayload }) {
  const greenSum = teamTotal(state, "green", true);
  const goldSum = teamTotal(state, "gold", true);
  const leader: MeclisTeam | null = greenSum === goldSum ? null : greenSum > goldSum ? "green" : "gold";
  return (
    <div className="mt-5 px-3 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Canlı tablo</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {(["green", "gold"] as const).map((team) => {
          const meta = TEAM_META[team];
          const sum = team === "green" ? greenSum : goldSum;
          const isLead = leader === team;
          return (
            <div key={team} className={`rounded-lg px-3 py-2 border ${meta.soft} ${isLead ? `ring-1 ${meta.ring}` : ""}`}>
              <div className={`text-[10px] uppercase tracking-wider font-bold ${meta.accent}`}>{meta.label}</div>
              <div className={`text-xl font-bold tabular-nums ${meta.accent}`}>{sum}</div>
            </div>
          );
        })}
      </div>
      <div className="space-y-1">
        {state.players.map((p) => {
          const meta = p.team ? TEAM_META[p.team] : null;
          return (
            <div key={p.userId} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${p.team === "green" ? "bg-emerald-500" : p.team === "gold" ? "bg-amber-500" : "bg-[var(--color-border)]"}`} />
              <span className="flex-1 truncate">{p.name}</span>
              {p.finishedAt && <span className="text-[10px] text-emerald-500">bitirdi</span>}
              <span className={`font-bold tabular-nums ${meta?.accent ?? ""}`}>{p.totalScore + p.currentScore}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Interim ──────────────────────────────────────────────

function InterimView({ state }: { state: MeclisStatePayload }) {
  const elapsed = state.session.roundStartedAt ? Math.floor((Date.now() - state.session.roundStartedAt) / 1000) : 0;
  const remaining = Math.max(0, Math.ceil(state.session.interimMs / 1000) - elapsed);
  const sorted = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
  const nextGameId = state.session.gamePool[state.session.currentGameIndex + 1];
  const nextLabel = nextGameId ? GAME_LABELS[nextGameId]?.title ?? nextGameId : null;
  const isDuelNext = state.session.teamMode && state.session.currentGameIndex + 1 === state.session.gamePool.length - 1;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <p className="mu-eyebrow text-center"><span className="mu-eb-line" />{state.session.currentGameIndex + 1}. El bitti</p>
      <h1 className="mu-display text-center" style={{ marginBottom: 18 }}>
        {isDuelNext ? "Düello finali!" : nextLabel ? `Sıra: ${nextLabel}` : "Sıradaki el…"}
      </h1>

      {state.session.teamMode ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(["green", "gold"] as const).map((team) => {
              const meta = TEAM_META[team];
              const sum = teamTotal(state, team, false);
              return (
                <div key={team} className={`rounded-xl border ${meta.soft} px-3 py-3 text-center`}>
                  <div className={`text-[11px] uppercase tracking-wider font-bold ${meta.accent}`}>{meta.label}</div>
                  <div className={`text-3xl font-bold tabular-nums ${meta.accent} mt-1`}>{sum}</div>
                </div>
              );
            })}
          </div>
          <div className="space-y-1.5 mb-6">
            {sorted.map((p) => (
              <div key={p.userId} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                <span className={`w-1.5 h-1.5 rounded-full ${p.team === "green" ? "bg-emerald-500" : p.team === "gold" ? "bg-amber-500" : "bg-[var(--color-border)]"}`} />
                <span className="flex-1 text-xs font-medium truncate">{p.name}</span>
                <span className="text-sm font-bold tabular-nums text-[var(--mu-accent)]">{p.totalScore}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2 mb-6">
          {sorted.map((p, i) => (
            <div key={p.userId} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-2xl font-bold tabular-nums w-8 text-[var(--color-text-secondary)]">#{i + 1}</span>
              <span className="flex-1 text-sm font-medium">{p.name}</span>
              <span className="text-base font-bold tabular-nums text-[var(--mu-accent)]">{p.totalScore}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-[var(--color-text-secondary)] tabular-nums">
        {remaining}sn içinde devam…
      </p>
    </div>
  );
}

// ── Final ────────────────────────────────────────────────

function FinalView({ state }: { state: MeclisStatePayload }) {
  const qc = useQueryClient();
  const { session, players, isHost } = state;
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];

  const restartMutation = useMutation({
    mutationFn: () => restartMeclis({ data: { code: session.code } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });

  // Takım modunda kazanan takımı belirle
  const greenSum = teamTotal(state, "green", false);
  const goldSum = teamTotal(state, "gold", false);
  const winningTeam: MeclisTeam | null = !session.teamMode || greenSum === goldSum
    ? null
    : greenSum > goldSum ? "green" : "gold";

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <p className="mu-eyebrow text-center"><span className="mu-eb-line" />Meclis tamam</p>
      <h1 className="mu-display text-center" style={{ marginBottom: 24 }}>
        {session.teamMode
          ? winningTeam
            ? `Kazanan: ${TEAM_META[winningTeam].label}`
            : "Berabere!"
          : `Kazanan: ${winner?.name}`}
      </h1>

      {session.teamMode && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {(["green", "gold"] as const).map((team) => {
            const meta = TEAM_META[team];
            const sum = team === "green" ? greenSum : goldSum;
            const isWin = winningTeam === team;
            return (
              <div
                key={team}
                className={`rounded-xl border ${meta.soft} px-3 py-4 text-center ${isWin ? `ring-2 ${meta.ring}` : ""}`}
              >
                <div className={`text-xs uppercase tracking-wider font-bold ${meta.accent}`}>{meta.label}</div>
                <div className={`text-4xl font-bold tabular-nums ${meta.accent} mt-1`}>{sum}</div>
                {isWin && <div className={`text-[10px] mt-1 ${meta.accent}`}>Kazanan takım</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2 mb-6">
        {sorted.map((p, i) => {
          const meta = p.team ? TEAM_META[p.team] : null;
          return (
            <div
              key={p.userId}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border ${i === 0 ? "border-[var(--mu-accent)] bg-[var(--mu-accent-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}
            >
              <span className="text-2xl font-bold tabular-nums w-10 text-center text-[var(--color-text-secondary)]">{i + 1}.</span>
              {meta && (
                <span className={`w-2 h-2 rounded-full ${p.team === "green" ? "bg-emerald-500" : "bg-amber-500"}`} title={meta.label} />
              )}
              <span className="flex-1 text-base font-medium">{p.name}</span>
              <span className="text-xl font-bold tabular-nums text-[var(--mu-accent)]">{p.totalScore}</span>
            </div>
          );
        })}
      </div>

      {isHost ? (
        <button
          onClick={() => restartMutation.mutate()}
          disabled={restartMutation.isPending}
          className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-[var(--mu-accent)] text-white hover:opacity-90 transition-opacity mb-2 disabled:opacity-50"
        >
          {restartMutation.isPending ? "Hazırlanıyor..." : "Aynı kadroyla yeniden oyna"}
        </button>
      ) : (
        <p className="text-center text-xs text-[var(--color-text-secondary)] mb-2 py-2">
          Mihmandar yeniden başlatabilir, buradan ayrılma.
        </p>
      )}
      <Link to="/meclis" className="block text-center w-full px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/40 transition-colors">
        Çık ve yeni meclis
      </Link>
      <Link to="/games/scoreboard" className="block text-center w-full px-4 py-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] mt-1">
        Skor Tablosuna git
      </Link>
    </div>
  );
}

// ── Cancelled ────────────────────────────────────────────

function CancelledView() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <p className="mu-muted mb-4">Meclis iptal edildi.</p>
      <Link to="/meclis" className="mu-btn primary">Yeni Meclis</Link>
    </div>
  );
}
