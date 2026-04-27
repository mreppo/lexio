# Lexio UI Kit

Click-thru recreation of the Lexio PWA - Dashboard, Quiz, Stats, Words, Settings.
Mobile-first, designed for an iPhone-class viewport (390×844).

## Files
- `index.html` - runtime shell with iOS frame, screen router, mock data
- `tokens.jsx` - color/type/radius/shadow constants from `colors_and_type.css`
- `Primitives.jsx` - `GlassCard`, `GlassChip`, `Button`, `Pill`, `IconSquare`, icons
- `BottomNav.jsx` - pinned 4-tab nav
- `Dashboard.jsx` - hero chip + stats + due list
- `QuizScreen.jsx` - multiple-choice quiz flow with feedback
- `StatsScreen.jsx` - streak hero + stat cards + bar chart
- `WordsScreen.jsx` - words list + add-word sheet
- `SettingsScreen.jsx` - grouped list with drill-down

## What's faked
- All data is in `index.html` `MOCKS` (10 words, 1 streak, etc.)
- HashRouter behavior simulated with React state
- No persistence (refresh resets)
