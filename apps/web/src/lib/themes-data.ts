/**
 * Kuran temalarının statik verisi.
 * Her sure 2–6 ana temayla etiketlenmiştir.
 */

export interface QuranTheme {
  id: string;
  icon: string;
  label: string;
  desc: string;
}

export const THEMES: QuranTheme[] = [
  { id: "tawhid",      icon: "☝️",  label: "Tevhid",         desc: "Allah'ın birliği ve eşsizliği" },
  { id: "iman",        icon: "💫",  label: "İman",            desc: "İman esasları ve hakikati" },
  { id: "quran",       icon: "📖",  label: "Kuran",           desc: "Kitabın fazileti ve özellikleri" },
  { id: "risalah",     icon: "📨",  label: "Nübüvvet",        desc: "Peygamberlik ve risalet" },
  { id: "salah",       icon: "🤲",  label: "Namaz",           desc: "Namaz ve ibadet" },
  { id: "zakat",       icon: "💰",  label: "Zekat",           desc: "Zekat ve sadaka" },
  { id: "sawm",        icon: "🌙",  label: "Oruç",            desc: "Oruç ve Ramazan" },
  { id: "hajj",        icon: "🕋",  label: "Hac",             desc: "Hac ve umre" },
  { id: "dua",         icon: "🙏",  label: "Dua",             desc: "Dua ve Allah'a yakarma" },
  { id: "akhirah",     icon: "⚖️",  label: "Ahiret",          desc: "Ölüm sonrası ve hesap günü" },
  { id: "jannah",      icon: "🌿",  label: "Cennet",          desc: "Cennet ve ebedi nimet" },
  { id: "jahannam",    icon: "🔥",  label: "Cehennem",        desc: "Cehennem ve azap" },
  { id: "kiyamet",     icon: "🌪️",  label: "Kıyamet",         desc: "Büyük gün ve alametleri" },
  { id: "prophets",    icon: "👤",  label: "Peygamberler",    desc: "Peygamber kıssaları (genel)" },
  { id: "ibrahim",     icon: "🏗️",  label: "Hz. İbrahim",     desc: "İbrahim peygamberin kıssası" },
  { id: "musa",        icon: "🌿",  label: "Hz. Musa",        desc: "Musa peygamberin kıssası" },
  { id: "isa",         icon: "✨",  label: "Hz. İsa",          desc: "İsa peygamberin kıssası" },
  { id: "nuh",         icon: "🚢",  label: "Hz. Nuh",         desc: "Nuh peygamberin kıssası" },
  { id: "yusuf",       icon: "🌾",  label: "Hz. Yusuf",       desc: "Yusuf peygamberin kıssası" },
  { id: "muhammad",    icon: "🌟",  label: "Hz. Muhammed",    desc: "Son peygamberin hayatı" },
  { id: "creation",    icon: "🌌",  label: "Yaratılış",       desc: "Evrenin ve insanın yaratılışı" },
  { id: "nature",      icon: "🌍",  label: "Tabiat",          desc: "Doğa ve kozmolojik ayetler" },
  { id: "signs",       icon: "🔭",  label: "Deliller",        desc: "Allah'ın varlığının delilleri" },
  { id: "knowledge",   icon: "🔬",  label: "İlim",            desc: "Bilgi, akıl ve hikmet" },
  { id: "guidance",    icon: "🧭",  label: "Hidayet",         desc: "Doğru yol ve rehberlik" },
  { id: "tawbah",      icon: "💧",  label: "Tevbe",           desc: "Tövbe ve bağışlanma" },
  { id: "patience",    icon: "🏔️",  label: "Sabır",           desc: "Sabır ve azim" },
  { id: "gratitude",   icon: "🌸",  label: "Şükür",           desc: "Şükür ve minnet" },
  { id: "ethics",      icon: "💎",  label: "Ahlak",           desc: "Güzel ahlak ve fazilet" },
  { id: "tawakkul",    icon: "🌟",  label: "Tevekkül",        desc: "Allah'a güven ve dayanma" },
  { id: "family",      icon: "👨‍👩‍👧", label: "Aile",            desc: "Nikah, aile ve miras" },
  { id: "justice",     icon: "⚖️",  label: "Adalet",          desc: "Hak, hukuk ve adalet" },
  { id: "community",   icon: "👥",  label: "Toplum",          desc: "Ümmet ve sosyal düzen" },
  { id: "jihad",       icon: "🛡️",  label: "Cihad",           desc: "Mücadele ve savunma" },
  { id: "munafiqun",   icon: "🎭",  label: "Münafıklar",      desc: "Nifak ve ikiyüzlülük" },
  { id: "ahlu_kitab",  icon: "📜",  label: "Ehl-i Kitap",     desc: "Yahudi ve Hristiyanlar" },
  { id: "history",     icon: "🏛️",  label: "Tarih",           desc: "Geçmiş kavimlerin kıssaları" },
  { id: "rizq",        icon: "🌾",  label: "Rızık",           desc: "Geçim, bereket ve şükür" },
  { id: "soul",        icon: "✨",  label: "Ruh/Nefis",       desc: "İnsan psikolojisi ve ruh" },
  { id: "charity",     icon: "❤️",  label: "İnfak",           desc: "Yardım, bağış ve cömertlik" },
];

const T = (ids: string[]) => ids; // tip yardımcısı

/** Her sure için ana tema kimliklerinin listesi (surahId → themeId[]) */
export const SURAH_THEMES: Record<number, string[]> = {
  1:   T(["tawhid", "dua", "guidance"]),
  2:   T(["guidance", "community", "family", "justice", "sawm", "hajj", "jihad", "history", "ahlu_kitab", "musa", "ibrahim"]),
  3:   T(["tawhid", "prophets", "isa", "ibrahim", "ahlu_kitab", "jihad", "patience"]),
  4:   T(["family", "justice", "community", "jihad", "ahlu_kitab", "munafiqun", "ethics"]),
  5:   T(["ahlu_kitab", "justice", "community", "isa", "musa", "ethics"]),
  6:   T(["tawhid", "creation", "signs", "iman", "history", "nature", "prophets"]),
  7:   T(["history", "musa", "creation", "prophets", "tawhid", "akhirah"]),
  8:   T(["jihad", "community", "munafiqun", "guidance", "tawbah"]),
  9:   T(["jihad", "munafiqun", "community", "ahlu_kitab", "tawbah"]),
  10:  T(["tawhid", "quran", "signs", "akhirah", "prophets", "history"]),
  11:  T(["history", "prophets", "nuh", "ibrahim", "patience", "tawhid"]),
  12:  T(["yusuf", "patience", "tawakkul", "family", "history"]),
  13:  T(["tawhid", "signs", "nature", "knowledge", "dua"]),
  14:  T(["ibrahim", "tawhid", "dua", "akhirah", "jannah", "gratitude"]),
  15:  T(["history", "creation", "tawhid", "akhirah", "quran"]),
  16:  T(["signs", "nature", "tawhid", "gratitude", "rizq", "ethics", "community"]),
  17:  T(["quran", "risalah", "salah", "ethics", "knowledge", "musa", "akhirah"]),
  18:  T(["patience", "knowledge", "history", "tawakkul", "prophets", "akhirah"]),
  19:  T(["prophets", "musa", "isa", "ibrahim", "tawhid", "risalah"]),
  20:  T(["musa", "tawhid", "salah", "patience", "history", "quran"]),
  21:  T(["prophets", "tawhid", "akhirah", "kiyamet", "creation"]),
  22:  T(["hajj", "akhirah", "kiyamet", "signs", "community", "jihad"]),
  23:  T(["iman", "creation", "akhirah", "ethics", "prophets"]),
  24:  T(["ethics", "community", "family", "signs", "guidance"]),
  25:  T(["quran", "tawhid", "creation", "akhirah", "ethics", "prophets"]),
  26:  T(["prophets", "musa", "ibrahim", "history", "quran"]),
  27:  T(["musa", "history", "tawhid", "signs", "akhirah"]),
  28:  T(["musa", "history", "community", "tawbah", "rizq"]),
  29:  T(["patience", "tawhid", "signs", "history", "jihad", "creation"]),
  30:  T(["signs", "nature", "tawhid", "history", "akhirah"]),
  31:  T(["knowledge", "family", "ethics", "gratitude", "tawhid"]),
  32:  T(["creation", "akhirah", "quran", "tawhid", "signs"]),
  33:  T(["muhammad", "community", "family", "munafiqun", "jihad", "ethics"]),
  34:  T(["tawhid", "akhirah", "gratitude", "history", "signs"]),
  35:  T(["tawhid", "creation", "signs", "akhirah", "community"]),
  36:  T(["quran", "tawhid", "akhirah", "kiyamet", "signs", "risalah"]),
  37:  T(["akhirah", "tawhid", "prophets", "ibrahim", "jannah", "jahannam"]),
  38:  T(["prophets", "patience", "history", "tawhid", "akhirah"]),
  39:  T(["tawhid", "tawbah", "gratitude", "akhirah", "guidance"]),
  40:  T(["musa", "tawhid", "akhirah", "dua", "kiyamet"]),
  41:  T(["quran", "tawhid", "signs", "creation", "history"]),
  42:  T(["tawhid", "community", "justice", "tawbah", "akhirah"]),
  43:  T(["quran", "isa", "ibrahim", "tawhid", "akhirah"]),
  44:  T(["quran", "tawhid", "history", "kiyamet", "jannah"]),
  45:  T(["tawhid", "signs", "akhirah", "community", "creation"]),
  46:  T(["tawhid", "quran", "history", "akhirah", "family"]),
  47:  T(["jihad", "munafiqun", "community", "akhirah", "guidance"]),
  48:  T(["jihad", "community", "tawbah", "munafiqun", "guidance"]),
  49:  T(["ethics", "community", "guidance", "iman", "tawbah"]),
  50:  T(["tawhid", "creation", "akhirah", "kiyamet", "quran"]),
  51:  T(["prophets", "tawhid", "kiyamet", "signs", "ibrahim"]),
  52:  T(["akhirah", "tawhid", "quran", "kiyamet", "jannah"]),
  53:  T(["risalah", "akhirah", "tawhid", "signs", "quran"]),
  54:  T(["kiyamet", "history", "tawhid", "signs", "musa"]),
  55:  T(["signs", "nature", "jannah", "gratitude", "tawhid"]),
  56:  T(["akhirah", "kiyamet", "jannah", "jahannam", "signs"]),
  57:  T(["tawhid", "jihad", "community", "iman", "history"]),
  58:  T(["community", "justice", "munafiqun", "ethics", "family"]),
  59:  T(["jihad", "community", "tawhid", "history", "guidance"]),
  60:  T(["community", "justice", "family", "jihad", "ibrahim"]),
  61:  T(["jihad", "isa", "musa", "community", "guidance"]),
  62:  T(["community", "salah", "knowledge", "tawhid", "risalah"]),
  63:  T(["munafiqun", "community", "guidance", "jihad"]),
  64:  T(["tawhid", "iman", "jihad", "akhirah", "signs"]),
  65:  T(["family", "community", "justice", "tawhid", "guidance"]),
  66:  T(["family", "ethics", "community", "tawbah", "iman"]),
  67:  T(["creation", "tawhid", "signs", "akhirah", "nature"]),
  68:  T(["quran", "ethics", "risalah", "tawhid", "patience"]),
  69:  T(["kiyamet", "akhirah", "history", "tawhid", "signs"]),
  70:  T(["akhirah", "kiyamet", "patience", "salah", "tawhid"]),
  71:  T(["nuh", "history", "tawhid", "creation", "tawbah"]),
  72:  T(["tawhid", "quran", "risalah", "iman", "akhirah"]),
  73:  T(["salah", "tawhid", "quran", "patience", "guidance"]),
  74:  T(["quran", "tawhid", "kiyamet", "jahannam", "risalah"]),
  75:  T(["kiyamet", "akhirah", "creation", "tawhid", "soul"]),
  76:  T(["jannah", "creation", "gratitude", "salah", "quran"]),
  77:  T(["kiyamet", "tawhid", "signs", "creation", "jahannam"]),
  78:  T(["kiyamet", "akhirah", "jannah", "jahannam", "creation"]),
  79:  T(["kiyamet", "akhirah", "musa", "history", "soul"]),
  80:  T(["ethics", "risalah", "creation", "tawhid", "quran"]),
  81:  T(["kiyamet", "creation", "tawhid", "quran", "soul"]),
  82:  T(["kiyamet", "akhirah", "creation", "tawhid", "ethics"]),
  83:  T(["ethics", "kiyamet", "akhirah", "jahannam", "jannah"]),
  84:  T(["kiyamet", "creation", "tawhid", "soul", "akhirah"]),
  85:  T(["history", "tawhid", "quran", "jahannam", "kiyamet"]),
  86:  T(["creation", "tawhid", "signs", "kiyamet", "quran"]),
  87:  T(["salah", "tawhid", "quran", "creation", "guidance"]),
  88:  T(["kiyamet", "akhirah", "jannah", "jahannam", "signs"]),
  89:  T(["kiyamet", "history", "akhirah", "ethics", "jannah"]),
  90:  T(["ethics", "community", "tawhid", "creation", "charity"]),
  91:  T(["soul", "ethics", "tawhid", "creation", "history"]),
  92:  T(["ethics", "tawhid", "soul", "akhirah", "charity"]),
  93:  T(["risalah", "tawhid", "ethics", "dua", "gratitude"]),
  94:  T(["risalah", "patience", "guidance", "tawhid", "gratitude"]),
  95:  T(["creation", "ethics", "tawhid", "akhirah", "soul"]),
  96:  T(["knowledge", "creation", "tawhid", "salah", "risalah"]),
  97:  T(["quran", "tawhid", "risalah", "iman", "signs"]),
  98:  T(["ahlu_kitab", "tawhid", "iman", "salah", "community"]),
  99:  T(["kiyamet", "akhirah", "creation", "ethics", "soul"]),
  100: T(["ethics", "creation", "kiyamet", "tawhid", "soul"]),
  101: T(["kiyamet", "akhirah", "tawhid", "creation", "jahannam"]),
  102: T(["ethics", "akhirah", "tawhid", "soul", "kiyamet"]),
  103: T(["ethics", "iman", "patience", "community", "guidance"]),
  104: T(["ethics", "akhirah", "jahannam", "soul", "community"]),
  105: T(["history", "tawhid", "community", "signs"]),
  106: T(["rizq", "tawhid", "community", "history", "salah"]),
  107: T(["ethics", "salah", "community", "iman", "charity"]),
  108: T(["tawhid", "salah", "gratitude", "risalah"]),
  109: T(["tawhid", "risalah", "ethics", "guidance"]),
  110: T(["tawhid", "tawbah", "risalah", "community"]),
  111: T(["history", "tawhid", "ethics", "akhirah"]),
  112: T(["tawhid", "iman"]),
  113: T(["dua", "tawhid", "guidance"]),
  114: T(["dua", "tawhid", "guidance", "soul"]),
};

/** Surah için temayı döndür */
export function getThemesForSurah(surahId: number): QuranTheme[] {
  const ids = SURAH_THEMES[surahId] ?? [];
  return ids.map((id) => THEMES.find((t) => t.id === id)).filter(Boolean) as QuranTheme[];
}

/** Ayet metnine göre öne çıkan temaları tahmin et (basit anahtar kelime eşleştirme) */
export function detectVerseThemes(surahId: number, translation: string): QuranTheme[] {
  const surahThemes = getThemesForSurah(surahId);
  if (surahThemes.length === 0) return [];

  const text = translation.toLowerCase();

  const KEYWORD_MAP: Record<string, string[]> = {
    tawhid:    ["allah", "tek", "bir", "ilah", "rab", "rabb"],
    iman:      ["iman", "inanmak", "mümin", "inanan"],
    salah:     ["namaz", "namazı", "kıl", "kılın", "rükû", "secde"],
    dua:       ["dua", "yalvar", "iste", "niyaz"],
    jannah:    ["cennet", "bahçe", "irmak", "akan"],
    jahannam:  ["cehennem", "ateş", "azap"],
    patience:  ["sabır", "sabret", "sabırlı"],
    gratitude: ["şükür", "şükredin", "nimeti"],
    tawbah:    ["tövbe", "bağışla", "affet", "istiğfar"],
    jihad:     ["cihat", "savaş", "mücadele", "savaşın"],
    family:    ["anne", "baba", "çocuk", "eş", "nikah", "miras"],
    justice:   ["adalet", "hak", "haksızlık", "zulüm"],
    kiyamet:   ["kıyamet", "hesap", "diriliş", "ölüm"],
  };

  // Ayetle örtüşen temaları öne çıkar
  const matched = new Set<string>();
  for (const [themeId, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => text.includes(kw))) matched.add(themeId);
  }

  // Öne çıkanlar önce, gerisi sonda
  return [
    ...surahThemes.filter((t) => matched.has(t.id)),
    ...surahThemes.filter((t) => !matched.has(t.id)),
  ];
}
