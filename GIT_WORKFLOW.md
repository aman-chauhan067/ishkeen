# Ishkeen Git Workflow

This repository adheres to a strict Git workflow to ensure safety, traceability, and production stability.

## Branch Strategy
- **`main`**: The production branch. It must always reflect the stable, production-ready state of the application. Commits are never pushed directly to `main`.
- **`develop`**: The primary development branch. This is the integration branch for all new features and bug fixes.
- **Temporary Branches**: All active work must occur on short-lived branches created from `develop`.
  - `feature/<name>`: For new features.
  - `fix/<name>`: For bug fixes.
  - `hotfix/<name>`: For urgent production fixes (these branch from `main`).
  - `release/<version>`: For preparing a new production release.
  - `docs/<name>`: For documentation updates.
  - `refactor/<name>`: For code refactoring without behavior changes.
  - `experiment/<name>`: For temporary proofs-of-concept.

## Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/). This standardizes history and allows for automated changelog generation.

### Format
`<type>: <description>`

### Types
- `feat:` A new feature.
- `fix:` A bug fix.
- `docs:` Documentation only changes.
- `style:` Changes that do not affect the meaning of the code (white-space, formatting).
- `refactor:` A code change that neither fixes a bug nor adds a feature.
- `perf:` A code change that improves performance.
- `test:` Adding missing tests or correcting existing tests.
- `build:` Changes that affect the build system or external dependencies.
- `ci:` Changes to CI configuration files and scripts.
- `chore:` Other changes that don't modify src or test files.

## Merge Flow
1. Create a branch from `develop` (e.g., `feature/login-system`).
2. Commit changes using Conventional Commits.
3. Push the branch to `origin`.
4. Open a Pull Request targeting `develop`.
5. After review and CI validation, merge into `develop`.

## Release Flow
1. When `develop` reaches a stable milestone, create a `release/vX.Y.Z` branch.
2. Perform final QA and bug fixes on the release branch.
3. Merge the release branch into `main` and tag the commit (e.g., `v1.1.0`).
4. Merge the release branch back into `develop` to sync any final fixes.
