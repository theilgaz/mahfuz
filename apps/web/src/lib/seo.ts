/**
 * Tüm route'lar için merkezi başlık + açıklama yardımcısı.
 * TanStack Start `head` fonksiyonundan dönen meta dizisini üretir.
 *
 * Kullanım:
 *   import { staticHead, surahHead } from "~/lib/seo";
 *   export const Route = createFileRoute("/bookmarks")({
 *     head: () => staticHead("bookmarks"),
 *   });
 *
 *   export const Route = createFileRoute("/surah/$surahSlug")({
 *     head: ({ params }) => surahHead(params.surahSlug),
 *   });
 */

import { surahIdFromSlug } from "./surah-slugs";
import { SURAH_NAMES_TR } from "./surah-names-tr";

const SITE = "Mahfuz";
const SEP = " · ";
const DEFAULT_DESC = "Sadece Kuran. Minimal, dikkat dağıtmayan Kuran yoldaşı.";

interface HeadMeta {
  title: string;
  description?: string;
}

function buildMeta({ title, description }: HeadMeta) {
  const fullTitle = `${title}${SEP}${SITE}`;
  const desc = description ?? DEFAULT_DESC;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: desc },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: desc },
      { property: "og:site_name", content: SITE },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: desc },
    ],
  };
}

// ── Statik route registry ────────────────────────────────

const STATIC: Record<string, HeadMeta> = {
  home: { title: "Ana Sayfa", description: "Günün ayeti, son okudukların ve sure listesi tek bir sade ekranda." },
  fihrist: { title: "Sure Fihristi", description: "Kuran'ın 114 sûresi — filtre, arama ve alfabetik düzenle." },
  about: { title: "Hakkında", description: "Mahfuz'un amacı, kaynakları ve geliştiricisi hakkında." },
  bookmarks: { title: "Yer İmlerim", description: "Kaydettiğin ayetler tek liste hâlinde — sure veya tarih sırasıyla." },
  changelog: { title: "Değişiklik Kaydı", description: "Mahfuz'a eklenen yeni özellikler ve düzeltmeler." },
  discover: { title: "Keşfet", description: "Konulara, köklere ve önerilere göre Kuran'da yeni şeyler keşfet." },
  hifz: { title: "Hifz", description: "Ezberlediğin ayetleri sure bazlı takip et, hedef belirle." },
  notes: { title: "Notlarım", description: "Ayetlere düştüğün notlar tek yerde." },
  premium: { title: "Mürşid Plan", description: "Mahfuz'un genişletilmiş özellikleri ve planlar." },
  profile: { title: "Profilim", description: "İstatistiklerin, hifz durumun ve hesap ayarların." },
  promo: { title: "Mahfuz" },
  recite: { title: "Tilavet", description: "Mikrofonla ayet okuma, doğrulama ve takip modu." },
  search: { title: "Arama", description: "Kuran metninde ve çevirilerde tam metin arama." },
  stats: { title: "İstatistikler", description: "Okuma serisi, geçen süre ve hedef ilerlemen." },
  tajweed: { title: "Tecvid", description: "16 tecvid kuralı, örnekleriyle birlikte." },
  games: { title: "Oyunlar", description: "Kuran kelime ve sure bilgini sınayan mini oyunlar." },
  "games-scoreboard": { title: "Skor Tablosu", description: "Mahfuz oyunlarındaki en yüksek skorlar." },
  "games-ayah-2048": { title: "Ayah 2048", description: "Sure sıralı 2048 — ayetleri birleştir, kombo yap." },
  "games-fill-blank": { title: "Kelime Doldurma", description: "Ayetteki eksik kelimeyi seç, ayeti tamamla." },
  "games-hexagon": { title: "Hexagon", description: "Harfleri birleştirerek Kuran kelimeleri kur." },
  "games-kelime-tahmini": { title: "Kelime Tahmini", description: "Günlük ve serbest modda Kuran kelimesi tahmin oyunu." },
  "games-surah-guess": { title: "Sûre Tanıma", description: "Türkçe anlama bakıp doğru sûreyi bul." },
  "games-verse-chain": { title: "Ayet Zinciri", description: "Verilen ayetten sonra gelen kelimeleri sırala." },
  "games-word-match": { title: "Kelime Eşleştirme", description: "Türkçe anlamı doğru Arapça kelimeyle eşleştir." },
  "games-word-meaning": { title: "Kelime Anlamı", description: "Arapça kelimenin Türkçe anlamını seç." },
  meclis: { title: "Meclis", description: "Arkadaşlarla canlı, çok-cihazlı parti modu — kodla katıl ya da yeni meclis aç." },
  khatm: { title: "Hatim Grupları", description: "Arkadaşlarla birlikte hatim et — grup oluştur veya katıl." },
  alifba: { title: "Elifba", description: "Adım adım Arap harflerini ve okumayı öğren." },
  "alifba-letters": { title: "Harfler", description: "Arap alfabesi — harf harf gez, dinle, çalış." },
  "alifba-exam": { title: "Elifba Sınavı", description: "Öğrendiğin harfleri pekiştiren karma sınav." },
  "alifba-exam-index": { title: "Sınavlar", description: "Adım sınavları ve karma sınav." },
  "alifba-games": { title: "Elifba Oyunları", description: "Harf öğrenirken eğlenmen için küçük oyunlar." },
  "alifba-games-fill": { title: "Eksik Harf", description: "Boşluktaki doğru harfi seç." },
  "alifba-games-memory": { title: "Hafıza", description: "Aynı harfin iki kartını bul." },
  "alifba-games-speed": { title: "Hız Oyunu", description: "Süreyle yarışarak harfleri tanı." },
  "alifba-games-word": { title: "Kelime Avı", description: "Harflerden kelime kur." },
  "alifba-quiz-forms": { title: "Harf Formları", description: "Başta, ortada, sonda — her bağlamda harf tanıma." },
  "alifba-quiz-voice": { title: "Sesli Quiz", description: "Sesi dinle, doğru harfi seç." },
  "auth-login": { title: "Giriş Yap", description: "Mahfuz'a e-posta, Google veya Apple ile giriş yap." },
  "auth-callback": { title: "Giriş Yapılıyor" },
  "not-found": { title: "Sayfa Bulunamadı", description: "Aradığın sayfa burada değil." },
};

export function staticHead(key: keyof typeof STATIC) {
  return buildMeta(STATIC[key]);
}

// ── Dinamik route yardımcıları ──────────────────────────

function surahNameFromSlug(slug: string | undefined): string | null {
  if (!slug) return null;
  const id = surahIdFromSlug(slug);
  if (!id) return null;
  return SURAH_NAMES_TR[id] ?? null;
}

export function surahHead(slug: string | undefined) {
  const name = surahNameFromSlug(slug);
  if (!name) return buildMeta({ title: "Sûre", description: "Kuran'da bir sure oku." });
  return buildMeta({
    title: `${name} Suresi`,
    description: `${name} suresinin Arapça metni, Türkçe meali ve sesli tilaveti.`,
  });
}

export function pageHead(pageNumber: string | number | undefined) {
  const n = Number(pageNumber);
  if (!n || n < 1 || n > 604) return buildMeta({ title: "Mushaf Sayfası" });
  return buildMeta({
    title: `Mushaf Sayfa ${n}`,
    description: `Mushaf-ı Şerif ${n}. sayfası — Medine baskısı düzeniyle.`,
  });
}

export function juzHead(juzId: string | number | undefined) {
  const n = Number(juzId);
  if (!n || n < 1 || n > 30) return buildMeta({ title: "Cüz" });
  return buildMeta({
    title: `${n}. Cüz`,
    description: `Kuran'ın ${n}. cüzü — kapsadığı sureler ve sayfa sırasıyla.`,
  });
}

export function analyseHead(verseKey: string | undefined) {
  if (!verseKey || !/^\d+:\d+$/.test(verseKey)) return buildMeta({ title: "Ayet Tahlili" });
  const [s, a] = verseKey.split(":").map(Number);
  const name = SURAH_NAMES_TR[s] ?? `Sure ${s}`;
  return buildMeta({
    title: `${name} ${a} · Tahlil`,
    description: `${name} suresi ${a}. ayetinin mealleri, kelime kelime morfoloji ve benzer ayetler.`,
  });
}

export function meclisCodeHead(code: string | undefined) {
  if (!code) return buildMeta({ title: "Meclis" });
  return buildMeta({
    title: `Meclis ${code.toUpperCase()}`,
    description: "Canlı meclise katıl — Mahfuz parti modu.",
  });
}

export function khatmGroupHead(groupId: string | undefined) {
  return buildMeta({
    title: "Hatim Grubu",
    description: "Grup üyeleri, ilerleme ve katkıların tek ekranda.",
  });
}

export function alifbaLetterHead(letterId: string | undefined) {
  return buildMeta({
    title: letterId ? `${letterId.toUpperCase()} · Harf` : "Harf",
    description: "Harfin sesleri, formları ve yazımı.",
  });
}

export function alifbaStepHead(stepId: string | undefined) {
  return buildMeta({
    title: stepId ? `Adım ${stepId}` : "Elifba Adımı",
    description: "Elifba müfredatında bir adım — alıştırmalar ve mini sınav.",
  });
}

export function alifbaExamHead(stepId: string | undefined) {
  return buildMeta({
    title: stepId ? `Adım ${stepId} Sınavı` : "Elifba Sınavı",
    description: "Adımın bitiminde küçük bir ölçme.",
  });
}
