/**
 * Meclis modunda "Kim Bu Peygamber?" — sadece ilk ipucu görünür,
 * oyuncu ihtiyaç duydukça "İpucu Al" ile diğerlerini açar.
 * Skor çarpanı kullanılan ipucu sayısına göre düşer:
 *   1 ipucu → 1.0x (tam puan + time bonus)
 *   2 ipucu → 0.6x
 *   3 ipucu → 0.3x
 * Bilen ilk hint'te basar, geç kalan yüksek puan kaybeder.
 *
 * Round timeout: 30sn (cevap verilmezse otomatik yeni peygamber).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PEYGAMBERS, type PeygamberEntry } from "~/lib/peygamber-clues";
import type { MeclisGameState } from "./MeclisGamePlay";

const ROUND_TIMEOUT_MS = 30_000;
const OPTION_COUNT = 4;
const MULTIPLIER_BY_CLUES: Record<number, number> = { 1: 1.0, 2: 0.6, 3: 0.3 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Round {
  target: PeygamberEntry;
  options: string[];
}

function buildRound(used: Set<string>): Round {
  const available = PEYGAMBERS.filter((p) => !used.has(p.name));
  const pool = available.length > 0 ? available : PEYGAMBERS;
  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(PEYGAMBERS.filter((p) => p.name !== target.name))
    .slice(0, OPTION_COUNT - 1)
    .map((p) => p.name);
  const options = shuffle([target.name, ...distractors]);
  return { target, options };
}

export function MeclisPeygamberKim({ scoreCorrect, scoreWrong, finished }: MeclisGameState) {
  const [round, setRound] = useState<Round>(() => buildRound(new Set()));
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<string | null>(null);
  const [revealedClues, setRevealedClues] = useState(1);
  const roundStartedAtRef = useRef(Date.now());

  const advance = useCallback(() => {
    const nextUsed = new Set(used).add(round.target.name);
    setUsed(nextUsed);
    setRound(buildRound(nextUsed));
    setPicked(null);
    setRevealedClues(1);
    roundStartedAtRef.current = Date.now();
  }, [round.target.name, used]);

  // Round timeout — cevap verilmediyse otomatik yeni soru
  useEffect(() => {
    if (finished || picked) return;
    const id = setInterval(() => {
      if (Date.now() - roundStartedAtRef.current >= ROUND_TIMEOUT_MS) {
        setPicked("__TIMEOUT__");
        scoreWrong();
        setTimeout(() => {
          if (!finished) advance();
        }, 1800);
      }
    }, 500);
    return () => clearInterval(id);
  }, [finished, picked, scoreWrong, advance]);

  const handlePick = useCallback((name: string) => {
    if (finished || picked) return;
    setPicked(name);
    const isCorrect = name === round.target.name;
    const answerTimeMs = Date.now() - roundStartedAtRef.current;
    if (isCorrect) {
      const mult = MULTIPLIER_BY_CLUES[revealedClues] ?? 0.3;
      scoreCorrect(answerTimeMs, mult);
    } else {
      scoreWrong();
    }
    setTimeout(() => {
      if (!finished) advance();
    }, 1500);
  }, [finished, picked, round.target.name, revealedClues, scoreCorrect, scoreWrong, advance]);

  const revealNextClue = useCallback(() => {
    if (revealedClues < 3 && !picked) setRevealedClues((n) => n + 1);
  }, [revealedClues, picked]);

  const visibleClues = useMemo(() => round.target.clues.slice(0, revealedClues), [round.target.clues, revealedClues]);
  const revealing = picked != null;
  const canHint = revealedClues < 3 && !picked;
  const nextMultiplier = MULTIPLIER_BY_CLUES[Math.min(revealedClues + 1, 3)] ?? 0.3;

  return (
    <div className="px-5 py-6 rounded-2xl border bg-[var(--color-surface)]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)]">
          Kim bu peygamber?
        </div>
        <div className="text-[10px] font-mono text-[var(--mu-accent)]">
          {revealedClues}/3 ipucu · {Math.round((MULTIPLIER_BY_CLUES[revealedClues] ?? 0.3) * 100)}% puan
        </div>
      </div>

      {/* İpuçları stack */}
      <div className="space-y-2 mb-3">
        {visibleClues.map((c, i) => (
          <div
            key={i}
            className="px-3 py-2.5 rounded-lg border bg-[var(--mu-bg)] border-[var(--color-border)] game-slide-up"
          >
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mr-2">
              {i + 1}.
            </span>
            <span className="text-sm text-[var(--color-text-primary)]">{c}</span>
          </div>
        ))}
      </div>

      {/* İpucu Al butonu */}
      {canHint && (
        <button
          onClick={revealNextClue}
          className="w-full mb-4 px-3 py-2 rounded-lg border border-dashed border-[var(--mu-accent)] text-xs font-medium text-[var(--mu-accent)] hover:bg-[var(--mu-accent-soft)] transition-colors"
        >
          İpucu Al · sonraki ipucu ile puan {Math.round(nextMultiplier * 100)}%
        </button>
      )}

      {/* Seçenekler */}
      <div className="grid grid-cols-2 gap-2">
        {round.options.map((opt) => {
          const isPick = picked === opt;
          const isAnswer = revealing && opt === round.target.name;
          const isWrongPick = revealing && isPick && !isAnswer;
          let style: React.CSSProperties = {};
          if (revealing) {
            if (isAnswer) style = { borderColor: "rgba(34,197,94,0.6)", background: "rgba(34,197,94,0.10)" };
            else if (isWrongPick) style = { borderColor: "rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.10)" };
            else style = { opacity: 0.4 };
          }
          return (
            <button
              key={opt}
              onClick={() => handlePick(opt)}
              disabled={!!picked}
              className="px-3 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium transition-all min-h-[48px]"
              style={style}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {picked === "__TIMEOUT__" && (
        <p className="text-center text-xs text-[var(--color-text-secondary)] mt-4">
          Süre doldu — cevap: <span className="font-bold">{round.target.name}</span>
        </p>
      )}
    </div>
  );
}
