# Handoff: Lexio — iOS 26 Liquid Glass Redesign

## Overview
Lexio is a vocabulary-learning app built around spaced-repetition flashcards. This handoff covers a full visual + interaction redesign of the mobile app around Apple's iOS 26 "Liquid Glass" material system: translucent glass chrome floating over a vivid wallpaper gradient, bubble-shaped nav/tab bars, and content-first layouts that let the target word be the visual anchor.

Eight screens are specified: Onboarding, Home (Today), Quiz (Typing), Quiz (Multiple choice), Library, Add Word, Progress (Stats), and Settings.

## About the Design Files
The files in this bundle are **design references created in HTML/React** — prototypes showing intended look and behavior, **not production code to copy directly**. The React/JSX in `prototype/` runs inside a browser iframe via Babel-standalone with all styling via inline `style={{...}}` objects; it is intentionally informal.

Your job is to **recreate these designs in the target codebase's existing environment** — likely native iOS (SwiftUI/UIKit) since the design language is iOS 26 — using its established patterns, component library, and conventions. If no target codebase exists yet, SwiftUI is the natural fit for the aesthetic (native `.glassEffect()` and `Material` types), but a React Native or web implementation is also viable if component primitives are built to match the spec below.

Treat the inline React as pseudo-spec: extract tokens, component anatomy, and layout rules from it — do not port it line-for-line.

## Fidelity
**High-fidelity.** Every screen has final colors (exact hex/oklch values), typography (family, size, weight, letter-spacing), spacing, border radius, shadows, and states. Recreate the UI pixel-perfectly using the target codebase's libraries and patterns. The only things intentionally left open-ended are:
- Real icon set (the prototype uses 1.5–2.4px stroke line icons drawn with SVG `<path d>`; ship SF Symbols on iOS or Lucide/Phosphor elsewhere).
- Real data (all numbers, word lists, and user names in the prototype are placeholder).
- Real animation curves for material transitions — spec gives durations, the motion designer / dev chooses springs.

## Screen gallery

All screens at 400×852 (iPhone 15/16 class). PNG files live in `screenshots/`.

| # | Screen | File |
|---|---|---|
| 1 | Onboarding | `screenshots/01-onboarding.png` |
| 2 | Home (Today) | `screenshots/02-home.png` |
| 3 | Quiz — Typing | `screenshots/03-quiz-typing.png` |
| 4 | Quiz — Multiple Choice | `screenshots/04-quiz-multiple-choice.png` |
| 5 | Library | `screenshots/05-library.png` |
| 6 | Add Word | `screenshots/06-add-word.png` |
| 7 | Progress (Stats) | `screenshots/07-progress.png` |
| 8 | Settings | `screenshots/08-settings.png` |
| 9 | Home — Dark variant | `screenshots/09-home-dark.png` |
| 10 | Quiz MC — Dark variant | `screenshots/10-quiz-mc-dark.png` |

Detailed per-screen specs follow below.

## Design Principles (keep these top-of-mind)
1. **Glass is the primary surface.** Cards, buttons, chips, search fields, nav, tab bar — all use the same translucent backdrop-blur-with-saturate material. Consistent application is what makes the aesthetic work.
2. **Chrome floats as separated bubbles.** Nav bars and tab bars are NOT pinned to the device bezel. They are discrete pill-shaped glass objects with margin on all sides.
3. **Wallpaper beneath everything.** Each screen root renders a multi-stop radial-gradient wallpaper. The glass needs something vivid to refract; solid-color backgrounds break the material.
4. **The word is the hero.** Target words render at 56–72px, bold, tight tracking. Chrome recedes; typography leads.
5. **Color is used sparingly but decisively.** Accent blue for CTAs and active state. Tinted colored squares for list-row icons (rhythm, not decoration). Gradient tiles ONLY for milestone moments (streak, AI upsell).

---

## Design Tokens

Two direction variants ship: **Liquid Light** (default) and **Liquid Dark**. Everything except the palette is identical.

### Colors — Liquid Light

| Token | Value | Usage |
|---|---|---|
| `wallpaper` | `radial-gradient(1200px 600px at 85% -10%, #FFD6A5 0%, transparent 50%), radial-gradient(900px 500px at -10% 30%, #A5C8FF 0%, transparent 55%), radial-gradient(800px 500px at 50% 110%, #FFB3D4 0%, transparent 55%), linear-gradient(180deg,#F9F7F2 0%,#EEEDF6 100%)` | Applied to every screen root |
| `bg` | `#F4F2EE` | Fallback if wallpaper can't render |
| `ink` | `#111114` | Primary text |
| `inkSoft` | `rgba(30,30,36,0.75)` | Secondary text, body copy |
| `inkSec` | `rgba(30,30,36,0.55)` | Tertiary text, captions, labels |
| `inkFaint` | `rgba(30,30,36,0.28)` | Chevrons, dividers on text |
| `rule2` | `rgba(0,0,0,0.08)` | Hairline dividers |
| `glassBg` | `rgba(255,255,255,0.55)` | Glass fill, default |
| `glassBgStrong` | `rgba(255,255,255,0.72)` | Glass fill, prominent cards |
| `glassBorder` | `rgba(255,255,255,0.7)` | Glass rim (0.5px hairline) |
| `glassInner` | `inset 1.5px 1.5px 1px rgba(255,255,255,0.85), inset -1px -1px 1px rgba(255,255,255,0.5)` | Inner highlight simulating a lit edge |
| `glassShadow` | `0 1px 3px rgba(0,0,0,0.05), 0 8px 30px rgba(0,0,0,0.08)` | Outer float shadow |
| `accent` | `#007AFF` | Primary CTA, active states |
| `accentSoft` | `rgba(0,122,255,0.14)` | Accent-tinted chips/backgrounds |
| `accentText` | `#0060D6` | Accent text on light |
| `ok` | `#34C759` | Success / mastered |
| `warn` | `#FF9500` | Warning / learning |
| `red` | `#FF3B30` | Error / struggling / destructive |
| `violet` | `#AF52DE` | Decorative gradients |
| `pink` | `#FF2D55` | Decorative gradients |

### Colors — Liquid Dark

| Token | Value |
|---|---|
| `wallpaper` | `radial-gradient(900px 500px at 100% -10%, #3A1E6B 0%, transparent 55%), radial-gradient(900px 500px at -10% 50%, #0F3B6C 0%, transparent 55%), radial-gradient(700px 400px at 50% 110%, #6B1E4A 0%, transparent 55%), linear-gradient(180deg,#0A0A10 0%,#14121D 100%)` |
| `bg` | `#0A0A10` |
| `ink` | `#FFFFFF` |
| `inkSoft` | `rgba(255,255,255,0.82)` |
| `inkSec` | `rgba(255,255,255,0.55)` |
| `inkFaint` | `rgba(255,255,255,0.28)` |
| `rule2` | `rgba(255,255,255,0.1)` |
| `glassBg` | `rgba(255,255,255,0.10)` |
| `glassBgStrong` | `rgba(255,255,255,0.18)` |
| `glassBorder` | `rgba(255,255,255,0.22)` |
| `glassInner` | `inset 1.5px 1.5px 1px rgba(255,255,255,0.14), inset -1px -1px 1px rgba(255,255,255,0.06)` |
| `glassShadow` | `0 1px 3px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.5)` |
| `accent` | `#0A84FF` |
| `accentSoft` | `rgba(10,132,255,0.22)` |
| `accentText` | `#6FB4FF` |
| `ok` | `#30D158` |
| `warn` | `#FF9F0A` |
| `red` | `#FF453A` |
| `violet` | `#BF5AF2` |
| `pink` | `#FF375F` |

### Typography

All fonts are system SF. Fallback stack: `-apple-system, "SF Pro Display"/"SF Pro Text", system-ui, sans-serif`.

| Role | Family | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Display hero (quiz word) | SF Pro Display | 56–72px | 800 | -1.2 | 1.02 |
| Large title (nav) | SF Pro Display | 36px | 800 | -1 | 1.05 |
| Onboarding headline | SF Pro Display | 42px | 800 | -1 | 1.05 |
| Title | SF Pro Display | 26–30px | 700–800 | -0.5 to -0.7 | 1.1 |
| Body (row title) | SF Pro Text | 17px | 500–600 | -0.3 | 1.3 |
| Button | SF Pro Text | 17px | 600–700 | -0.2 | 1 |
| Body copy | SF Pro Text | 15–16px | 500 | -0.2 | 1.45–1.5 |
| Caption / detail | SF Pro Text | 13px | 500–600 | -0.1 | 1.3 |
| Micro / chip | SF Pro Text | 12px | 700 | -0.1 | 1 |
| Uppercase label | SF Pro Text | 12–13px | 600–700 | +0.6 to +1.2 | 1 |
| Mono | SF Mono | 11px+ | 700 | 0 | 1 |

### Spacing

Unit grid: **4px**. Common values:
- `4, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 36, 46, 56, 72`
- Screen horizontal padding: **16px** (content areas); **20–24px** (hero/onboarding headline areas).
- Vertical gap between stacked cards: **10px**.
- Nav bar top offset from screen top: **52px** (leaves room for status bar + breathing).
- Tab bar sits **30px** from bottom edge.

### Radii

| Token | Value | Usage |
|---|---|---|
| `radiusCard` | 22px | Default glass card |
| `radiusBtn` | 18px | Buttons (but pill buttons use height/2) |
| `radiusGlass` | 28px | Large glass containers |
| — | 14px | Inline tinted text blocks inside a card |
| — | 10px | Icon-tinted-square on list rows |
| — | 9–14px | Small inset surfaces |
| — | 999 | Pills, chips, toggles, glass icon buttons, tab capsules |

### Shadows

- **Glass float** (outer): `0 1px 3px rgba(0,0,0,0.05), 0 8px 30px rgba(0,0,0,0.08)` light / `0 1px 3px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.5)` dark.
- **Inner highlight** (on every glass surface): `inset 1.5px 1.5px 1px rgba(255,255,255,0.85), inset -1px -1px 1px rgba(255,255,255,0.5)` light / dimmed version in dark.
- **Accent button**: `0 6px 20px rgba(0,122,255,0.32)`.
- **White button**: `0 6px 20px rgba(0,0,0,0.2)`.
- **Tinted-icon square (list rows)**: `inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.1)`.
- **Active tab capsule**: `0 4px 14px rgba(0,122,255,0.35)`.

### Motion

- Toggle thumb, progress fill: **200ms ease**.
- Blinking caret (typing quiz, add-word): `steps(2) 1s infinite`, 50% opacity.
- Glass material transitions should use a soft spring / ease-out; no specific curves — use the platform default (`UIView.Spring` / `Animation.smooth` on iOS).

---

## The Glass Component (core primitive)

Every glass surface in the app is built from the same anatomy. Implement this once, reuse everywhere.

### Anatomy (3 stacked layers)
1. **Fill layer** — absolutely filling the rounded bounds:
   - `background: glassBg` (or `glassBgStrong` for prominent cards).
   - `backdrop-filter: blur(24px) saturate(180%);` (and `-webkit-` prefix on web). On iOS native, use `.ultraThinMaterial` or `.glassEffect()` (iOS 26).
2. **Rim / inner-highlight layer** — absolutely filling, pointer-events none:
   - `border: 0.5px solid glassBorder`.
   - `box-shadow: glassInner` (the inset double-highlight).
3. **Content layer** — relative, with padding (default 16px).

Plus, when `floating={true}`:
- Outer `box-shadow: glassShadow`.

All three layers share the same `border-radius` via `border-radius: inherit` so the rim clips correctly.

### Variants
- `strong` — use `glassBgStrong` instead of `glassBg`.
- `floating` — adds the outer drop shadow.
- `radius` — override default 22px radius (common: 16, 22, 28, 34, 999).
- `pad` — override 16px content padding (common: 0, 12, 14, 16, 18, 22).

---

## Component Library

All components live on `window.*` in the prototype. Translate each to a first-class component in your target framework.

### Btn
Pill button with three `kind`s and three `size`s.

| Size | Height | Font | Horizontal padding |
|---|---|---|---|
| sm | 36 | 15/600 | 14 |
| md | 50 | 17/600 | 20 |
| lg | 56 | 17/600 | 24 |

- `kind="filled"` — `background: accent`, white text, `border-radius: height/2`, shadow `0 6px 20px rgba(0,122,255,0.32)`.
- `kind="white"` — white fill, accent text (weight 700), same shadow.
- `kind="glass"` — a `Glass strong floating` pill with transparent `<button>` child (ink-colored text).
- `full` — `width: 100%`.

### Chip
Inline pill. Two tones:
- `neutral`: fill `glassBg`, text `ink`.
- `accent`: fill `accentSoft`, text `accentText`.

Always `height: 26`, padding `0 12`, radius `999`, font `12/700` `letter-spacing: -0.1`, with a 0.5px `glassBorder`.

### LargeTitle
Used by iOS-style large-title nav. 36/800, letter-spacing `-1`, line-height `1.05`, color `ink`.

### NavBar
Floating-bubble nav bar. Props: `title`, `leading`, `trailing`, `large`, `prominentTitle`.

**Compact mode** (`large` is false):
- `padding-top: 52`.
- Row: `[leading GlassIcon] [glass pill with title, height 44, padding 0 18, font 16/700] [trailing GlassIcon[s]]`.
- Horizontal padding 16, row gap 10.

**Large mode** (`large` is true):
- `padding-top: 52`, then leading/trailing row with NO center title pill.
- Followed by `LargeTitle` at `padding: 14px 22px 8px`.

### GlassIcon
44×44 floating glass square (radius 22) containing centered icon. Used for nav icon buttons and the "streak" chip-in-nav.

### TabBar
Single floating pill, absolutely positioned `bottom: 30` and horizontally centered, `z-index: 20`.
- Inside: `Glass strong floating` with `radius: 34`, `padding: 8`, horizontal flex with gap 4.
- Four tab slots: each 52×52, `border-radius: 26`.
  - Active: `background: accent`, shadow `0 4px 14px rgba(0,122,255,0.35)`, icon white, stroke 2.4.
  - Inactive: transparent, icon `inkSoft`, stroke 2.
- Tabs (in order): home (flash icon), library (book), stats (trophy), settings (gear).

### LangPair
Inline meta showing `from → to` language codes. Small arrow SVG between two 2-letter codes, all in `inkSec` 13/600.

### Progress
Horizontal progress bar. `height: 8` default; 6 on in-nav variant.
- Track: `rule2` (or custom `track` prop).
- Fill: `ink` / `accent` / `ok` (pick via `tone`), radius 99, width animated.

### BigWord
Display-font numeric/word. Defaults: 44px / 800 / letter-spacing `-1.2` (for size ≥40) or `-0.5` (smaller). Used for quiz words, big stat numbers.

### Toggle
51×31 pill, radius 99. On: `background: ok`. Off: `rgba(120,120,128,0.32)`. 27×27 white thumb with `0 3px 8px rgba(0,0,0,0.15)` shadow, 2px inset from rail edges, `left: 2` off / `left: 22` on, 200ms transition.

### GlassRow
List row inside a glass card.
- Height: `min-height: 56`, padding `12 16`, gap 14.
- Optional `icon` + `iconBg`: 34×34 rounded-square (radius 10), icon white at size 18, stroke 2.3, with tinted-icon shadow.
- Title 17/500 `letter-spacing: -0.3`, detail 13/inkSec.
- Optional `accessory` rendered before chevron.
- `chevron` default true — 8×13 chevron-right in `inkFaint` at stroke 2.
- Hairline divider at the bottom (`left: 64 if icon else 16, right: 16, height: 0.5, background: rule2`) unless `isLast`.

### SectionHeader
iOS-style uppercase section header. `padding: 20 30 8` default, font 13/600, color `inkSec`, `text-transform: uppercase`, `letter-spacing: 0.6`.

### PaperSurface
The screen root. Full-size, `background: wallpaper` with `background-size: cover`, `color: ink`, `font-family: body`, relative, overflow hidden.

### IconGlyph
Line icon from a small library of `d` path strings. 24-unit viewBox, stroke color defaults to `ink`, stroke width 2, round linecap/linejoin. On native iOS, map each to an SF Symbol equivalent:

| Name | SF Symbol |
|---|---|
| chevronRight | `chevron.right` |
| chevronLeft | `chevron.left` |
| close / x | `xmark` |
| plus | `plus` |
| flame | `flame.fill` |
| check | `checkmark` |
| speaker | `speaker.wave.2.fill` |
| search | `magnifyingglass` |
| book | `book.fill` |
| card | `rectangle.fill.on.rectangle.fill` |
| sparkle | `sparkles` |
| clock | `clock` |
| flash | `bolt.fill` |
| settings | `gearshape.fill` |
| trophy | `trophy.fill` |
| bell | `bell.fill` |
| share | `square.and.arrow.up` |

---

## Screens

All screens render inside a 402×874 iPhone frame (iPhone 15/16 class). Safe-area assumptions baked in: nav content starts at y=52; tab bar at y=height−30−tabHeight.

### 1. Onboarding
**Purpose:** First-run language selection.

**Layout (top to bottom):**
- `padding: 72 24 0`
  - Uppercase label "WELCOME TO LEXIO" in `inkSec` 13/700 letter-spacing 1, margin-bottom 14.
  - Headline "Learn any\nlanguage, a\nword at a time." as `BigWord size=42`.
  - Subhead "Spaced-repetition flashcards that adapt to how well you know each word." in 16/500 `inkSoft`, max-width 320, margin-top 14.
- `padding: 28 16 0` — list of 4 language cards, each `Glass pad=12 floating` with 10px margin-bottom. Selected card has `strong` + 2px `accent` border.
  - Each card row: 46×46 gradient square (radius 14) with 2-letter code in white 13/800, then label "Spanish → English" (17/700) + sub "1,240 words · Starter pack" (13/inkSec), then a 24×24 radio circle (filled accent with white check when selected, else 1.5px `rule2` ring).
  - Pair gradients: ES `linear-gradient(135deg,#FF9500,#FF3B30)`; FR `#5856D6→#0A84FF`; JP `#FF2D55→#AF52DE`; DE `#30D158→#0A84FF`.
- Absolute bottom: `Btn kind=filled full size=lg` "Continue" at `bottom: 46, left/right: 16`.

### 2. Home (Today)
**Purpose:** Landing view — daily review count, word of the day, streak.

- `NavBar large prominentTitle="Today"`.
  - Leading: 36×36 circular gradient avatar `#007AFF→#AF52DE` with white "M" 15/700.
  - Trailing: `GlassIcon` showing flame glyph + streak number "7" in `warn` color.
- **Hero card** — `Glass pad=22 floating strong` at padding 8 16 0:
  - Chip "DUE TODAY" (accent tone).
  - Row baseline: `BigWord size=72` "14" + "words" 17/600 `inkSoft`.
  - Subtext "≈ 6 min · Spanish → English" 14/500 `inkSec`.
  - `Progress value=0.3 tone=accent height=8`, margin-top 18.
  - Row below progress: "4 of 14 done" · "Goal · 20" in 12/600 `inkSec`.
  - `Btn kind=filled full size=md` "Start review", margin-top 16.
- **Quick stats** — row of 3 `Glass pad=14 floating` cards, each `flex: 1`, 10px gap, padding 14 16 0:
  - `BigWord size=24 weight=700` number, then 12/600 `inkSec` label.
  - Cards: "240 · Library", "164 · Mastered", "84% · Accuracy".
- `SectionHeader` "Word of the day".
- **Word of the day** — `Glass pad=18 floating`:
  - Top row: `LangPair ES→EN` + `GlassIcon` with accent speaker icon.
  - `BigWord size=38 weight=800` "efímero", margin-top 12.
  - Subtext "adj. — ephemeral, short-lived" 15/500 `inkSoft`.
  - Italic example block in inline tinted card: `background: glassBg`, 0.5px border, radius 14, padding 12 14.
- 140px bottom spacer, then `TabBar active=home`.

### 3. Quiz — Typing
**Purpose:** Translate by typing.

- Top bar: `padding: 56 16 10`, flex row, gap 10:
  - `GlassIcon` with close icon (inkSoft).
  - `Glass radius=22 floating flex=1` with inner `Progress value=5/14 height=6`, padded 15 18.
  - `Glass radius=22 floating` with "5/14" pill, height 44, padding 0 14, 14/700.
- Prompt area `padding: 40 24 0`:
  - Row: `LangPair ES→EN` + `Chip accent` "adjective".
  - `BigWord size=64 weight=800` "efímero".
  - "Translate to English" 15/500 `inkSec`, margin-top 10.
- Input area `padding: 36 16 0`:
  - `Glass pad=18 floating strong` containing typed-so-far text in display 26/700 `letter-spacing: -0.5`, followed by a blinking 2×24 accent caret.
  - Below: flex row "Hint: starts with **e**, 9 letters" on left (13/inkSec, bold word in `ink`), "Skip" on right (13/700 accent).
- Absolute bottom at `bottom: 46, left/right: 16`, flex row gap 10:
  - `Btn kind=glass size=lg flex=1` "Show answer".
  - `Btn kind=filled size=lg flex=1.3` "Check".

### 4. Quiz — Multiple Choice
**Purpose:** Pick the meaning.

- Same top bar as Typing (but `Progress value=7/14`, label "7/14").
- Prompt area `padding: 36 24 0` centered:
  - `LangPair PT→EN` centered.
  - `BigWord size=66 weight=800` "saudade" margin-top 14.
  - "Choose the meaning" 14/500 `inkSec` margin-top 12.
- Options `padding: 34 16 0`, flex column gap 10. Each option is a `Glass pad=0 floating`:
  - Idle: 30×30 tinted square (radius 9) with letter A/B/C/D in 13/800 `inkSoft` on `glassBg` with 0.5px rim; label 17/600 `ink`.
  - Correct: whole card gains 2px `ok` border + `strong` fill; square becomes `ok`-filled with white check.
  - Wrong: whole card gains 2px `red` border + `strong` fill; square becomes `red`-filled with white X.
  - Padding inside each: `14 16`, gap 14.
- Bottom (absolute): feedback card + next button:
  - `Glass pad=14 floating strong` with border `1px solid ok@40`, margin-bottom 10:
    - Row: 22×22 `ok` circle with white check, then "Correct · +8 XP" 15/700 `ok`.
    - Then explanation 13/500 `inkSoft` margin-top 6, line-height 1.4.
  - `Btn kind=filled full size=lg` "Next word".

### 5. Library
**Purpose:** Browse and filter saved words.

- `NavBar large prominentTitle="Library"`. Trailing: two `GlassIcon`s — search (`ink`) and plus (accent, stroke 2.4).
- **Search field** — `Glass pad=0 floating radius=16`, content height 40, padding 0 14, gap 8: search icon (16, `inkSec`, stroke 2.2) + placeholder "Search 240 words" 15/500 `inkSec`.
- **Filter pills** — horizontal scroll row, padding 6 16 8, gap 8:
  - Active pill: solid `ink` fill, white (or `#000` in dark) text, padding 8 14, radius 999, 14/700, shadow `0 4px 14px rgba(0,0,0,0.18)`.
  - Inactive pills: `Glass pad=0 floating radius=999`, inner padding 8 14, 14/600 `ink`.
  - Example: `All · 240` (active), `Due · 14`, `Learning · 62`, `Mastered · 164`.
- **Grouped word list**, padded `0 0 140`:
  - Each group: `SectionHeader` with the capital letter (E, K, S).
  - Then padded 0 16: `Glass pad=0 floating` containing `GlassRow`s.
  - Each row: colored-square icon (card glyph), title word, detail meaning, accessory is a score chip (`glassBg`, 0.5px rim, `inkSoft` 12/700, padding 0 10, height 22, radius 999). State colors: mastered→`ok`, learning→`warn`, new→`accent`.
- `TabBar active=library`.

### 6. Add Word
**Purpose:** Create a new flashcard, with optional AI autofill.

- Custom modal nav at `padding: 56 20 12`: `"Cancel"` (17/500 accent) · `"New Word"` (17/700 ink) · `"Save"` (17/700 accent). Three-column flex-between.
- Fields `padding: 10 16 0`:
  - **Term field** `Glass pad=16 floating`, margin-bottom 10:
    - Uppercase label "TERM · ES" 12/700 `inkSec`.
    - Value "madrugar" in display 30/800 `letter-spacing: -0.7`, followed by blinking caret.
  - **Meaning field** `Glass pad=16 floating`, same anatomy, label "MEANING · EN", value "to wake up early" 20/500.
- `SectionHeader` "Part of speech", then flex-wrap chip row gap 8:
  - Selected chip: accent fill, white text, padding 8 16, radius 999, 14/700, shadow `0 4px 12px rgba(0,122,255,0.3)`.
  - Others: `Glass pad=0 floating radius=999`, inner padding 8 16, 14/600 `ink`.
  - Options: noun, verb, adj, adv, phrase.
- `SectionHeader` "Example", then `Glass pad=16 floating` with italic example in 16/500 `inkSoft`.
- **AI upsell card** — `Glass pad=14 floating strong`:
  - Row gap 12: 38×38 gradient circle (`linear-gradient(135deg,#AF52DE,#007AFF)`) with white sparkle icon, shadow `0 4px 12px rgba(175,82,222,0.4)`.
  - Middle: "Autofill with AI" 15/700 and "Meaning, example, pronunciation" 12/500 `inkSec`.
  - Right: 32-tall pill button, accent fill, white "Fill" text 14/700.

### 7. Progress (Stats)
**Purpose:** Overview of streak, accuracy, weekly activity, knowledge distribution.

- `NavBar large prominentTitle="Progress"`, trailing share `GlassIcon`.
- **Streak hero** — NOT a glass card; a gradient tile `linear-gradient(135deg,#FF9500,#FF3B30)`, radius = `radiusCard`, padding 22:
  - Row: 20-size flame icon (white) + "STREAK" 13/800 white letter-spacing 1.
  - Row baseline: `BigWord size=68 color=#fff` "7", then "days · best 19" 18/600 white @ 0.92 opacity.
- **Two stat cards**, flex row gap 10:
  - Accuracy card: label "Accuracy" 13/600 `inkSec`; row baseline `BigWord 30/800` "84" + "%" 16/700; delta "↑ 6% wk/wk" 12/700 `ok`.
  - Mastered card: label "Mastered"; baseline `BigWord 30/800` "164" + "/ 240" 14/700 `inkSec`; helper "68% of library" 12/600 `inkSec`.
- `SectionHeader` "This week", then `Glass pad=18 floating`:
  - Top row: `BigWord 22/800` "82" + "words reviewed" 13/600 `inkSec`.
  - Bar chart: flex row height 100, gap 8; for each day M T W T F S S draw a bar of `height = (value/20) * 84`, radius 6, min-height 4. Zero value → `rule2`. Today's bar (index 2) → `accent`; others → `ink`. Day letter below, 11/600 `inkSec`.
- `SectionHeader` "Knowledge", then `Glass pad=16 floating`:
  - Stacked horizontal bar (height 14, radius 99): 68% `ok`, 26% `warn`, 6% `red`.
  - Three legend rows — 10×10 colored dot, label, count 15/700 `inkSoft`, hairline divider between rows: Mastered 164, Learning 62, Struggling 14.
- `TabBar active=stats`.

### 8. Settings
**Purpose:** Account + preferences.

- `NavBar large prominentTitle="Settings"`, leading custom accent back-button: chevron-left (10×16, 2.5px stroke, accent) + "Learn" 16/500 accent.
- **Account card** — `Glass pad=16 floating`:
  - 56×56 gradient-circle avatar `#007AFF→#AF52DE` with "M" 22/800 white.
  - Name "Miro" 18/800 `letter-spacing: -0.3` + email "miro@example.com" 14 `inkSec`.
  - Chevron right.
- `SectionHeader` "Daily practice", then `Glass pad=0 floating` holding rows:
  - `GlassRow icon=flash iconBg=#FF9500 title="Daily goal" detail="20 words"`.
  - `GlassRow icon=bell iconBg=#FF3B30 title="Reminder" detail="9:00 AM"`.
  - `GlassRow icon=speaker iconBg=#5856D6 title="Sound effects" chevron={false} accessory={<Toggle on/>} isLast`.
- `SectionHeader` "Quiz":
  - `GlassRow icon=card iconBg=#007AFF title="Quiz mode" detail="Mixed"`.
  - `GlassRow icon=clock iconBg=#34C759 title="Show hints" detail="After 10s"`.
  - `GlassRow icon=speaker iconBg=#AF52DE title="Auto-play pronunciation" chevron={false} accessory={<Toggle on={false}/>} isLast`.
- `SectionHeader` "Data":
  - `GlassRow icon=share iconBg=#30D158 title="Export vocabulary" detail="CSV"`.
  - `GlassRow icon=plus iconBg=#0A84FF title="Import from file"`.
  - `GlassRow icon=close iconBg=#FF3B30 title="Reset progress" chevron={false} isLast` — destructive action (title color can stay `ink` in this design; icon-square red signals intent).
- `TabBar active=settings`.

---

## Interactions & Behavior

### Global
- Tab bar switches top-level views: Today (Home), Library, Progress (Stats), Settings.
- Back gestures: iOS swipe-from-edge and explicit leading chevron on modal screens.
- Scroll regions: main content. Nav bar and tab bar do NOT scroll with content — they float.

### Onboarding
- Tap a language card → single-select radio behavior, card becomes `strong` + 2px accent border + filled accent radio with check.
- "Continue" proceeds to the main app.

### Home
- "Start review" → opens Quiz flow. Mode determined by Settings > Quiz mode (default Mixed).
- Speaker icon on word-of-the-day → play pronunciation.
- Tapping any stat card (library/mastered/accuracy) navigates to the corresponding detailed view.

### Quiz — Typing
- Live text entry, blinking caret.
- "Show answer" reveals the correct answer (no XP awarded).
- "Check" validates. On correct: brief success confirmation, auto-advance after ~700ms. On wrong: shake animation on the input card, reveal answer.
- "Skip" records a miss and moves on.
- Progress bar and n/14 counter update after each submission.

### Quiz — Multiple Choice
- Tap option → immediately reveals correct (green) and, if user was wrong, their choice (red).
- "Next word" advances; tapping elsewhere during feedback does nothing.
- "+8 XP" increments per correct; formula is platform-side spaced-repetition scoring (not specified in design — use existing or a simple mastery score).

### Library
- Search field focuses and filters list in real time (case-insensitive, matches term OR meaning).
- Filter pills are mutually exclusive.
- Tap word row → word detail (design not specified; use iOS default push with the word as its hero).
- Plus icon in nav → presents Add Word as a sheet modally.

### Add Word
- Both Term and Meaning are editable text fields (design shows them as "typed" content). Tapping the card focuses the input.
- Part-of-speech chip row is single-select.
- "Fill" (AI) button: disabled until Term has ≥2 chars. On tap: spinner on button, populate Meaning + Example + pronunciation audio. Error state: toast "Couldn't autofill — check your connection."
- "Save" requires Term + Meaning; grayed out otherwise.

### Stats
- Tap a bar → drilldown to that day's reviews.
- Tap any legend row (Mastered/Learning/Struggling) → filtered Library view.

### Settings
- Tap row with detail → disclosure (native iOS push or a picker sheet for Daily goal / Reminder / Quiz mode / Show hints).
- Toggles are instant; no confirm.
- "Reset progress" requires a confirm alert with destructive styling.

### States to specify per interactive component
- Default / hover (not relevant on touch, but for iPad/Mac idioms map to highlight) / pressed / disabled / loading.
- Pressed on glass = reduce `glassBgStrong` opacity by 6% and 1-unit inner shadow; OR 0.96 scale with 80ms ease.

---

## Responsive / Adaptive Notes

- The prototype is sized for **402×874** (iPhone 15/16 Pro class). On wider phones (Pro Max), expand horizontal padding proportionally; keep max content width ≤ 560 for one-hand readability.
- On iPad, consider keeping the same glass vocabulary but using a two-column layout: Home + Library side-by-side with the tab bar replaced by a sidebar.
- Dark mode is first-class. Respect `@Environment(\.colorScheme)` on iOS; default to Light unless the user has set Dark at the OS level.

---

## Accessibility

- All icons in the prototype are decorative unless they replace text (tab bar, search, speaker, close). In implementation: give each icon a `Label` / `accessibilityLabel`.
- Contrast: with wallpaper behind glass, verify AA (4.5:1) for all text against the darkest possible wallpaper region. If a text color fails, bump weight and/or switch to `ink` instead of `inkSoft`.
- Dynamic Type: display/headline sizes should use `.relative(to: .largeTitle/.title)` on iOS so users who upsize text keep the hierarchy.
- Reduce Transparency: when enabled, replace glass with solid `bg` + `rule2` 0.5px border + same radius. Do NOT keep backdrop-blur; it's a material that must degrade.
- Reduce Motion: drop the caret blink to steady; progress fill becomes instant.
- Tap targets: minimum 44×44 — confirmed for all buttons and rows. The 52×52 tab capsules already exceed this.

---

## Files in this handoff

```
design_handoff_lexio/
├── README.md                    ← you are here
├── tokens.json                  ← machine-readable token dump
├── screenshots/                 ← PNG of every screen (light + dark samples)
└── prototype/
    ├── Lexio Design Improvements.html   ← entry HTML (open in browser)
    ├── lexio-tokens.jsx                 ← all color/type/radius tokens
    ├── lexio-atoms.jsx                  ← Glass, Btn, Chip, NavBar, TabBar, GlassRow, etc.
    ├── lexio-screens.jsx                ← all 8 screens
    ├── lexio-app.jsx                    ← canvas layout of screens
    ├── lexio-tweaks.jsx                 ← light/dark toggle
    ├── ios-frame.jsx                    ← 402×874 iPhone frame
    └── design-canvas.jsx                ← presentation canvas (not part of app)
```

To view the prototype: open `prototype/Lexio Design Improvements.html` in a modern browser. Pan/zoom the canvas to inspect any artboard; double-click an artboard to focus it full-screen.

---

## Open questions / gaps

- **Real icon set.** Prototype uses ad-hoc stroke paths. Map to SF Symbols for iOS (table above) or Lucide/Phosphor for cross-platform.
- **Animation curves.** Durations given; specific springs (stiffness/damping) left to the dev / motion designer. Recommend iOS `Animation.smooth(duration:)` defaults.
- **Real copy.** All words/numbers are placeholder. Product team should review onboarding language-pack names, AI upsell microcopy, and Reset-progress confirm alert copy.
- **Empty states.** Not designed. Suggest: Library empty → illustration placeholder + primary "Add a word" CTA; Home empty (nothing due) → celebratory hero + "Explore library" secondary CTA.
- **Error states.** Not designed. Suggest: inline red text below the offending field; for network errors, a glass toast from top-of-screen (`Glass pad=14 floating strong` + accent icon).
- **Keyboard handling in Quiz Typing.** Spec assumes system keyboard; make sure the Show answer / Check row floats above the keyboard when it's up.

---

## Implementation suggestion

Build in this order to get value early:

1. **Tokens + Glass primitive.** Nothing else works without these.
2. **Atoms:** Btn, Chip, Progress, Toggle, LangPair, BigWord, LargeTitle.
3. **Composites:** NavBar, TabBar, GlassIcon, GlassRow, SectionHeader, PaperSurface.
4. **Home → Quiz (Typing) → Quiz (MC)** — the core loop. Get this working with real data.
5. **Library → Add Word.** Second loop.
6. **Stats, Settings, Onboarding.** Peripheral.
7. **Dark mode pass.** Should be mostly free from tokens; verify each screen.
8. **A11y pass.** Labels, Reduce Transparency, Reduce Motion, Dynamic Type.
