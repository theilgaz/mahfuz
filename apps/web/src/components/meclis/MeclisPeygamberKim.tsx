/**
 * Meclis modunda "Kim Bu Peygamber?" — 3 ipucu kademeli açılır,
 * 4 isim arasından doğru olanı seçen oyuncu kazanır. Erken bilenler
 * (henüz az ipucu açıkken) daha hızlı cevap verir → time bonus
 * doğal olarak yüksek olur.
 *
 * Round timing:
 *   t=0s  → ipucu 1 görünür, seçenekler gösterilir
 *   t=6s  → ipucu 2 ortaya çıkar
 *   t=12s → ipucu 3 ortaya çıkar
 *   t=18s → cevap reveal + 2sn pause
 *   t=20s → yeni peygamber
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PEYGAMBERS, type PeygamberEntry } from "~/lib/peygamber-clues";
import type { MeclisGameState } from "./MeclisGamePlay";

const CLUE_INTERVAL_MS = 6_000;
const REVEAL_AT_MS = 18_000;
const NEXT_ROUND_AT_MS = 20_000;
const OPTION_COUNT = 4;

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
  const [stage, setStage] = useState(0); // 0,1,2 = clues 1,2,3 visible; 3 = reveal
  const roundStartedAtRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  // Round timer — ipuçları kademeli aç + reveal + next
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - roundStartedAtRef.current;
      if (elapsed >= NEXT_ROUND_AT_MS) {
        // Yeni tur
        const nextUsed = new Set(used).add(round.target.name);
        setUsed(nextUsed);
        setRound(buildRound(nextUsed));
        setPicked(null);
        setStage(0);
        roundStartedAtRef.current = Date.now();
        questionStartRef.current = Date.now();
      } else if (elapsed >= REVEAL_AT_MS) {
        setStage(3);
      } else if (elapsed >= CLUE_INTERVAL_MS * 2) {
        setStage(2);
      } else if (elapsed >= CLUE_INTERVAL_MS) {
        setStage(1);
      }
    }, 200);
    return () => clearInterval(id);
  }, [finished, used, round.target.name]);

  const handlePick = useCallback((name: string) => {
    if (finished || picked || stage >= 3) return;
    setPicked(name);
    const isCorrect = name === round.target.name;
    const answerTimeMs = Date.now() - questionStartRef.current;
    if (isCorrect) scoreCorrect(answerTimeMs);
    else scoreWrong();
  }, [finished, picked, stage, round.target.name, scoreCorrect, scoreWrong]);

  const visibleClues = useMemo(() => {
    const v = round.target.clues.slice(0, Math.min(stage + 1, 3));
    return v;
  }, [round.target.clues, stage]);

  const revealing = stage >= 3 || picked != null;

  return (
    <div className="px-5 py-6 rounded-2xl border bg-[var(--color-surface)]">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-3 text-center">
        Kim bu peygamber?
      </div>

      {/* İpuçları stack — yenisi en üste */}
      <div className="space-y-2 mb-5 min-h-[120px]">
        {visibleClues.map((c, i) => (
          <div
            key={i}
            className="px-3 py-2.5 rounded-lg border bg-[var(--mu-bg)] border-[var(--color-border)]"
          >
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mr-2">
              {i + 1}.
            </span>
            <span className="text-sm text-[var(--color-text-primary)]">{c}</span>
          </div>
        ))}
      </div>

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
              disabled={picked != null || stage >= 3}
              className="px-3 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium transition-all min-h-[48px]"
              style={style}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {revealing && picked == null && (
        <p className="text-center text-xs text-[var(--color-text-secondary)] mt-4">
          Geç kaldın — cevap: <span className="font-bold">{round.target.name}</span>
        </p>
      )}
    </div>
  );
}
