/**
 * Kelime Anlamı — Arapça kelime → Türkçe anlam (4 seçenek).
 * Doğru cevaplanmış kelimeler oturum boyunca tekrar gelmez.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { submitScore } from "~/lib/score-service";
import { useTranslation } from "~/hooks/useTranslation";
import { GameHeader } from "~/components/GameHeader";
import { GAME_THEMES } from "~/lib/game-themes";

const THEME = GAME_THEMES["word-meaning"];
const P = THEME.primary; // "#8B5E1A"

export const Route = createFileRoute("/games/word-meaning")({
  component: WordMeaningGame,
});

interface WordPair {
  arabic: string;
  meaning: string;
  wrong: [string, string, string];
}

// ~150 temel Kuran kelimesi
const WORD_PAIRS: WordPair[] = [
  // Esmaül Hüsna & Allah'ın sıfatları
  { arabic: "اللَّهُ",       meaning: "Allah",                        wrong: ["Melek", "Peygamber", "Cennet"] },
  { arabic: "الرَّحْمَٰنِ", meaning: "Rahman (çok merhamet eden)",    wrong: ["Şiddetli", "Kızgın", "Güçlü"] },
  { arabic: "الرَّحِيمِ",   meaning: "Rahim (merhamet edici)",        wrong: ["Bilen", "Duyan", "Yaratan"] },
  { arabic: "الْمَلِكِ",    meaning: "Hükümdar / Melik",              wrong: ["Kul", "Elçi", "Yolcu"] },
  { arabic: "الْقُدُّوسُ",  meaning: "Kutsal / Münezzeh",             wrong: ["Adil", "Güçlü", "Yaratan"] },
  { arabic: "السَّلَامُ",   meaning: "Esenlik / Selamet",             wrong: ["Savaş", "Azap", "Fitne"] },
  { arabic: "الْعَزِيزُ",   meaning: "Güçlü / Aziz",                 wrong: ["Zayıf", "Yoksul", "Kibar"] },
  { arabic: "الْحَكِيمُ",   meaning: "Hakim / Hikmet sahibi",         wrong: ["Cahil", "Acemi", "Zalim"] },
  { arabic: "الْغَفُورُ",   meaning: "Çok bağışlayan",               wrong: ["Cezalandıran", "Unutan", "Sınayan"] },
  { arabic: "الشَّكُورُ",   meaning: "Şükrü kabul eden",             wrong: ["Nankör", "Veren", "Alan"] },
  { arabic: "الْحَلِيمُ",   meaning: "Yumuşak huylu / Halim",        wrong: ["Sert", "Kızgın", "Hızlı"] },
  { arabic: "الْعَلِيمُ",   meaning: "Her şeyi bilen",               wrong: ["Gören", "Duyan", "Güçlü"] },
  { arabic: "الْقَدِيرُ",   meaning: "Her şeye gücü yeten",          wrong: ["Bilen", "İşiten", "Gören"] },
  { arabic: "السَّمِيعُ",   meaning: "Her şeyi işiten",              wrong: ["Gören", "Bilen", "Güçlü"] },
  { arabic: "الْبَصِيرُ",   meaning: "Her şeyi gören",               wrong: ["İşiten", "Bilen", "Güçlü"] },
  { arabic: "الْوَاحِدُ",   meaning: "Bir / Tek",                    wrong: ["İki", "Çok", "Sonsuz"] },
  { arabic: "الصَّمَدُ",    meaning: "Herkesin muhtaç olduğu",       wrong: ["Yaratan", "Yıkıcı", "Gönderen"] },
  { arabic: "الْكَرِيمُ",   meaning: "Çok cömert / Kerim",           wrong: ["Cimri", "Zalim", "Güçlü"] },
  { arabic: "الرَّزَّاقُ",  meaning: "Rızık veren",                  wrong: ["Alan", "Yaratan", "Öldüren"] },
  { arabic: "الْوَدُودُ",   meaning: "Seven / Sevilen",              wrong: ["Kızan", "Unutan", "Cezalandıran"] },

  // Temel kavramlar
  { arabic: "الْحَمْدُ",    meaning: "Hamd / Övgü",                  wrong: ["Şikâyet", "Dua", "İstek"] },
  { arabic: "كِتَابٌ",      meaning: "Kitap",                        wrong: ["Ev", "Su", "Taş"] },
  { arabic: "نُورٌ",        meaning: "Nur / Işık",                   wrong: ["Karanlık", "Ateş", "Su"] },
  { arabic: "صَلَاةٌ",      meaning: "Namaz / Dua",                  wrong: ["Oruç", "Zekat", "Hac"] },
  { arabic: "رَحْمَةٌ",     meaning: "Rahmet / Merhamet",            wrong: ["Azap", "Hüzün", "Felaket"] },
  { arabic: "جَنَّةٌ",      meaning: "Cennet",                       wrong: ["Cehennem", "Dünya", "Kabir"] },
  { arabic: "نَارٌ",        meaning: "Ateş / Cehennem ateşi",        wrong: ["Su", "Hava", "Toprak"] },
  { arabic: "قَلْبٌ",       meaning: "Kalp / Gönül",                 wrong: ["El", "Göz", "Kulak"] },
  { arabic: "عِلْمٌ",       meaning: "İlim / Bilgi",                 wrong: ["Cehalet", "Güç", "Mal"] },
  { arabic: "صَبْرٌ",       meaning: "Sabır",                        wrong: ["Acele", "Korku", "Hırs"] },
  { arabic: "إِيمَانٌ",     meaning: "İman",                         wrong: ["Küfür", "Şüphe", "Kibir"] },
  { arabic: "تَقْوَى",      meaning: "Takva / Allah'tan korkma",     wrong: ["Cimrilik", "Kibir", "Gaflet"] },
  { arabic: "آيَةٌ",        meaning: "Ayet / İşaret",                wrong: ["Sure", "Cüz", "Hizb"] },
  { arabic: "سُورَةٌ",      meaning: "Sure",                         wrong: ["Ayet", "Kelime", "Harf"] },
  { arabic: "قُرْآنٌ",      meaning: "Kuran",                        wrong: ["Tevrat", "İncil", "Zebur"] },
  { arabic: "رَبِّ",        meaning: "Rab / Efendi",                 wrong: ["Kul", "Şeytan", "Dünya"] },

  // İnsanlar & toplum
  { arabic: "نَبِيٌّ",      meaning: "Nebi / Peygamber",             wrong: ["Melek", "Veli", "Şehit"] },
  { arabic: "رَسُولٌ",      meaning: "Resul / Elçi",                 wrong: ["Kral", "Kâtip", "Şair"] },
  { arabic: "مُؤْمِنٌ",     meaning: "Mümin / İnanan",               wrong: ["Kâfir", "Münafık", "Fasık"] },
  { arabic: "كَافِرٌ",      meaning: "Kâfir / İnkârcı",              wrong: ["Mümin", "Fasık", "Zalim"] },
  { arabic: "مُنَافِقٌ",    meaning: "Münafık / İkiyüzlü",           wrong: ["Mümin", "Kâfir", "Zalim"] },
  { arabic: "إِنْسَانٌ",    meaning: "İnsan",                        wrong: ["Cin", "Melek", "Hayvan"] },
  { arabic: "مَلَكٌ",       meaning: "Melek",                        wrong: ["Cin", "İnsan", "Şeytan"] },
  { arabic: "شَيْطَانٌ",    meaning: "Şeytan",                       wrong: ["Melek", "Cin", "İnsan"] },
  { arabic: "عَبْدٌ",       meaning: "Kul / Köle",                   wrong: ["Efendi", "Kral", "Peygamber"] },
  { arabic: "قَوْمٌ",       meaning: "Kavim / Halk",                 wrong: ["Ordu", "Aile", "Yolcu"] },
  { arabic: "أُمَّةٌ",      meaning: "Ümmet / Topluluk",             wrong: ["Aile", "Ordu", "Devlet"] },
  { arabic: "وَلِيٌّ",      meaning: "Veli / Dost",                  wrong: ["Düşman", "Yabancı", "Köle"] },

  // Doğa & evren
  { arabic: "سَمَاءٌ",      meaning: "Gök / Sema",                   wrong: ["Yer", "Deniz", "Dağ"] },
  { arabic: "أَرْضٌ",       meaning: "Yer / Toprak",                 wrong: ["Gök", "Su", "Hava"] },
  { arabic: "مَاءٌ",        meaning: "Su",                           wrong: ["Ateş", "Hava", "Toprak"] },
  { arabic: "نَهَارٌ",      meaning: "Gündüz",                       wrong: ["Gece", "Sabah", "Akşam"] },
  { arabic: "لَيْلٌ",       meaning: "Gece",                         wrong: ["Gündüz", "Sabah", "Öğle"] },
  { arabic: "شَمْسٌ",       meaning: "Güneş",                        wrong: ["Ay", "Yıldız", "Bulut"] },
  { arabic: "قَمَرٌ",       meaning: "Ay",                           wrong: ["Güneş", "Yıldız", "Bulut"] },
  { arabic: "نَجْمٌ",       meaning: "Yıldız",                       wrong: ["Ay", "Güneş", "Işık"] },
  { arabic: "جَبَلٌ",       meaning: "Dağ",                          wrong: ["Deniz", "Nehir", "Çöl"] },
  { arabic: "بَحْرٌ",       meaning: "Deniz",                        wrong: ["Nehir", "Göl", "Dağ"] },
  { arabic: "رِيحٌ",        meaning: "Rüzgar",                       wrong: ["Yağmur", "Kar", "Fırtına"] },
  { arabic: "مَطَرٌ",       meaning: "Yağmur",                       wrong: ["Kar", "Rüzgar", "Bulut"] },
  { arabic: "شَجَرَةٌ",     meaning: "Ağaç",                         wrong: ["Çiçek", "Taş", "Toprak"] },
  { arabic: "نَارٌ",        meaning: "Ateş",                         wrong: ["Su", "Hava", "Toprak"] },

  // Ahiret & din
  { arabic: "يَوْمٌ",       meaning: "Gün",                          wrong: ["Gece", "Yıl", "Ay"] },
  { arabic: "آخِرَةٌ",      meaning: "Ahiret",                       wrong: ["Dünya", "Cennet", "Kabir"] },
  { arabic: "دُنْيَا",      meaning: "Dünya",                        wrong: ["Ahiret", "Cennet", "Cehennem"] },
  { arabic: "قِيَامَةٌ",    meaning: "Kıyamet",                      wrong: ["Ölüm", "Hesap", "Cennet"] },
  { arabic: "حِسَابٌ",      meaning: "Hesap / Yargılama",            wrong: ["Ödül", "Azap", "Cennet"] },
  { arabic: "جَهَنَّمُ",    meaning: "Cehennem",                     wrong: ["Cennet", "Dünya", "Kabir"] },
  { arabic: "مَوْتٌ",       meaning: "Ölüm",                         wrong: ["Hayat", "Diriliş", "Uyku"] },
  { arabic: "حَيَاةٌ",      meaning: "Hayat / Yaşam",                wrong: ["Ölüm", "Uyku", "Rüya"] },
  { arabic: "صِرَاطٌ",      meaning: "Yol / Sırat",                  wrong: ["Kapı", "Köprü", "Dağ"] },
  { arabic: "مِيزَانٌ",     meaning: "Terazi / Ölçü",                wrong: ["Hesap", "Kitap", "Kalem"] },
  { arabic: "عَذَابٌ",      meaning: "Azap / Ceza",                  wrong: ["Nimet", "Rahmet", "Cennet"] },
  { arabic: "ثَوَابٌ",      meaning: "Sevap / Ödül",                 wrong: ["Ceza", "Azap", "Günah"] },
  { arabic: "ذَنْبٌ",       meaning: "Günah / Suç",                  wrong: ["Sevap", "İbadet", "Tövbe"] },
  { arabic: "تَوْبَةٌ",     meaning: "Tövbe / Pişmanlık",            wrong: ["Günah", "Kibir", "Gaflet"] },
  { arabic: "نِعْمَةٌ",     meaning: "Nimet",                        wrong: ["Azap", "Ceza", "Yoksulluk"] },

  // İbadet & ahlak
  { arabic: "زَكَاةٌ",      meaning: "Zekat",                        wrong: ["Oruç", "Hac", "Namaz"] },
  { arabic: "صَوْمٌ",       meaning: "Oruç",                         wrong: ["Namaz", "Zekat", "Hac"] },
  { arabic: "حَجٌّ",        meaning: "Hac",                          wrong: ["Umre", "Zekat", "Oruç"] },
  { arabic: "جِهَادٌ",      meaning: "Cihad / Mücadele",             wrong: ["Namaz", "Oruç", "Hac"] },
  { arabic: "دُعَاءٌ",      meaning: "Dua",                          wrong: ["Namaz", "Zikir", "Tilâvet"] },
  { arabic: "ذِكْرٌ",       meaning: "Zikir / Anmak",                wrong: ["Dua", "Namaz", "Oruç"] },
  { arabic: "تَوَكُّلٌ",    meaning: "Tevekkül / Allah'a güvenmek",  wrong: ["Korku", "Ümit", "Sabır"] },
  { arabic: "إِخْلَاصٌ",    meaning: "İhlâs / Samimilik",            wrong: ["Riya", "Kibir", "Cimrilik"] },
  { arabic: "شُكْرٌ",       meaning: "Şükür / Teşekkür",             wrong: ["Nankörlük", "Şikayet", "Kibir"] },
  { arabic: "عَدْلٌ",       meaning: "Adalet",                       wrong: ["Zulüm", "Kibir", "Yalan"] },
  { arabic: "أَمَانَةٌ",    meaning: "Emanet / Güven",               wrong: ["Hıyanet", "Yalan", "Kibir"] },
  { arabic: "رِبَا",        meaning: "Faiz",                         wrong: ["Zekat", "Sadaka", "Ticaraet"] },
  { arabic: "صَدَقَةٌ",     meaning: "Sadaka",                       wrong: ["Zekat", "Hac", "Oruç"] },
  { arabic: "كِبْرٌ",       meaning: "Kibir / Büyüklük taslama",     wrong: ["Tevazu", "Sabır", "Şükür"] },
  { arabic: "حَسَدٌ",       meaning: "Haset / Kıskançlık",           wrong: ["Sevgi", "Merhamet", "Sabır"] },

  // Fiiller & eylem isimleri
  { arabic: "هُدًى",        meaning: "Hidayet / Rehberlik",          wrong: ["Sapıklık", "Karanlık", "Şüphe"] },
  { arabic: "ضَلَالٌ",      meaning: "Sapıklık / Yoldan çıkma",      wrong: ["Hidayet", "İman", "Tövbe"] },
  { arabic: "فَتْحٌ",       meaning: "Fetih / Açılış",               wrong: ["Yenilgi", "Kapanma", "Hüzün"] },
  { arabic: "نَصْرٌ",       meaning: "Zafer / Yardım",               wrong: ["Yenilgi", "Hüzün", "Azap"] },
  { arabic: "هِجْرَةٌ",     meaning: "Hicret / Göç",                 wrong: ["Dönüş", "Savaş", "Barış"] },
  { arabic: "عَهْدٌ",       meaning: "Ahit / Sözleşme",              wrong: ["Yalan", "Hıyanet", "Savaş"] },
  { arabic: "قَوْلٌ",       meaning: "Söz / Kelam",                  wrong: ["Sessizlik", "İş", "Bakış"] },
  { arabic: "فِعْلٌ",       meaning: "Fiil / Eylem",                 wrong: ["Söz", "Düşünce", "Niyet"] },
  { arabic: "نِيَّةٌ",      meaning: "Niyet",                        wrong: ["Eylem", "Söz", "Sonuç"] },
  { arabic: "حِكْمَةٌ",     meaning: "Hikmet / Bilgelik",            wrong: ["Cehalet", "Kibir", "Gaflet"] },

  // Varlık & yaratılış
  { arabic: "خَلْقٌ",       meaning: "Yaratılış / Yaratık",          wrong: ["Ölüm", "Yıkım", "Değişim"] },
  { arabic: "رُوحٌ",        meaning: "Ruh",                          wrong: ["Beden", "Kan", "Nefes"] },
  { arabic: "نَفْسٌ",       meaning: "Nefs / Can",                   wrong: ["Ruh", "Beden", "Akıl"] },
  { arabic: "عَقْلٌ",       meaning: "Akıl",                         wrong: ["Kalp", "Nefs", "Ruh"] },
  { arabic: "لِسَانٌ",      meaning: "Dil / Lisan",                  wrong: ["Göz", "Kulak", "El"] },
  { arabic: "يَدٌ",         meaning: "El",                           wrong: ["Göz", "Ayak", "Baş"] },
  { arabic: "عَيْنٌ",       meaning: "Göz / Pınar",                  wrong: ["Kulak", "El", "Dil"] },
  { arabic: "أُذُنٌ",       meaning: "Kulak",                        wrong: ["Göz", "Dil", "El"] },
  { arabic: "وَجْهٌ",       meaning: "Yüz",                          wrong: ["El", "Ayak", "Gönül"] },

  // Zaman & mekan
  { arabic: "وَقْتٌ",       meaning: "Vakit / Zaman",                wrong: ["Mekan", "Yol", "Kapı"] },
  { arabic: "مَسْجِدٌ",     meaning: "Mescit / Cami",                wrong: ["Ev", "Pazar", "Saray"] },
  { arabic: "بَيْتٌ",       meaning: "Ev",                           wrong: ["Mescit", "Kapı", "Yol"] },
  { arabic: "مَدِينَةٌ",    meaning: "Şehir / Medine",               wrong: ["Köy", "Çöl", "Dağ"] },
  { arabic: "طَرِيقٌ",      meaning: "Yol",                          wrong: ["Kapı", "Ev", "Nehir"] },
  { arabic: "أَوَّلٌ",      meaning: "İlk / Evvel",                  wrong: ["Son", "Orta", "Bir"] },
  { arabic: "آخِرٌ",        meaning: "Son / Ahir",                   wrong: ["İlk", "Orta", "Yeni"] },

  // Sıfatlar & nitelikler
  { arabic: "كَبِيرٌ",      meaning: "Büyük",                        wrong: ["Küçük", "Uzak", "Eski"] },
  { arabic: "صَغِيرٌ",      meaning: "Küçük",                        wrong: ["Büyük", "Uzun", "Yeni"] },
  { arabic: "عَظِيمٌ",      meaning: "Yüce / Azim",                  wrong: ["Küçük", "Zayıf", "Adi"] },
  { arabic: "حَقٌّ",        meaning: "Hak / Gerçek",                 wrong: ["Batıl", "Yalan", "Şüphe"] },
  { arabic: "بَاطِلٌ",      meaning: "Batıl / Geçersiz",             wrong: ["Hak", "Gerçek", "Doğru"] },
  { arabic: "حَسَنٌ",       meaning: "Güzel / İyi",                  wrong: ["Kötü", "Çirkin", "Yanlış"] },
  { arabic: "قَرِيبٌ",      meaning: "Yakın",                        wrong: ["Uzak", "Yabancı", "Gizli"] },
  { arabic: "بَعِيدٌ",      meaning: "Uzak",                         wrong: ["Yakın", "Burada", "Gizli"] },

  // Diğer önemli kelimeler
  { arabic: "أَمْرٌ",       meaning: "Emir / İş",                    wrong: ["Yasak", "Niyet", "Söz"] },
  { arabic: "نَهْيٌ",       meaning: "Yasak / Nehiy",                wrong: ["Emir", "İzin", "Teşvik"] },
  { arabic: "مَلَكُوتٌ",    meaning: "Hükümranlık / İktidar",        wrong: ["Zayıflık", "Yoksulluk", "Kölelik"] },
  { arabic: "غَيْبٌ",       meaning: "Gayb / Görünmez",              wrong: ["Görünen", "Bilinen", "Açık"] },
  { arabic: "وَحْيٌ",       meaning: "Vahiy",                        wrong: ["Rüya", "Görüş", "Düşünce"] },
  { arabic: "فِرْعَوْنُ",   meaning: "Firavun",                      wrong: ["Karun", "Haman", "Nemrut"] },
  { arabic: "إِبْرَاهِيمُ", meaning: "İbrahim (a.s.)",               wrong: ["Musa", "İsa", "Yusuf"] },
  { arabic: "مُوسَى",       meaning: "Musa (a.s.)",                  wrong: ["İsa", "İbrahim", "Davud"] },
  { arabic: "عِيسَى",       meaning: "İsa (a.s.)",                   wrong: ["Musa", "İbrahim", "Yahya"] },
  { arabic: "مُحَمَّدٌ",    meaning: "Muhammed (s.a.v.)",             wrong: ["İbrahim", "Musa", "İsa"] },
  { arabic: "إِسْرَائِيلُ", meaning: "İsrail / Yakup (a.s.)",        wrong: ["İbrahim", "Musa", "İsmail"] },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getRandomQuestion(seenIndices: Set<number>) {
  const available = WORD_PAIRS
    .map((p, i) => i)
    .filter((i) => !seenIndices.has(i));

  const pool = available.length > 0 ? available : Array.from({ length: WORD_PAIRS.length }, (_, i) => i);
  const idx = pool[Math.floor(Math.random() * pool.length)];
  const pair = WORD_PAIRS[idx];
  const options = shuffle([pair.meaning, ...pair.wrong]);
  return { ...pair, options, idx };
}

type GameState = "playing" | "correct" | "wrong";

function WordMeaningGame() {
  const { t } = useTranslation();
  const [seenIndices, setSeenIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(() => getRandomQuestion(new Set()));
  const [gameState, setGameState] = useState<GameState>("playing");
  const [selected, setSelected] = useState<string | null>(null);

  const allDone = seenIndices.size >= WORD_PAIRS.length;

  // Doğru cevapta 3s sonra otomatik ilerle
  useEffect(() => {
    if (gameState !== "correct") return;
    const t = setTimeout(nextRound, 3000);
    return () => clearTimeout(t);
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((opt: string) => {
    if (gameState !== "playing") return;
    setSelected(opt);
    if (opt === question.meaning) {
      setScore((s) => s + 10);
      setGameState("correct");
      setSeenIndices((prev) => new Set(prev).add(question.idx));
    } else {
      setGameState("wrong");
    }
  }, [gameState, question]);

  const nextRound = () => {
    const nextQ = getRandomQuestion(
      gameState === "correct" ? new Set([...seenIndices, question.idx]) : seenIndices
    );
    setQuestion(nextQ);
    setGameState("playing");
    setSelected(null);
    setRound((r) => r + 1);
  };

  const resetSession = () => {
    const fresh = new Set<number>();
    setSeenIndices(fresh);
    setScore(0);
    setRound(1);
    setQuestion(getRandomQuestion(fresh));
    setGameState("playing");
    setSelected(null);
  };

  // Tüm kelimeler tamamlandığında skoru kaydet
  useEffect(() => {
    if (allDone && score > 0 && !submittedRef.current) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "word-meaning", score, durationMs: Date.now() - sessionStart.current } }).catch(() => {});
    }
  }, [allDone, score]);

  // Tüm kelimeler tamamlandı
  if (allDone) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${P}18`, color: P }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 21h8M12 17v4M7 4h10l1 7H6L7 4z"/><path d="M6 11s-1 2 0 4 6 2 6 2 5 0 6-2 0-4 0-4"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{t.wordMeaningGame.allDoneTitle}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">
          <strong>{t.wordMeaningGame.allDoneDesc.replace("{count}", String(WORD_PAIRS.length))}</strong>
        </p>
        <p className="text-2xl font-bold text-[var(--color-accent)] mb-6">{t.wordMeaningGame.points.replace("{score}", String(score))}</p>
        <button
          onClick={resetSession}
          className="px-8 py-3 rounded-2xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:opacity-90 transition-all"
        >
          {t.wordMeaningGame.restart}
        </button>
        <div className="mt-4">
          <Link to="/games" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
            {t.wordMeaningGame.backToGames}
          </Link>
        </div>
      </div>
    );
  }

  const remaining = WORD_PAIRS.length - seenIndices.size;

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Colored header */}
      <GameHeader
        img={THEME.img}
        bg={THEME.bg}
        isDark={THEME.isDark}
        title={t.wordMeaningGame.title}
        onBack={() => { window.history.back(); }}
        right={
          <div className="text-right">
            <p className="text-xs opacity-70">{t.wordMeaningGame.roundLabel.replace("{round}", String(round))}</p>
            <p className="text-sm font-bold tabular-nums">{score}</p>
          </div>
        }
      />
      <div className="px-4 pt-2">

      {/* Soru */}
      <div className="px-5 py-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-6 text-center">
        <p className="text-xs text-[var(--color-text-secondary)] mb-8">{t.wordMeaningGame.questionPrompt}</p>
        <p
          className="text-5xl font-bold text-[var(--color-text-primary)] leading-[1.6]"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          {question.arabic}
        </p>
        <p className="text-[10px] text-[var(--color-text-secondary)] mt-4">
          {t.wordMeaningGame.remainingWords.replace("{count}", String(remaining))}
        </p>
      </div>

      {/* Seçenekler */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {question.options.map((opt) => {
          let cls = "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]";
          let style: React.CSSProperties = {};
          if (gameState !== "playing") {
            if (opt === question.meaning) {
              cls = "border-2";
              style = { borderColor: `${P}80`, backgroundColor: `${P}15`, color: P };
            } else if (opt === selected) {
              cls = "border-red-400 bg-red-50 text-red-600";
            } else {
              cls = "border-[var(--color-border)]/50 opacity-40 text-[var(--color-text-secondary)]";
            }
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={gameState !== "playing"}
              style={style}
              className={`px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {gameState === "correct" && (
        <div className="px-4 py-3 rounded-xl text-center border" style={{ backgroundColor: `${P}12`, borderColor: `${P}40` }}>
          <p className="text-sm font-semibold" style={{ color: P }}>{t.wordMeaningGame.correct}</p>
          <p className="text-xs mt-1" style={{ color: `${P}cc` }}>{t.wordMeaningGame.correctNext}</p>
        </div>
      )}

      {gameState === "wrong" && (
        <>
          <div className="px-4 py-3 rounded-xl text-center bg-red-50 border border-red-100 mb-3">
            <p className="text-sm font-semibold text-red-600">{t.wordMeaningGame.wrong.replace("{word}", question.meaning)}</p>
            <p className="text-xs text-red-500 mt-1">{t.wordMeaningGame.wrongNote}</p>
          </div>
          <button
            onClick={nextRound}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: P }}
          >
            {t.wordMeaningGame.nextQuestion}
          </button>
        </>
      )}
      </div>
    </div>
  );
}
