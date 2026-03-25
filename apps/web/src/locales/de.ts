import type { Messages } from "./types";

export const de: Messages = {
  settings: {
    title: "Einstellungen",
    close: "Schließen",
    theme: "Design",
    themes: {
      papyrus: "Papyrus",
      sea: "Meer",
      night: "Nacht",
    },
    readingMode: "Lesemodus",
    mushafPage: "Mushaf-Seite",
    verseList: "Versliste",
    translation: "Übersetzung",
    tajweed: "Tajweed-Färbung",
    fontSize: "Schriftgröße",
    fontDefault: "Standard",
    arabic: "Arabisch",
    reciter: "Rezitator",
    resetAll: "Alle Einstellungen zurücksetzen",
    language: "Sprache",
    searchTranslation: "Übersetzung suchen...",
    searchReciter: "Rezitator suchen...",
    textStyle: "Textstil",
    textStyleUthmani: "Medina-Mushaf",
    textStyleBasic: "Einfache Schrift",
    tajweedOnlyUthmani: "Tajweed ist nur im Uthmani-Textstil verfügbar.",
    select: "Auswählen",
    searchPlaceholder: "Suchen...",
  },

  nav: {
    home: "Startseite",
    continueReading: "Weiterlesen",
    read: "Lesen",
    bookmarks: "Lesezeichen",
    search: "Suche",
    back: "Zurück",
    login: "Anmelden",
    signOut: "Abmelden",
  },

  common: {
    loading: "Wird geladen...",
    noResults: "Keine Ergebnisse gefunden",
    close: "Schließen",
    page: "Seite",
    surah: "Sure",
    verse: "Vers",
    juz: "Dschuz",
    results: "Ergebnisse",
    searching: "Suche läuft...",
  },

  home: {
    continueReading: "Weiterlesen",
  },

  search: {
    title: "Suche",
    placeholder: "Vers oder Übersetzung suchen...",
  },

  reader: {
    prevPage: "Vorherige Seite",
    nextPage: "Nächste Seite",
    prevSurah: "Vorherige Sure",
    nextSurah: "Nächste Sure",
    pageNotFound: "Seite nicht gefunden",
    surahNotFound: "Sure nicht gefunden",
    searchSurah: "Sure suchen...",
    bookmark: "Lesezeichen hinzufügen",
    removeBookmark: "Lesezeichen entfernen",
    verseActions: "Vers {n} Aktionen",
  },

  error: {
    notFound: "Seite Nicht Gefunden",
    notFoundDesc: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    goHome: "Zur Startseite",
  },

  surahList: {
    searchPlaceholder: "Sure suchen...",
    verses: "Verse",
    goToJuz: "Zum Dschuz",
  },
} as const;
