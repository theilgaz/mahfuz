import type { Messages } from "./types";

export const fr: Messages = {
  settings: {
    title: "Paramètres",
    close: "Fermer",
    theme: "Thème",
    themes: {
      papyrus: "Papyrus",
      sea: "Océan",
      night: "Nuit",
    },
    readingMode: "Mode de Lecture",
    mushafPage: "Page du Mushaf",
    verseList: "Liste des Versets",
    translation: "Traduction",
    tajweed: "Coloration Tajweed",
    fontSize: "Taille de Police",
    fontDefault: "Par défaut",
    arabic: "Arabe",
    reciter: "Récitateur",
    resetAll: "Réinitialiser Tous les Paramètres",
    language: "Langue",
    searchTranslation: "Rechercher une traduction...",
    searchReciter: "Rechercher un récitateur...",
    textStyle: "Style de Texte",
    textStyleUthmani: "Mushaf de Médine",
    textStyleBasic: "Écriture simple",
    tajweedOnlyUthmani: "Le tajweed n'est disponible qu'avec le style de texte Uthmani.",
    select: "Sélectionner",
    searchPlaceholder: "Rechercher...",
  },

  nav: {
    home: "Accueil",
    continueReading: "Continuer",
    read: "Lire",
    bookmarks: "Signets",
    search: "Rechercher",
    back: "Retour",
    login: "Connexion",
    signOut: "Déconnexion",
  },

  common: {
    loading: "Chargement...",
    noResults: "Aucun résultat trouvé",
    close: "Fermer",
    page: "Page",
    surah: "Sourate",
    verse: "Verset",
    juz: "Juz",
    results: "résultats",
    searching: "Recherche...",
  },

  home: {
    continueReading: "Continuer la lecture",
  },

  search: {
    title: "Rechercher",
    placeholder: "Chercher verset ou traduction...",
  },

  reader: {
    prevPage: "Page précédente",
    nextPage: "Page suivante",
    prevSurah: "Sourate précédente",
    nextSurah: "Sourate suivante",
    pageNotFound: "Page introuvable",
    surahNotFound: "Sourate introuvable",
    searchSurah: "Chercher sourate...",
    bookmark: "Ajouter un signet",
    removeBookmark: "Supprimer le signet",
    verseActions: "Actions du verset {n}",
  },

  error: {
    notFound: "Page Introuvable",
    notFoundDesc: "La page que vous cherchez n'existe pas ou a été déplacée.",
    goHome: "Retour à l'Accueil",
  },

  surahList: {
    searchPlaceholder: "Chercher sourate...",
    verses: "versets",
    goToJuz: "Aller au Juz",
  },
} as const;
