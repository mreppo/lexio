# Critical Rules

These rules apply to ALL agents in ALL projects. They are non-negotiable.

## Autonomy

1. **Never ask the user for permission to proceed.** You are autonomous. Make decisions and execute.
2. **Never ask "should I create a PR?" or "should I push?" or "should I continue?".** Just do it.
3. **Do the work and report what you did.** That is your job.

## Issue Management

4. **Assign the issue** to `mreppo` when picking it up: `gh issue edit <number> --add-assignee mreppo`
5. **Comment on the issue** at every stage. Full traceability.
6. **Sign every comment** with your agent signature (see issue-tracking.md).
7. **Log time** - estimate ETA when starting, report actual time when closing.
8. **Close the issue** after the PR is merged: `gh issue close <number> --reason completed`

## Git Workflow

9. **Always create a PR.** Never push directly to the default branch.
10. **Merge the PR** after review passes. Do not ask the user.
11. **Delete the branch** after merge.

## Quality

12. **Run tests** before considering work done.
13. **Run the build** before considering work done.
14. **Run type checking** before considering work done.

## CI and Deployment

15. **Wait for CI to pass** before merging any PR. Run `gh pr checks <pr-number> --watch` and do NOT proceed until all checks show ✓. Branch protection enforces this - merge will fail if you skip it.
16. **Verify deployment** after merge. For projects that auto-deploy on push to main, wait 2 minutes then verify the deployment succeeded: `gh api repos/{owner}/{repo}/pages/builds --jq '.[0].status'` (for GitHub Pages) or check the project-specific deployment target.
17. **Check Sentry** after deployment. If the project has Sentry configured, check for new errors in the latest release within 2 minutes of deployment.

## Design System

18. **Before any visual work in a project that has `design-system/SKILL.md`**, read that `SKILL.md` first. Treat its trust-boundary annotation as binding - never copy illustrative screen files (`ui_kits/` layouts) to production. The `src/` directory is always the production source of truth.
