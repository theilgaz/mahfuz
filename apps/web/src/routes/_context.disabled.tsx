/**
 * Bağlamsal Açıklamalar — /context
 * Sıkça yanlış anlaşılan ayetler: tarihsel bağlam, klasik tefsir, akademik yanıtlar.
 * Giriş: 4 haneli PIN (2255 = Bakara:255 Ayetel Kursi)
 */

import { useState, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllVerseContexts } from "~/lib/verse-context-data";

const CORRECT_PIN = "2255";
const SESSION_KEY = "savunma_unlocked";

const CATEGORY_LABELS: Record<string, string> = {
  siddet: "Silahlı Çatışma ve Savaş",
  kadin: "Kadın Hakları",
  cinsellik: "Evlilik ve Cinsellik",
  ceza: "Ceza Hukuku",
  din: "Dini Özgürlük",
  kolelik: "Kölelik ve Özgürlük",
  cennet: "Ahiret Tasvirleri",
};

export const Route = createFileRoute("/_context/disabled")({
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
        <div className="w-14 h-14 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Bağlamsal Açıklamalar</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Devam etmek için şifreyi girin</p>
        </div>

        <div
          className="flex gap-3"
          style={shake ? { animation: "wiggle 0.4s ease-in-out" } : {}}
        >
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
              className={`w-13 h-13 text-center text-xl font-bold rounded border-2 bg-[var(--color-surface)] outline-none transition-all
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

  // Sure bazında grupla, sure numarasına göre sırala
  const grouped = all.reduce<Record<string, { surahName: string; surahNumber: number; verses: typeof all }>>((acc, v) => {
    const surahNumber = parseInt(v.verseKey.split(":")[0]);
    if (!acc[v.surahName]) {
      acc[v.surahName] = { surahName: v.surahName, surahNumber, verses: [] };
    }
    acc[v.surahName].verses.push(v);
    return acc;
  }, {});

  const groups = Object.values(grouped).sort((a, b) => a.surahNumber - b.surahNumber);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">
          Bağlamsal Açıklamalar
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
          Sıkça yanlış anlaşılan {all.length} ayet için tarihsel bağlam, klasik tefsir görüşleri ve akademik yanıtlar.
        </p>
      </div>

      {/* Sure bazında gruplar */}
      <div className="space-y-8">
        {groups.map(({ surahName, surahNumber, verses }) => (
          <section key={surahName}>

            {/* Sure başlığı */}
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-accent)]/8 flex items-center justify-center">
                <span className="text-[11px] font-bold text-[var(--color-accent)]">{surahNumber}</span>
              </div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {surahName} Suresi
              </h2>
              <span className="text-[10px] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
                {verses.length} konu
              </span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            {/* Ayet kartları */}
            <div className="space-y-1.5">
              {verses.map((ctx) => {
                const ayahNum = ctx.verseKey.split(":")[1];
                const categoryLabel = CATEGORY_LABELS[ctx.category] ?? ctx.category;
                return (
                  <Link
                    key={ctx.verseKey}
                    to="/analyse/$verseKey"
                    params={{ verseKey: ctx.verseKey }}
                    search={{ tab: "bagit" }}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/3 transition-all group"
                  >
                    {/* Ayet numarası */}
                    <div className="shrink-0 w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col items-center justify-center gap-px">
                      <span className="text-[8px] text-[var(--color-text-secondary)] leading-none uppercase tracking-wide">ayet</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)] leading-none">{ayahNum}</span>
                    </div>

                    {/* Konu ve kategori */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">
                        {ctx.topic}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                        {categoryLabel}
                        <span className="mx-1.5 opacity-40">·</span>
                        {ctx.misconceptions.length} itiraz yanıtı
                      </p>
                    </div>

                    {/* Ok */}
                    <svg
                      className="w-4 h-4 shrink-0 text-[var(--color-border)] group-hover:text-[var(--color-accent)] transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Alt bilgi */}
      <div className="mt-10 px-5 py-4 rounded border border-[var(--color-border)]">
        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed text-center">
          Açıklamalar klasik tefsir, hadis kaynakları ve akademik çalışmalar esas alınarak hazırlanmıştır.
          Kur'an bütünlük içinde anlaşılır; hiçbir ayet bağlamından koparılarak değerlendirilemez.
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
