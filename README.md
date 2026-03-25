<div align="center">

<br>

<img src="apps/legacy/public/icons/mahfuz-logo-organic-gold.svg" width="80" alt="Mahfuz">

# Mahfuz / محفوظ

A minimal, distraction-free Quran companion for the web.

**[mahfuz.ilg.az](https://mahfuz.ilg.az)**

<br>

</div>

---

## About

Mahfuz is a Quran companion designed around simplicity. No clutter, no ads. Just the text and the tools you need to read, listen, learn, and memorize.

- **Three reading modes.** Line-by-line for focused reading, word-by-word with inline translation and transliteration, and a traditional Mushaf page with Karahisari-style illuminated borders.
- **Two page layouts.** Standard Medina Mushaf (604 pages) and Berkenar layout (600 pages, 20 per juz), switchable in settings.
- **Focus mode.** Distraction-free reading with annotation canvas (pen, highlighter, text notes), gesture navigation, and wake lock.
- **Audio playback.** Verse or surah-level playback with real-time word highlighting, auto-continue to next surah, reciter selection, adjustable speed, and lock screen controls via MediaSession.
- **Memorization.** Five study modes: Learn (word-by-word), Listen (audio tracking), Test (fill-in-the-blank), Type (transliteration), and Immersive (fullscreen). Powered by SM-2 spaced repetition with per-verse word accuracy tracking.
- **Discover.** Linguistic exploration with an Arabic root dictionary, 36 Quranic concepts across 8 categories, i'rab (syntax analysis) with interactive syntax trees, and word-by-word grammar popovers.
- **Learn to Read.** A 14-stage curriculum from letters to tajweed, with adaptive practice and Quranic word quests.
- **Kids.** Child-friendly Arabic letter learning with animated introductions, stroke tracing, sound matching, letter hunt games, and quizzes. Multi-profile support for families.
- **Library.** Unified hub for courses, learning tracks, and memorization in one place.
- **7 themes.** Light, Crystal, Sepia, Teal, Dimmed, Dark, and Black, plus 4 reading presets (night, study, mushaf, default).
- **Offline first.** Three-layer caching with TanStack Query, Dexie IndexedDB, and Service Worker.
- **Sync.** Cross-device progress sync with LWW merge for preferences, union merge for bookmarks, and append-only for reviews and badges.
- **5 languages.** Turkish, English, Spanish, French, and Arabic interface with auto-detection.

## Roadmap

| Status | Feature |
|:------:|---------|
| Done | Reading: three view modes, two page layouts, topic index, command palette |
| Done | Focus: distraction-free reading with pen/highlighter/text annotations |
| Done | Audio: verse-level playback with word-level sync, auto-continue |
| Done | Offline: PWA with stale-while-revalidate caching |
| Done | Authentication: Better Auth with cookie sessions |
| Done | Memorization: 5-mode word-by-word system with SM-2 |
| Done | Learn: 14-stage curriculum with side quests |
| Done | Library: unified courses, tracks, and memorization |
| Done | Discover: root dictionary, concepts, i'rab syntax trees |
| Done | Kids: Arabic letter learning with tracing, games, quizzes |
| Done | i18n: Turkish, English, Spanish, French, Arabic |
| Done | Gamification: achievement badges |
| Done | Performance: virtualization, memoization, lazy loading |
| Done | Sync: cross-device progress sync |
| Done | Reading tools: presets, stats, favorites, bookmarks, history |
| Next | Share and SEO: social sharing, calligraphy cards, deep links |
| Next | Mobile: native Android and iOS apps |
| Next | @mahfuz/sdk: public npm package for Quran data |

## Getting Started

```bash
git clone https://github.com/theilgaz/mahfuz.git
cd mahfuz/mahfuz-app
npx pnpm@9 install
cp apps/legacy/.env.example apps/legacy/.env
npx pnpm@9 dev
```

Dev server runs at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npx pnpm@9 dev` | Start development server |
| `npx pnpm@9 build` | Production build (all packages) |
| `npx pnpm@9 lint` | Run ESLint |
| `npx pnpm@9 typecheck` | TypeScript type checking |
| `npx pnpm@9 format` | Format with Prettier |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TanStack Start (SSR) |
| Routing | TanStack Router (file-based) |
| Data | TanStack Query + TanStack Virtual |
| Styling | Tailwind CSS v4 |
| Build | Vite 7 + Turborepo |
| State | Zustand (18 focused stores) |
| Database | Dexie v4 (IndexedDB) + Drizzle ORM + LibSQL |
| Auth | Better Auth v1.5 |
| Deploy | Dokploy (Docker, Node.js SSR) |
| Package manager | pnpm 9 |

## Project Structure

```
mahfuz-app/
├── apps/
│   └── web/                      Main web application
│       ├── server.mjs            Node.js SSR server
│       ├── Dockerfile            Multi-stage Docker build
│       ├── drizzle/              Database migrations (5 files)
│       └── src/
│           ├── components/       UI components (141 files)
│           │   ├── audio/        AudioBar, AudioProvider, playlists
│           │   ├── browse/       Surah list, chapter cards, reading list
│           │   ├── discover/     Dictionary, concepts, i'rab, grammar
│           │   ├── focus/        Focus mode layout, annotations, gestures
│           │   ├── kids/          Letter learning, tracing, games, quizzes
│           │   ├── memorization/ 5 study modes, surah selector, results
│           │   ├── quran/        AyahText, VerseList, MushafPage, WBW
│           │   ├── settings/     7 extracted setting sections
│           │   └── ui/           Dialog, Popover, Skeleton, Loading...
│           ├── hooks/            Custom hooks, query and mutation hooks
│           ├── locales/          i18n strings (tr, en, es, fr, ar)
│           ├── lib/              Utilities, constants, store helpers
│           ├── routes/           File-based routes (37 files)
│           └── stores/           Zustand stores (18 focused stores)
├── packages/
│   ├── api/                      Quran.com API client with IndexedDB cache
│   ├── audio-engine/             Playback engine with word-level sync
│   ├── db/                       Dexie IndexedDB schemas and Drizzle ORM
│   ├── gamification/             Badge and achievement system
│   ├── memorization/             SM-2 spaced repetition algorithm
│   ├── sdk/                      Public SDK (planned)
│   └── shared/                   Types, constants, curriculum data
└── tooling/                      Shared ESLint, TypeScript, Tailwind configs
```

## Architecture

### Data Flow

```
Quran API (api.quran.com)
    ↓
Service Worker (stale-while-revalidate)
    ↓
@mahfuz/api (IndexedDB cache, 30-day TTL)
    ↓
TanStack Query (in-memory, 24h gcTime)
    ↓
React Components (Zustand for UI state)
    ↓
Sync Engine (push/pull with LWW + union merge)
    ↓
Server DB (LibSQL via Drizzle ORM)
```

### Performance

- **Virtualized verse list.** Only ~15 DOM nodes for a 286-verse surah via TanStack Virtual.
- **Per-verse audio isolation.** During playback, only the active verse re-renders.
- **Consolidated Zustand selectors.** Single `useShallow` subscription per component.
- **React.memo** on all verse, card, and translation components.
- **Dynamic imports.** Topic index, morphology data, and heavy assets lazy-loaded on demand.
- **Service Worker caching.** API responses served instantly from cache.

## Credits

### Translations

| Translation | Author | Source |
|-------------|--------|--------|
| Diyanet İşleri Başkanlığı Meali | Diyanet İşleri Başkanlığı | [quran.com](https://quran.com) API |
| Ömer Çelik Meali | Prof. Dr. Ömer Çelik | [kuranvemeali.com](https://www.kuranvemeali.com) |
| Ömer Nasuhi Bilmen Meali | Ömer Nasuhi Bilmen | [kuranayetleri.net](https://kuranayetleri.net) |
| Ali Fikri Yavuz Meali | Ali Fikri Yavuz | [kuranayetleri.net](https://kuranayetleri.net) |

### Data Sources

- **[Tanzil.net](https://tanzil.net).** Quran verse texts in Uthmani and Simple scripts. Licensed under Creative Commons BY 3.0.
- **[Quran.com API](https://quran.com).** Word-by-word data, transliteration, and Diyanet translation.
- **[Kuran Meali Ebook Oluşturucu](https://github.com/alialparslan/Kuran-Meali-Ebook-Olusturucu)** by alialparslan. Ali Fikri Yavuz and Ömer Nasuhi Bilmen translations in JSON format.

### Fonts

- **[KFGQPC Uthmani Hafs](https://fonts.qurancomplex.gov.sa).** King Fahd Glorious Quran Printing Complex.
- **[Google Fonts](https://fonts.google.com).** Scheherazade New, Amiri, Noto Naskh Arabic, Rubik, Zain, Reem Kufi, Playpen Sans Arabic.

## Contributing

Contributions are welcome. Whether you work with React, mobile development, or are passionate about building tools for the Quran, there is a place for you here.

Start by opening an issue to discuss your idea, then send a pull request.

## License

MIT
