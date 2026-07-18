# Contributing to Ishkeen

We welcome contributions! Please follow these guidelines to ensure a smooth collaboration.

## 1. Local Development Setup
Ensure you have Docker, Python 3.11, and Node 20 installed. Follow the `Installation & Setup` guide in the `README.md`.

## 2. Branching Strategy
- `main` is the stable production branch.
- Create feature branches off `main` (e.g., `feature/add-new-endpoint`, `fix/login-bug`).

## 3. Code Quality & Formatting
We strictly enforce code quality across the repository:
- **Backend:** Run `flake8 app/` for linting and `mypy app/ --explicit-package-bases` for static typing.
- **Frontend:** Run `npm run lint` (Oxlint) and `npm run typecheck` (TypeScript).
- **ML:** Run `flake8 src/` and `pytest tests/`.

Ensure all tests pass before submitting a PR.

## 4. Submitting a Pull Request
- Provide a clear, descriptive title.
- Link any relevant issues.
- Describe the 'Why' behind architectural changes.
- Ensure GitHub Actions CI is passing.

## 5. Security Vulnerabilities
If you discover a security vulnerability, please do NOT open a public issue. Email the core team directly.
