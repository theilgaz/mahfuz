import type { Messages } from "./types";

export const es: Messages = {
  settings: {
    title: "Ajustes",
    close: "Cerrar",
    theme: "Tema",
    themes: {
      papyrus: "Papiro",
      sea: "Mar",
      night: "Noche",
    },
    readingMode: "Modo de Lectura",
    mushafPage: "Página del Mushaf",
    verseList: "Lista de Versículos",
    translation: "Traducción",
    tajweed: "Coloración Tajweed",
    fontSize: "Tamaño de Fuente",
    fontDefault: "Predeterminado",
    arabic: "Árabe",
    reciter: "Recitador",
    resetAll: "Restablecer Todos los Ajustes",
    language: "Idioma",
    searchTranslation: "Buscar traducción...",
    searchReciter: "Buscar recitador...",
    textStyle: "Estilo de Texto",
    textStyleUthmani: "Mushaf de Medina",
    textStyleBasic: "Escritura simple",
    tajweedOnlyUthmani: "El tajweed solo está disponible con el estilo de texto Uthmani.",
    select: "Seleccionar",
    searchPlaceholder: "Buscar...",
  },

  nav: {
    home: "Inicio",
    continueReading: "Continuar",
    read: "Leer",
    bookmarks: "Marcadores",
    search: "Buscar",
    back: "Atrás",
    login: "Iniciar sesión",
    signOut: "Cerrar sesión",
  },

  common: {
    loading: "Cargando...",
    noResults: "No se encontraron resultados",
    close: "Cerrar",
    page: "Página",
    surah: "Sura",
    verse: "Versículo",
    juz: "Yuz",
    results: "resultados",
    searching: "Buscando...",
  },

  home: {
    continueReading: "Seguir leyendo",
  },

  search: {
    title: "Buscar",
    placeholder: "Buscar versículo o traducción...",
  },

  reader: {
    prevPage: "Página anterior",
    nextPage: "Página siguiente",
    prevSurah: "Sura anterior",
    nextSurah: "Sura siguiente",
    pageNotFound: "Página no encontrada",
    surahNotFound: "Sura no encontrada",
    searchSurah: "Buscar sura...",
    bookmark: "Añadir marcador",
    removeBookmark: "Quitar marcador",
    verseActions: "Acciones del versículo {n}",
  },

  error: {
    notFound: "Página No Encontrada",
    notFoundDesc: "La página que buscas no existe o ha sido movida.",
    goHome: "Ir al Inicio",
  },

  surahList: {
    searchPlaceholder: "Buscar sura...",
    verses: "versículos",
    goToJuz: "Ir al Yuz",
  },
} as const;
