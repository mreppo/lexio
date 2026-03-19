# Lexio - Product Specification

## Vision

A language-agnostic vocabulary trainer that helps users learn word translations through active recall and spaced repetition. MVP is a static PWA hosted on GitHub Pages - but architected for future expansion (backend, native app, API).

## Target Users

- Language learners at any level
- Primary MVP user: Latvian speaker learning English (B1-B2)
- Secondary: anyone learning any language pair

## Core Principles

- **Language-agnostic** - any language pair, user-defined
- **No hardcoded limits** - modular, extensible architecture
- **Offline-first** - localStorage now, syncable storage interface later
- **Mobile-first** - responsive, works everywhere
- **PWA** - installable on home screen, works offline

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 18+ | Vite as build tool |
| Language | TypeScript (strict) | Type safety, maintainability |
| UI Library | MUI (Material UI) | Consistent, accessible components |
| State | React Context + useReducer | Keep it simple, replaceable later |
| Storage | localStorage via abstraction layer | Interface ready for IndexedDB/API swap |
| Testing | Vitest + React Testing Library | From day one |
| Hosting | GitHub Pages | Static build, CI/CD via GitHub Actions |
| PWA | Vite PWA plugin | Service worker, manifest, offline |

### Architecture Notes

- Storage accessed through a `StorageService` interface - never call localStorage directly. This allows swapping to IndexedDB, REST API, or any backend without touching business logic.
- Word data model should be normalised and versioned, so future migrations are possible.
- All text/labels externalised for i18n readiness (not full i18n in MVP, but structured for it).

---

## Data Model

### LanguagePair
```
{
  id: string (uuid),
  sourceLang: string,     // e.g. "Latvian"
  targetLang: string,     // e.g. "English"
  sourceCode: string,     // e.g. "lv"
  targetCode: string,     // e.g. "en"
  createdAt: timestamp
}
```

### Word
```
{
  id: string (uuid),
  pairId: string,           // references LanguagePair
  source: string,           // word in source language
  target: string,           // word in target language
  notes: string | null,     // optional context, example sentence
  tags: string[],           // e.g. ["food", "B1", "starter-pack"]
  createdAt: timestamp,
  isFromPack: boolean       // distinguishes user words from starter pack
}
```

### WordProgress
```
{
  wordId: string,
  correctCount: number,
  incorrectCount: number,
  streak: number,
  lastReviewed: timestamp | null,
  nextReview: timestamp,      // spaced repetition scheduling
  confidence: number,         // 0-1 calculated score
  history: Array<{            // last N attempts
    direction: "source-to-target" | "target-to-source",
    mode: "type" | "choice",
    correct: boolean,
    timestamp: timestamp
  }>
}
```

### UserSettings
```
{
  activePairId: string | null,
  quizMode: "type" | "choice" | "mixed",
  dailyGoal: number,           // words per day target
  theme: "light" | "dark" | "system"
}
```

### DailyStats
```
{
  date: string,               // YYYY-MM-DD
  wordsReviewed: number,
  correctCount: number,
  incorrectCount: number,
  streakDays: number           // consecutive days of meeting daily goal
}
```

---

## Features - MVP

### F1: Language Pair Management
- Create custom language pairs (any two languages)
- Switch between pairs
- Delete pairs (with confirmation)
- EN-LV pair suggested on first launch

### F2: Word Management
- Add words manually (source + target + optional notes/tags)
- Edit existing words
- Delete words
- Bulk import (paste CSV/text format)
- Search/filter words by text or tags

### F3: Starter Packs
- Built-in EN-LV B1-B2 starter pack (~200-300 words)
- User can choose to load starter pack when creating a pair
- Starter pack words are clearly marked, can be deleted individually
- Architecture allows adding more packs later (JSON files)

### F4: Quiz - Type Mode
- Show a word, user types the translation
- Both directions (source-to-target, target-to-source), mixed randomly
- Case-insensitive matching
- Accept minor typos (Levenshtein distance tolerance - configurable)
- Show correct answer on wrong attempt
- Visual feedback (correct/incorrect animation)

### F5: Quiz - Multiple Choice Mode
- Show a word with 4 options
- Options generated from other words in the same language pair
- Both directions, mixed randomly
- Visual feedback on selection

### F6: Quiz - Mixed Mode
- Alternates between type and choice modes
- Ratio configurable in settings (default: 50/50)

### F7: Spaced Repetition
- Algorithm based on SM-2 (or simplified variant)
- Words user gets wrong appear more frequently
- Words user knows well appear less often
- Confidence score per word (derived from history)
- "Next review" scheduling

### F8: Score and Streak Tracking
- Current session score (correct/total)
- Daily streak (consecutive days of reaching daily goal)
- Total words learned (confidence > threshold)

### F9: Progress Stats
- Per-word stats (times seen, correct %, confidence level)
- Overall progress (words by confidence bucket: learning / familiar / mastered)
- Daily activity chart (last 7/30 days)
- Streak calendar view

### F10: Daily Goal
- Configurable words-per-day target (default: 20)
- Visual progress indicator during quiz
- Notification/reminder via PWA notification API (if user permits)

### F11: Settings
- Theme: light / dark / system
- Quiz mode preference
- Daily goal amount
- Typo tolerance level
- Data export (JSON)
- Data import (JSON)
- Reset progress (with confirmation)

### F12: PWA
- Installable on iOS/Android home screen
- Offline functionality (all data is local)
- App manifest with icon, splash screen
- Service worker for caching

### F13: Onboarding
- First-launch flow: pick or create a language pair
- Option to load starter pack
- Brief tutorial (how quiz works, swipe/tap)

---

## Features - Future (Out of MVP Scope)

Documented here so architecture doesn't block them:

- Backend sync (user accounts, cloud storage)
- Native iOS/Android app (React Native)
- Sentence/phrase mode (not just single words)
- Audio pronunciation (TTS API)
- Image associations for words
- Social features (shared word lists, leaderboards)
- More starter packs (other language pairs, levels)
- AI-powered example sentences
- Gamification (badges, levels, XP)

---

## Pages / Screens

1. **Onboarding** - first launch only
2. **Home / Dashboard** - daily progress, quick-start quiz, streak info
3. **Quiz** - the main learning screen
4. **Word List** - browse, search, add, edit, delete words
5. **Stats** - progress charts and history
6. **Settings** - preferences, import/export, about

---

## Design Direction

- Clean, modern, mobile-first
- MUI components with custom theme
- Dark mode as default (light available)
- Accent colour: amber/gold (warm, encouraging)
- Animations: subtle feedback on correct/incorrect, smooth transitions
- Accessible: proper contrast, keyboard navigation, screen reader support

---

## Repo Structure (Proposed)

```
lexio/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deploy
├── public/
│   ├── icons/                  # PWA icons
│   └── starter-packs/          # JSON word lists
│       └── en-lv-b1b2.json
├── src/
│   ├── components/             # Reusable UI components
│   ├── features/               # Feature modules
│   │   ├── quiz/
│   │   ├── words/
│   │   ├── stats/
│   │   ├── settings/
│   │   └── onboarding/
│   ├── services/               # StorageService, SpacedRepetition, etc.
│   ├── hooks/                  # Custom React hooks
│   ├── theme/                  # MUI theme config
│   ├── types/                  # TypeScript interfaces
│   ├── utils/                  # Helpers (uuid, levenshtein, date, etc.)
│   ├── App.tsx
│   └── main.tsx
├── docs/                       # Product spec, architecture docs
│   └── PRODUCT_SPEC.md
├── CLAUDE.md                   # Instructions for Claude CLI agents
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## CLAUDE.md Notes

The `CLAUDE.md` file in repo root will instruct Claude CLI agents on:

- Project context and architecture
- Coding conventions (TypeScript strict, MUI theming, storage abstraction)
- How to pick up issues (read issue, branch, implement, test, PR)
- Testing expectations
- PR format

---

## Resolved Decisions

1. **TypeScript** - Yes, strict mode enabled
2. **Testing** - Vitest + React Testing Library from the start
3. **CI/CD** - GitHub Actions, auto-deploy to Pages on merge to main
4. **Starter pack size** - ~200-300 words for EN-LV B1-B2
5. **Levenshtein tolerance** - user-configurable in settings (default: 1 char tolerance)
