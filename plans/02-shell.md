# Plan 02 — Morning Path screen shell (header + ribbon)

**Goal**: Add `MorningPathScreen.kt` containing the scenery background, the top header (brand + countdown chip + 3-day weather strip), and the bottom calendar ribbon. The middle band where two kid lanes will live stays empty.

By end of Plan 02: navigating to `morning` route renders a pixel-close match to the **top 280dp** and **bottom 175dp** of the reference screenshot. Real data drives weather + calendar + countdown.

**Do NOT** build kid lanes, stones, walker, or D-pad in this plan — those are Plan 03. **Do NOT** flip the nav route yet — the screen is registered as a route but the user can only reach it manually for now.

---

## Cold-start briefing (context cleared — read first)

You are in `C:\Projects\Kinboard\kinboard-tv/`. Plan 01 done and committed. Confirm before starting:
- `data/model/AuthResponse.kt` → `SiteSettings` has 8 fields including `schoolStartTime`
- `ui/theme/Color.kt` has `MorningInk`, `MorningRed`, etc.
- `ui/theme/MorningType.kt` exists with Fraunces/Quicksand/Caveat helpers
- `ui/screens/morning/MorningHelpers.kt` exists with `wearCueFor`, `weatherIconFor`, `minutesUntilSchool`, `parseEventTime`
- `ui/viewmodel/MorningPathViewModel.kt` exists and compiles
- 13 vector drawables in `res/drawable/`

If any are missing, return to Plan 01 and finish first.

Design references (open before starting):
- `design-mockups/tv/04-morning-path-v2.html` in Chrome at 1920×1080 — use DevTools to inspect element padding, font sizes, colors.
- `design-mockups/tv/04-morning-path-v2.png` — pixel reference.

The Compose-for-TV `tv-material` library is already on the classpath. Use `androidx.tv.material3.*` for focusable elements, `androidx.compose.material3.*` for general primitives, and `androidx.compose.foundation.*` for Box/Row/Column/Canvas.

Layout strategy: design canvas is 1920×1080 dp. Use a fixed-pixel Box scaled with `Modifier.aspectRatio(16f/9f).wrapContentSize()` inside a `BoxWithConstraints` so the whole UI scales proportionally:

```kotlin
@Composable
fun MorningPathScreen(state: MorningUiState, vm: MorningPathViewModel) {
    BoxWithConstraints(Modifier.fillMaxSize()) {
        val scale = minOf(maxWidth / 1920.dp, maxHeight / 1080.dp)
        Box(Modifier.size(1920.dp, 1080.dp).scale(scale.value).align(Alignment.Center)) {
            MorningCanvas(state, vm)
        }
    }
}
```

This is the simplest scale-to-fit. All children use absolute 1920×1080 layout units.

---

## Step 1 — Register `morning` route in NavHost

Open `kinboard-tv/app/src/main/java/com/kinboard/tv/MainActivity.kt`. Extend the `Screen` sealed class:

```kotlin
sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Jobs : Screen("jobs")
    object Morning : Screen("morning")  // NEW
}
```

Add a new `composable(Screen.Morning.route)` block in `NavHost`. **DO NOT** change `startDestination` and **DO NOT** change the post-login navigation in the `LaunchedEffect`. The Jobs route remains the default. Plan 03 flips this.

```kotlin
composable(Screen.Morning.route) {
    val vm: MorningPathViewModel = viewModel()
    val s by vm.state.collectAsState()
    MorningPathScreen(state = s, vm = vm)
}
```

For development, temporarily flip the post-login nav target to `Screen.Morning.route` while building. **Revert before commit.**

## Step 2 — Create `MorningPathScreen.kt` skeleton

`kinboard-tv/app/src/main/java/com/kinboard/tv/ui/screens/morning/MorningPathScreen.kt`:

```kotlin
package com.kinboard.tv.ui.screens.morning

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.kinboard.tv.ui.viewmodel.MorningPathViewModel
import com.kinboard.tv.ui.viewmodel.MorningUiState

@Composable
fun MorningPathScreen(state: MorningUiState, vm: MorningPathViewModel) {
    BoxWithConstraints(Modifier.fillMaxSize().background(Color.Black)) {
        val sx = maxWidth.value / 1920f
        val sy = maxHeight.value / 1080f
        val scale = minOf(sx, sy)
        Box(
            Modifier.size(1920.dp, 1080.dp).align(Alignment.Center).scale(scale)
        ) {
            SceneryBackground(Modifier.matchParentSize())
            MorningTopBar(state = state, modifier = Modifier
                .padding(top = 36.dp, start = 60.dp, end = 60.dp)
                .fillMaxWidth())
            // Middle band reserved for kid lanes — Plan 03 fills this
            // y range: 280 to 905
            MorningCalendarRibbon(events = state.calendarEvents, modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 36.dp, start = 60.dp, end = 60.dp)
                .fillMaxWidth())
        }
    }
}
```

## Step 3 — `SceneryBackground`

`ui/screens/morning/components/SceneryBackground.kt`:

```kotlin
@Composable
fun SceneryBackground(modifier: Modifier = Modifier) {
    Box(modifier.background(
        Brush.verticalGradient(
            0.00f to MorningSkyTop,
            0.36f to MorningSkyMid,
            0.64f to MorningSkyB1,
            1.00f to MorningSkyB2,
        )
    )) {
        // 4 fluffy clouds — see HTML mock .cloud-big c1..c4 positions
        Cloud(x = 80.dp,   y = 50.dp,  w = 220.dp, h = 64.dp, alpha = 0.94f)
        Cloud(x = 520.dp,  y = 130.dp, w = 280.dp, h = 72.dp, alpha = 0.85f)
        Cloud(x = 980.dp,  y = 60.dp,  w = 200.dp, h = 56.dp, alpha = 0.90f)
        Cloud(x = 1280.dp, y = 160.dp, w = 180.dp, h = 52.dp, alpha = 0.80f)
        // mist band near hills — 60dp tall, 130dp from bottom
        Box(Modifier
            .fillMaxWidth().height(60.dp)
            .offset(y = (1080-130-60).dp)
            .background(Brush.verticalGradient(listOf(Color.Transparent, Color.White.copy(alpha=0.4f))))
        )
    }
}

@Composable
private fun Cloud(x: Dp, y: Dp, w: Dp, h: Dp, alpha: Float) {
    Box(Modifier.offset(x, y).size(w, h)) {
        // Use a single rounded rectangle + two overlapping circles to mimic the CSS
        Box(Modifier.fillMaxSize().clip(RoundedCornerShape(60.dp)).background(Color.White.copy(alpha=alpha)))
        Box(Modifier.size(w*0.6f, h*1.2f).align(Alignment.TopStart)
            .offset(x = w*0.18f, y = -h*0.5f)
            .clip(CircleShape).background(Color.White.copy(alpha=alpha)))
        Box(Modifier.size(w*0.42f, h*0.96f).align(Alignment.TopStart)
            .offset(x = w*0.55f, y = -h*0.32f)
            .clip(CircleShape).background(Color.White.copy(alpha=alpha)))
    }
}
```

## Step 4 — `MorningTopBar`

`ui/screens/morning/components/MorningTopBar.kt`:

Three-column row. Brand on left (flex), countdown chip center (intrinsic), weather strip right (intrinsic). 30dp gap between.

```kotlin
@Composable
fun MorningTopBar(state: MorningUiState, modifier: Modifier = Modifier) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(30.dp), verticalAlignment = Alignment.Top) {
        Brand(state, Modifier.weight(1f))
        SchoolCountdownChip(state.siteSettings?.schoolStartTime, state.now)
        WeatherStrip(state.weather)
    }
}
```

### `Brand`
```
"Good morning!" — Fraunces italic 900, 84sp, ink, last "!" red
"tuesday · 26 may · {conditionText} · {tempC}°" — Quicksand 700, 24sp, ink-soft, uppercase letterSpacing .18em
[📍 location pill] — bottom; only renders if state.weather != null
```

Use `buildAnnotatedString` to make the last "!" red.

### `SchoolCountdownChip`

If `minutesUntilSchool(schoolStartTime, now) == null`, return `Spacer(0.dp)`. Otherwise:

```kotlin
@Composable
fun SchoolCountdownChip(schoolStartTime: String?, now: LocalDateTime) {
    val mins = minutesUntilSchool(schoolStartTime, now) ?: return
    Box(Modifier
        .rotate(-1.6f)
        .background(MorningRed, RoundedCornerShape(26.dp))
        .border(5.dp, MorningInk, RoundedCornerShape(26.dp))
        // 8dp ink "drop shadow" — implement via drawBehind drawing an offset ink rect
        .padding(horizontal = 28.dp, vertical = 14.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("school in".uppercase(), style = MorningType.quicksand(18f, FontWeight.ExtraBold).copy(
                color = Color(0xFFFFD9D0), letterSpacing = 0.22.em))
            Row(verticalAlignment = Alignment.LastBaseline) {
                Text("$mins", style = MorningType.fraunces(70f, italic = true).copy(color = Color.White))
                Spacer(Modifier.width(4.dp))
                Text("min", style = MorningType.quicksand(24f).copy(color = Color(0xFFFFD9D0)))
            }
            Text("be ready by $schoolStartTime", style = MorningType.caveat(30f).copy(color = Color(0xFFFFE9E2)))
        }
    }
}
```

The 8-dp ink "drop shadow" of the chip: wrap in a `Modifier.drawBehind { drawRoundRect(MorningInk, topLeft = Offset(0, 8.dp.toPx()), ...) }`. Match the design's `box-shadow: 0 8px 0 var(--ink)`.

### `WeatherStrip`

Three `WeatherDayCard`s, 200dp wide each, 14dp gap. First has TODAY badge.

```kotlin
@Composable
fun WeatherStrip(weather: WeatherData?) {
    val forecast = (weather?.forecast ?: emptyList()).take(3)
    Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        forecast.forEachIndexed { i, f ->
            WeatherDayCard(
                item = f, isToday = (i == 0),
                rotation = listOf(-3f, 1f, -1f)[i.coerceIn(0,2)],
                modifier = Modifier.width(200.dp))
        }
    }
}
```

`WeatherDayCard` chrome: white bg, 5dp ink border, 24dp radius, 8dp ink drop shadow, content stack:
1. Day label "TUESDAY" / "WEDNESDAY" / "THURSDAY" — Quicksand 800 22sp ink uppercase letterSpacing .06em
2. Sub date "26 May" — Quicksand 700 13sp ink-soft letterSpacing .14em
3. Vector icon 96dp — `Icon(painterResource(weatherIconFor(f)), null, modifier = Modifier.size(96.dp))`
4. Temp row: Fraunces italic 900 46sp `${maxTempC.toInt()}°` ink, then 30sp `${minTempC.toInt()}°` ink-soft
5. Rain pill: `💧 89%` Quicksand 800 16sp ink, `#CFE9FF` bg, 2.5dp ink border, 14dp radius, padding 2/10
6. Cue chip: row of cue icons (24dp) + label, `bgWearCue` color, 3dp ink border, 16dp radius

TODAY badge overlay: rotated -3deg pill positioned at `top=-14dp left=center`, red bg, ink border, 3-px ink shadow.

## Step 5 — `MorningCalendarRibbon`

`ui/screens/morning/components/MorningCalendarRibbon.kt`:

Outer `Box`: white bg, 5dp ink border, 26dp radius, 8dp ink drop shadow, height 140dp, rotation +0.2deg, padding 14/22.

Inner Row:
- Title column 240dp wide: "Today" Fraunces italic 900 52sp ink + sub "tue · N things on" Quicksand 700 14sp ink-soft uppercase
- Events Row (Expanded): up to 3 `EventCard`s

```kotlin
@Composable
fun MorningCalendarRibbon(events: List<CalendarEvent>, modifier: Modifier = Modifier) {
    val today = LocalDate.now()
    val visible = events
        .mapNotNull { ev -> parseEventTime(ev.start)?.let { it to ev } }
        .filter { it.first.toLocalDate() == today }
        .sortedBy { it.first }
        .take(3)
    if (visible.isEmpty()) return  // hide ribbon when nothing scheduled
    Box(modifier
        .height(140.dp).rotate(0.2f)
        .background(Color.White, RoundedCornerShape(26.dp))
        .border(5.dp, MorningInk, RoundedCornerShape(26.dp))
        .padding(horizontal = 22.dp, vertical = 14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(20.dp)) {
            Column(Modifier.width(240.dp)) {
                Text("Today", style = MorningType.fraunces(52f).copy(color = MorningInk))
                Text("${today.dayOfWeek.shortName().lowercase()} · ${visible.size} things on",
                    style = MorningType.quicksand(14f).copy(color = MorningInkSoft, letterSpacing = 0.18.em))
            }
            Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                visible.forEachIndexed { i, (start, ev) ->
                    EventCard(start = start, ev = ev, rotation = listOf(-1f, 0.6f, -0.8f)[i], modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun EventCard(start: ZonedDateTime, ev: CalendarEvent, rotation: Float, modifier: Modifier) {
    val end = parseEventTime(ev.end)
    val timeText = if (ev.allDay == true) "ALL DAY"
                   else "${start.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"))} – ${end?.toLocalTime()?.format(DateTimeFormatter.ofPattern("HH:mm")) ?: "?"}"
    val dotColor = runCatching { Color(android.graphics.Color.parseColor(ev.colorHex)) }.getOrDefault(Color(0xFF8B5CF6))
    Box(modifier
        .rotate(rotation)
        .background(MorningRibbonEv, RoundedCornerShape(18.dp))
        .border(3.5.dp, MorningInk, RoundedCornerShape(18.dp))
        .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.size(16.dp).clip(CircleShape).background(dotColor).border(3.dp, MorningInk, CircleShape))
            Column {
                Text(timeText, style = MorningType.quicksand(13f, FontWeight.ExtraBold).copy(color = MorningInkSoft, letterSpacing = 0.18.em))
                Text(ev.title ?: "", style = MorningType.quicksand(22f, FontWeight.ExtraBold).copy(color = MorningInk), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}
```

## Step 6 — Drop shadow helper

The "0 8px 0 ink" CSS shadow is non-blurred, just a hard offset. Compose `shadow` modifier uses blur. Implement a custom modifier:

```kotlin
fun Modifier.hardShadow(offsetY: Dp, color: Color, radius: Dp): Modifier =
    drawBehind {
        drawRoundRect(color = color, topLeft = Offset(0f, offsetY.toPx()),
            size = size, cornerRadius = CornerRadius(radius.toPx()))
    }.then(this)
```

Apply this BEFORE the foreground background. Use on every card that has the trademark ink drop-shadow.

## Step 7 — Wire `MorningPathViewModel` data through

The `MorningTopBar(state)` and `MorningCalendarRibbon(state.calendarEvents)` calls in Step 2 already receive data from the StateFlow via `collectAsState()` in MainActivity's `composable(Screen.Morning.route)` block.

Add an explicit 1Hz refresh of `state.now` (already in VM as 30s tick — confirm it propagates to chip).

## Step 8 — Run

```powershell
.\gradlew installDebug
adb shell am start -n com.kinboard.tv/.MainActivity
```

Manually navigate to morning route during dev (temporarily set post-login destination to `Screen.Morning.route`, revert before commit).

---

## ⛔ Built-in review checkpoint #1 — after Step 4

Hot reload (rerun installDebug). Photograph the running emulator. Compare top region (`y < 280dp`) of screenshot against `04-morning-path-v2.png`:

- [ ] "Good morning!" present, italic Fraunces, "!" is red
- [ ] Sub-line uppercased, includes today's weekday + date + condition text + temp (from live weather)
- [ ] Countdown chip is red, rotated, contains 2-digit minute, "min", "be ready by H:mm"
- [ ] If you delete `schoolStartTime` from API JSON (or set null), chip disappears entirely
- [ ] 3 weather cards, each rotated, each with: TODAY badge (only first), day name, date, vector icon (NOT WeatherAPI URL), big temp + lo, rain pill, wear cue chip
- [ ] Wear cue text says "raincoat" for all 3 days against current real backend (89/89/88% rain)
- [ ] No use of `Icon(rememberAsyncImagePainter(weather.conditionIconUrl))` — local drawables only

If any layout looks off by > 10dp or wrong color, fix before continuing.

## ⛔ Built-in review checkpoint #2 — after Step 5

- [ ] Calendar ribbon visible at bottom only when at least 1 event today; otherwise hidden cleanly
- [ ] Events sorted ascending by start
- [ ] Times render in local timezone (Stanthorpe AEST = UTC+10) — e.g. for the test backend right now: Matilda doc `09:30 – 10:30`, Jujitsu `15:30 – 16:15`, Contemporary `17:00 – 17:30`
- [ ] Dots all purple `#8B5CF6` (single Family calendar source)
- [ ] Each event card rotated slightly differently

---

## Success criteria

1. **Build**: `.\gradlew assembleDebug` succeeds with zero errors.
2. **Route registered**: `morning` route appears in NavHost. Login flow still routes to Jobs (default post-login destination unchanged).
3. **Visual parity (top)**: header at `y < 280dp` matches `04-morning-path-v2.png` for layout, colors, fonts.
4. **Visual parity (bottom)**: calendar ribbon at `y > 905dp` matches the screenshot for layout, colors, fonts.
5. **Real data**:
   - Brand sub-line shows live weekday/date/condition/temp
   - Countdown ticks down minute-by-minute when `schoolStartTime` is set
   - Countdown hidden when `schoolStartTime` is null or already past
   - 3 weather cards reflect `state.weather.forecast.take(3)`
   - Wear cue chip text follows the rule in `wearCueFor`
   - Calendar ribbon shows up to 3 events for today in local time
6. **Polling**: tweak `weatherRefreshSeconds=60` and `calendarRefreshSeconds=10` in DB (admin) and confirm UI updates without restart.
7. **Failure modes**: airplane mode → weather strip shows last-good cache (or empty placeholders); no crash; ribbon empty hides itself.
8. **No regressions**: existing Login → Jobs flow opens Jobs as before. `JobsScreen.kt` is byte-identical to its previous state.

---

## Hand-off note → Plan 03

Commit:
```
feat(tv): plan 02 — Morning Path screen shell (header + ribbon)

- MorningPathScreen with scenery background gradient + 4 clouds
- MorningTopBar: brand, school countdown chip, 3-day weather strip with vector icons
- MorningCalendarRibbon: title + up to 3 EventCards in local time
- hardShadow modifier helper
- Wired to MorningPathViewModel StateFlow
- New route registered in NavHost (default still routes to Jobs)

No kid lanes yet; middle band intentionally empty.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Plan 03 fills the middle empty band with the two kid lanes (avatar card, stone path, walker, D-pad) and flips the post-login nav target from `Jobs` to `Morning`.
