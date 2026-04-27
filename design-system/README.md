# Lexio Design System

A handoff bundle that codifies the **iOS 26 "Liquid Glass"** visual language
shipped in [Lexio](https://mreppo.github.io/lexio/), a language-agnostic
vocabulary trainer PWA. Everything here documents what already ships in
`mreppo/lexio` - nothing has been redesigned.

> **For Claude Code:** The CSS variables in `colors_and_type.css` and the JSX
> components in `ui_kits/lexio-app/` are intentionally **plain** (no MUI
> dependency). They are reference recreations for prototypes and mockups.
> The production source of truth is `src/theme/liquidGlass.ts` and
> `src/theme/theme.ts` in the Lexio repo. **Read those first** before
> integrating tokens - the tokens here mirror them but the repo always wins.

---

## Sources

This design system was reverse-engineered from the live Lexio repository.

| Source | Path / link |
| --- | --- |
| Lexio repo | `github.com/mreppo/lexio` |
| Token canon | `src/theme/liquidGlass.ts` (TypeScript) + `docs/design/liquid-glass/tokens.json` (JSON) |
| MUI theme | `src/theme/theme.ts` |
| Animations | `src/theme/animations.ts` |
| Older design notes | `docs/design/DESIGN.md` *(superseded - describes the pre-Liquid-Glass amber/Sora/Nunito direction; do **not** use as a reference)* |
| Atoms | `src/components/atoms/` (Btn, Chip, FilterPill, Toggle, GlassIcon, IconGlyph, BigWord, LangPair, LargeTitle, Progress) |
| Composites | `src/components/composites/` (NavBar, TabBar, GlassRow, SectionHeader, IOSAlert) |
| Screens | `src/features/{landing,about,dashboard,quiz,words,stats,settings,onboarding}/` |
| PRs that established the system | #127 Dashboard · #186/#193 Settings drill-down · #185 Bottom nav pin · #187 Words sheets · #194 Token consolidation |
| Brand assets | `public/favicon.svg`, `public/og-image.{svg,png}`, `public/icons/*.png` |

---

## Index (manifest)

```
.
├── README.md                     ← you are here
├── SKILL.md                      ← agent skill entrypoint (Claude Code-compatible)
├── colors_and_type.css           ← all CSS variables + type roles
├── assets/                       ← brand marks copied from public/
│   ├── favicon.svg
│   ├── favicon.png
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-512-maskable.png
│   ├── og-image.svg
│   └── og-image.png
├── preview/                      ← Design System tab cards
│   ├── type-display.html · type-body.html
│   ├── type-roles-quiz.html · type-roles-stats.html
│   ├── colors-light.html · colors-dark.html
│   ├── colors-semantic.html · colors-gradients.html
│   ├── wallpaper.html
│   ├── radius-scale.html · spacing-scale.html · shadows.html
│   ├── comp-hero-chip.html · comp-buttons.html · comp-list-rows.html
│   ├── comp-inputs.html · comp-bottom-nav.html · comp-sheet.html
│   ├── comp-quiz-card.html · comp-stat-cards.html · comp-states.html
│   └── brand-app-icon.html · brand-voice.html · iconography.html
└── ui_kits/
    └── lexio_app/                ← interactive PWA recreation (mobile-first)
        ├── README.md
        ├── index.html            ← entrypoint (iOS frame + click-thru)
        ├── tokens.jsx            ← LX.color/font/radius/shadow constants
        ├── Primitives.jsx        ← GlassCard, GlassChip, Button, Pill, IconSquare, Icon
        ├── BottomNav.jsx
        ├── Dashboard.jsx
        ├── QuizScreen.jsx
        ├── StatsScreen.jsx
        ├── WordsScreen.jsx
        └── SettingsScreen.jsx
```

---

## Product context

**What is Lexio?** A language-agnostic vocabulary trainer PWA. You define a
language pair (any two languages), add words, and quiz yourself with two
modes: **type the answer** or **multiple choice**. A simplified SM-2 spaced
repetition algorithm schedules reviews. Daily goals + streaks + per-word
confidence stats keep users engaged. All data is local (`localStorage`),
no account required.

**Audience.** Originally a Latvian speaker learning English at B1–B2.
Now anyone learning any pair. Latvian diacritics (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž)
must always be supported.

**Tech.** React 18 + TypeScript (strict) + MUI 6 + Vite, GitHub Pages,
HashRouter (the `?demo=true` flag works inside the hash). PWA via
`vite-plugin-pwa`. Sentry + GoatCounter analytics. Fonts shipped via
`@fontsource/inter`.

**Surfaces.**
1. **Landing page** (`/`) - dark mode, marketing-first, "Built by AI" angle.
2. **About page** (`/about`) - dark mode, story + dev stats.
3. **App** (`/app`) - light mode by default (system-preference aware), 5 tabs:
   Home (Dashboard), Quiz, Words (Library), Stats, Settings.
4. **Onboarding** - first-launch wizard inside `/app` until a pair exists.

**Single-developer reality.** Mareks is the Product Owner; agents (Claude
Chat for product, Claude CLI sub-agents for implementation) write all code.
That's why `CLAUDE.md` is so detailed - it's the team's ops manual. When
codifying the system, **lean toward what the code actually does**, not what
older docs say it should do.

---

## Content fundamentals

### Voice

**Quiet, encouraging, no exclamation marks.** Lexio talks to a single
learner, in second person, in plain language. Never patronising, never
gamified-sounding (no "Crush your goal!", no XP shouting). Praise is small
and earned: a short headline + a faint helper line.

| Surface | Example | Notes |
| --- | --- | --- |
| Greeting | `Good morning, Mareks` | Time-of-day greeting + first name (`useDashboard.ts`) |
| Daily goal eyebrow | `TODAY'S PRACTICE` | Uppercase eyebrow, tracking 1px |
| Empty review | `All caught up` / `Nothing to review yet` | Calm, not celebratory |
| Quiz wrong | `Not quite - the answer is **māja**` | Em-dash, full word echoed back |
| Quiz right | `Correct · +1` | Middle dot separator, no exclamation |
| Streak helper | `5 days · best 12` | Middle dot, lowercase noun |
| Settings drill-down | `Daily goal`, `Typo tolerance`, `Theme` | Sentence case, single short label |
| Destructive confirm | `Reset progress` / `Delete pair` | Verb-first, no "Are you sure" |
| Install banner | `Add Lexio to your home screen` | No marketing fluff, no app-store gloss |

### Casing & punctuation

- **Sentence case** for buttons, labels, body. Never Title Case.
- **UPPERCASE** only for tracking-1px eyebrows (`STREAK`, `TODAY'S PRACTICE`).
- **Middle dot (`·`)** is the metadata separator. Em-dash (`-`) joins clauses.
- **No exclamation marks**, ever. No emoji in product copy.
- Numbers are bare: `5 days`, not `5 Days` or `5️⃣`.
- "you" not "I" - the app addresses the learner. The learner is never
  forced into "I" copy.

### Tone-out-of-the-box examples

- Onboarding step 1: `What language pair?` (question, not imperative)
- Quiz hint button: `Show hint` (verb + noun)
- Quiz skip: `Skip` (one word - never "I don't know")
- Words tab empty: `No words yet - add your first` (em-dash bridge)
- Sentry-caught crash fallback: `Something went wrong` + `The error has
  been reported. Please try refreshing the page.`

### Internationalisation posture

The product is language-agnostic at the **content level** but the **UI chrome**
is currently English-only. Code keeps strings in components for now (no full
i18n library) but does **not** hardcode the user's source/target language
into UI copy - it's always the pair the user defined.

---

## Visual foundations

### Mode philosophy

- **Dark by default on the marketing surfaces** (Landing + About). Same dark
  wallpaper as the app's dark mode - purple/blue/magenta radial gradients
  on a `#0A0A10` base. This sells the "premium iOS-26-glass" aesthetic
  before the user enters the app.
- **Light by default in-app**, user can switch to dark or follow the system
  in Settings. Light is the warmer, more editorial mode (peach/blue/pink
  radial gradients on `#F4F2EE` linen).

### Color

A two-variant token set lives in `liquidGlass.ts`. Both share semantic roles
(accent, ok, warn, red, violet, pink) and a parallel ink/inkSec/inkFaint
hierarchy. **Never hardcode colors** - go through the token. The full table
is in `colors_and_type.css`; the short version:

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#F4F2EE` | `#0A0A10` |
| Ink (primary text) | `#111114` | `#FFFFFF` |
| Ink secondary | `rgba(30,30,36,0.70)` | `rgba(255,255,255,0.55)` |
| Accent | `#007AFF` | `#0A84FF` |
| OK / Success | `#34C759` | `#30D158` |
| Warn | `#FF9500` | `#FF9F0A` |
| Red / Destructive | `#FF3B30` | `#FF453A` |
| Violet | `#AF52DE` | `#BF5AF2` |
| Pink | `#FF2D55` | `#FF375F` |

The streak gradient (`#FF9500 → #FF3B30`) is **mode-invariant** by design -
it's always vivid orange-red on the Stats hero. Pair gradients (es/fr/ja/de)
are also mode-invariant.

### Type

- **Display** (`-apple-system, "SF Pro Display", "Helvetica Neue", Inter, system-ui`)
- **Body** (`-apple-system, "SF Pro Text", Inter, system-ui`)
- **Mono** (`"SF Mono", ui-monospace`)

The product spec mentions Sora + Nunito but the **shipped code uses the SF Pro
system stack with Inter as the cross-platform fallback** (loaded via
`@fontsource/inter` in `src/main.tsx`). The DESIGN.md note is stale.
Sizes are absolute in the tokens but the MUI theme converts to rem so user
font-size scaling works.

> ⚠️ **Font substitution note.** SF Pro is Apple-only. On non-Apple OSes the
> stack falls back to Inter. The static HTML preview cards in this kit pull
> Inter from Google Fonts. If you're producing print/PDF artefacts where
> SF Pro is unavailable, Inter is the canonical substitute - same metrics,
> tested with Latvian diacritics. **No additional fonts have been added to
> this design system. If the user wants a non-Inter substitute, ask.**

### Spacing

Base unit `4px`. Scale: `4, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 36, 46, 56, 72`.
Screens always use `screenPadX = 16` horizontally. The fixed nav has
`navTop = 52` (status bar clearance) and `tabBottom = 30` (home indicator
clearance, plus `env(safe-area-inset-bottom)`).

### Backgrounds

- **Wallpapers** are 4 stacked radial gradients + a linear base, applied at
  the screen root behind every glass element. Never repeat patterns,
  textures, illustrations, or photos. Light wallpaper: peach (top-right),
  blue (left), pink (bottom-centre), warm linen base. Dark wallpaper:
  purple (top-right), navy-blue (left), magenta (bottom-centre), near-black
  base.
- **Hand-drawn illustrations: none.** No emoji, no stickers, no doodles.
- The og-image and landing hero use the `Lexio` wordmark + a small amber
  book icon - that's the only "illustration" in the product.

### Glass

The signature element. Every floating chrome surface (NavBar, TabBar,
buttons in `glass` kind, Chip, FilterPill inactive, GlassRow card,
Sheet header) is a glass layer:

```
background:        rgba(255,255,255,0.55)   /* light */
                   rgba(255,255,255,0.10)   /* dark */
backdrop-filter:   blur(24px) saturate(180%)
border:            0.5px solid rgba(255,255,255,0.7)   /* light */
                   0.5px solid rgba(255,255,255,0.22)  /* dark */
inner highlight:   inset 1.5 1.5 1 rgba(255,255,255,0.85),
                   inset -1 -1 1 rgba(255,255,255,0.5)
shadow:            0 1px 3 rgba(0,0,0,.05), 0 8px 30 rgba(0,0,0,.08)
```

**Strong** variant raises bg alpha to 0.72/0.18 (used by buttons + NavBar
center pill so text contrast stays AA over the wallpaper).

**No generic MUI `Card` / `variant="outlined"` is allowed in app code.**
Issue #194 deliberately removed those patterns. Always use the `<Glass>`
primitive (or its derivatives).

### Borders

- **Hairline dividers** inside glass cards: `0.5px` rule using `rule2`
  (`rgba(0,0,0,0.08)` light, `rgba(255,255,255,0.10)` dark). Inset 64px
  from the left when an icon precedes the row, otherwise 16px.
- **Glass border**: `0.5px` of `glass.border` (high-alpha white).
- **Outlined inputs**: `1px` `rule2` resting, `1.5px` accent on focus,
  plus a `3px` accent-soft glow ring.
- **No 1px solid section borders** anywhere. Sectioning is done with
  spacing or background tonal shift.

### Shadows

| Token | Value | Used by |
| --- | --- | --- |
| `glassFloat` | `0 1px 3 rgba(0,0,0,.05), 0 8px 30 rgba(0,0,0,.08)` | Light glass surfaces |
| `glassFloatDark` | `0 1px 3 rgba(0,0,0,.4), 0 12px 36 rgba(0,0,0,.5)` | Dark glass surfaces |
| `accentBtn` | `0 6px 20 rgba(0,122,255,.32)` | Filled (accent) buttons |
| `whiteBtn` | `0 6px 20 rgba(0,0,0,.2)` | White buttons (on color) |
| `iconSquare` | `inset 0 1 0 rgba(255,255,255,.35), 0 2px 6 rgba(0,0,0,.1)` | 34×34 colored icon tiles in GlassRow |
| `activeTab` | `0 4px 14 rgba(0,122,255,.35)` | Active TabBar slot |
| `pillActive` | `0 4px 14 rgba(0,0,0,.18)` | Active FilterPill |
| `aiCircle` | `0 4px 12 rgba(175,82,222,.4)` | Add-Word AI upsell glyph |

No protection gradients; we let the glass blur do the contrast work.

### Corner radii

`card 22 · btn 18 · glass 28 · inline 14 · iconSquare 10 · pill 999`.
Buttons use **`height/2`** (true pill, supersedes `btn 18` for sized buttons).
Tab slots use `26` (half of 52). Toggle rail: `99`. NavBar center pill:
`22`. Cards: `22`. Sheets: `28` (on top corners only).

### Animation

Three motion tokens: `toggle 200ms ease`, `progress 300ms ease`,
`caretBlink 1s steps(2) infinite`. House rules:

1. **Never animate `backdrop-filter`, `background`, or `box-shadow` on a
   blurred surface.** It causes GPU stutter on iOS/Android. Animate
   `opacity` and `transform` only.
2. **Press states** scale to `0.94`–`0.97` for ~80ms then release - never a
   color shift on a glass surface.
3. **Hover** on desktop: `translateY(-1px)` (buttons) or `-2px` (cards).
   Mobile is the primary platform; hover is a secondary nicety.
4. **Toggle thumb** slides via `transform: translateX(20px)` (GPU path),
   never `left`.
5. **`prefers-reduced-motion`** disables transitions and press transforms
   everywhere. **`prefers-reduced-transparency`** disables backdrop-filter
   and substitutes a solid background.
6. **Drill-down transitions** (Settings → Daily goal): right-to-left slide
   of the new view with a 200ms ease - no fade, no scale.
7. **Sheet animations**: bottom sheets slide up `translateY(100%) → 0`
   over 250ms ease-out; backdrop fades in over 200ms.

### Hover, press, focus

- **Hover (buttons)**: tiny `translateY(-1px)` lift only. No color change.
- **Press**: `scale(0.94–0.97)` for buttons/pills/tabs, ~80ms.
- **Focus-visible**: a hard-wired `2px solid accent` outline with `2px`
  offset, applied globally to every interactive element. **Do not override
  it with `outline:none` anywhere** - it's a WCAG 2.4.7/2.4.11 hard
  requirement.
- **Disabled**: `opacity: 0.5`, `cursor: not-allowed`. No grey wash.

### Transparency / blur

- Only on chrome and floating surfaces. Body content (the page wallpaper +
  fixed text) is always opaque.
- `backdrop-filter: blur(24px) saturate(180%)` is the canonical blur. Chip
  uses a smaller `blur(10px) saturate(150%)` because it's an inline span.
- Always pair `backdrop-filter` with `-webkit-backdrop-filter` for iOS
  Safari.

### Imagery

- Color vibe: **warm peach + cool blue + pink magenta on linen** (light)
  or **deep purple/navy/magenta on near-black** (dark). Vivid, never grey,
  never cool-only.
- No photography in the product. The og-image is the only marketing image
  (`assets/og-image.png`), and it's a flat composition of the wordmark + a
  single book icon on the dark wallpaper.

### Layout rules

- **Mobile-first.** Design widths assume 390px (iPhone 14 Pro). Desktop is
  a centred 390–430px column on the wallpaper.
- **Nothing snaps to the screen edge.** All content padded `16px` left/right.
- **Fixed elements**: the TabBar (`position: fixed; bottom: 30px`) and any
  `<NavBar>` inside a screen (top of scroll container). Each screen
  reserves a `~140px` bottom spacer so the last row isn't hidden behind
  the TabBar.
- **No cards-inside-cards.** If you need sub-grouping, use a `SectionHeader`
  + a fresh glass card, separated by `20px` spacing. Never two glass
  layers stacked.
- **Asymmetric padding** is fine and encouraged for editorial breathing -
  e.g. `padding: 14px 22px 8px` on a LargeTitle block.

---

## Iconography

### What ships

- **Primary icon library: `lucide-react`** (already a dep in `package.json`).
  Used everywhere in app code: TabBar (`Zap`, `Layers`, `BookOpen`,
  `Trophy`, `Settings`), GlassRow (`ChevronRight`), Quiz (`HelpCircle`,
  `SkipForward`), Settings drill-downs (`Sun`, `Moon`, `Type`, `Shield`).
- **Secondary: `@mui/icons-material`** (Material Icons) - used in a handful
  of places where MUI components hard-bind to it (e.g. `IconGlyph`'s
  `iconMap.ts` exposes both Lucide and Material variants).
- **Brand glyphs**: only the `Lexio` wordmark + a small amber book icon
  (visible in `assets/favicon.svg` and `assets/og-image.png`). These are
  custom, single-purpose SVGs; do not extend.

### Stroke + style

- Lucide stroke weight: **`2`** for resting, **`2.4`** for active emphasis
  (active TabBar slot, GlassRow icon).
- Default Lucide size: **`24px`** (TabBar, NavBar buttons), **`18px`**
  (GlassRow icon square), **`16px`** (chevrons, inline status).
- Stroke caps + joins: **always `round`** (`strokeLinecap="round"`,
  `strokeLinejoin="round"`).
- Color: `inkSoft` (`rgba(…,0.75/0.82)`) for inactive, `#ffffff` for icons
  on a colored fill (TabBar active, GlassRow icon square, AI upsell).

### Icon squares (GlassRow)

`34×34` rounded `10`, filled with a semantic color (`accent`, `accentSoft`,
`ok`, `warn`, `red`, `violet`), **white icon inside**, with the
`iconSquare` inset+drop shadow. This is the canonical "row icon" pattern.

### Emoji + unicode

- **No emoji in any UI surface.** Onboarding, empty states, success states
  - all text. The closest thing to emoji is the `·` (middle dot) separator
  in metadata strings.
- A single unicode glyph (`✓` or `⌥`) is acceptable inside an icon square
  for a transient state if Lucide doesn't have a fitting symbol - but
  prefer Lucide.

### Substitution policy

If you can't use Lucide (e.g. a non-React static HTML preview), use the
**Lucide CDN** (`https://unpkg.com/lucide-static@latest/icons/<name>.svg`)
or inline the SVG. The static preview cards in this kit do exactly that.
**Don't hand-draw new icons.** If a product surface needs an icon Lucide
doesn't have, ship a Material Icon from `@mui/icons-material` and flag it.

---

## CAVEATS - please review

These are decisions made under uncertainty; please correct or confirm.

1. **Font substitution.** No SF Pro license is included (Apple-only).
   The static HTML cards use **Inter** (Google Fonts) as the canonical
   cross-platform substitute. The production app does the same via
   `@fontsource/inter`. If you need a different fallback (e.g. `Sora` for
   any pre-Liquid-Glass surfaces), let me know.
2. **`docs/design/DESIGN.md` is stale.** It describes an earlier
   amber/Sora/Nunito direction that was superseded by Liquid Glass
   (issues #127 + #194). I treated `liquidGlass.ts` + `tokens.json` as the
   source of truth and ignored DESIGN.md. Please confirm.
3. **No screenshots embedded.** I avoided pulling the
   `docs/design/liquid-glass/screenshots/*.png` mockups - those are pre-ship
   prototype renders, not the actual UI. The UI kit is built directly from
   the component code. Tell me if you'd rather I include them as
   reference cards.
4. **UI kit components are deliberately framework-light.** They are plain
   JSX recreations (no MUI dep) so prototypes load fast in the browser.
   They mirror the visual contract of the production components but do not
   share their event/A11y plumbing - for that, link to the real `src/`.
5. **No iconography for `lucide-react@1.8.0`** - that's the version pinned
   in `package.json`. The CDN I used is `lucide-static@latest`. If a
   specific icon name has shifted between versions, swap the CDN URL.
6. **No print/PPTX template.** Lexio doesn't have a slide deck. If you
   ever want one, point me at a sample and I'll build it from the same
   tokens.

## **Ask: please iterate with me.**

I'd love your eye on:

- **Anything missing** from the visual foundations / iconography / content
  rules? Things CLI agents have gotten wrong before that I should
  pre-empt? *(You called out empty/loading/error states - I covered them
  in the UI kit but tell me if I missed nuance.)*
- **The Liquid-Glass prototype `.jsx` files** at
  `docs/design/liquid-glass/prototype/` - I didn't read them in full. If
  they have nuances the production code doesn't, I should pull them in.
- **The PR list (#127/#185/#186/#187/#193/#194).** I extracted the
  visual rules from the resulting code but didn't read the PR diffs
  themselves. If a PR description carries intent that isn't in the code,
  paste it and I'll fold it into the README.
- **A real Lexio screenshot review.** I'd love to compare the UI kit's
  rendered Dashboard / Quiz / Stats screens against the live app
  side-by-side and tighten anything that's off.
