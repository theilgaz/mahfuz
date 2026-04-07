/**
 * Açık Kuran REST API istemcisi.
 * Docs: https://github.com/acik-kuran/acikkuran-api
 * Base URL: https://api.acikkuran.com
 * Kullanım: CC BY-NC-SA 4.0 (attribution required, non-commercial)
 */

const BASE = "https://api.acikkuran.com";

export interface AcikKuranRootResult {
  id: number;
  latin: string;
  arabic: string;
  mean: string;
  mean_en: string;
  transcription: string;
  diffs: { id: number; diff: string; count: number }[];
}

export interface AcikKuranRootVerse {
  surahId: number;
  surahName: string;
  verseNumber: number;
  verseText: string;
  wordText: string;
  rootArabic: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 }, // 24 saat cache (Next/SSR uyumlu değil ama güvenli)
  } as RequestInit);
  if (!res.ok) throw new Error(`Açık Kuran API error: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export async function searchRootByLatin(latinChars: string): Promise<AcikKuranRootResult[]> {
  // API /root/latin/{chars} returns a single root. "h" maps to both ه (he) and ح (ha),
  // so we try both lowercase and H-capitalized variants and merge results.
  const normalized = latinChars.toLowerCase().trim();

  const queries = new Set([normalized]);
  if (normalized.includes("h")) {
    queries.add(normalized.replace(/h/g, "H"));
  }

  const results = await Promise.all(
    Array.from(queries).map(async (q) => {
      const data = await apiFetch<{ data: AcikKuranRootResult | null }>(
        `/root/latin/${encodeURIComponent(q)}`,
      );
      return data.data;
    }),
  );

  const seen = new Set<number>();
  return results.filter((r): r is AcikKuranRootResult => {
    if (!r || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export async function getRootVerses(rootId: number): Promise<AcikKuranRootVerse[]> {
  const data = await apiFetch<{ data: AcikKuranRootVerse[] }>(`/root/${rootId}/verses`);
  return data.data ?? [];
}

// ── Çeviri / Meal ──────────────────────────────────────────────────────────

export interface AcikKuranTranslation {
  authorId: number;
  authorName: string;
  description: string;
  language: string;
  text: string;
  footnotes: { id: number; text: string }[] | null;
}

interface AcikKuranVerseResponse {
  data: {
    translation: {
      text: string;
      footnotes: { id: number; text: string }[] | null;
      author: { id: number; name: string; description: string; language: string };
    };
  };
}

export async function getVerseByAuthor(
  surahId: number,
  verseNum: number,
  authorId: number,
): Promise<AcikKuranTranslation | null> {
  try {
    const data = await apiFetch<AcikKuranVerseResponse>(
      `/surah/${surahId}/verse/${verseNum}?author=${authorId}`,
    );
    const { translation } = data.data;
    return {
      authorId,
      authorName: translation.author.name,
      description: translation.author.description,
      language: translation.author.language,
      text: translation.text,
      footnotes: translation.footnotes,
    };
  } catch {
    return null;
  }
}

export async function getVerseByAuthors(
  surahId: number,
  verseNum: number,
  authorIds: number[],
): Promise<AcikKuranTranslation[]> {
  const results = await Promise.all(
    authorIds.map((id) => getVerseByAuthor(surahId, verseNum, id)),
  );
  return results.filter(Boolean) as AcikKuranTranslation[];
}
