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
  startMeclisVoting,
  submitMeclisVotes,
  cancelMeclis,
  restartMeclis,
  type MeclisStatePayload,
} from "~/lib/meclis-service";
import type { Difficulty } from "~/lib/game-scoring";
import { MeclisGamePlay } from "~/components/meclis/MeclisGamePlay";

export const Route = createFileRoute("/meclis/$code")({
  component: MeclisSession,
});

const GAME_LABELS: Record<string, { title: string; sub: string }> = {
  "fill-blank": { title: "Kelime Doldurma", sub: "Eksik kelimeyi seçerek ayeti doğru tamamla" },
  "surah-guess": { title: "Sûre Tanıma", sub: "Türkçe anlama bakıp doğru sûreyi seç" },
  "word-meaning": { title: "Kelime Anlamı", sub: "Arapça kelimenin Türkçe anlamını eşleştir" },
  "word-match": { title: "Kelime Eşleştirme", sub: "Türkçe anlamı doğru Arapça kelimeyle eşleştir" },
  "peygamber-kim": { title: "Kim Bu Peygamber?", sub: "3 ipucundan peygamberi tahmin et — erken bilen kazanır" },
  "kari-tahmini": { title: "Karı Tahmini", sub: "Tilaveti dinle, doğru kâriyi seç" },
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
      if (!s || s === "final" || s === "cancelled") return false;
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
  const allReady = !needsMore && readyCount === totalCount;
  const navigate = useNavigate();

  const readyMutation = useMutation({
    mutationFn: () => toggleMeclisReady({ data: { code: session.code, ready: !(me?.ready ?? false) } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meclis-state", session.code] }),
  });
  const difficultyMutation = useMutation({
    mutationFn: (d: Difficulty) => setMeclisDifficulty({ data: { code: session.code, difficulty: d } }),
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
          Zorluk {!isHost && <span className="opacity-60">(mihmandar belirler)</span>}
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

const ALL_GAMES = ["fill-blank", "surah-guess", "word-meaning", "word-match", "peygamber-kim", "kari-tahmini"] as const;

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
  const { session, players, meId } = state;
  const me = players.find((p) => p.userId === meId);
  const initialGames = (me?.votes ?? []) as string[];
  const initialScope = me?.scopeVote ?? "";
  const [picks, setPicks] = useState<string[]>(initialGames);
  const [scope, setScope] = useState<string>(initialScope);
  const [submitted, setSubmitted] = useState(initialGames.length > 0 && initialScope !== "");
  const elapsed = session.roundStartedAt ? Math.floor((Date.now() - session.roundStartedAt) / 1000) : 0;
  const remaining = Math.max(0, 30 - elapsed);

  const submitMutation = useMutation({
    mutationFn: () => submitMeclisVotes({ data: { code: session.code, votes: picks, scope } }),
    onSuccess: () => {
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["meclis-state", session.code] });
    },
  });

  const toggleGame = (g: string) => {
    if (submitted) return;
    setPicks((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      if (prev.length >= 3) return prev;
      return [...prev, g];
    });
  };

  const votedCount = players.filter((p) => p.votes.length > 0 && p.scopeVote != null).length;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <p className="mu-eyebrow"><span className="mu-eb-line" />Oylama</p>
      <h1 className="mu-display" style={{ marginBottom: 6 }}>Oyun & sure seç</h1>
      <p className="mu-lede" style={{ marginBottom: 18 }}>
        En çok oy alan 3 oyun ve sure kapsamı mecliste oynanır.
      </p>

      <div className="flex justify-between items-center mb-4 text-xs">
        <span className="text-[var(--color-text-secondary)]">{votedCount}/{players.length} oy verdi</span>
        <span className="font-bold text-[var(--mu-accent)] tabular-nums">{remaining}sn</span>
      </div>

      <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
        Oyunlar — 3 tanesini seç ({picks.length}/3)
      </p>
      <div className="space-y-2 mb-5">
        {ALL_GAMES.map((g) => {
          const picked = picks.includes(g);
          const meta = GAME_LABELS[g];
          return (
            <button
              key={g}
              disabled={submitted}
              onClick={() => toggleGame(g)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                picked
                  ? "border-[var(--mu-accent)] bg-[var(--mu-accent-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              } ${submitted ? "opacity-60 cursor-default" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">{meta?.title ?? g}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{meta?.sub ?? ""}</div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border-2 ${
                    picked ? "bg-[var(--mu-accent)] border-[var(--mu-accent)]" : "border-[var(--color-border)]"
                  } flex items-center justify-center`}
                >
                  {picked && <span className="text-white text-xs">✓</span>}
                </span>
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
          return (
            <button
              key={opt.key}
              disabled={submitted}
              onClick={() => !submitted && setScope(opt.key)}
              className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                picked
                  ? "border-[var(--mu-accent)] bg-[var(--mu-accent-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              } ${submitted ? "opacity-60 cursor-default" : ""}`}
            >
              <div className="text-xs font-bold text-[var(--color-text-primary)]">{opt.label}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-tight">{opt.sub}</div>
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={() => submitMutation.mutate()}
          disabled={picks.length === 0 || scope === "" || submitMutation.isPending}
          className="mu-btn primary w-full disabled:opacity-50"
        >
          {submitMutation.isPending ? "Kaydediliyor..." : `Onayla (${picks.length} seçim)`}
        </button>
      ) : (
        <p className="text-center text-sm text-[var(--color-text-secondary)]">
          Oyların alındı. Diğerleri bekleniyor…
        </p>
      )}
    </div>
  );
}

// ── Playing ──────────────────────────────────────────────

function PlayingView({ state }: { state: MeclisStatePayload }) {
  const { session } = state;
  const gameId = session.gamePool[session.currentGameIndex] ?? "fill-blank";
  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <div className="text-center mb-3">
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

// ── Interim ──────────────────────────────────────────────

function InterimView({ state }: { state: MeclisStatePayload }) {
  const elapsed = state.session.roundStartedAt ? Math.floor((Date.now() - state.session.roundStartedAt) / 1000) : 0;
  const remaining = Math.max(0, Math.ceil(state.session.interimMs / 1000) - elapsed);
  const sorted = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
  const isLast = state.session.currentGameIndex >= state.session.gamePool.length - 1;
  const nextGameId = state.session.gamePool[state.session.currentGameIndex + 1];
  const nextLabel = nextGameId ? GAME_LABELS[nextGameId]?.title ?? nextGameId : null;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <p className="mu-eyebrow text-center"><span className="mu-eb-line" />{state.session.currentGameIndex + 1}. El bitti</p>
      <h1 className="mu-display text-center" style={{ marginBottom: 18 }}>
        {isLast ? "Final yaklaşıyor" : `Sıra: ${nextLabel}`}
      </h1>

      <div className="space-y-2 mb-6">
        {sorted.map((p, i) => (
          <div key={p.userId} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <span className="text-2xl font-bold tabular-nums w-8 text-[var(--color-text-secondary)]">#{i + 1}</span>
            <span className="flex-1 text-sm font-medium">{p.name}</span>
            <span className="text-base font-bold tabular-nums text-[var(--mu-accent)]">{p.totalScore}</span>
          </div>
        ))}
      </div>
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

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <p className="mu-eyebrow text-center"><span className="mu-eb-line" />Meclis tamam</p>
      <h1 className="mu-display text-center" style={{ marginBottom: 24 }}>
        Birincilik {winner?.name}'nın
      </h1>

      <div className="space-y-2 mb-6">
        {sorted.map((p, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
          return (
            <div
              key={p.userId}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border ${i === 0 ? "border-[var(--mu-accent)] bg-[var(--mu-accent-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}
            >
              <span className="text-2xl w-10 text-center">{medal || `#${i + 1}`}</span>
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
          Mihmandar yeniden başlatabilir — buradan ayrılma.
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
