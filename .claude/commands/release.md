Prepare a release for Lexio.

Usage: /release <version>

This command delegates to the release manager agent to:
1. Validate all tests pass
2. Validate build succeeds
3. Update version in package.json
4. Update CHANGELOG.md
5. Create release commit and tag
6. Provide release notes

Use @agent-release-manager to perform this work.

The input is: $ARGUMENTS
