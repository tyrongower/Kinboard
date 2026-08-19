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
# Set the API URL to match your backend (defaults to port 5000)
set NEXT_PUBLIC_API_URL=http://localhost:5197   # Windows PowerShell - adjust port as needed
npm run dev
```
Visit http://localhost:3000

**Note**: For local development, set `NEXT_PUBLIC_API_URL` to match your backend port (typically 5197 for `dotnet run`). If not set, the frontend defaults to port 5000. For Docker deployments, no configuration is needed as the backend defaults to port 5000.

---

## Docker deployment

The easiest way to run Kinboard is using Docker with the published image.

### Using Docker Compose (recommended)

The repo ships a ready `docker-compose.yml`. Clone the repo (or copy that file), then:

1) Create `.env` alongside it from `.env.example`:

```bash
cp .env.example .env
# set JWT_SECRET (openssl rand -base64 48) and KINBOARD_ORIGIN
chmod 600 .env
```

2) Start the service:

```bash
docker compose up -d
```

3) Access Kinboard at http://localhost:6565

The admin UI is at http://localhost:6565/admin and the kiosk display is at http://localhost:6565/kiosk.

`JWT_SECRET` and `KINBOARD_ORIGIN` are required and the stack refuses to start without them. `KINBOARD_ORIGIN` must be the exact `scheme://host:port` browsers and kiosks use - CORS is origin-exact and credentialed, and an empty value throws at startup.

The stack also joins an external `proxy` network so a reverse proxy container can
reach it by name at `kinboard:6565`. Create it once if it doesn't exist:

```bash
docker network create proxy
```

Caddy example (Caddy must be attached to the same `proxy` network):

```caddyfile
kinboard.example.com {
    reverse_proxy kinboard:6565
}
```

Behind a proxy you can drop the `ports:` block entirely so 6565 isn't exposed on
the LAN. Set `KINBOARD_ORIGIN` to the public URL, e.g. `https://kinboard.example.com`.

### Deploying as a Dockhand Git stack

[Dockhand](https://dockhand.pro/) can deploy this repo directly:

1) Add the repository as a Git source, pointed at `main`.
2) Create a stack from it using `docker-compose.yml`.
3) Add stack variables - `KINBOARD_ORIGIN` (and any optional overrides) as plain variables, `JWT_SECRET` as a **secret** so it is never written to disk.
4) Deploy. Enable webhook auto-sync to redeploy on push.

The compose file uses named volumes rather than relative bind mounts on purpose: Dockhand checks the repo out under `$DATA_DIR/git-repos`, so `./data`-style paths are neither stable nor predictable.

### Using Docker CLI

Run Kinboard with a single Docker command:

```bash
docker run -d \
  --name kinboard \
  -p 6565:6565 \
  -v kinboard-data:/app/data \
  -v kinboard-media:/app/wwwroot \
  -e Jwt__Secret="$(openssl rand -base64 48)" \
  -e Cors__AllowedOrigins__0=http://localhost:6565 \
  --restart unless-stopped \
  tyrongower/kinboard:latest
```

### Docker environment variables

Substituted by compose (see `.env.example`):

- `JWT_SECRET` (required), `KINBOARD_ORIGIN` (required)
- `KINBOARD_PORT`, `TZ`, `KINBOARD_IMAGE`, `KINBOARD_TAG`, `KINBOARD_CONTAINER_NAME`

Read directly by the backend:

- `Jwt__Secret`: JWT signing key
- `ConnectionStrings__DefaultConnection`: SQLite path, e.g. `Data Source=/app/data/kinboard.db`
- `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, etc.: allowed CORS origins for production
- Any other backend setting, using `__` for nesting (see Configuration section)

### Data persistence

Two volumes are required - `/app/data` alone is not enough:

- `/app/data` - SQLite database
- `/app/wwwroot` - uploaded avatars and job images (written relative to the app's working directory, not under `/app/data`)

Migrating an existing install? Load the files into the named volumes before the first start, since the backend applies EF migrations on boot and schema upgrades are one-way:

```bash
docker compose create
docker cp kinboard.db kinboard:/app/data/kinboard.db
docker cp wwwroot/. kinboard:/app/wwwroot/
docker compose up -d
```

Back up both volumes together:

```bash
docker exec kinboard sh -c 'cd /app/data && tar cz kinboard.db' > kinboard-db.tgz
docker exec kinboard tar cz -C /app wwwroot > kinboard-media.tgz
```

---

## Configuration

Backend (`backend/Kinboard.Api`):
- `ConnectionStrings:DefaultConnection` (SQLite file path by default)
- `Cors:AllowedOrigins` (array of allowed origins for Production)
- `ASPNETCORE_ENVIRONMENT` (`Development` enables Swagger and permissive CORS)

Frontend (`frontend`):
- `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:5000`). If omitted, proxy routing is used.

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
