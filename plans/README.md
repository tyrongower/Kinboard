# Kinboard TV — Morning Path Screen — Implementation Plans

Add a new **Morning Path** screen to the **existing** Android-TV app at `kinboard-tv/` (Kotlin + Jetpack Compose for TV). Match the design at `design-mockups/tv/04-morning-path-v2.html` + `04-morning-path-v2.png`.

## Scope rules (read once, enforce in every plan)

- **DO NOT** create a new Android project. Project is `kinboard-tv/` (Kotlin/Compose-for-TV with Retrofit, Coil, DataStore already wired).
- **DO NOT** delete or modify `JobsScreen.kt`, `JobsViewModel.kt`, or any existing component. They stay for fallback / dev reference.
- **DO** add a new screen `MorningPathScreen.kt` + `MorningPathViewModel.kt`.
- **DO** add new shared components in `ui/components/morning/`.
- **DO** add fonts (Fraunces, Quicksand, Caveat) and extend the color palette.
- **DO** flip the nav route in `MainActivity.kt`: after login, navigate to `morning` instead of `jobs`. Keep both routes registered.
- **DO** extend `SiteSettings` model to include `schoolStartTime`, `weatherLocation`, `calendarRefreshSeconds`, `weatherRefreshSeconds` (backend already returns them; client model is incomplete).
- **DO** reuse `KinboardApi`, `SessionManager`, `TokenAuthenticator`, existing data models (`User`, `Job`, `JobAssignment`, `WeatherData`, `ForecastItem`, `CalendarEvent`).
- Backend already modified earlier: `SiteSettings.SchoolStartTime` field + admin form exist. EF migration is pending (Plan 01 runs it).

## Plans (run in order, each after a context clear)

| # | File | Outcome |
|---|---|---|
| 1 | `01-foundation.md` | Run EF migration. Extend `SiteSettings` Kotlin model. Add Fraunces/Quicksand/Caveat fonts. Add `MorningTheme` palette. Add SVG drawable assets. Add `MorningPathViewModel` (no UI yet). Project compiles. |
| 2 | `02-shell.md` | Add `MorningPathScreen` with scenery bg + top bar (brand + countdown + 3-day weather) + bottom calendar ribbon. Middle band empty. Nav still points to Jobs (don't swap yet). Visual parity for top+bottom regions. |
| 3 | `03-lanes.md` | Add `KidLaneCard`, `StonePath`, `StoneTile`, `Walker`. D-pad nav L/R within lane, U/D between lanes, OK toggles complete via API. Filter completed per `hideCompletedInKiosk`. Update `MainActivity` to route Login → `morning`. |
| 4 | `04-polish-ship.md` | Confetti on complete (konfetti lib). All-done trophy banner. Loading/error/empty states. Performance pass. Signed APK build. Sideload + 15-item acceptance checklist. |

## Master success criteria (verified end of Plan 04)

Existing TV (real device) launches the app → Login screen (unchanged) → after kiosk auth → Morning Path screen (new) displaying both Waverley + Matilda lanes with real stones, animated walker on NEXT, D-pad navigation works, OK toggles completion against API, weather strip shows 3-day forecast with auto wear-cue, countdown reads `schoolStartTime`, calendar ribbon shows today's events. Old `JobsScreen.kt` file still exists in repo, untouched.

## Design references (open before every plan)

- HTML mock: `design-mockups/tv/04-morning-path-v2.html` — open in Chrome at 1920×1080
- Screenshot: `design-mockups/tv/04-morning-path-v2.png` — pixel reference
- Real test backend: `https://kinboard.gower.tools`
- Kiosk test token: `ouERYfc7SE7o42LnPRThYxMSfM2PndP9L9T0DPSa0CE`
- Test users: Waverley (id=2, #EC4899), Matilda (id=3, #3B82F6). Stanthorpe AU weather.

## Each plan is self-contained

Every plan starts with a "Cold-start briefing" section assuming zero prior context. Built-in review checkpoints (⛔) at logical stages — do not skip ahead.
