---
name: lexio-design
description: Use this skill to generate well-branded interfaces and assets for Lexio (a language-agnostic vocabulary trainer PWA - iOS-26 "Liquid Glass" aesthetic), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `preview/`, `ui_kits/lexio_app/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Pull the CSS variables from `colors_and_type.css` and reuse the JSX primitives in `ui_kits/lexio_app/Primitives.jsx` (GlassCard, GlassChip, Button, Pill, IconSquare, Icon).

If working on production code, the source of truth is `src/theme/liquidGlass.ts` and `src/theme/theme.ts` in the `mreppo/lexio` repo. The tokens here mirror them but the repo always wins. Never use generic MUI `Card` or `variant="outlined"` patterns - those were deliberately removed (#194). Always use the `<Glass>` primitive (or its derivatives).

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (audience, surface, light vs dark, mobile vs desktop), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Trust boundary (CRITICAL for production work)
This bundle has two reliability tiers:

**Canonical** (use as authoritative reference):
- `colors_and_type.css` - tokens mirror `src/theme/liquidGlass.ts` + `src/theme/theme.ts`
- `ui_kits/lexio_app/Primitives.jsx` - component contract reference
- `ui_kits/lexio_app/tokens.jsx` - token values
- Interaction rules in this SKILL.md (press/hover/focus/motion)
- Iconography style and color treatment in `preview/`

**Illustrative only** (NEVER copy to production):
- `ui_kits/lexio_app/Dashboard.jsx`
- `ui_kits/lexio_app/QuizScreen.jsx`
- `ui_kits/lexio_app/WordsScreen.jsx`
- `ui_kits/lexio_app/StatsScreen.jsx`
- `ui_kits/lexio_app/SettingsScreen.jsx`
- `ui_kits/lexio_app/BottomNav.jsx` (kit has 4 tabs; production has 5)

Production layouts live in `src/features/` and `src/components/`. The repo always wins. When building a feature, read the relevant `src/features/<feature>/` directory FIRST, use this bundle as a style reference SECOND.

Key rules to honor:
- Mobile-first, 390px design width.
- Light theme in-app, dark theme on landing/about.
- Sentence case, middle-dot separator, no exclamation marks, no emoji.
- Lucide icons, stroke 2 (resting) / 2.4 (active), rounded caps.
- Animate `opacity` and `transform` only on glass surfaces - never `backdrop-filter`/`background`/`box-shadow`.
- Press: scale(0.94–0.97). Hover: translateY(-1px). Focus-visible: 2px accent outline.
- Honor `prefers-reduced-motion` and `prefers-reduced-transparency`.
