<div align="center">

<br>

<img src="apps/web/public/images/mahfuz-logo.svg" width="320" alt="Mahfuz — محفوظ">

<br>

A minimal, distraction-free Quran reading experience on the web.

**[mahfuz.ilg.az](https://mahfuz.ilg.az)**

<br>

</div>

---

## About

Mahfuz is a Quran companion designed around simplicity. No clutter, no ads — just the text and the tools you need to read, listen, learn, and memorize.

- **Three reading modes** — Line-by-line for focused reading, word-by-word with inline translation and transliteration, and a traditional Mushaf page with Karahisari-style illuminated borders in CSS and SVG.
- **Audio playback** — Verse or surah-level playback with real-time word highlighting, gapless preloading, reciter selection, adjustable speed, and lock screen controls via MediaSession.
- **Memorization** — SM-2 spaced repetition, progress tracking per surah and ayah, daily goals, review sessions, and verification exams.
- **Learn to Read** — 14-stage curriculum from letters to tajweed, with adaptive practice and Quranic word quests.
- **Offline first** — Three-layer caching: TanStack Query (memory) + Dexie IndexedDB (persistent) + Service Worker (PWA).
- **Bilingual** — Full Turkish and English interface with auto-detection.

## Roadmap

| Status | Feature |
|:------:|---------|
| ✅ | Reading — Three view modes, topic index, command palette |
| ✅ | Audio — Verse-level playback with word-level sync |
| ✅ | Offline — PWA with stale-while-revalidate caching |
| ✅ | Authentication — Better Auth with cookie sessions |
| ✅ | Memorization — Spaced repetition with SM-2 |
| ✅ | Learn — 14-stage curriculum with side quests |
| ✅ | i18n — Turkish and English |
| ✅ | Gamification — Achievement badges |
| ✅ | Performance — Virtualization, memoization, lazy loading |
| 🔜 | Sync — Cross-device progress sync |
| 🔜 | Share & SEO — Social sharing, calligraphy cards, deep links |
| 🔜 | Mobile — Native Android and iOS apps |
| 🔜 | @mahfuz/sdk — Public npm package for Quran data |

## Getting Started

```bash
git clone https://github.com/theilgaz/mahfuz.git
cd mahfuz/mahfuz-app
npx pnpm@9 install
cp apps/web/.env.example apps/web/.env
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
| State | Zustand |
| Database | Dexie v4 (IndexedDB) + Drizzle ORM + LibSQL |
| Auth | Better Auth v1.5 |
| Deploy | Netlify (SSR via Netlify Functions) |
| Package manager | pnpm 9 |

## Project Structure

```
mahfuz-app/
├── apps/
│   └── web/                      Main web application
│       └── src/
│           ├── components/       UI components (quran, ui, learn, memorization, audio)
│           ├── hooks/            Custom hooks (useChapters, useAudio, useLearn, etc.)
│           ├── locales/          i18n strings (tr.ts, en.ts)
│           ├── routes/           File-based routes (~35 routes)
│           └── stores/           Zustand stores (7 stores)
├── packages/
│   ├── api/                      Quran.com API client with IndexedDB cache
│   ├── audio-engine/             Playback engine with word-level sync
│   ├── db/                       Dexie IndexedDB schemas + Drizzle ORM
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
```

### Performance

- **Virtualized verse list** — Only ~15 DOM nodes for a 286-verse surah (TanStack Virtual)
- **Per-verse audio isolation** — During playback, only the active verse re-renders
- **Consolidated Zustand selectors** — Single `useShallow` subscription per component
- **React.memo** on all verse, card, and translation components
- **Dynamic imports** — Topic index and heavy data lazy-loaded on demand
- **SW stale-while-revalidate** — API responses served instantly from cache

## Credits

### Translations

| Translation | Author | Source |
|-------------|--------|--------|
| Diyanet İşleri Başkanlığı Meali | Diyanet İşleri Başkanlığı | [quran.com](https://quran.com) API |
| Ömer Çelik Meali | Prof. Dr. Ömer Çelik | [kuranvemeali.com](https://www.kuranvemeali.com) |
| Ömer Nasuhi Bilmen Meali | Ömer Nasuhi Bilmen | [kuranayetleri.net](https://kuranayetleri.net) |
| Ali Fikri Yavuz Meali | Ali Fikri Yavuz | [kuranayetleri.net](https://kuranayetleri.net) |

### Data Sources

- **[Quran.com API](https://quran.com)** — Verse text, word-by-word data, transliteration, and Diyanet translation
- **[Kuran Meali Ebook Oluşturucu](https://github.com/alialparslan/Kuran-Meali-Ebook-Olusturucu)** by alialparslan — Ali Fikri Yavuz and Ömer Nasuhi Bilmen translations in JSON format

### Fonts

- **[KFGQPC Uthmani Hafs](https://fonts.qurancomplex.gov.sa)** — King Fahd Glorious Quran Printing Complex
- **[Google Fonts](https://fonts.google.com)** — Scheherazade New, Amiri, Noto Naskh Arabic, Rubik, Zain, Reem Kufi, Playpen Sans Arabic

## Contributing

We'd love to have talented developers join the journey. Whether you're into React, mobile development, or just passionate about building tools for the Quran — there's a place for you here.

Start by opening an issue to discuss your idea, then send a PR.

## License

MIT
