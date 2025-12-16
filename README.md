## Kinboard

> Important experimental notice
>
> This project was implemented with heavy use of AI as part of an experiment. The codebase has not yet undergone full human review. The goals are twofold: (1) solve practical family/household management needs (chores, calendars, shopping, kiosk) and (2) explore the capabilities and limitations of AI as a software developer. Prominent AI models used include Claude Opus 4.5, GPT-5.2, and Claude Sonnet 4.5.

Family household dashboard with chores, calendar, shopping lists, and kiosk display.

### Features
- Chores/jobs with assignments, ordering, recurrence, and completion tracking
- Shared calendar aggregation via iCal sources and color coding
- Shopping lists with avatars, ordering, and quick toggles
- Kiosk mode for wall displays (read‑only, auto‑refresh)
- Admin UI for management

### Tech stack
- Backend: .NET 9 (ASP.NET Core), Entity Framework Core, SQLite by default
- Frontend: Next.js 16, React 19, MUI

### Monorepo layout
```
Kinboard/
├─ backend/
│  └─ Kinboard.Api/           # .NET 9 Web API
│     ├─ Controllers/
│     ├─ Models/
│     ├─ Dtos/
│     ├─ Services/
│     ├─ Data/
│     ├─ Migrations/
│     └─ Program.cs
├─ frontend/                  # Next.js application
│  └─ src/
│     ├─ app/
│     │  ├─ page.tsx          # Landing page
│     │  ├─ admin/            # Admin dashboard
│     │  └─ kiosk/            # Kiosk display
│     ├─ components/
│     └─ lib/
└─ install/
   └─ install.sh              # LXC installer (Debian/Ubuntu)
```

---

## Quick start (development)

Prerequisites: Node.js 22+, .NET 9 SDK

1) Backend
```
cd backend/Kinboard.Api
dotnet restore
dotnet run
```
This uses SQLite by default (see `appsettings.Development.json`). Swagger/OpenAPI is enabled in Development only.

2) Frontend
```
cd frontend
npm install
# Either set API URL explicitly, or rely on relative fetches for a proxy setup
set NEXT_PUBLIC_API_URL=http://localhost:5000   # Windows PowerShell example
npm run dev
```
Visit http://localhost:3000

Tip: If `NEXT_PUBLIC_API_URL` is not set, the frontend will call relative paths (e.g., `/api/...`). Configure a dev proxy or run the frontend on the same host that can reach the backend under the same origin.

---

## Configuration

Backend (`backend/Kinboard.Api`):
- `ConnectionStrings:DefaultConnection` (SQLite file path by default)
- `Cors:AllowedOrigins` (array of allowed origins for Production)
- `ASPNETCORE_ENVIRONMENT` (`Development` enables Swagger and permissive CORS)

Frontend (`frontend`):
- `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:5000`). If omitted, relative URLs are used.

Production samples:
- See `backend/Kinboard.Api/appsettings.Production.sample.json`

---

## Deployment

An installer script for Debian/Ubuntu LXC is provided at `install/install.sh`.
- It installs Node.js and .NET 9, builds backend and frontend, and creates systemd services.
- Ensure `REPO_URL` and `BRANCH` in the script match your public repository location and default branch.

---

## Contributing
Please see `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

## Security
Please see `SECURITY.md` for our vulnerability disclosure policy.

## License
GPL-3.0 — see `LICENSE`.
