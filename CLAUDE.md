# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kinboard is a family household dashboard with chores (jobs), calendar, shopping lists, and kiosk display. It's a monorepo containing a .NET backend, Next.js frontend, and Android mobile/TV applications.

**Important**: This project was implemented with heavy use of AI as an experiment. The codebase has not undergone full human review.

## Repository Structure

- **backend/Kinboard.Api/** - .NET 9 Web API with Entity Framework Core and SQLite
- **frontend/** - Next.js 16 + React 19 web application
- **kinboard-mobile/** - Android mobile app (Jetpack Compose + Kotlin)
- **kinboard-tv/** - Android TV app (Jetpack Compose + Kotlin)
- **install/** - Debian/Ubuntu LXC installer script

## Development Commands

### Backend (.NET API)

```bash
cd backend/Kinboard.Api

# Restore dependencies
dotnet restore

# Run development server (typically port 5197)
dotnet run

# Build for production
dotnet build -c Release
dotnet publish -c Release -o ./publish

# Database migrations
dotnet ef migrations add MigrationName
dotnet ef database update

# Run tests (if present)
dotnet test
```

The backend runs on port 5197 in development by default. Swagger/OpenAPI is available at `/scalar/v1` in Development mode only.

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

**Environment Variables**:
- `NEXT_PUBLIC_API_URL` - Backend API URL (defaults to http://localhost:5000 if not set)
- For local development, set to match your backend port: `set NEXT_PUBLIC_API_URL=http://localhost:5197` (Windows) or `export NEXT_PUBLIC_API_URL=http://localhost:5197` (Linux/Mac)

### Mobile App (Android)

```bash
cd kinboard-mobile

# Build debug APK
./gradlew assembleDebug

# Build release APK (requires signing config)
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug

# Run tests
./gradlew test
```

The mobile app uses:
- Jetpack Compose for UI
- Hilt for dependency injection
- Retrofit for API calls
- Kotlin Coroutines + Flow for async operations

### TV App (Android TV)

```bash
cd kinboard-tv

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on connected TV/device
./gradlew installDebug
```

The TV app is optimized for D-pad navigation with custom focus management.

## Architecture

### Backend Architecture

**Technology**: ASP.NET Core 9, Entity Framework Core, SQLite

**Key Components**:
- **Controllers/** - API endpoints (AuthController, JobsController, CalendarsController, ShoppingController, etc.)
- **Services/** - Business logic (TokenService, CalendarService, PerformanceStorage)
- **Data/** - DbContext and database access (AppDbContext)
- **Models/** - Domain entities (Job, User, Calendar, ShoppingList, RefreshToken, KioskToken)
- **Dtos/** - Data transfer objects for API requests/responses
- **Middleware/** - Custom middleware (e.g., performance tracking)
- **Migrations/** - EF Core database migrations

**Database**: SQLite by default, configured in `appsettings.json` via `ConnectionStrings:DefaultConnection`

**Authentication System**: Dual authentication approach
- **Admin Auth**: Email/password with JWT access tokens (15 min) + rotating refresh tokens (7 days) stored in HttpOnly cookies
- **Kiosk Auth**: Long-lived token-based authentication for display devices
- See `AUTHENTICATION.md` for complete details on authentication flows, security features, and API endpoints

**Key Patterns**:
- Services registered in `Program.cs` with dependency injection
- JWT Bearer authentication configured with issuer/audience validation
- CORS configured differently for Development (permissive) vs Production (restricted origins)
- Serilog for structured logging

### Frontend Architecture

**Technology**: Next.js 16 (App Router), React 19, TailwindCSS v4

**Key Structure**:
- **app/** - Next.js App Router pages and layouts
  - **admin/** - Admin dashboard UI (jobs, calendars, shopping, users, settings)
  - **kiosk/** - Kiosk display mode for wall-mounted displays
  - **login/** - Admin login
  - **setup/** - Initial setup wizard
- **components/** - React components organized by feature (admin, auth, kiosk, shared)
- **contexts/** - React contexts for global state (AuthContext)
- **lib/** - Utility functions and API client setup
- **proxy.ts** - API proxy configuration for development

**Authentication Flow**:
- Access tokens stored in memory (not localStorage)
- Refresh tokens in HttpOnly cookies
- AuthContext provides `authFetch` wrapper for authenticated API calls
- Auto-refresh logic triggers at 14 minutes (before 15 min expiration)

**API Communication**:
- All API calls use `authFetch` from AuthContext (adds Bearer token)
- API base URL configured via `NEXT_PUBLIC_API_URL` or defaults to same-origin

### Mobile App Architecture

**Technology**: Android (Kotlin), Jetpack Compose, Hilt DI, Retrofit, Room (potential)

**Package Structure** (`io.tyrongower.kinboard`):
- **data/api/** - API client setup (Retrofit, OkHttp interceptors)
- **data/local/** - Local storage (TokenManager using SharedPreferences)
- **data/model/** - Data models matching backend DTOs
- **data/repository/** - Repository layer (AuthRepository, JobRepository, CalendarRepository, ShoppingRepository)
- **ui/** - Compose UI screens and components
- **di/** - Hilt dependency injection modules

**Key Features**:
- Material 3 design system
- Supports Calendar, Jobs, and Shopping features
- See `CALENDAR_IMPLEMENTATION_SUMMARY.md` and `SHOPPING_IMPLEMENTATION_SUMMARY.md` for detailed implementation docs

### TV App Architecture

**Technology**: Android TV (Kotlin), Jetpack Compose for TV, Retrofit

**Package Structure** (`com.kinboard.tv`):
- **data/api/** - API client (ApiClient, KinboardApi, SessionManager)
- **data/local/** - Preferences storage (PreferencesManager)
- **data/model/** - Data models (Job, User, AuthResponse)
- **ui/** - Compose UI screens optimized for TV (JobsScreen with D-pad navigation)
- **MainActivity** - Single activity with Compose

**TV-Specific Features**:
- Custom focus management for D-pad navigation
- Optimized horizontal layout for 4 person cards across screen
- Visual focus indicators (borders, shadows)
- Kiosk token-based authentication
- See `KINBOARD_TV_DESIGN_SPEC.md` for complete design system and API specifications

## Important Configuration Files

- **backend/Kinboard.Api/appsettings.json** - Main backend config (JWT secret, DB connection, CORS)
- **backend/Kinboard.Api/appsettings.Development.json** - Development overrides (permissive CORS)
- **backend/Kinboard.Api/appsettings.Production.sample.json** - Production config template
- **frontend/.env.production** - Frontend production env vars (created by installer)
- **docker-compose.yml** - Docker deployment configuration (port 6565)
- **Dockerfile** - Multi-stage Docker build (backend + frontend)

## API Endpoints Overview

All endpoints require `Authorization: Bearer {token}` except login/authenticate endpoints.

**Authentication**:
- `POST /api/auth/admin/login` - Admin login (email + password)
- `POST /api/auth/admin/refresh` - Refresh access token (uses cookie)
- `POST /api/auth/admin/logout` - Admin logout
- `POST /api/auth/kiosk/authenticate` - Kiosk authentication (token-based)
- `POST /api/auth/kiosk/tokens` - Create kiosk token (admin only)
- `GET /api/auth/kiosk/tokens` - List kiosk tokens (admin only)
- `DELETE /api/auth/kiosk/tokens/{id}` - Revoke kiosk token (admin only)

**Core Resources**:
- `/api/jobs` - Job (chore) management with assignments and recurrence
- `/api/users` - User management (family members)
- `/api/calendars` - Calendar source management (iCal URLs)
- `/api/calendar-events` - Fetch parsed calendar events
- `/api/shoppinglists` - Shopping list management
- `/api/shoppingitems` - Shopping list items
- `/api/sitesettings` - Global settings (default view, completion mode, refresh intervals)
- `/api/health` - Health check endpoint

**Roles**:
- **Admin**: Full access to all endpoints
- **Kiosk**: Read-only access, can mark jobs complete, limited user/calendar access

## Common Development Workflows

### Running Full Stack Locally

1. Start backend: `cd backend/Kinboard.Api && dotnet run`
2. Start frontend: `cd frontend && npm run dev`
3. Set frontend env var to match backend port if needed
4. Access at http://localhost:3000

### Adding a Database Migration

1. Modify models in `backend/Kinboard.Api/Models/`
2. `cd backend/Kinboard.Api`
3. `dotnet ef migrations add YourMigrationName`
4. `dotnet ef database update`
5. Commit both the model changes and generated migration files

### Creating a New API Endpoint

1. Add DTOs in `Dtos/` if needed
2. Create/modify controller in `Controllers/`
3. Add service logic in `Services/` if complex business logic required
4. Update frontend API client in `frontend/src/lib/`
5. Consider authorization requirements (admin vs kiosk)

### Adding a New Frontend Page

1. Create route in `frontend/src/app/` following App Router conventions
2. Add components in `frontend/src/components/`
3. Use `authFetch` from AuthContext for authenticated API calls
4. Follow existing patterns for layout and error handling

## Docker Deployment

The project includes a multi-stage Dockerfile that builds both backend and frontend into a single container.

```bash
# Build image
docker build -t kinboard:latest .

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -d -p 6565:6565 -v kinboard-data:/app/data tyrongower/kinboard:latest
```

**Published Image**: `tyrongower/kinboard:latest` (available on Docker Hub)

Access at http://localhost:6565 (admin: `/admin`, kiosk: `/kiosk`)

## Security Considerations

- **JWT Secret**: Must be set in `appsettings.json` (`Jwt:Secret`) - use `openssl rand -base64 32` to generate
- **HTTPS**: Required in production, cookies marked as Secure
- **CORS**: Configure `Cors:AllowedOrigins` restrictively in production
- **Password Hashing**: BCrypt with automatic salts
- **Token Lifetimes**: Access tokens expire in 15 minutes, refresh tokens in 7 days
- Never commit secrets, credentials, or production `appsettings.json`

## Testing & Quality

- Backend: Use `dotnet test` (test projects if present)
- Frontend: Use `npm run lint` for ESLint checks
- Manual testing: Use Swagger UI at `/scalar/v1` in Development mode

## Branch Strategy

- **main** - Primary branch for stable releases
- **mobile-app** - Current working branch for mobile/TV app development

When creating PRs, target the `main` branch unless working on specific feature branches.
