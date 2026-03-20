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

Keep commits atomic - one logical change per commit.

## PR Lifecycle (Orchestrator's Job)

### 1. Create Feature Branch
```bash
git checkout -b feature/<issue-number>-<short-description>
```

### 2. Push to Remote
```bash
git push origin feature/<issue-number>-<short-description>
```

### 3. Create PR
```bash
gh pr create --title "feat: <description> (#<issue-number>)" \
  --body "## Summary

<what was done>

## Changes

- file list

## Testing

- All tests pass
- Acceptance criteria verified

## Review

- Code review passed

Closes #<issue-number>" \
  --base main
```

### 4. Wait for CI to Pass (MANDATORY)
```bash
gh pr checks <pr-number> --watch
```
Do NOT proceed to merge until all checks pass. If checks fail, diagnose the failure, fix the code, push again, and re-check. Branch protection prevents merging with failed checks.

### 5. Merge
```bash
gh pr merge <pr-number> --squash --delete-branch
```

### 6. Close Issue
```bash
gh issue comment <number> --body "<completion summary>"
gh issue close <number> --reason completed
```

### 7. Verify Deployment
After merge to main, verify the deployment succeeded:
```bash
# Wait for deployment to complete
sleep 120

# For GitHub Pages projects:
gh api repos/{owner}/{repo}/pages/builds --jq '.[0].status'
# Expected: "built"

# Or check the Actions run directly:
gh run list --branch main --limit 1 --json status,conclusion --jq '.[0]'
# Expected: conclusion = "success"
```

If deployment failed, investigate the GitHub Actions run and create a hotfix issue.

### 8. Post-deploy Smoke Check
Verify the live site is accessible:
```bash
curl -s -o /dev/null -w "%{http_code}" <deployment-url>
# Expected: 200
```

### 9. Check Sentry (if configured)
If the project uses Sentry, check for new errors within 2 minutes of deployment:
```bash
# Check for unresolved issues in the last 5 minutes
# Use Sentry CLI or API if available
```
Report any new errors as a comment on the issue.

## Rules

- Never push directly to the default branch
- Every change goes through a PR
- Orchestrator creates AND merges PRs - no asking the user
- Branch is deleted after merge
- Issue is closed after merge
- Never merge a PR with failing CI checks
- Always verify deployment succeeded after merge
- "Merged" is NOT the same as "deployed and working"
