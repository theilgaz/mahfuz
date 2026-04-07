/**
 * Savunma — yaygın yanlış anlaşılan ayetlerin baglamsal açıklamaları.
 * Giriş: 4 haneli PIN (2255 = Bakara:255 Ayetel Kursi)
 */

import { useState, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllVerseContexts, VERSE_CATEGORIES } from "~/lib/verse-context-data";

const CORRECT_PIN = "2255";
const SESSION_KEY = "savunma_unlocked";

export const Route = createFileRoute("/savunma")({
  component: SavunmaPage,
});

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError(false);

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    if (value && index === 3) {
      const pin = [...next.slice(0, 3), value].join("");
      if (pin === CORRECT_PIN) {
        sessionStorage.setItem(SESSION_KEY, "1");
        onUnlock();
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => {
          setShake(false);
          setDigits(["", "", "", ""]);
          inputs.current[0]?.focus();
        }, 600);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs flex flex-col items-center gap-6">
        {/* Kilit ikonu */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Bağlamsal Açıklamalar</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Devam etmek için şifreyi girin</p>
        </div>

        {/* PIN kutucukları */}
        <div className={`flex gap-3 ${shake ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`}
          style={shake ? { animation: "wiggle 0.4s ease-in-out" } : {}}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-xl font-bold rounded-xl border-2 bg-[var(--color-surface)] outline-none transition-all
                ${error
                  ? "border-red-400 text-red-500"
                  : d
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-text-primary)]"
                }
                focus:border-[var(--color-accent)]`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500">Yanlış şifre, tekrar deneyin.</p>
        )}

        <p className="text-[10px] text-[var(--color-text-secondary)] text-center leading-relaxed max-w-[200px]">
          Bu içerik hassas kelami konular içermektedir.
        </p>
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

function SavunmaContent() {
  const all = getAllVerseContexts();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
          Bağlamsal Açıklamalar
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Sıkça yanlış anlaşılan {all.length} ayet için tarihsel bağlam, klasik tefsir görüşleri ve akademik yanıtlar.
        </p>
      </div>

      {/* Kategoriler */}
      <div className="space-y-6">
        {VERSE_CATEGORIES.map((cat) => {
          const verses = all.filter((v) => v.category === cat.id);
          if (verses.length === 0) return null;

          return (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{cat.icon}</span>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {cat.label}
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                  {verses.length}
                </span>
              </div>

              <div className="space-y-2">
                {verses.map((ctx) => (
                  <Link
                    key={ctx.verseKey}
                    to="/analyse/$verseKey"
                    params={{ verseKey: ctx.verseKey }}
                    search={{ tab: "bagit" }}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-[var(--color-accent)]">
                          {ctx.surahName} {ctx.verseKey.split(":")[1]}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          {ctx.verseKey}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-primary)] font-medium leading-snug">
                        {ctx.topic}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed line-clamp-2">
                        {ctx.misconceptions[0]?.claim}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-[var(--color-text-secondary)]">
                        {ctx.misconceptions.length} itiraz
                      </span>
                      <svg
                        className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alt bilgi */}
      <div className="mt-8 px-4 py-4 rounded-xl border border-dashed border-[var(--color-border)] text-center">
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Açıklamalar klasik tefsir, hadis kaynakları ve akademik çalışmalar esas alınarak hazırlanmıştır.
          <br />
          Tek bir ayet, Kur'an bütününden koparılarak incelenemez.
        </p>
      </div>
    </div>
  );
}

function SavunmaPage() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  return <SavunmaContent />;
}
