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

### One-line install

Run the following on a fresh Debian/Ubuntu container/VM (requires `sudo` privileges):

```
bash -c "$(curl -fsSL https://raw.githubusercontent.com/tyrongower/Kinboard/main/install/install.sh)"
```

This will:
- Install prerequisites (curl, git, cron, etc.), Node.js 22.x and .NET 9 SDK
- Clone the repository and build the backend and frontend
- Create and start `systemd` services for both apps
- Prompt you for:
  - Backend API port (default `5000`)
  - Frontend port (default `3000`)
  - API URL used by the frontend (auto-derived from IP + backend port if not provided)

After installation completes, you should see the URLs to access the frontend and backend.

### Update existing installation

If you don’t already have the script locally, download it first:

```
curl -fsSL -o kinboard-install.sh https://raw.githubusercontent.com/tyrongower/Kinboard/main/install/install.sh
chmod +x kinboard-install.sh
```

Then you can run updates using the supported flags:

- Update if newer version is available:

```
sudo bash kinboard-install.sh --update
```

- Force rebuild even if already up to date:

```
sudo bash kinboard-install.sh --force-update
```

- Check if an update is available (exits 0 when an update exists, 1 otherwise):

```
sudo bash kinboard-install.sh --check
```

### Script options and behavior

`install/install.sh` accepts the following options (see in-script help with `--help`):

- No args (fresh install):
  - Prompts for ports and API URL on first install
  - Installs dependencies, builds both apps, creates and enables services
  - Starts services and outputs access URLs
- `--update`: Updates only when the remote `main` branch has a newer commit than the currently installed commit
- `--force-update`: Rebuilds and restarts services regardless of commit status
- `--check`: Prints whether an update is available and exits with a corresponding code
- `--help`/`-h`: Shows usage information

Other notes:
- Default repo and branch are set in the script: `REPO_URL=https://github.com/tyrongower/Kinboard.git`, `BRANCH=main`
- Install paths: app source at `/opt/kinboard`, published backend at `/opt/kinboard-backend`
- Logs: update logs at `/var/log/kinboard-update.log`
- Services: `kinboard-backend.service` (ASP.NET Core on chosen port) and `kinboard-frontend.service` (Next.js served via `npm start` on chosen port)
- The frontend’s production `.env.production` will be created with `NEXT_PUBLIC_API_URL` on first install; subsequent updates preserve it

---

## Contributing
Please see `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

## Security
Please see `SECURITY.md` for our vulnerability disclosure policy.

## License
GPL-3.0 — see `LICENSE`.
