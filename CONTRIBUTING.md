# Contributing to Smart Pilot

Thank you for your interest in contributing to Smart Pilot. This document outlines the process, standards, and guidelines for contributing to this repository.

## Table of Contents

- Code of Conduct
- Getting Started
- Branching Strategy
- Development Workflow
- Coding Standards
- Commit Message Conventions
- Pull Request Process
- Reporting Security Vulnerabilities

---

## Code of Conduct

All contributors and maintainers are expected to adhere to the project Code of Conduct detailed in `CODE_OF_CONDUCT.md`. Professionalism, mutual respect, and constructive collaboration are required at all times.

---

## Getting Started

1. Fork the repository on GitHub.
2. Clone your forked repository locally:
   ```bash
   git clone https://github.com/<your-username>/SmartPilotNew.git
   cd SmartPilotNew
   ```
3. Set the upstream remote:
   ```bash
   git remote add upstream https://github.com/itzgauravgoswami/SmartPilotNew.git
   ```
4. Install dependencies for both backend and frontend applications:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

---

## Branching Strategy

Follow standard branch naming conventions:

- `feature/<feature-name>`: New functionality or enhancements.
- `fix/<bug-name>`: Bug fixes and patches.
- `refactor/<scope-name>`: Code refactoring without behavioral modifications.
- `docs/<topic-name>`: Documentation updates or additions.
- `perf/<scope-name>`: Performance improvements.

Always branch off the latest `main` branch:

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

---

## Development Workflow

1. Create environment configuration files:
   - Copy `backend/.env.example` to `backend/.env` and supply valid development credentials.
   - Copy `frontend/.env.example` to `frontend/.env` and configure local endpoint URLs.
2. Start the local backend development server:
   ```bash
   cd backend
   npm run dev
   ```
3. Start the local frontend Vite development server:
   ```bash
   cd frontend
   npm run dev
   ```
4. Verify your changes locally before committing.
5. Ensure no linting errors exist:
   ```bash
   cd frontend
   npm run lint
   ```

---

## Coding Standards

### JavaScript and React

- Use modern ES6+ syntax and functional components with React Hooks.
- Do not mutate state directly; utilize immutable state update patterns.
- Follow modular architecture: separate routing, page controllers, reusable components, and API service layers.
- Maintain responsive UI design with Tailwind CSS.
- Ensure proper error boundary handling and safe JSON parsing in network requests.

### Backend and Express

- Keep routes lean by delegating complex business logic to controllers or dedicated service modules.
- Ensure all database queries through Mongoose handle errors gracefully.
- Validate input payloads on all mutation endpoints (`POST`, `PUT`, `DELETE`).
- Preserve authentication middleware protections on restricted routes.
- Never log plain-text passwords, authentication tokens, or private secrets to server logs.

---

## Commit Message Conventions

Use clear, descriptive, and imperative commit messages conforming to Conventional Commits:

```
<type>(<scope>): <subject>
```

### Examples:
- `feat(invoices): add tax calculation breakdown to PDF generator`
- `fix(auth): correct token validation during multi-device session check`
- `refactor(dashboard): optimize month-over-month growth computation`
- `docs(readme): add environment variables reference table`

---

## Pull Request Process

1. Rebase your feature branch on the latest `upstream/main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. Open a Pull Request against the `main` branch of `itzgauravgoswami/SmartPilotNew`.
4. Provide a thorough description of the changes:
   - Motivation and context.
   - Summary of implemented changes.
   - Verification and testing steps.
   - Screenshots or video demonstrations for UI changes, if applicable.
5. Address review feedback constructively.

---

## Reporting Security Vulnerabilities

Do not report security-related vulnerabilities via public GitHub issues. Please follow the disclosure instructions in `SECURITY.md`.
