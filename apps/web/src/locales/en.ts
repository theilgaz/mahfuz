import type { Messages } from "./types";

export const en: Messages = {
  settings: {
    title: "Settings",
    close: "Close",
    theme: "Theme",
    themes: {
      papyrus: "Papyrus",
      sea: "Ocean",
      night: "Night",
    },
    readingMode: "Reading Mode",
    mushafPage: "Mushaf Page",
    verseList: "Verse List",
    translation: "Translation",
    tajweed: "Tajweed Coloring",
    fontSize: "Font Size",
    fontDefault: "Default",
    arabic: "Arabic",
    reciter: "Reciter",
    resetAll: "Reset All Settings",
    language: "Language",
    searchTranslation: "Search translation...",
    searchReciter: "Search reciter...",
    textStyle: "Text Style",
    textStyleUthmani: "Medina mushaf",
    textStyleBasic: "Simple script",
    tajweedOnlyUthmani: "Tajweed is only available with Uthmani text style.",
    select: "Select",
    searchPlaceholder: "Search...",
  },

  nav: {
    home: "Home",
    continueReading: "Continue",
    read: "Read",
    bookmarks: "Bookmarks",
    search: "Search",
    back: "Back",
    login: "Login",
    signOut: "Sign out",
  },

  common: {
    loading: "Loading...",
    noResults: "No results found",
    close: "Close",
    page: "Page",
    surah: "Surah",
    verse: "Verse",
    juz: "Juz",
    results: "results",
    searching: "Searching...",
  },

  home: {
    continueReading: "Continue reading",
  },

  search: {
    title: "Search",
    placeholder: "Search verse or translation...",
  },

  reader: {
    prevPage: "Previous page",
    nextPage: "Next page",
    prevSurah: "Previous surah",
    nextSurah: "Next surah",
    pageNotFound: "Page not found",
    surahNotFound: "Surah not found",
    searchSurah: "Search surah...",
    bookmark: "Add bookmark",
    removeBookmark: "Remove bookmark",
    verseActions: "Verse {n} actions",
  },

  error: {
    notFound: "Page Not Found",
    notFoundDesc: "The page you're looking for doesn't exist or has been moved.",
    goHome: "Go to Home",
  },

  surahList: {
    searchPlaceholder: "Search surah...",
    verses: "verses",
    goToJuz: "Go to Juz",
  },
} as const;
