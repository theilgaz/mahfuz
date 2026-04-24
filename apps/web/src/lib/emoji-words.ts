/**
 * Emoji-Kelime Eslestirme oyunu icin veri.
 * Her kayit: emoji, Arapca kelime, TR/EN anlam.
 */

export interface EmojiWord {
  emoji: string;
  arabic: string;
  tr: string;
  en: string;
  category: "element" | "animal" | "nature" | "object" | "body" | "food" | "celestial" | "concept";
}

export const EMOJI_WORDS: EmojiWord[] = [
  // Gokyuzu / Celestial
  { emoji: "\u2600\uFE0F", arabic: "\u0634\u064E\u0645\u0652\u0633", tr: "G\u00fcne\u015f", en: "Sun", category: "celestial" },
  { emoji: "\uD83C\uDF19", arabic: "\u0642\u064E\u0645\u064E\u0631", tr: "Ay", en: "Moon", category: "celestial" },
  { emoji: "\u2B50", arabic: "\u0646\u064E\u062C\u0652\u0645", tr: "Y\u0131ld\u0131z", en: "Star", category: "celestial" },
  { emoji: "\uD83C\uDF24\uFE0F", arabic: "\u0633\u064E\u0645\u064E\u0627\u0621", tr: "G\u00f6k", en: "Sky", category: "celestial" },

  // Elementler
  { emoji: "\uD83D\uDD25", arabic: "\u0646\u064E\u0627\u0631", tr: "Ate\u015f", en: "Fire", category: "element" },
  { emoji: "\uD83D\uDCA7", arabic: "\u0645\u064E\u0627\u0621", tr: "Su", en: "Water", category: "element" },
  { emoji: "\uD83C\uDF0D", arabic: "\u0623\u064E\u0631\u0652\u0636", tr: "Yery\u00fcz\u00fc", en: "Earth", category: "element" },
  { emoji: "\uD83D\uDCA8", arabic: "\u0631\u0650\u064A\u062D", tr: "R\u00fczgar", en: "Wind", category: "element" },
  { emoji: "\uD83C\uDF27\uFE0F", arabic: "\u0645\u064E\u0637\u064E\u0631", tr: "Ya\u011fmur", en: "Rain", category: "element" },
  { emoji: "\u2601\uFE0F", arabic: "\u0633\u064E\u062D\u064E\u0627\u0628", tr: "Bulut", en: "Cloud", category: "element" },

  // Hayvanlar
  { emoji: "\uD83D\uDC1D", arabic: "\u0646\u064E\u062D\u0652\u0644", tr: "Ar\u0131", en: "Bee", category: "animal" },
  { emoji: "\uD83D\uDC1C", arabic: "\u0646\u064E\u0645\u0652\u0644", tr: "Kar\u0131nca", en: "Ant", category: "animal" },
  { emoji: "\uD83D\uDD77\uFE0F", arabic: "\u0639\u064E\u0646\u0643\u064E\u0628\u064F\u0648\u062A", tr: "\u00d6r\u00fcmcek", en: "Spider", category: "animal" },
  { emoji: "\uD83D\uDC2A", arabic: "\u062C\u064E\u0645\u064E\u0644", tr: "Deve", en: "Camel", category: "animal" },
  { emoji: "\uD83D\uDC04", arabic: "\u0628\u064E\u0642\u064E\u0631\u064E\u0629", tr: "\u0130nek", en: "Cow", category: "animal" },
  { emoji: "\uD83D\uDC18", arabic: "\u0641\u0650\u064A\u0644", tr: "Fil", en: "Elephant", category: "animal" },
  { emoji: "\uD83D\uDC1F", arabic: "\u062D\u064F\u0648\u062A", tr: "Bal\u0131k", en: "Fish", category: "animal" },
  { emoji: "\uD83D\uDC26", arabic: "\u0637\u064E\u064A\u0652\u0631", tr: "Ku\u015f", en: "Bird", category: "animal" },
  { emoji: "\uD83D\uDC0E", arabic: "\u062E\u064E\u064A\u0652\u0644", tr: "At", en: "Horse", category: "animal" },
  { emoji: "\uD83D\uDC15", arabic: "\u0643\u064E\u0644\u0652\u0628", tr: "K\u00f6pek", en: "Dog", category: "animal" },
  { emoji: "\uD83D\uDC11", arabic: "\u063A\u064E\u0646\u064E\u0645", tr: "Koyun", en: "Sheep", category: "animal" },
  { emoji: "\uD83D\uDC14", arabic: "\u062F\u0650\u064A\u0643", tr: "Horoz", en: "Rooster", category: "animal" },
  { emoji: "\uD83E\uDD85", arabic: "\u0646\u064E\u0633\u0652\u0631", tr: "Kartal", en: "Eagle", category: "animal" },

  // Doga / Nature
  { emoji: "\u26F0\uFE0F", arabic: "\u062C\u064E\u0628\u064E\u0644", tr: "Da\u011f", en: "Mountain", category: "nature" },
  { emoji: "\uD83C\uDF33", arabic: "\u0634\u064E\u062C\u064E\u0631\u064E\u0629", tr: "A\u011fa\u00e7", en: "Tree", category: "nature" },
  { emoji: "\uD83C\uDF0A", arabic: "\u0628\u064E\u062D\u0652\u0631", tr: "Deniz", en: "Sea", category: "nature" },
  { emoji: "\uD83C\uDF3E", arabic: "\u0632\u064E\u0631\u0652\u0639", tr: "Ekin", en: "Crop", category: "nature" },
  { emoji: "\uD83C\uDF39", arabic: "\u0648\u064E\u0631\u0652\u062F", tr: "G\u00fcl", en: "Rose", category: "nature" },
  { emoji: "\uD83C\uDF3F", arabic: "\u0648\u064E\u0631\u064E\u0642", tr: "Yaprak", en: "Leaf", category: "nature" },
  { emoji: "\uD83C\uDF05", arabic: "\u0641\u064E\u062C\u0652\u0631", tr: "Fecir / \u015eafak", en: "Dawn", category: "nature" },
  { emoji: "\uD83C\uDF03", arabic: "\u0644\u064E\u064A\u0652\u0644", tr: "Gece", en: "Night", category: "nature" },

  // Nesneler / Objects
  { emoji: "\uD83D\uDCD6", arabic: "\u0643\u0650\u062A\u064E\u0627\u0628", tr: "Kitap", en: "Book", category: "object" },
  { emoji: "\uD83D\uDD8A\uFE0F", arabic: "\u0642\u064E\u0644\u064E\u0645", tr: "Kalem", en: "Pen", category: "object" },
  { emoji: "\uD83D\uDEA2", arabic: "\u0633\u064E\u0641\u0650\u064A\u0646\u064E\u0629", tr: "Gemi", en: "Ship", category: "object" },
  { emoji: "\uD83C\uDFE0", arabic: "\u0628\u064E\u064A\u0652\u062A", tr: "Ev", en: "House", category: "object" },
  { emoji: "\uD83D\uDEAA", arabic: "\u0628\u064E\u0627\u0628", tr: "Kap\u0131", en: "Door", category: "object" },
  { emoji: "\uD83D\uDD11", arabic: "\u0645\u0650\u0641\u0652\u062A\u064E\u0627\u062D", tr: "Anahtar", en: "Key", category: "object" },
  { emoji: "\uD83D\uDCA1", arabic: "\u0645\u0650\u0635\u0652\u0628\u064E\u0627\u062D", tr: "Kandil", en: "Lamp", category: "object" },
  { emoji: "\u2696\uFE0F", arabic: "\u0645\u0650\u064A\u0632\u064E\u0627\u0646", tr: "Terazi", en: "Scale", category: "object" },
  { emoji: "\uD83D\uDEE1\uFE0F", arabic: "\u062F\u0650\u0631\u0652\u0639", tr: "Kalkan", en: "Shield", category: "object" },
  { emoji: "\uD83D\uDC51", arabic: "\u062A\u064E\u0627\u062C", tr: "Ta\u00e7", en: "Crown", category: "object" },

  // Vucut / Body
  { emoji: "\u2764\uFE0F", arabic: "\u0642\u064E\u0644\u0652\u0628", tr: "Kalp", en: "Heart", category: "body" },
  { emoji: "\uD83D\uDC41\uFE0F", arabic: "\u0639\u064E\u064A\u0652\u0646", tr: "G\u00f6z", en: "Eye", category: "body" },
  { emoji: "\uD83D\uDC42", arabic: "\u0623\u064F\u0630\u064F\u0646", tr: "Kulak", en: "Ear", category: "body" },
  { emoji: "\u270B", arabic: "\u064A\u064E\u062F", tr: "El", en: "Hand", category: "body" },
  { emoji: "\uD83E\uDDB6", arabic: "\u0642\u064E\u062F\u064E\u0645", tr: "Ayak", en: "Foot", category: "body" },
  { emoji: "\uD83D\uDDE3\uFE0F", arabic: "\u0644\u0650\u0633\u064E\u0627\u0646", tr: "Dil", en: "Tongue", category: "body" },

  // Yiyecekler / Food
  { emoji: "\uD83C\uDF4E", arabic: "\u062A\u064F\u0641\u0651\u064E\u0627\u062D", tr: "Elma", en: "Apple", category: "food" },
  { emoji: "\uD83E\uDED2", arabic: "\u0632\u064E\u064A\u0652\u062A\u064F\u0648\u0646", tr: "Zeytin", en: "Olive", category: "food" },
  { emoji: "\uD83C\uDF47", arabic: "\u0639\u0650\u0646\u064E\u0628", tr: "\u00dcz\u00fcm", en: "Grape", category: "food" },
  { emoji: "\uD83C\uDF4C", arabic: "\u062A\u0650\u064A\u0646", tr: "\u0130ncir", en: "Fig", category: "food" },
  { emoji: "\uD83C\uDF34", arabic: "\u0646\u064E\u062E\u0652\u0644", tr: "Hurma a\u011fac\u0131", en: "Palm tree", category: "food" },
  { emoji: "\uD83C\uDF6F", arabic: "\u0639\u064E\u0633\u064E\u0644", tr: "Bal", en: "Honey", category: "food" },
  { emoji: "\uD83E\uDD5B", arabic: "\u0644\u064E\u0628\u064E\u0646", tr: "S\u00fct", en: "Milk", category: "food" },
  { emoji: "\uD83C\uDF3D", arabic: "\u062D\u064E\u0628\u0651", tr: "Tah\u0131l", en: "Grain", category: "food" },
  { emoji: "\uD83E\uDDC5", arabic: "\u0628\u064E\u0635\u064E\u0644", tr: "So\u011fan", en: "Onion", category: "food" },

  // Kavramlar / Concepts
  { emoji: "\uD83D\uDD4B", arabic: "\u0645\u064E\u0633\u0652\u062C\u0650\u062F", tr: "Mescid", en: "Mosque", category: "concept" },
  { emoji: "\uD83D\uDD4D", arabic: "\u0643\u064E\u0639\u0652\u0628\u064E\u0629", tr: "Kabe", en: "Kaaba", category: "concept" },
  { emoji: "\uD83D\uDCAB", arabic: "\u0631\u064F\u0648\u062D", tr: "Ruh", en: "Soul", category: "concept" },
  { emoji: "\uD83D\uDC94", arabic: "\u0645\u064E\u0648\u0652\u062A", tr: "\u00d6l\u00fcm", en: "Death", category: "concept" },
];

/** Get localized meaning for a pair */
export function getEmojiMeaning(item: EmojiWord, locale: string): string {
  return locale === "en" ? item.en : item.tr;
}

export interface PickedItem {
  item: EmojiWord;
  globalIdx: number;
}

/** Pick N random unique items from the pool, optionally excluding used indices */
export function pickRandomItems(count: number, usedIndices?: Set<number>): PickedItem[] {
  const available = EMOJI_WORDS
    .map((item, i) => ({ item, globalIdx: i }))
    .filter(({ globalIdx }) => !usedIndices?.has(globalIdx));

  const pool = available.length >= count ? available : EMOJI_WORDS.map((item, i) => ({ item, globalIdx: i }));

  // Fisher-Yates shuffle
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, count);
}
