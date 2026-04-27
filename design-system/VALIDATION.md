# Design System Validation

Phase 2 findings from issue #214 - comparing the Claude Design UI kit click-thru against the live app at `https://mreppo.github.io/lexio/#/app?demo=true`. All 5 screens swept; bundle structure verified.

## What Claude Design got right (high-confidence layer)

- Visual language: iOS 26 Liquid Glass, light theme + subtle gradient wallpaper, translucent glass cards, blur+saturate aesthetic
- Accent color: system blue #007AFF on primary actions
- Typography: sentence case headers, middle-dot separators, weight scale matches
- Iconography style: rounded-square colored icons with letters/glyphs (palette and treatment match Settings)
- Tokens: radii (pill 999, glass 28, card 22), spacing scale, motion timings
- Interaction rules in SKILL.md: press scale 0.94-0.97, hover translateY(-1px), animate only opacity+transform, prefers-reduced-motion/transparency honored
- Self-correction: caught and overruled stale `docs/design/DESIGN.md` (amber/Sora ghost) by reading actual `theme.ts` + `liquidGlass.ts`

## What Claude Design got wrong (low-confidence layer)

UI kit renders what _could_ ship, not what _did_ ship. Per-screen:

| Screen | Live (shipped) | UI kit (Claude Design) |
|---|---|---|
| Bottom nav | **5 tabs**: Today/Practice/Library/Progress/Settings | **4 tabs**: Home/Words/Stats/Settings - Quiz missing |
| Dashboard h1 | "Today" | "Good morning" + date |
| Dashboard hero | 187 words DUE TODAY + progress bar + Start review CTA | Continue review preview card |
| Dashboard stats | 3 cards (Library/Mastered/Accuracy) | 2 cards (Streak/Reviewed) - Streak doesn't even live on Dashboard |
| Dashboard tail | Word of the day | UP NEXT word list |
| Library | A-Z sections, filter pills (All/Due/Learning/Mastered), blue book icons, New/Mastered status | Flat list, no filters, no icons, due/days pills |
| Stats streak | **Vivid orange-red gradient hero card** | Glass card same as everything else |
| Stats cards | 2 horizontal (Accuracy, Mastered ratio) | 4 in 2x2 (Reviewed, Accuracy, Words known, Time) |
| Stats tail | KNOWLEDGE bar (green/orange/red) with Mastered/Learning/Struggling rows | absent |
| Settings groups | 4 labeled sections (DAILY PRACTICE, QUIZ, APPEARANCE, DATA) | 3 unlabeled blocks |
| Settings rows | Real: Daily goal, Reminder, Sound effects (toggle), Quiz mode, Show hints, Auto-play (toggle), Theme, Export/Import/Reset | Fabricated: Account, Languages, Notifications, Review schedule, Appearance, Backup&sync, Help, About |
| Settings widgets | Inline toggles (green ON state) | None |

## Hidden facts the bundle missed

- **Violet "L" logo color** (~#5856D6) used for profile avatar in app top-left - bundle has no record of this
- **Landing page uses amber/orange brand accent on dark theme** - completely different from in-app blue. Bundle docs only the in-app system. Landing needs its own spec.
- Bundle's Type preview cards still label roles as "Sora bold" even though the rendering uses Inter (the substitute). Cosmetic doc drift - corrected in `ui_kits/lexio_app/tokens.jsx` and `index.html` as part of Phase 3 integration.
- Bundle uses em dashes throughout - violates EU style preference (use `-`). Corrected in `SKILL.md`, `README.md`, and `ui_kits/lexio_app/README.md` as part of Phase 3 integration.

## Trust tier implications

The bundle has a two-tier reliability profile:

1. **High-trust tier** (use as canonical reference): tokens, components, interaction rules, color/type/spacing, iconography treatment, motion, accessibility rules. These mirror the actual code accurately.

2. **Low-trust tier** (illustrative only): screen layouts, content, navigation structure, settings inventory. CLI agents must NOT copy these to ship.

See the Trust boundary section in `SKILL.md` for the definitive rule set.
