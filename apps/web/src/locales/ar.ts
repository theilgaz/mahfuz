import type { Messages } from "./types";

export const ar: Messages = {
  settings: {
    title: "الإعدادات",
    close: "إغلاق",
    theme: "المظهر",
    themes: {
      papyrus: "بردية",
      sea: "بحر",
      night: "ليل",
    },
    readingMode: "وضع القراءة",
    mushafPage: "صفحة المصحف",
    verseList: "قائمة الآيات",
    translation: "الترجمة",
    tajweed: "تلوين التجويد",
    fontSize: "حجم الخط",
    fontDefault: "افتراضي",
    arabic: "العربية",
    reciter: "القارئ",
    resetAll: "إعادة تعيين جميع الإعدادات",
    language: "اللغة",
    searchTranslation: "...ابحث عن ترجمة",
    searchReciter: "...ابحث عن قارئ",
    textStyle: "نمط النص",
    textStyleUthmani: "مصحف المدينة",
    textStyleBasic: "إملاء بسيط",
    tajweedOnlyUthmani: "التجويد متاح فقط مع نمط النص العثماني.",
    select: "اختر",
    searchPlaceholder: "...بحث",
  },

  nav: {
    home: "الرئيسية",
    continueReading: "متابعة",
    read: "اقرأ",
    bookmarks: "المفضلة",
    search: "بحث",
    back: "رجوع",
    login: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
  },

  common: {
    loading: "جاري التحميل...",
    noResults: "لم يتم العثور على نتائج",
    close: "إغلاق",
    page: "صفحة",
    surah: "سورة",
    verse: "آية",
    juz: "جزء",
    results: "نتائج",
    searching: "جاري البحث...",
  },

  home: {
    continueReading: "متابعة القراءة",
  },

  search: {
    title: "بحث",
    placeholder: "ابحث عن آية أو ترجمة...",
  },

  reader: {
    prevPage: "الصفحة السابقة",
    nextPage: "الصفحة التالية",
    prevSurah: "السورة السابقة",
    nextSurah: "السورة التالية",
    pageNotFound: "الصفحة غير موجودة",
    surahNotFound: "السورة غير موجودة",
    searchSurah: "ابحث عن سورة...",
    bookmark: "إضافة إشارة مرجعية",
    removeBookmark: "إزالة الإشارة المرجعية",
    verseActions: "إجراءات الآية {n}",
  },

  error: {
    notFound: "الصفحة غير موجودة",
    notFoundDesc: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    goHome: "العودة للرئيسية",
  },

  surahList: {
    searchPlaceholder: "ابحث عن سورة...",
    verses: "آيات",
    goToJuz: "انتقل إلى الجزء",
  },
} as const;
