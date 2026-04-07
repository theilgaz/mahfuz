/**
 * Oyunlar hub
 */

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/games/")({
  component: GamesPage,
});

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  link?: string;
}

const GAMES: Game[] = [
  {
    id: "kelime-doldurma",
    title: "Kelime Doldurma",
    description: "Ayetteki eksik kelimeyi bul",
    category: "Hıfz",
    link: "/games/fill-blank",
  },
  {
    id: "ayet-zinciri",
    title: "Ayet Zinciri",
    description: "Ayetin devamını tamamla",
    category: "Hıfz",
    link: "/games/verse-chain",
  },
  {
    id: "kiraet-karaoke",
    title: "Kıraet Karaoke",
    description: "Oku, dinle, geri bildirim al",
    category: "Hıfz",
    link: "/recite",
  },
  {
    id: "sure-tanima",
    title: "Sure Tanıma",
    description: "Tilaveti duyunca sureyi tahmin et",
    category: "Dinleme",
    link: "/games/surah-guess",
  },
  {
    id: "kelime-anlami",
    title: "Kelime Anlamı",
    description: "Arapça kelime → Türkçe anlam",
    category: "Kelime",
    link: "/games/word-meaning",
  },
  {
    id: "hexagon-harf",
    title: "Hexagon Harf",
    description: "Bal peteğinde harflerden kelime oluştur",
    category: "Kelime",
    link: "/games/hexagon",
  },
  {
    id: "harf-tanima",
    title: "Harf Tanıma",
    description: "Duyduğun harfi seç",
    category: "Elifba",
    link: "/alifba",
  },
];

const COMING_SOON: Game[] = [
  { id: "kelime-yagmuru", title: "Kelime Yağmuru", description: "Düşen kelimelerin anlamını seç", category: "Kelime" },
  { id: "baglanti-oyunu", title: "Bağlantı Oyunu", description: "16 kartı 4 kategoriye grupla", category: "Mantık" },
  { id: "musretek-kok", title: "Müşterek Kök", description: "4 kelimenin ortak kökünü bul", category: "Kelime" },
  { id: "kissadan-hisse", title: "Kıssadan Hisse", description: "Kıssa özetinden peygamberi bul", category: "Mantık" },
  { id: "rakip-mod", title: "Rakip Modu", description: "Arkadaşınla aynı soruları yarış", category: "Hıfz" },
];

function GamesPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Oyunlar</h1>

      {/* Aktif oyunlar */}
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden mb-8">
        {GAMES.map((game, i) => (
          <Link
            key={game.id}
            to={game.link as "/recite"}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)] transition-colors ${
              i < GAMES.length - 1 ? "border-b border-[var(--color-border)]" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{game.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{game.description}</p>
            </div>
            <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0">{game.category}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-border)] shrink-0">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Yakında */}
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">Yakında</p>
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden opacity-50">
        {COMING_SOON.map((game, i) => (
          <div
            key={game.id}
            className={`flex items-center gap-3 px-4 py-3.5 ${
              i < COMING_SOON.length - 1 ? "border-b border-[var(--color-border)]" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{game.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{game.description}</p>
            </div>
            <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0">{game.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
