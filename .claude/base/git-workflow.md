# Git Workflow

This workflow applies to ALL projects.

## Branch Strategy

- Default branch (usually `main`) - production, auto-deploys
- Feature branches: `feature/<issue-number>-<short-description>`
- Bug fix branches: `fix/<issue-number>-<short-description>`

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - new feature
- `fix:` - bug fix
- `test:` - adding or updating tests
- `docs:` - documentation changes
- `refactor:` - code refactoring
- `chore:` - maintenance, dependencies, CI

Always reference the issue number: `feat: add storage service (#3)`

## PR Lifecycle (Orchestrator's Job)

1. Create feature branch
2. Push to remote
3. Create PR with `gh pr create`
4. Verify CI: `gh pr checks <pr-number> --watch`
5. Merge: `gh pr merge <pr-number> --squash --delete-branch`
6. Comment on issue with summary
7. Close issue: `gh issue close <number> --reason completed`
