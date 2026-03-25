import type { Messages } from "./types";

export const nl: Messages = {
  settings: {
    title: "Instellingen",
    close: "Sluiten",
    theme: "Thema",
    themes: {
      papyrus: "Papyrus",
      sea: "Zee",
      night: "Nacht",
    },
    readingMode: "Leesmodus",
    mushafPage: "Mushaf Pagina",
    verseList: "Verslijst",
    translation: "Vertaling",
    tajweed: "Tajweed Kleuring",
    fontSize: "Lettergrootte",
    fontDefault: "Standaard",
    arabic: "Arabisch",
    reciter: "Reciteerder",
    resetAll: "Alle Instellingen Resetten",
    language: "Taal",
    searchTranslation: "Vertaling zoeken...",
    searchReciter: "Reciteerder zoeken...",
    textStyle: "Tekststijl",
    textStyleUthmani: "Medina mushaf",
    textStyleBasic: "Eenvoudige spelling",
    tajweedOnlyUthmani: "Tajweed is alleen beschikbaar met de Uthmani-tekststijl.",
    select: "Selecteer",
    searchPlaceholder: "Zoeken...",
  },

  nav: {
    home: "Startpagina",
    continueReading: "Verder lezen",
    read: "Lezen",
    bookmarks: "Bladwijzers",
    search: "Zoeken",
    back: "Terug",
    login: "Inloggen",
    signOut: "Uitloggen",
  },

  common: {
    loading: "Laden...",
    noResults: "Geen resultaten gevonden",
    close: "Sluiten",
    page: "Pagina",
    surah: "Soera",
    verse: "Vers",
    juz: "Juz",
    results: "resultaten",
    searching: "Zoeken...",
  },

  home: {
    continueReading: "Verder lezen",
  },

  search: {
    title: "Zoeken",
    placeholder: "Zoek vers of vertaling...",
  },

  reader: {
    prevPage: "Vorige pagina",
    nextPage: "Volgende pagina",
    prevSurah: "Vorige soera",
    nextSurah: "Volgende soera",
    pageNotFound: "Pagina niet gevonden",
    surahNotFound: "Soera niet gevonden",
    searchSurah: "Zoek soera...",
    bookmark: "Bladwijzer toevoegen",
    removeBookmark: "Bladwijzer verwijderen",
    verseActions: "Vers {n} acties",
  },

  error: {
    notFound: "Pagina Niet Gevonden",
    notFoundDesc: "De pagina die u zoekt bestaat niet of is verplaatst.",
    goHome: "Naar Startpagina",
  },

  surahList: {
    searchPlaceholder: "Zoek soera...",
    verses: "verzen",
    goToJuz: "Ga naar Juz",
  },
} as const;
