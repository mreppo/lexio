Implement a GitHub issue for the Lexio project.

Usage: /implement <issue-number-or-description>

This command kicks off the full development workflow:

1. Read the GitHub issue (if number provided) or create a plan from the description
2. Verify dependencies are met
3. Create a feature branch
4. Delegate implementation to @agent-developer
5. Delegate testing to @agent-qa
6. Delegate code review to @agent-reviewer
7. Fix any issues found in review
8. Verify all acceptance criteria
9. Commit with conventional commit format

Use @agent-orchestrator to coordinate this workflow.

The input is: $ARGUMENTS
