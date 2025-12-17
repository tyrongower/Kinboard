## Kinboard
> [!IMPORTANT]
> Important experimental notice
>
> This project was implemented with heavy use of AI as part of an experiment. The codebase has not yet undergone full human review. The goals are twofold: (1) solve practical family/household management needs (chores, calendars, shopping, kiosk) and (2) explore the capabilities and limitations of AI as a software developer. Prominent AI models used include Claude Opus 4.5, GPT-5.2, and Claude Sonnet 4.5.

Family household dashboard with chores, calendar, shopping lists, and kiosk display.

### Why Kinboard?

Kin means family — the people you share life with.
A board is a shared surface — visible, central, and used together.

Kinboard brings family planning into one shared place, where chores, schedules, and lists are seen by everyone and done together.


### Features
- Chores/jobs with assignments, ordering, recurrence, and completion tracking
- Shared calendar aggregation via iCal sources and color coding
- Shopping lists with avatars, ordering, and quick toggles
- Kiosk mode for wall displays
- Admin UI for management
-
### Calendar
Admin ui allows adding iCal sources and color coding.
<img src="https://raw.githubusercontent.com/tyrongower/Kinboard/refs/heads/main/readme/calendar.png" width="800"  alt=""/>

### Jobs
Admin ui allows adding chores and assigning them to people with recurrence.
<img src="https://raw.githubusercontent.com/tyrongower/Kinboard/refs/heads/main/readme/jobs.png" width="800"  alt=""/>

### Shopping
Admin ui allows for the creation of shopping lists. Kiosk allows adding and removing items from the shopping list.
<img src="https://raw.githubusercontent.com/tyrongower/Kinboard/refs/heads/main/readme/shopping.png" width="800"  alt=""/>


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
# For development, set the backend port (defaults to 5000)
set BACKEND_PORT=5197   # Windows PowerShell - matches dev backend port
# Or set API URL explicitly
set NEXT_PUBLIC_API_URL=http://localhost:5197   # Windows PowerShell example
npm run dev
```
Visit http://localhost:3000

Tip: If `NEXT_PUBLIC_API_URL` is not set, the frontend proxy will route requests to `http://{hostname}:{BACKEND_PORT}`. Set `BACKEND_PORT` env var (defaults to 5000 for Docker, use 5197 for local development).

---

## Configuration

Backend (`backend/Kinboard.Api`):
- `ConnectionStrings:DefaultConnection` (SQLite file path by default)
- `Cors:AllowedOrigins` (array of allowed origins for Production)
- `ASPNETCORE_ENVIRONMENT` (`Development` enables Swagger and permissive CORS)

Frontend (`frontend`):
- `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:5197`). If omitted, proxy routing is used.
- `BACKEND_PORT` (defaults to `5000`). Used for proxy routing when `NEXT_PUBLIC_API_URL` is not set.

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
