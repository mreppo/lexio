# Lexio - Claude CLI Agent Instructions

You are working on **Lexio**, a language-agnostic vocabulary trainer PWA.

Read `docs/PRODUCT_SPEC.md` for the full product specification before starting any work.

---

## Agent Team

This project uses a team of specialised Claude Code sub-agents. Each agent has a specific role, permissions, and signs its comments on GitHub issues.

| Agent | Role | Signature | Tools |
|-------|------|-----------|-------|
| `@agent-orchestrator` | Routes work, delegates, manages PRs | 🤖 *Orchestrator Agent (Claude CLI)* | All + Agent |
| `@agent-developer` | Writes implementation code | 🤖 *Developer Agent (Claude CLI)* | Read, Write, Edit, Bash, Glob, Grep |
| `@agent-qa` | Writes/runs tests, validates criteria | 🤖 *QA Agent (Claude CLI)* | Read, Write, Edit, Bash, Glob, Grep |
| `@agent-reviewer` | Code review (read-only) | 🤖 *Reviewer Agent (Claude CLI)* | Read, Glob, Grep |
| `@agent-devops` | CI/CD, deployment, infrastructure | 🤖 *DevOps Agent (Claude CLI)* | Read, Write, Edit, Bash, Glob, Grep |
| `@agent-release-manager` | Versioning, changelogs, releases | 🤖 *Release Manager Agent (Claude CLI)* | Read, Write, Edit, Bash, Glob, Grep |

Comments made by the **Product Architect** (in Claude Chat) are signed: 🤖 *Product Architect (Claude Chat)*

All agents run on **Sonnet**. All comments are posted under the repo owner's GitHub account, so signatures are essential for traceability.

### Issue Lifecycle

When an agent picks up an issue:
1. **Assign** the issue to `mreppo`
2. **Comment** with a plan and **ETA**
3. Each agent **comments** what it did (with signature)
4. On completion, **log time spent** and **close** the issue

### Slash Commands

| Command | Description |
|---------|-------------|
| `/implement <issue>` | Full workflow: implement, test, review an issue |
| `/review [files]` | Run code review on current branch or specific files |
| `/test [files]` | Write tests and/or run test suite |
| `/release <version>` | Prepare a release (version bump, changelog, tag) |

### Typical Workflow

1. **You** discuss features with the product owner in Claude Chat
2. **You** or the product owner creates GitHub issues with requirements
3. **Developer** runs `/implement #<issue-number>` in Claude Code
4. **Orchestrator** assigns the issue, comments with plan and ETA, then delegates:
   - `@agent-developer` implements the code, comments what it did
   - `@agent-qa` writes and runs tests, comments results
   - `@agent-reviewer` reviews the code, comments findings
   - Fixes are applied if review finds issues
5. **Orchestrator** creates PR, merges, logs time, closes the issue
6. **Release Manager** handles versioning when ready (`/release`)

---

## Project Context

- **What**: A vocabulary quiz app with spaced repetition, supporting any language pair
- **Tech**: React 18+ / TypeScript (strict) / MUI / Vite / Vitest
- **Hosting**: GitHub Pages (static build)
- **Storage**: localStorage via abstraction layer (StorageService interface)
- **Target**: Mobile-first PWA, works on any device

---

## Coding Conventions

### TypeScript

- Strict mode enabled - no `any` types, no `@ts-ignore`
- Use interfaces over types where possible
- All function parameters and return types explicitly typed
- Use `readonly` where mutation is not needed

### React

- Functional components only (no class components)
- Custom hooks for reusable logic (in `src/hooks/`)
- React Context + useReducer for state management
- No prop drilling beyond 2 levels - use context instead
- Memoise expensive computations (`useMemo`, `useCallback` where it matters)

### MUI

- Always use the project theme from `src/theme/` - never hardcode colours or spacing
- Use `sx` prop for one-off styles, `styled()` for reusable styled components
- Use MUI components over custom HTML elements where a suitable component exists
- Follow MUI accessibility patterns (proper labels, aria attributes)

### Storage

- **Never call `localStorage` directly** - always go through `StorageService`
- The StorageService interface is in `src/services/storage/StorageService.ts`
- All storage methods are async (return Promises)
- This ensures we can swap to IndexedDB or a REST API later

### File Organisation

```
src/
  components/      # Shared, reusable UI components
  features/        # Feature modules (quiz, words, stats, settings, onboarding)
  services/        # Business logic services (storage, spaced repetition)
  hooks/           # Custom React hooks
  theme/           # MUI theme configuration
  types/           # TypeScript interfaces and types
  utils/           # Pure utility functions
```

- Feature modules are self-contained: each has its own components, hooks, and logic
- Shared components go in `src/components/`
- Cross-feature utilities go in `src/utils/`

### Naming

- Components: `PascalCase` (e.g. `QuizScreen.tsx`, `WordCard.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g. `useStorage.ts`, `useQuizSession.ts`)
- Utils: `camelCase` (e.g. `matching.ts`, `levenshtein.ts`)
- Types: `PascalCase` for interfaces, `UPPER_SNAKE_CASE` for constants
- Test files: `*.test.ts` or `*.test.tsx` next to the source file

### Code Style

- Use named exports (not default exports) except for React components used with lazy loading
- Prefer `const` over `let`, never use `var`
- Use early returns to reduce nesting
- Keep functions small and focused - if a function exceeds ~50 lines, consider splitting
- Comments: explain *why*, not *what* - code should be self-documenting

---

## Git Workflow

### Branches

- `main` - production, auto-deploys to GitHub Pages
- Feature branches: `feature/<issue-number>-<short-description>` (e.g. `feature/3-storage-service`)
- Bug fix branches: `fix/<issue-number>-<short-description>`

### Commits

- Use conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`
- Reference issue number: `feat: add storage service abstraction (#3)`
- Keep commits atomic - one logical change per commit

### Pull Requests

- Title: same format as commits, with issue reference
- Description: brief summary of what changed and why
- Ensure all tests pass before requesting merge
- PR should be mergeable into `main` without conflicts

---

## Testing

### Framework

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **jsdom** environment for browser API simulation

### What to Test

- All utility functions (pure logic)
- All service methods (storage, spaced repetition algorithm)
- Component rendering and user interactions
- Edge cases: empty states, error handling, boundary values

### Test Patterns

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

- Use `describe` blocks grouped by feature/behaviour
- Test names should read as sentences: `it('should calculate confidence from attempt history')`
- Mock the StorageService for component tests - never touch real localStorage in tests
- Use `beforeEach` to reset state between tests

### Running Tests

```bash
npm test           # Run all tests (watch mode)
npm test -- --run  # Run once (no watch)
npm run build      # Verify production build
npx tsc --noEmit   # Type check only
```

---

## Important Reminders

- **Never hardcode language-specific content** - the app is language-agnostic
- **Never call localStorage directly** - use StorageService
- **Always support Latvian diacritics** (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž) - fonts and inputs must handle them
- **Mobile-first** - test on small screens, ensure touch targets are large enough
- **Accessibility** - proper labels, contrast ratios, keyboard navigation
- **No hardcoded magic numbers** - use named constants for algorithm parameters, thresholds, etc.
- **Sign every issue comment** - all agents post under the same GitHub account, signatures identify who did what
- **Log time** - orchestrator estimates ETA at start and logs actual time at close
