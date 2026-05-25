# Plan 01 — Foundation (existing Kotlin/Compose TV project)

**Goal**: Extend the existing `kinboard-tv` Android-TV app to prepare for the new Morning Path screen. Run pending backend migration. Extend the Kotlin `SiteSettings` model. Add Fraunces/Quicksand/Caveat fonts. Add a `MorningTheme` color palette. Add SVG drawable assets for weather + wear cues. Create an empty `MorningPathViewModel` reading all needed flows. Project must build green.

**Do NOT** create any new screen UI in this plan. UI is Plan 02. **Do NOT** modify `JobsScreen.kt`, `JobsViewModel.kt`, `MainActivity.kt`, or any existing component.

---

## Cold-start briefing (context cleared — read first)

You are working in `C:\Projects\Kinboard\`. Repo layout:

- `backend/Kinboard.Api/` — .NET 9 API. `SiteSettings` model + DTO already have a new `SchoolStartTime` field (added earlier). EF migration NOT run yet. Live deployment at `https://kinboard.gower.tools`.
- `frontend/` — Next.js. Admin form for `SchoolStartTime` already added under `SiteSettingsAdmin.tsx`. Do not modify.
- `kinboard-tv/` — **the project you will modify**. Kotlin + Jetpack Compose for TV. Retrofit + Coil + DataStore. Java 17. compileSdk 34, minSdk 26.
- `kinboard-mobile/` — Do not touch.
- `design-mockups/tv/04-morning-path-v2.html` + `.png` — pixel-accurate design reference.

Existing `kinboard-tv` structure (relevant subset):

```
kinboard-tv/app/src/main/
  AndroidManifest.xml
  java/com/kinboard/tv/
    MainActivity.kt                     # nav host
    data/api/{ApiClient, KinboardApi, SessionManager, TokenAuthenticator}.kt
    data/local/PreferencesManager.kt
    data/model/{AuthResponse, CalendarEvent, Job, JobAssignment, User, Weather}.kt
    ui/components/{JobItem, KinboardButton, KinboardTextField, PersonJobCard, ProgressBar, TodayCalendarCard, UserAvatar, WeatherWidget}.kt
    ui/screens/{JobsScreen, LoginScreen}.kt
    ui/theme/{Color, Dimensions, Theme, Type}.kt
    ui/viewmodel/{JobsViewModel, LoginViewModel}.kt
```

Real test backend credentials:
- Base URL: `https://kinboard.gower.tools`
- Kiosk pairing token: `ouERYfc7SE7o42LnPRThYxMSfM2PndP9L9T0DPSa0CE`
- After Plan 04 is shipped, family will pair their own production token via the existing Login screen.

`KinboardApi` already has: `authenticate`, `getJobs(date)`, `completeJob`, `uncompleteJob`, `getUsers`, `getSiteSettings`, `getWeather`, `getCalendarEvents(start,end)`. **No new API methods are needed** — both `completeJob` and `uncompleteJob` already exist.

---

## Step 1 — Run pending backend migration

```powershell
cd C:\Projects\Kinboard\backend\Kinboard.Api
dotnet ef migrations add AddSchoolStartTime
dotnet ef database update
```

Verify a new `*_AddSchoolStartTime.cs` file exists under `Migrations/`. If running locally, restart the API. If hitting the live `gower.tools` instance, deploy backend so `GET /api/sitesettings` returns the new field. Without this step, `schoolStartTime` will be missing from JSON and the countdown chip in Plan 02 will not fire.

Smoke-test:
```powershell
curl -X POST "https://kinboard.gower.tools/api/auth/kiosk/authenticate" -H "Content-Type: application/json" -d '{"token":"ouERYfc7SE7o42LnPRThYxMSfM2PndP9L9T0DPSa0CE"}'
# copy accessToken
curl "https://kinboard.gower.tools/api/sitesettings" -H "Authorization: Bearer <TOKEN>"
# expect `"schoolStartTime"` key in response
```

## Step 2 — Extend `SiteSettings` Kotlin model

Open `kinboard-tv/app/src/main/java/com/kinboard/tv/data/model/AuthResponse.kt`. The `SiteSettings` data class at the bottom only has 4 fields. Backend returns more. Replace the class with:

```kotlin
data class SiteSettings(
    @SerializedName("id")
    val id: Int,

    @SerializedName("defaultView")
    val defaultView: String,

    @SerializedName("completionMode")
    val completionMode: String? = null,

    @SerializedName("choresRefreshSeconds")
    val choresRefreshSeconds: Int? = null,

    @SerializedName("calendarRefreshSeconds")
    val calendarRefreshSeconds: Int? = null,

    @SerializedName("weatherRefreshSeconds")
    val weatherRefreshSeconds: Int? = null,

    @SerializedName("weatherLocation")
    val weatherLocation: String? = null,

    @SerializedName("schoolStartTime")
    val schoolStartTime: String? = null  // "HH:mm" 24h, null = hide countdown
)
```

Existing JobsViewModel reads `jobsRefreshSeconds`. Rename their reference to `choresRefreshSeconds` — backend uses `choresRefreshSeconds` (confirmed via live probe). Audit grep:

```powershell
Select-String -Path kinboard-tv\app\src\main\java -Pattern "jobsRefreshSeconds" -Recurse
```

If found, replace with `choresRefreshSeconds`. Do not break `JobsViewModel` — read it and patch the field name; do not touch logic.

## Step 3 — Add fonts

Use Google Fonts via Downloadable Fonts. Create `kinboard-tv/app/src/main/res/font/`:

1. Create `fraunces.xml`:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <font-family xmlns:app="http://schemas.android.com/apk/res-auto"
       app:fontProviderAuthority="com.google.android.gms.fonts"
       app:fontProviderPackage="com.google.android.gms"
       app:fontProviderQuery="name=Fraunces&amp;weight=900&amp;italic=1"
       app:fontProviderCerts="@array/com_google_android_gms_fonts_certs"
   />
   ```
2. Create `quicksand.xml` similarly with `name=Quicksand&weight=700`.
3. Create `caveat.xml` with `name=Caveat&weight=700`.
4. Provider certs: add `res/values/font_certs.xml` with the standard Google Play certs array (copy from any official Android docs sample).
5. Register fonts as preloaded in `res/values/preloaded_fonts.xml`.
6. Add to `AndroidManifest.xml` inside `<application>`:
   ```xml
   <meta-data android:name="preloaded_fonts" android:resource="@array/preloaded_fonts" />
   ```

Alternative if Downloadable Fonts has friction: download the .ttf files (`Fraunces-BlackItalic.ttf`, `Quicksand-Bold.ttf`, `Caveat-Bold.ttf`) and drop them in `res/font/` directly. Reference via `FontFamily(Font(R.font.fraunces_blackitalic))`.

## Step 4 — Add Morning palette + typography

Extend `kinboard-tv/app/src/main/java/com/kinboard/tv/ui/theme/Color.kt`. Append at the bottom (do NOT modify existing values used by `JobsScreen`):

```kotlin
// ── Morning Path palette (new screen) ──
val MorningInk = Color(0xFF2A2014)
val MorningInkSoft = Color(0xFF6B5A44)
val MorningRed = Color(0xFFE85A3A)
val MorningGold = Color(0xFFFFCE3B)
val MorningGoldDeep = Color(0xFFE09A14)
val MorningSkyTop = Color(0xFFA8D8F5)
val MorningSkyMid = Color(0xFFD6ECF9)
val MorningSkyB1 = Color(0xFFFBE9C6)
val MorningSkyB2 = Color(0xFFFFCF80)
val MorningKidWavBg = Color(0xFFFFD0E8)
val MorningKidWavInk = Color(0xFF9D2A6A)
val MorningKidMatBg = Color(0xFFCFE0FF)
val MorningKidMatInk = Color(0xFF1D4EA1)
val MorningPathTan1 = Color(0xFFEECF95)
val MorningPathTan2 = Color(0xFFCBA366)
val MorningPathGreen1 = Color(0xFFCCE4BE)
val MorningPathGreen2 = Color(0xFF9EC77F)
val MorningCueRain = Color(0xFFFFE3D6)
val MorningCueHeavy = Color(0xFFFFD0D0)
val MorningRainBlue = Color(0xFF3AA9FF)
val MorningRibbonEv = Color(0xFFFFF3D9)
```

Create a NEW file `kinboard-tv/app/src/main/java/com/kinboard/tv/ui/theme/MorningType.kt`:

```kotlin
package com.kinboard.tv.ui.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.kinboard.tv.R

object MorningFonts {
    val fraunces = FontFamily(/* TODO load Fraunces black italic */)
    val quicksand = FontFamily(/* TODO load Quicksand bold */)
    val caveat = FontFamily(/* TODO load Caveat bold */)
}

object MorningType {
    fun fraunces(size: Float, italic: Boolean = true, weight: FontWeight = FontWeight.Black) =
        TextStyle(
            fontFamily = MorningFonts.fraunces,
            fontWeight = weight,
            fontStyle = if (italic) FontStyle.Italic else FontStyle.Normal,
            fontSize = size.sp,
            lineHeight = (size * 0.9).sp,
            letterSpacing = (-0.02 * size / 10).sp
        )
    fun quicksand(size: Float, weight: FontWeight = FontWeight.Bold) =
        TextStyle(fontFamily = MorningFonts.quicksand, fontWeight = weight, fontSize = size.sp)
    fun caveat(size: Float, weight: FontWeight = FontWeight.Bold) =
        TextStyle(fontFamily = MorningFonts.caveat, fontWeight = weight, fontSize = size.sp, lineHeight = (size * 1.0).sp)
}
```

Replace the `/* TODO */` placeholders with the actual `Font(R.font.fraunces)` etc. once fonts are wired in Step 3.

## Step 5 — Bundle SVG drawables

Add to `kinboard-tv/app/build.gradle.kts` dependencies block if not already present:

```kotlin
implementation("androidx.core:core-splashscreen:1.0.1")
// Coil already supports SVG via this:
implementation("io.coil-kt:coil-svg:2.5.0")
```

Create `kinboard-tv/app/src/main/res/drawable/` files (use Android Studio's Vector Asset wizard or paste raw XML). Lift the SVG paths directly from `<defs>` in `design-mockups/tv/04-morning-path-v2.html`. Convert each to an Android Vector Drawable. Files needed:

Weather icons (64dp viewport):
- `weather_sun.xml`
- `weather_sun_cloud.xml`
- `weather_cloud.xml`
- `weather_rain.xml`
- `weather_heavy_rain.xml`

Wear cue icons (24dp viewport):
- `cue_raincoat.xml`
- `cue_coat.xml`
- `cue_jumper.xml`
- `cue_tshirt.xml`
- `cue_boots.xml`
- `cue_hat.xml`

Other icons:
- `ic_check.xml` (the heavy ink check used in stamps)
- `ic_trophy.xml` (gold goblet — used by Plan 04's all-done banner; bundle now to avoid revisiting drawables)

Conversion tip: each SVG `<symbol>` has a viewBox and a few `<path>` / `<circle>` / `<rect>` children. Android Vector Drawable XML mirrors this with `<vector android:viewportWidth="64" ...>` and `<path android:pathData=... android:fillColor=... android:strokeColor=... android:strokeWidth=.../>`. Convert numbers verbatim. Verify the rendered output in Android Studio's drawable preview pane.

## Step 6 — Helper functions in a new file `MorningHelpers.kt`

Create `kinboard-tv/app/src/main/java/com/kinboard/tv/ui/screens/morning/MorningHelpers.kt`:

```kotlin
package com.kinboard.tv.ui.screens.morning

import androidx.annotation.DrawableRes
import com.kinboard.tv.R
import com.kinboard.tv.data.model.ForecastItem
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

@DrawableRes
fun weatherIconFor(f: ForecastItem): Int {
    val cond = (f.conditionText ?: "").lowercase()
    if (f.totalPrecipMm >= 15.0) return R.drawable.weather_heavy_rain
    if (f.chanceOfRainPercent >= 60) return R.drawable.weather_rain
    if ("partly" in cond || "sun" in cond && "cloud" in cond) return R.drawable.weather_sun_cloud
    if ("cloud" in cond || "overcast" in cond || "mist" in cond) return R.drawable.weather_cloud
    return R.drawable.weather_sun
}

data class WearCue(val label: String, @DrawableRes val iconA: Int, @DrawableRes val iconB: Int? = null)

fun wearCueFor(f: ForecastItem): WearCue {
    if (f.totalPrecipMm >= 15.0) return WearCue("coat + boots", R.drawable.cue_raincoat, R.drawable.cue_boots)
    if (f.chanceOfRainPercent >= 60) return WearCue("raincoat", R.drawable.cue_raincoat)
    if (f.maxTempC <= 13.0) return WearCue("coat", R.drawable.cue_coat)
    if (f.maxTempC <= 18.0) return WearCue("jumper", R.drawable.cue_jumper)
    if (f.maxTempC <= 24.0) return WearCue("t-shirt", R.drawable.cue_tshirt)
    return WearCue("sun hat", R.drawable.cue_hat)
}

/** Returns minutes remaining until `schoolStartTime` today, or null if already past or null input. */
fun minutesUntilSchool(schoolStartTime: String?, now: LocalDateTime = LocalDateTime.now()): Int? {
    if (schoolStartTime.isNullOrBlank()) return null
    val t = runCatching { LocalTime.parse(schoolStartTime, DateTimeFormatter.ofPattern("HH:mm")) }.getOrNull()
        ?: runCatching { LocalTime.parse(schoolStartTime) }.getOrNull() ?: return null
    val target = LocalDateTime.of(now.toLocalDate(), t)
    val mins = Duration.between(now, target).toMinutes().toInt()
    return if (mins in 1..360) mins else null  // only show in 6h window before school
}

/** Parse calendar event start/end (mix of UTC-Z and naked local). Returns local zoned datetime. */
fun parseEventTime(value: String): ZonedDateTime? = runCatching {
    java.time.Instant.parse(value).atZone(java.time.ZoneId.systemDefault())
}.getOrNull() ?: runCatching {
    LocalDateTime.parse(value).atZone(java.time.ZoneId.systemDefault())
}.getOrNull() ?: runCatching {
    LocalDate.parse(value).atStartOfDay(java.time.ZoneId.systemDefault())
}.getOrNull()
```

## Step 7 — Create `MorningPathViewModel`

`kinboard-tv/app/src/main/java/com/kinboard/tv/ui/viewmodel/MorningPathViewModel.kt`:

Read existing `JobsViewModel` first as reference for patterns (Retrofit calls, coroutine scope, polling). Adopt the same conventions.

```kotlin
package com.kinboard.tv.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.data.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

data class MorningUiState(
    val users: List<User> = emptyList(),
    val jobs: List<Job> = emptyList(),
    val weather: WeatherData? = null,
    val calendarEvents: List<CalendarEvent> = emptyList(),
    val siteSettings: SiteSettings? = null,
    val now: LocalDateTime = LocalDateTime.now(),
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val focusedKidIndex: Int = 0,
    val focusedStoneIndex: Int = 0,
    /** Per kid id → assignmentId that just toggled to complete (for celebrating once). */
    val celebrateAssignmentId: Int? = null,
)

class MorningPathViewModel : ViewModel() {
    private val api = ApiClient.api
    private val _state = MutableStateFlow(MorningUiState())
    val state: StateFlow<MorningUiState> = _state.asStateFlow()
    private val dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    init { loadAll(); startPolling(); tickClock() }

    private fun loadAll() = viewModelScope.launch {
        try {
            val today = LocalDate.now()
            val settingsResp = api.getSiteSettings(); val settings = settingsResp.body()
            val usersResp = api.getUsers(); val users = usersResp.body() ?: emptyList()
            val jobsResp = api.getJobs(today.format(dateFmt)); val jobs = jobsResp.body() ?: emptyList()
            val weatherResp = api.getWeather(); val weather = weatherResp.body()
            val calStart = today.format(dateFmt); val calEnd = today.plusDays(1).format(dateFmt)
            val calResp = api.getCalendarEvents(calStart, calEnd); val cal = calResp.body() ?: emptyList()
            _state.update { it.copy(
                users = users.filter { u -> u.id > 0 }.sortedBy { u -> u.displayOrder ?: 0 },
                jobs = jobs, weather = weather, calendarEvents = cal,
                siteSettings = settings, isLoading = false, errorMessage = null
            ) }
        } catch (e: Exception) {
            _state.update { it.copy(isLoading = false, errorMessage = e.message) }
        }
    }

    private fun startPolling() = viewModelScope.launch {
        while (true) {
            val s = _state.value.siteSettings
            val choresMs = (s?.choresRefreshSeconds ?: 10) * 1000L
            delay(choresMs)
            try {
                val today = LocalDate.now().format(dateFmt)
                val jobs = api.getJobs(today).body() ?: emptyList()
                val users = api.getUsers().body() ?: emptyList()
                _state.update { it.copy(jobs = jobs, users = users) }
            } catch (_: Exception) { /* keep last good */ }
        }
    }
    // similar pollers for weather (weatherRefreshSeconds, default 1800) and calendar (calendarRefreshSeconds, default 30)

    private fun tickClock() = viewModelScope.launch {
        while (true) { delay(30_000); _state.update { it.copy(now = LocalDateTime.now()) } }
    }

    fun setFocus(kidIndex: Int, stoneIndex: Int) {
        _state.update { it.copy(focusedKidIndex = kidIndex, focusedStoneIndex = stoneIndex) }
    }

    fun toggleAssignment(job: Job, assignment: JobAssignment) = viewModelScope.launch {
        val today = LocalDate.now().format(dateFmt)
        try {
            if (assignment.isCompleted == true) {
                api.uncompleteJob(job.id, assignment.id, today)
            } else {
                api.completeJob(job.id, assignment.id, today)
                _state.update { it.copy(celebrateAssignmentId = assignment.id) }
            }
            // refresh
            val jobs = api.getJobs(today).body() ?: emptyList()
            _state.update { it.copy(jobs = jobs) }
        } catch (_: Exception) { /* surface in error state */ }
    }

    fun clearCelebrate() = _state.update { it.copy(celebrateAssignmentId = null) }
}
```

This file produces NO UI yet. Plan 02 + 03 consume `state` flow.

## Step 8 — Smoke build

```powershell
cd C:\Projects\Kinboard\kinboard-tv
.\gradlew assembleDebug
```

Build must succeed. Fix any compile errors (typos, missing imports) before continuing.

---

## ⛔ Built-in review checkpoint #1 — after Step 2

Verify:
- [ ] `SiteSettings.kt` has 8 fields (id, defaultView, completionMode, choresRefreshSeconds, calendarRefreshSeconds, weatherRefreshSeconds, weatherLocation, schoolStartTime)
- [ ] No lingering `jobsRefreshSeconds` in the codebase (`grep -r jobsRefreshSeconds kinboard-tv` returns 0 hits)
- [ ] `JobsViewModel` still compiles after the field rename

## ⛔ Built-in review checkpoint #2 — after Step 5

Open Android Studio. For each of the 13 new drawable XML files in `res/drawable/`, click Preview pane and confirm the shape renders correctly. Compare side-by-side with the corresponding `<symbol>` in the HTML mock. Any blank previews = broken pathData = fix before continuing.

## ⛔ Built-in review checkpoint #3 — after Step 7

Run a smoke unit test (write inline in `MorningPathViewModel` if no test infra exists):

```kotlin
fun selfTest() {
    val f = ForecastItem(date="2026-05-26", avgTempC=14.6, minTempC=12.1, maxTempC=18.8,
        totalPrecipMm=0.17, chanceOfRainPercent=89, conditionIconUrl=null, conditionText="Patchy rain")
    require(wearCueFor(f).label == "raincoat")
    require(weatherIconFor(f) == R.drawable.weather_rain)
    require(minutesUntilSchool("08:25", LocalDateTime.of(2026,5,26,7,38)) == 47)
    require(minutesUntilSchool(null) == null)
}
```

Manually call from `ViewModel.init { selfTest() }` once during dev (delete the call before Plan 04).

---

## Success criteria

1. **Backend live**: `GET /api/sitesettings` over the wire returns a JSON object containing the key `schoolStartTime` (value may be null).
2. **Build**: `.\gradlew assembleDebug` produces an APK with zero errors.
3. **Model**: `SiteSettings` Kotlin class has all 8 fields. `JobsViewModel` no longer references the old `jobsRefreshSeconds`.
4. **Fonts**: Fraunces, Quicksand, Caveat are loadable. A trivial preview composable that renders `Text("Hello", style=MorningType.fraunces(48f))` shows italic black serif (not the default Roboto).
5. **Drawables**: 13 vector XML drawables in `res/drawable/` render correctly in Android Studio preview.
6. **Theme**: `MorningInk`, `MorningRed`, etc. are accessible from any `@Composable` via simple import.
7. **ViewModel**: `MorningPathViewModel.state` emits a populated `MorningUiState` (non-empty users/jobs) within 5 seconds of instantiation when authenticated against the live backend.
8. **No regressions**: existing screens — Login + Jobs — open and function exactly as before. `JobsScreen.kt` is byte-identical to its previous state.

---

## Hand-off note → Plan 02

Commit:
```
feat(tv): plan 01 — foundation for Morning Path screen

- Extend SiteSettings model with schoolStartTime + missing refresh fields
- Add Fraunces / Quicksand / Caveat fonts via Downloadable Fonts
- Add Morning color tokens + typography helper
- Add 13 vector drawables (weather + wear cues + check + trophy)
- Add MorningPathViewModel reading users/jobs/weather/calendar/settings
- Add MorningHelpers (icon mapping, wear cue, minutesUntilSchool, event time parse)
- Run EF migration AddSchoolStartTime

No UI changes yet. Existing JobsScreen unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Plan 02 builds the actual `MorningPathScreen` (scenery + top bar + calendar ribbon) consuming the ViewModel from this plan. Nav still points to Jobs — that swap happens in Plan 03.
