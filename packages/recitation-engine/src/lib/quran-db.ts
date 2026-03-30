/**
 * QuranDB — verse lookup and fuzzy matching against phoneme transcriptions.
 * Simplified port from offline-tarteel focused on matchVerse().
 */

import { ratio, fragmentScore } from "./levenshtein";
import type { QuranVerse, VerseMatch } from "./types";

const BSM_PHONEMES_JOINED = "bismi allahi arraHmaani arraHiimi";

export interface TokenEncoder {
  encodeRawPhonemes(rawPhonemes: string): number[];
}

export class QuranDB {
  verses: QuranVerse[];
  private byRef = new Map<string, QuranVerse>();
  private bySurah = new Map<number, QuranVerse[]>();

  constructor(data: QuranVerse[], private tokenEncoder?: TokenEncoder) {
    this.verses = data;

    for (const v of data) {
      this.byRef.set(`${v.surah}:${v.ayah}`, v);

      const arr = this.bySurah.get(v.surah) ?? [];
      arr.push(v);
      this.bySurah.set(v.surah, arr);

      // Computed fields
      v.phoneme_tokens = v.phonemes.trim().split(/\s+/).filter(Boolean);
      v.phoneme_words = v.phonemes_joined.split(" ");

      // Strip bismillah from first ayah of most surahs
      if (
        v.ayah === 1 &&
        v.surah !== 1 &&
        v.surah !== 9 &&
        v.phonemes_joined.startsWith(BSM_PHONEMES_JOINED)
      ) {
        v.phonemes_joined_no_bsm = v.phonemes_joined.slice(BSM_PHONEMES_JOINED.length).trim() || null;
      } else {
        v.phonemes_joined_no_bsm = null;
      }

      v.phonemes_joined_ns = v.phonemes_joined.replace(/ /g, "");
      v.phonemes_joined_no_bsm_ns = v.phonemes_joined_no_bsm
        ? v.phonemes_joined_no_bsm.replace(/ /g, "")
        : null;

      if (tokenEncoder) {
        v.phoneme_token_ids = tokenEncoder.encodeRawPhonemes(v.phonemes);
      }
    }
  }

  getVerse(surah: number, ayah: number): QuranVerse | undefined {
    return this.byRef.get(`${surah}:${ayah}`);
  }

  /**
   * Match transcribed phonemes against all 6,236 verses.
   * Returns the best match above threshold, or null.
   */
  matchVerse(
    text: string,
    threshold = 0.3,
    hint: [number, number] | null = null,
  ): VerseMatch | null {
    if (!text.trim()) return null;

    const bonuses = this.continuationBonuses(hint);
    const noSpaceText = text.replace(/ /g, "");
    let bestVerse: QuranVerse | null = null;
    let bestRaw = 0;
    let bestBonus = 0;
    let bestTotal = 0;

    for (const v of this.verses) {
      let raw = ratio(text, v.phonemes_joined);

      // Short query: try prefix matching
      if (noSpaceText.length <= 10) {
        raw = Math.max(raw, this.shortQueryBoost(noSpaceText, v));
      }

      // Try without bismillah
      if (v.phonemes_joined_no_bsm) {
        raw = Math.max(raw, ratio(text, v.phonemes_joined_no_bsm));
      }

      // Fragment scoring for longer queries
      if (noSpaceText.length >= 8 && v.phonemes_joined_ns) {
        if (noSpaceText.length < v.phonemes_joined_ns.length * 0.8) {
          const frag = fragmentScore(noSpaceText, v.phonemes_joined_ns);
          if (frag > raw) {
            raw = raw + (frag - raw) * 0.7;
          }
        }
      }

      const bonus = bonuses.get(`${v.surah}:${v.ayah}`) ?? 0;
      const total = Math.min(raw + bonus, 1.0);

      if (total > bestTotal) {
        bestTotal = total;
        bestRaw = raw;
        bestBonus = bonus;
        bestVerse = v;
      }
    }

    if (!bestVerse || bestTotal < threshold) return null;

    return {
      surah: bestVerse.surah,
      ayah: bestVerse.ayah,
      text: bestVerse.text_uthmani,
      phonemesJoined: bestVerse.phonemes_joined,
      score: Math.round(bestTotal * 1000) / 1000,
      rawScore: Math.round(bestRaw * 1000) / 1000,
      bonus: Math.round(bestBonus * 1000) / 1000,
    };
  }

  private shortQueryBoost(noSpaceText: string, verse: QuranVerse): number {
    const candidate = verse.phonemes_joined_ns ?? "";
    if (!candidate) return 0;
    const prefixWindow = Math.min(candidate.length, noSpaceText.length + 6);
    const prefixScore = ratio(noSpaceText, candidate.slice(0, prefixWindow));
    const firstWord = verse.phoneme_words?.[0] ?? "";
    const firstWordScore = firstWord ? ratio(noSpaceText, firstWord) : 0;
    return Math.max(prefixScore, firstWordScore);
  }

  private continuationBonuses(hint: [number, number] | null): Map<string, number> {
    const bonuses = new Map<string, number>();
    if (!hint) return bonuses;

    const [hSurah, hAyah] = hint;
    const nv = this.byRef.get(`${hSurah}:${hAyah + 1}`);
    if (nv) {
      bonuses.set(`${hSurah}:${hAyah + 1}`, 0.22);
      if (this.byRef.has(`${hSurah}:${hAyah + 2}`))
        bonuses.set(`${hSurah}:${hAyah + 2}`, 0.12);
      if (this.byRef.has(`${hSurah}:${hAyah + 3}`))
        bonuses.set(`${hSurah}:${hAyah + 3}`, 0.06);
    } else {
      // Next surah
      const nextVerses = this.bySurah.get(hSurah + 1) ?? [];
      const bonusValues = [0.22, 0.12, 0.06];
      for (let i = 0; i < Math.min(nextVerses.length, 3); i++) {
        bonuses.set(`${nextVerses[i].surah}:${nextVerses[i].ayah}`, bonusValues[i]);
      }
    }
    return bonuses;
  }
}
