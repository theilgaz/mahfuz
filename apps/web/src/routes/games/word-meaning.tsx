/**
 * Kelime Anlamı — Arapça kelime → Türkçe anlam (4 seçenek).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";

export const Route = createFileRoute("/games/word-meaning")({
  component: WordMeaningGame,
});

// Temel Kuran kelimeleri ve Türkçe anlamları
const WORD_PAIRS = [
  { arabic: "اللَّهُ", meaning: "Allah", wrong: ["Melek", "Peygamber", "Cennet"] },
  { arabic: "رَبِّ", meaning: "Rab / Efendi", wrong: ["Kul", "Şeytan", "Dünya"] },
  { arabic: "الرَّحْمَٰنِ", meaning: "Rahman (çok merhamet eden)", wrong: ["Şiddetli", "Kızgın", "Güçlü"] },
  { arabic: "الرَّحِيمِ", meaning: "Rahim (merhamet edici)", wrong: ["Bilen", "Duyan", "Yaratan"] },
  { arabic: "الْمَلِكِ", meaning: "Hükümdar / Melik", wrong: ["Kul", "Elçi", "Yolcu"] },
  { arabic: "الْحَمْدُ", meaning: "Hamd / Övgü", wrong: ["Şikâyet", "Dua", "İstek"] },
  { arabic: "كِتَابٌ", meaning: "Kitap", wrong: ["Ev", "Su", "Taş"] },
  { arabic: "نُورٌ", meaning: "Nur / Işık", wrong: ["Karanlık", "Ateş", "Su"] },
  { arabic: "صَلَاةٌ", meaning: "Namaz / Dua", wrong: ["Oruç", "Zekat", "Hac"] },
  { arabic: "رَحْمَةٌ", meaning: "Rahmet / Merhamet", wrong: ["Azap", "Hüzün", "Felaket"] },
  { arabic: "جَنَّةٌ", meaning: "Cennet", wrong: ["Cehennem", "Dünya", "Kabir"] },
  { arabic: "نَارٌ", meaning: "Ateş", wrong: ["Su", "Hava", "Toprak"] },
  { arabic: "قَلْبٌ", meaning: "Kalp / Gönül", wrong: ["El", "Göz", "Kulak"] },
  { arabic: "عِلْمٌ", meaning: "İlim / Bilgi", wrong: ["Cehalet", "Güç", "Mal"] },
  { arabic: "صَبْرٌ", meaning: "Sabır", wrong: ["Acele", "Korku", "Hırs"] },
  { arabic: "إِيمَانٌ", meaning: "İman", wrong: ["Küfür", "Şüphe", "Kibir"] },
  { arabic: "تَقْوَى", meaning: "Takva / Allah'tan korkma", wrong: ["Cimrilik", "Kibir", "Gaflet"] },
  { arabic: "آيَةٌ", meaning: "Ayet / İşaret", wrong: ["Sure", "Cüz", "Hizb"] },
  { arabic: "سُورَةٌ", meaning: "Sure", wrong: ["Ayet", "Kelime", "Harf"] },
  { arabic: "قُرْآنٌ", meaning: "Kuran", wrong: ["Tevrat", "İncil", "Zebur"] },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getRandomQuestion() {
  const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
  const options = shuffle([pair.meaning, ...pair.wrong]);
  return { ...pair, options };
}

type GameState = "playing" | "correct" | "wrong";

function WordMeaningGame() {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(() => getRandomQuestion());
  const [gameState, setGameState] = useState<GameState>("playing");
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = useCallback((opt: string) => {
    if (gameState !== "playing") return;
    setSelected(opt);
    if (opt === question.meaning) {
      setScore((s) => s + 10);
      setGameState("correct");
    } else {
      setGameState("wrong");
    }
  }, [gameState, question.meaning]);

  const nextRound = () => {
    setQuestion(getRandomQuestion());
    setGameState("playing");
    setSelected(null);
    setRound((r) => r + 1);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/games" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="text-center">
          <p className="text-xs text-[var(--color-text-secondary)]">Kelime Anlamı</p>
          <p className="text-sm font-bold text-[var(--color-accent)]">Soru {round}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-text-secondary)]">Puan</p>
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{score}</p>
        </div>
      </div>

      {/* Soru */}
      <div className="px-5 py-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-6 text-center">
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Bu kelimenin anlamı nedir?</p>
        <p
          className="text-5xl font-bold text-[var(--color-text-primary)]"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          {question.arabic}
        </p>
      </div>

      {/* Seçenekler */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {question.options.map((opt) => {
          let cls = "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]";
          if (gameState !== "playing") {
            if (opt === question.meaning) cls = "border-green-500 bg-green-50 text-green-700";
            else if (opt === selected) cls = "border-red-400 bg-red-50 text-red-600";
            else cls = "border-[var(--color-border)]/50 opacity-40 text-[var(--color-text-secondary)]";
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={gameState !== "playing"}
              className={`px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Sonuç */}
      {gameState !== "playing" && (
        <>
          <div className={`px-4 py-3 rounded-xl mb-4 text-center ${
            gameState === "correct" ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
          }`}>
            <p className={`text-sm font-semibold ${gameState === "correct" ? "text-green-700" : "text-red-600"}`}>
              {gameState === "correct" ? "✓ Doğru! +10 puan" : `✗ Yanlış. Doğrusu: ${question.meaning}`}
            </p>
          </div>
          <button
            onClick={nextRound}
            className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm"
          >
            Sonraki Soru →
          </button>
        </>
      )}
    </div>
  );
}
