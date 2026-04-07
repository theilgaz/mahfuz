/**
 * Ayet Zinciri statik soru verileri.
 * Server function'lardan bağımsız tutulmuştur — client tarafında da import edilebilir.
 */

export interface ChainQuestion {
  currentVerse: {
    verseKey: string;
    surahName: string;
    textUthmani: string;
    lastWordArabic: string;
  };
  options: {
    verseKey: string;
    surahName: string;
    textUthmani: string;
    firstWords: string;
    isCorrect: boolean;
  }[];
  correctIndex: number;
}

export const STATIC_QUESTIONS: ChainQuestion[] = [
  {
    currentVerse: {
      verseKey: "1:1",
      surahName: "El-Fatiha",
      textUthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      lastWordArabic: "الرَّحِيمِ",
    },
    correctIndex: 0,
    options: [
      {
        verseKey: "1:2",
        surahName: "El-Fatiha",
        textUthmani: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        firstWords: "الْحَمْدُ لِلَّهِ رَبِّ...",
        isCorrect: true,
      },
      {
        verseKey: "2:255",
        surahName: "El-Bakara",
        textUthmani: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ",
        firstWords: "اللَّهُ لَا إِلَٰهَ...",
        isCorrect: false,
      },
      {
        verseKey: "112:1",
        surahName: "El-İhlas",
        textUthmani: "قُلْ هُوَ اللَّهُ أَحَدٌ",
        firstWords: "قُلْ هُوَ اللَّهُ...",
        isCorrect: false,
      },
      {
        verseKey: "36:1",
        surahName: "Yasin",
        textUthmani: "يس",
        firstWords: "يس",
        isCorrect: false,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "1:2",
      surahName: "El-Fatiha",
      textUthmani: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      lastWordArabic: "الْعَالَمِينَ",
    },
    correctIndex: 2,
    options: [
      {
        verseKey: "2:1",
        surahName: "El-Bakara",
        textUthmani: "الم",
        firstWords: "الم",
        isCorrect: false,
      },
      {
        verseKey: "112:1",
        surahName: "El-İhlas",
        textUthmani: "قُلْ هُوَ اللَّهُ أَحَدٌ",
        firstWords: "قُلْ هُوَ اللَّهُ...",
        isCorrect: false,
      },
      {
        verseKey: "1:3",
        surahName: "El-Fatiha",
        textUthmani: "الرَّحْمَٰنِ الرَّحِيمِ",
        firstWords: "الرَّحْمَٰنِ الرَّحِيمِ",
        isCorrect: true,
      },
      {
        verseKey: "55:1",
        surahName: "Er-Rahman",
        textUthmani: "الرَّحْمَٰنُ",
        firstWords: "الرَّحْمَٰنُ",
        isCorrect: false,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "2:255",
      surahName: "El-Bakara",
      textUthmani: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
      lastWordArabic: "الْقَيُّومُ",
    },
    correctIndex: 1,
    options: [
      {
        verseKey: "112:1",
        surahName: "El-İhlas",
        textUthmani: "قُلْ هُوَ اللَّهُ أَحَدٌ",
        firstWords: "قُلْ هُوَ اللَّهُ...",
        isCorrect: false,
      },
      {
        verseKey: "2:256",
        surahName: "El-Bakara",
        textUthmani: "لَا إِكْرَاهَ فِي الدِّينِ",
        firstWords: "لَا إِكْرَاهَ فِي...",
        isCorrect: true,
      },
      {
        verseKey: "1:1",
        surahName: "El-Fatiha",
        textUthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        firstWords: "بِسْمِ اللَّهِ...",
        isCorrect: false,
      },
      {
        verseKey: "55:1",
        surahName: "Er-Rahman",
        textUthmani: "الرَّحْمَٰنُ",
        firstWords: "الرَّحْمَٰنُ",
        isCorrect: false,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "112:1",
      surahName: "El-İhlas",
      textUthmani: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      lastWordArabic: "أَحَدٌ",
    },
    correctIndex: 2,
    options: [
      {
        verseKey: "1:1",
        surahName: "El-Fatiha",
        textUthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        firstWords: "بِسْمِ اللَّهِ...",
        isCorrect: false,
      },
      {
        verseKey: "2:1",
        surahName: "El-Bakara",
        textUthmani: "الم",
        firstWords: "الم",
        isCorrect: false,
      },
      {
        verseKey: "112:2",
        surahName: "El-İhlas",
        textUthmani: "اللَّهُ الصَّمَدُ",
        firstWords: "اللَّهُ الصَّمَدُ",
        isCorrect: true,
      },
      {
        verseKey: "114:1",
        surahName: "En-Nas",
        textUthmani: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
        firstWords: "قُلْ أَعُوذُ بِرَبِّ...",
        isCorrect: false,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "112:2",
      surahName: "El-İhlas",
      textUthmani: "اللَّهُ الصَّمَدُ",
      lastWordArabic: "الصَّمَدُ",
    },
    correctIndex: 3,
    options: [
      {
        verseKey: "1:1",
        surahName: "El-Fatiha",
        textUthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        firstWords: "بِسْمِ اللَّهِ...",
        isCorrect: false,
      },
      {
        verseKey: "55:1",
        surahName: "Er-Rahman",
        textUthmani: "الرَّحْمَٰنُ",
        firstWords: "الرَّحْمَٰنُ",
        isCorrect: false,
      },
      {
        verseKey: "36:2",
        surahName: "Yasin",
        textUthmani: "وَالْقُرْآنِ الْحَكِيمِ",
        firstWords: "وَالْقُرْآنِ الْحَكِيمِ",
        isCorrect: false,
      },
      {
        verseKey: "112:3",
        surahName: "El-İhlas",
        textUthmani: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
        firstWords: "لَمْ يَلِدْ وَلَمْ...",
        isCorrect: true,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "55:1",
      surahName: "Er-Rahman",
      textUthmani: "الرَّحْمَٰنُ",
      lastWordArabic: "الرَّحْمَٰنُ",
    },
    correctIndex: 0,
    options: [
      {
        verseKey: "55:2",
        surahName: "Er-Rahman",
        textUthmani: "عَلَّمَ الْقُرْآنَ",
        firstWords: "عَلَّمَ الْقُرْآنَ",
        isCorrect: true,
      },
      {
        verseKey: "112:1",
        surahName: "El-İhlas",
        textUthmani: "قُلْ هُوَ اللَّهُ أَحَدٌ",
        firstWords: "قُلْ هُوَ اللَّهُ...",
        isCorrect: false,
      },
      {
        verseKey: "2:256",
        surahName: "El-Bakara",
        textUthmani: "لَا إِكْرَاهَ فِي الدِّينِ",
        firstWords: "لَا إِكْرَاهَ فِي...",
        isCorrect: false,
      },
      {
        verseKey: "96:1",
        surahName: "El-Alak",
        textUthmani: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
        firstWords: "اقْرَأْ بِاسْمِ رَبِّكَ...",
        isCorrect: false,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "36:1",
      surahName: "Yasin",
      textUthmani: "يس",
      lastWordArabic: "يس",
    },
    correctIndex: 3,
    options: [
      {
        verseKey: "2:255",
        surahName: "El-Bakara",
        textUthmani: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ",
        firstWords: "اللَّهُ لَا إِلَٰهَ...",
        isCorrect: false,
      },
      {
        verseKey: "55:1",
        surahName: "Er-Rahman",
        textUthmani: "الرَّحْمَٰنُ",
        firstWords: "الرَّحْمَٰنُ",
        isCorrect: false,
      },
      {
        verseKey: "1:7",
        surahName: "El-Fatiha",
        textUthmani: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ",
        firstWords: "صِرَاطَ الَّذِينَ...",
        isCorrect: false,
      },
      {
        verseKey: "36:2",
        surahName: "Yasin",
        textUthmani: "وَالْقُرْآنِ الْحَكِيمِ",
        firstWords: "وَالْقُرْآنِ الْحَكِيمِ",
        isCorrect: true,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "96:1",
      surahName: "El-Alak",
      textUthmani: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
      lastWordArabic: "خَلَقَ",
    },
    correctIndex: 1,
    options: [
      {
        verseKey: "1:1",
        surahName: "El-Fatiha",
        textUthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        firstWords: "بِسْمِ اللَّهِ...",
        isCorrect: false,
      },
      {
        verseKey: "96:2",
        surahName: "El-Alak",
        textUthmani: "خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ",
        firstWords: "خَلَقَ الْإِنسَانَ...",
        isCorrect: true,
      },
      {
        verseKey: "55:2",
        surahName: "Er-Rahman",
        textUthmani: "عَلَّمَ الْقُرْآنَ",
        firstWords: "عَلَّمَ الْقُرْآنَ",
        isCorrect: false,
      },
      {
        verseKey: "36:2",
        surahName: "Yasin",
        textUthmani: "وَالْقُرْآنِ الْحَكِيمِ",
        firstWords: "وَالْقُرْآنِ الْحَكِيمِ",
        isCorrect: false,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "114:1",
      surahName: "En-Nas",
      textUthmani: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
      lastWordArabic: "النَّاسِ",
    },
    correctIndex: 0,
    options: [
      {
        verseKey: "114:2",
        surahName: "En-Nas",
        textUthmani: "مَلِكِ النَّاسِ",
        firstWords: "مَلِكِ النَّاسِ",
        isCorrect: true,
      },
      {
        verseKey: "2:1",
        surahName: "El-Bakara",
        textUthmani: "الم",
        firstWords: "الم",
        isCorrect: false,
      },
      {
        verseKey: "112:4",
        surahName: "El-İhlas",
        textUthmani: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
        firstWords: "وَلَمْ يَكُن لَّهُ...",
        isCorrect: false,
      },
      {
        verseKey: "1:5",
        surahName: "El-Fatiha",
        textUthmani: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        firstWords: "إِيَّاكَ نَعْبُدُ...",
        isCorrect: false,
      },
    ],
  },
  {
    currentVerse: {
      verseKey: "1:5",
      surahName: "El-Fatiha",
      textUthmani: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      lastWordArabic: "نَسْتَعِينُ",
    },
    correctIndex: 2,
    options: [
      {
        verseKey: "2:255",
        surahName: "El-Bakara",
        textUthmani: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ",
        firstWords: "اللَّهُ لَا إِلَٰهَ...",
        isCorrect: false,
      },
      {
        verseKey: "96:1",
        surahName: "El-Alak",
        textUthmani: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
        firstWords: "اقْرَأْ بِاسْمِ...",
        isCorrect: false,
      },
      {
        verseKey: "1:6",
        surahName: "El-Fatiha",
        textUthmani: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
        firstWords: "اهْدِنَا الصِّرَاطَ...",
        isCorrect: true,
      },
      {
        verseKey: "36:1",
        surahName: "Yasin",
        textUthmani: "يس",
        firstWords: "يس",
        isCorrect: false,
      },
    ],
  },
];
