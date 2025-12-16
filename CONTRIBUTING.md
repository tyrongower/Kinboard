### Contributing to Kinboard

Thank you for your interest in contributing! This document outlines how to get set up and how we work together.

#### Development setup
- Backend
  - Requires .NET 9 SDK
  - `cd backend/Kinboard.Api && dotnet restore && dotnet run`
- Frontend
  - Requires Node.js 22+
  - `cd frontend && npm install && npm run dev`
  - Optionally set `NEXT_PUBLIC_API_URL` to point at your backend

#### Branching and commits
- Use feature branches from `main` (or the default branch)
- Write clear commit messages (Conventional Commits encouraged but not required)

#### Code style
- C#: follow existing conventions; prefer explicit types and nullable correctness
- TypeScript/React: follow existing patterns; prefer functional components and hooks
- Editor settings are governed by `.editorconfig`

#### Tests
- If adding complex logic, include appropriate tests where practical

#### Pull Requests
- Describe the change, motivation, and any breaking changes
- Include screenshots for UI-affecting changes
- Link related issues

#### License
By contributing, you agree that your contributions will be licensed under the GPL-3.0 license of this repository.
