import type {
  Surah,
  Ayah,
  SurahData,
  PageData,
  DailyVerse,
  TranslationSource,
  ReciterRow,
  GameQuestion,
  GameScoreSubmit,
  GameScoreResult,
  LeaderboardEntry,
} from "./types";

export interface MahfuzClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
}

export class MahfuzClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(options: MahfuzClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getToken = options.getToken ?? (() => Promise.resolve(null));
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Quran Data ──

  async getSurahs(): Promise<Surah[]> {
    return this.request<Surah[]>("/api/v1/surahs");
  }

  async getSurahData(surahId: number, translationSlugs?: string[]): Promise<SurahData | null> {
    const params = translationSlugs?.length
      ? `?translations=${translationSlugs.join(",")}`
      : "";
    return this.request<SurahData | null>(`/api/v1/surahs/${surahId}${params}`);
  }

  async getAyahsBySurah(surahId: number): Promise<Ayah[]> {
    return this.request<Ayah[]>(`/api/v1/surahs/${surahId}/ayahs`);
  }

  async getPageData(pageNumber: number, translationSlugs?: string[]): Promise<PageData | null> {
    const params = translationSlugs?.length
      ? `?translations=${translationSlugs.join(",")}`
      : "";
    return this.request<PageData | null>(`/api/v1/pages/${pageNumber}${params}`);
  }

  async getDailyVerse(): Promise<DailyVerse | null> {
    return this.request<DailyVerse | null>("/api/v1/daily-verse");
  }

  async getTranslationSources(): Promise<TranslationSource[]> {
    return this.request<TranslationSource[]>("/api/v1/translation-sources");
  }

  async getReciters(): Promise<ReciterRow[]> {
    return this.request<ReciterRow[]>("/api/v1/reciters");
  }

  // ── Search ──

  async search(query: string, limit = 20): Promise<Ayah[]> {
    const q = encodeURIComponent(query);
    return this.request<Ayah[]>(`/api/v1/search?q=${q}&limit=${limit}`);
  }

  // ── Sync ──

  async pull(): Promise<{
    version: number;
    settings: Record<string, unknown>;
    bookmarks: Array<{ surahId: number; ayahNumber: number; pageNumber: number; createdAt: number }>;
    readingPositions: Array<{ surahId: number; ayahNumber: number; pageNumber: number }>;
  }> {
    return this.request("/api/v1/sync");
  }

  async push(data: {
    readingPositions?: Array<{ surahId: number; ayahNumber: number; pageNumber: number }>;
    bookmarks?: Array<{ surahId: number; ayahNumber: number; pageNumber: number; createdAt: number; deleted?: boolean }>;
    settings?: Record<string, { value: unknown; ts: number }>;
  }): Promise<{ ok: boolean }> {
    return this.request("/api/v1/sync", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ── Games ──

  async getGameQuestion(type: string = "fill-blank"): Promise<GameQuestion | null> {
    return this.request<GameQuestion | null>(`/api/v1/games/question?type=${encodeURIComponent(type)}`);
  }

  async submitGameScore(data: GameScoreSubmit): Promise<GameScoreResult> {
    return this.request<GameScoreResult>("/api/v1/games/scores", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLeaderboard(gameId?: string, limit = 10): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (gameId) params.set("gameId", gameId);
    return this.request<LeaderboardEntry[]>(`/api/v1/games/scores?${params}`);
  }
}
