/**
 * Faz B — Ömer Çelik WBW Hizalaması (Claude API)
 *
 * Kullanım (apps/web/ dizininden):
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/build-wbw-oc.ts
 *
 * Çıktı: public/wbw-oc/{surahId}.json  (114 dosya)
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const IN_FILE  = resolve(import.meta.dirname, "data/arabic-words.json");
const OUT_DIR  = resolve(import.meta.dirname, "../public/wbw-oc");
const LOG_FILE = resolve(import.meta.dirname, "data/wbw-oc-progress.json");

const BATCH_SIZE = 20;
const MODEL      = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 700;
const DELAY_MS   = 150;

interface ArabicWord { pos: number; text: string; translit: string; }
interface VerseData  { arabic: ArabicWord[]; turkish: string; }
type SurahWbw = Record<string, Record<string, string>>;
interface Progress { completed: string[]; failed: string[]; }

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

function loadProgress(): Progress {
  if (existsSync(LOG_FILE)) return JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  return { completed: [], failed: [] };
}
function saveProgress(p: Progress) {
  writeFileSync(LOG_FILE, JSON.stringify(p, null, 2), "utf-8");
}
function loadSurahFile(surahId: number): SurahWbw {
  const path = resolve(OUT_DIR, `${surahId}.json`);
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf-8"));
  return {};
}
function saveSurahFile(surahId: number, data: SurahWbw) {
  writeFileSync(resolve(OUT_DIR, `${surahId}.json`), JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Prompt: compact pipe format
 * Output per line: "sure:ayet:karşılık1|karşılık2|karşılık3"
 */
function buildPrompt(batch: Array<{ key: string; data: VerseData }>): string {
  const lines = batch.map(({ key, data }) => {
    const words = data.arabic.map((w) => `${w.pos}.${w.text}`).join(" ");
    return `[${key}] ${words} => ${data.turkish}`;
  }).join("\n");

  return `Kuran WBW hizalama. Her satır için Arapça kelime pozisyonlarına mealden Türkçe karşılık bul.
Sadece şu formatta yanıt ver (başka hiçbir şey ekleme):
sure:ayet:karşılık1|karşılık2|karşılık3

Örnek: 1:1:Rahmân ve Rahîm|olan|Allah'ın

${lines}`;
}

/**
 * Parse pipe format response → { verseKey: { "1": "...", "2": "..." } }
 */
function parseResponse(text: string, batchKeys: string[]): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Format: "sure:ayet:k1|k2|k3"
    const firstColon = trimmed.indexOf(":");
    const secondColon = trimmed.indexOf(":", firstColon + 1);
    if (firstColon === -1 || secondColon === -1) continue;
    const verseKey = trimmed.slice(0, secondColon);
    if (!batchKeys.includes(verseKey)) continue;
    const glossStr = trimmed.slice(secondColon + 1);
    const glosses = glossStr.split("|").map((g) => g.trim()).filter(Boolean);
    if (glosses.length === 0) continue;
    const posMap: Record<string, string> = {};
    glosses.forEach((g, i) => { posMap[String(i + 1)] = g; });
    result[verseKey] = posMap;
  }
  return result;
}

async function callClaude(
  client: Anthropic,
  batch: Array<{ key: string; data: VerseData }>
): Promise<Record<string, Record<string, string>>> {
  const prompt = buildPrompt(batch);
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
  return parseResponse(text, batch.map((b) => b.key));
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error("ANTHROPIC_API_KEY eksik."); process.exit(1); }
  if (!existsSync(IN_FILE)) { console.error(`Giriş dosyası yok: ${IN_FILE}`); process.exit(1); }

  const client = new Anthropic({ apiKey });
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Veri yükleniyor…");
  const allVerses: Record<string, VerseData> = JSON.parse(readFileSync(IN_FILE, "utf-8"));
  const allKeys = Object.keys(allVerses).sort((a, b) => {
    const [as_, an] = a.split(":").map(Number);
    const [bs, bn] = b.split(":").map(Number);
    return as_ !== bs ? as_ - bs : an - bn;
  });

  console.log(`Toplam ayet: ${allKeys.length}`);

  const progress = loadProgress();
  const completedSet = new Set(progress.completed);
  const failedSet    = new Set(progress.failed);
  const remaining    = allKeys.filter((k) => !completedSet.has(k) && !failedSet.has(k));

  console.log(`Tamamlanan : ${completedSet.size}`);
  console.log(`Başarısız  : ${failedSet.size}`);
  console.log(`İşlenecek  : ${remaining.length}\n`);

  if (remaining.length === 0) { console.log("Tüm ayetler işlenmiş. ✓"); return; }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batchKeys = remaining.slice(i, i + BATCH_SIZE);
    const batch = batchKeys.map((key) => ({ key, data: allVerses[key] }));
    const surahId = parseInt(batchKeys[0].split(":")[0]);
    const lastKey  = batchKeys[batchKeys.length - 1];

    process.stdout.write(
      `\r[${i + batchKeys.length}/${remaining.length}] Sure ${surahId} — ${batchKeys[0]}…${lastKey}     `
    );

    try {
      const result = await callClaude(client, batch);

      // Surah dosyalarına kaydet
      const surahGroups: Record<number, Record<string, Record<string, string>>> = {};
      for (const [verseKey, glosses] of Object.entries(result)) {
        const sid = parseInt(verseKey.split(":")[0]);
        if (!surahGroups[sid]) surahGroups[sid] = {};
        surahGroups[sid][verseKey] = glosses;
      }
      for (const [sid, verses] of Object.entries(surahGroups)) {
        const existing = loadSurahFile(Number(sid));
        Object.assign(existing, verses);
        saveSurahFile(Number(sid), existing);
      }

      // Progress güncelle
      for (const key of batchKeys) {
        if (result[key]) { completedSet.add(key); processed++; }
        else { failedSet.add(key); } // Parse edilemedi, kaydet ama devam et
      }
      progress.completed = [...completedSet];
      progress.failed    = [...failedSet];
      saveProgress(progress);

      await sleep(DELAY_MS);
    } catch (err) {
      errors++;
      console.error(`\n  Batch hatası (${batchKeys[0]}…${lastKey}): ${err}`);
      for (const key of batchKeys) failedSet.add(key);
      progress.failed = [...failedSet];
      saveProgress(progress);
      await sleep(1000);
    }
  }

  console.log(`\n\n=== Faz B Tamamlandı ===`);
  console.log(`İşlenen   : ${processed}`);
  console.log(`Hata      : ${errors} batch`);
  console.log(`Başarısız : ${failedSet.size} ayet`);
  console.log(`Çıktı     : ${OUT_DIR}/`);

  if (failedSet.size > 0) {
    console.log(`\nBaşarısız ayetler: ${LOG_FILE}`);
  } else {
    console.log("\nTüm ayetler başarıyla işlendi. ✓");
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
