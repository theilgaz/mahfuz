/**
 * Oyunlar hub
 */

import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSurahSelectionStore } from "~/stores/surahSelection.store";
import { useGamesFavoritesStore } from "~/stores/gamesFavorites.store";
import {
  getGameLeaderboard,
  getGlobalLeaderboard,
  getMyScoreStats,
  GAME_TITLES,
  GAME_IDS,
  type LeaderboardEntry,
  type MyGameStat,
} from "~/lib/score-service";

export const Route = createFileRoute("/games/")({
  component: GamesPage,
});

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  link: string;
  surahScoped?: boolean;
}

const GAMES: Game[] = [
  {
    id: "kelime-doldurma",
    title: "Kelime Doldurma",
    description: "Ayetteki eksik kelimeyi bul",
    category: "Hıfz",
    link: "/games/fill-blank",
    surahScoped: true,
  },
  {
    id: "ayet-zinciri",
    title: "Ayet Zinciri",
    description: "Ayetin devamını tamamla",
    category: "Hıfz",
    link: "/games/verse-chain",
    surahScoped: true,
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
    surahScoped: true,
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
];

const ELIFBA_GAMES: Game[] = [
  {
    id: "elifba-sesli-quiz",
    title: "Sesli Quiz",
    description: "Sesi dinle, doğru harfi seç",
    category: "Elifba",
    link: "/alifba/quiz/voice",
  },
  {
    id: "elifba-form-quiz",
    title: "Form Quizi",
    description: "Harfin hangi formu olduğunu bul",
    category: "Elifba",
    link: "/alifba/quiz/forms",
  },
  {
    id: "elifba-karisik-sinav",
    title: "Karışık Sınav",
    description: "28 sorudan oluşan kapsamlı sınav",
    category: "Elifba",
    link: "/alifba/exam",
  },
  {
    id: "elifba-hafiza",
    title: "Hafıza Oyunu",
    description: "Eşleşen harf kartlarını bul",
    category: "Elifba",
    link: "/alifba/games/memory",
  },
  {
    id: "elifba-hiz",
    title: "Hız Oyunu",
    description: "30 saniyede kaç harf tanırsın?",
    category: "Elifba",
    link: "/alifba/games/speed",
  },
  {
    id: "elifba-harf-bul",
    title: "Harf Bul",
    description: "Kelime içindeki harfi bul",
    category: "Elifba",
    link: "/alifba/games/fill",
  },
  {
    id: "elifba-kelime-bul",
    title: "Kelime Bul",
    description: "Sesi duyunca doğru kelimeyi seç",
    category: "Elifba",
    link: "/alifba/games/word",
  },
];

const COMING_SOON: Omit<Game, "link">[] = [
  { id: "kelime-yagmuru", title: "Kelime Yağmuru", description: "Düşen kelimelerin anlamını seç", category: "Kelime" },
  { id: "baglanti-oyunu", title: "Bağlantı Oyunu", description: "16 kartı 4 kategoriye grupla", category: "Mantık" },
  { id: "musretek-kok", title: "Müşterek Kök", description: "4 kelimenin ortak kökünü bul", category: "Kelime" },
  { id: "kissadan-hisse", title: "Kıssadan Hisse", description: "Kıssa özetinden peygamberi bul", category: "Mantık" },
  { id: "rakip-mod", title: "Rakip Modu", description: "Arkadaşınla aynı soruları yarış", category: "Hıfz" },
];

function ScopeLabel({ count }: { count: number }) {
  return (
    <span className="text-[10px] text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full shrink-0 font-medium">
      {count === 0 ? "Tüm Kuran" : `${count} sure`}
    </span>
  );
}

function StarButton({ id }: { id: string }) {
  const toggle = useGamesFavoritesStore((s) => s.toggle);
  const isFavorite = useGamesFavoritesStore((s) => s.isFavorite(id));

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className="p-1 -mr-1 shrink-0"
      aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isFavorite ? "text-amber-400" : "text-[var(--color-border)]"}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

function GameRow({ game, isLast }: { game: Game; isLast: boolean }) {
  const selectedSurahIds = useSurahSelectionStore((s) => s.selectedSurahIds);

  return (
    <div className={`flex items-center ${!isLast ? "border-b border-[var(--color-border)]" : ""}`}>
      <Link
        to={game.link as "/recite"}
        className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0 hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{game.title}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{game.description}</p>
        </div>
        {game.surahScoped ? (
          <ScopeLabel count={selectedSurahIds.length} />
        ) : (
          <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0">{game.category}</span>
        )}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-border)] shrink-0">
          <path d="M5 3l4 4-4 4" />
        </svg>
      </Link>
      <div className="pr-3">
        <StarButton id={game.id} />
      </div>
    </div>
  );
}

function GamesList({ games }: { games: Game[] }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      {games.map((game, i) => (
        <GameRow key={game.id} game={game} isLast={i === games.length - 1} />
      ))}
    </div>
  );
}

// ── Skor Tablosu ─────────────────────────────────────────

const MEDAL = ["🥇", "🥈", "🥉"];

function ScoreboardSection({ userId }: { userId?: string }) {
  const [tab, setTab] = useState<"mine" | "global" | "game">("mine");
  const [selectedGame, setSelectedGame] = useState(GAME_IDS[0]);
  const [open, setOpen] = useState(false);

  const { data: myStats } = useQuery<MyGameStat[]>({
    queryKey: ["my-score-stats"],
    queryFn: () => getMyScoreStats(),
    staleTime: 30_000,
    enabled: !!userId && open,
  });

  const { data: globalBoard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["global-leaderboard"],
    queryFn: () => getGlobalLeaderboard(),
    staleTime: 60_000,
    enabled: tab === "global" && open,
  });

  const { data: gameBoard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["game-leaderboard", selectedGame],
    queryFn: () => getGameLeaderboard({ data: { gameId: selectedGame } }),
    staleTime: 60_000,
    enabled: tab === "game" && open,
  });

  const myTotal = myStats?.reduce((s, r) => s + r.bestScore, 0) ?? 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
      {/* Başlık — tıklanınca aç/kapat */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Skor Tablosu</span>
          {myTotal > 0 && (
            <span className="text-xs text-[var(--color-accent)] font-bold bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full">
              {myTotal} puan
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[var(--color-text-secondary)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)]">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--color-border)]">
            {[
              { key: "mine", label: "Benim" },
              { key: "global", label: "Global" },
              { key: "game", label: "Oyuna Göre" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as typeof tab)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  tab === key
                    ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="px-4 py-3 space-y-2">
            {/* Benim rekorlarım */}
            {tab === "mine" && (
              !userId ? (
                <p className="text-xs text-[var(--color-text-secondary)] text-center py-2">
                  Rekorların kaydedilmesi için{" "}
                  <Link to="/auth/login" className="text-[var(--color-accent)] underline">giriş yap</Link>
                </p>
              ) : !myStats || myStats.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)] text-center py-2">Henüz oyun oynamadın</p>
              ) : (
                myStats.map((s) => (
                  <div key={s.gameId} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-secondary)]">{GAME_TITLES[s.gameId] ?? s.gameId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-secondary)]">{s.totalPlays}x</span>
                      <span className="text-sm font-bold text-[var(--color-accent)]">{s.bestScore}</span>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Global liderler */}
            {tab === "global" && (
              !globalBoard || globalBoard.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)] text-center py-2">Henüz kayıtlı skor yok</p>
              ) : (
                globalBoard.map((e) => (
                  <div key={e.userId} className={`flex items-center gap-2 ${e.userId === userId ? "text-[var(--color-accent)]" : ""}`}>
                    <span className="text-base w-6 text-center">{MEDAL[e.rank - 1] ?? e.rank}</span>
                    <span className="flex-1 text-xs truncate text-[var(--color-text-primary)]">{e.userName}</span>
                    <span className="text-sm font-bold">{e.bestScore}</span>
                  </div>
                ))
              )
            )}

            {/* Oyuna göre */}
            {tab === "game" && (
              <>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] mb-2"
                >
                  {GAME_IDS.map((id) => (
                    <option key={id} value={id}>{GAME_TITLES[id]}</option>
                  ))}
                </select>
                {!gameBoard || gameBoard.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-secondary)] text-center py-2">Bu oyun için henüz skor yok</p>
                ) : (
                  gameBoard.map((e) => (
                    <div key={e.userId} className={`flex items-center gap-2 ${e.userId === userId ? "text-[var(--color-accent)]" : ""}`}>
                      <span className="text-base w-6 text-center">{MEDAL[e.rank - 1] ?? e.rank}</span>
                      <span className="flex-1 text-xs truncate text-[var(--color-text-primary)]">{e.userName}</span>
                      <span className="text-sm font-bold">{e.bestScore}</span>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GamesPage() {
  const { session } = useRouteContext({ from: "__root__" });
  const favoriteIds = useGamesFavoritesStore((s) => s.favoriteIds);

  const allFavoritable = [...GAMES, ...ELIFBA_GAMES];
  const favorites = allFavoritable.filter((g) => favoriteIds.includes(g.id));
  const mainGames = GAMES.filter((g) => !favoriteIds.includes(g.id));
  const elifbaGames = ELIFBA_GAMES.filter((g) => !favoriteIds.includes(g.id));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
      <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Oyunlar</h1>

      <ScoreboardSection userId={session?.user?.id} />

      {/* Favoriler */}
      {favorites.length > 0 && (
        <section>
          <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Favoriler</p>
          <GamesList games={favorites} />
        </section>
      )}

      {/* Ana oyunlar */}
      {mainGames.length > 0 && (
        <section>
          {favorites.length > 0 && (
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Oyunlar</p>
          )}
          <GamesList games={mainGames} />
        </section>
      )}

      {/* Elifba */}
      {elifbaGames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Elifba</p>
            <Link
              to="/alifba"
              className="text-[10px] text-[var(--color-accent)] hover:underline"
            >
              Elifba'ya git →
            </Link>
          </div>
          <GamesList games={elifbaGames} />
        </section>
      )}

      {/* Yakında */}
      <section>
        <p className="text-xs text-[var(--color-text-secondary)] mb-2">Yakında</p>
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
      </section>
    </div>
  );
}
