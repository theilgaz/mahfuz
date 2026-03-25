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

Mahfuz is a Quran companion designed around simplicity. No clutter, no ads. Just the text and the tools you need to read, listen, and search.

- **Two reading modes.** Verse list for focused reading and a traditional Mushaf page view.
- **Audio playback.** Verse or surah-level playback with reciter selection and adjustable speed.
- **Full-text search.** Search across Arabic text and translations with diacritics stripping.
- **Bookmarks.** Save verses and access them from the home page.
- **Reading tracker.** Remembers last position and shows a continue-reading card.
- **3 themes.** Papyrus, Sea, and Night.
- **Tajweed coloring.** Optional color-coded tajweed rules on Uthmani text.
- **Two text styles.** Uthmani (Medina mushaf) and Basic (simple script).
- **7 languages.** Turkish, English, Spanish, French, Arabic, German, and Dutch interface with auto-detection.
- **Offline first.** PWA with Service Worker caching.

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
| Data | TanStack Query |
| Styling | Tailwind CSS v4 |
| Build | Vite 7 + Turborepo |
| State | Zustand (5 focused stores) |
| Database | Drizzle ORM + LibSQL |
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
│       ├── drizzle/              Database migrations
│       └── src/
│           ├── components/       UI components (22 files)
│           │   ├── reader/       AyahBlock, MushafPage, SurahView, AudioBar...
│           │   ├── habit/        HabitDashboard, StreakCard, WeeklyChart
│           │   └── icons/        MahfuzLogo
│           ├── hooks/            Custom hooks (5 files)
│           ├── locales/          i18n strings (tr, en, es, fr, ar, de, nl)
│           ├── lib/              Utilities (13 files)
│           ├── routes/           File-based routes (12 files)
│           ├── stores/           Zustand stores (5 files)
│           └── db/               Drizzle schema
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

### Routes

| Route | Description |
|-------|-------------|
| `/` | Home — continue reading, bookmarks, surah list |
| `/surah/$surahSlug` | Surah reader (verse list with translations) |
| `/page/$pageNumber` | Mushaf page view |
| `/juz/$juzId` | Juz reader (redirects to first page) |
| `/search` | Full-text search |
| `/bookmarks` | Saved verses |
| `/auth/login` | Login / register |
| `/auth/callback` | OAuth callback |

### Stores

| Store | Purpose |
|-------|---------|
| `settings` | Theme, reading mode, font sizes, translation, reciter, text style |
| `reading` | Last reading position, history |
| `bookmarks` | Saved verses with timestamps |
| `audio` | AudioEngine ref, playback state |
| `locale` | Current UI language |

## Architecture

### Data Flow

```
Quran API (api.quran.com)
    ↓
Service Worker (stale-while-revalidate)
    ↓
TanStack Query (in-memory, 24h gcTime)
    ↓
React Components (Zustand for UI state)
    ↓
Server DB (LibSQL via Drizzle ORM)
```

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
- **[Google Fonts](https://fonts.google.com).** Scheherazade New, Noto Naskh Arabic.

## Contributing

Contributions are welcome. Whether you work with React, mobile development, or are passionate about building tools for the Quran, there is a place for you here.

Start by opening an issue to discuss your idea, then send a pull request.

## License

MIT
