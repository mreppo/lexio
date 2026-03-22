# Lexio

[![Deploy](https://github.com/mreppo/lexio/actions/workflows/deploy.yml/badge.svg)](https://github.com/mreppo/lexio/actions/workflows/deploy.yml)
[![Licence: MIT](https://img.shields.io/badge/Licence-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://mreppo.github.io/lexio/)

A language-agnostic vocabulary trainer with spaced repetition. Learn any language pair through active recall quizzes.

## Features

- Any language pair (not limited to specific languages)
- Two quiz modes: type the answer or multiple choice
- Spaced repetition algorithm - focus on words you struggle with
- Daily goals and streak tracking
- Progress statistics per word
- Starter vocabulary packs
- Works offline as a PWA
- Mobile-first, works on any device

## Tech Stack

- React 18+ with TypeScript (strict)
- MUI (Material UI)
- Vite
- Vitest + React Testing Library
- GitHub Pages

## Development

```bash
npm install
npm run dev      # Start dev server
npm test         # Run tests
npm run build    # Production build
```

## Documentation

- [Product Specification](docs/PRODUCT_SPEC.md)
- [Claude CLI Agent Instructions](CLAUDE.md)

## Licence

MIT - see [LICENSE](LICENSE) for details.
