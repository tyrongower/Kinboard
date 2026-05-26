# Plan 04 — Polish, celebration, ship

**Goal**: take the working app from Plan 03 and finish it. Add confetti on each toggle-to-done. Add all-done trophy banner when a kid's visible stones hit zero. Cover loading / error / empty edge cases. Performance pass. Signed release APK + sideload to family Android TV. Final 15-item acceptance walkthrough.

By end of Plan 04 the Morning Path TV experience is **fully functioning** end-to-end. No further plans needed.

---

## Cold-start briefing (context cleared — read first)

You are in `C:\Projects\Kinboard\kinboard-tv/`. Plans 01-03 done and committed. Confirm before starting:
- Launching app → Login → Kiosk auth → **Morning Path** screen (not Jobs)
- Both kids' lanes render with stones, walker, D-pad, complete-toggle work
- `JobsScreen.kt`, `JobsViewModel.kt`, `LoginScreen.kt` are byte-identical to pre-plan state
- `MorningPathViewModel` exposes `celebrateAssignmentId` field that fires when an assignment toggles to complete

Design references:
- `design-mockups/tv/04-morning-path-v2.html` + `04-morning-path-v2.png`
- Decisions confirmed during design: confetti burst + trophy banner per assignment; all-done state shows big trophy + "All done, {name}!" banner across the lane

Already-existing keystore config in `app/build.gradle.kts`:
- Uses env vars `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`
- Plan 04 reuses this. No new keystore created unless one doesn't exist.

---

## Step 1 — Add confetti library

Add to `kinboard-tv/app/build.gradle.kts` dependencies:

```kotlin
implementation("nl.dionsegijn:konfetti-compose:2.0.4")
```

Run `.\gradlew --refresh-dependencies` and confirm sync.

## Step 2 — `ConfettiOverlay`

`ui/screens/morning/components/ConfettiOverlay.kt`:

```kotlin
@Composable
fun ConfettiOverlay(triggerKey: Int?, originY: Float = 0.5f, originX: Float = 0.5f, onDone: () -> Unit) {
    if (triggerKey == null) return
    val party = remember(triggerKey) {
        Party(
            speed = 28f, maxSpeed = 50f, damping = 0.92f,
            spread = 360, angle = 270,
            colors = listOf(
                MorningGold.toArgb(), MorningRed.toArgb(),
                Color(0xFFEC4899).toArgb(), Color(0xFF3B82F6).toArgb(),
                Color(0xFF8B5CF6).toArgb(), 0xFFFFFFFF.toInt(),
            ),
            emitter = Emitter(duration = 600, TimeUnit.MILLISECONDS).max(60),
            position = Position.Relative(originX.toDouble(), originY.toDouble()),
        )
    }
    KonfettiView(parties = listOf(party), modifier = Modifier.fillMaxSize())
    LaunchedEffect(triggerKey) { delay(1200); onDone() }
}
```

In `MorningPathScreen` add as the top-most child of the scaled Box:

```kotlin
ConfettiOverlay(
    triggerKey = state.celebrateAssignmentId,
    originX = if (state.focusedKidIndex == 0) 0.5f else 0.5f,
    originY = if (state.focusedKidIndex == 0) 0.42f else 0.72f,
    onDone = { vm.clearCelebrate() },
)
```

Only emit on the toggle-to-COMPLETE path in the VM (not the uncomplete path). Already correct from Plan 01's `toggleAssignment` — confirm.

## Step 3 — All-done trophy banner

In `KidLane`, when computed `stones.isEmpty() && totalCount > 0`, render the trophy banner instead of the stone path:

```kotlin
if (stones.isEmpty() && totalCount > 0) {
    AllDoneBanner(kid = kid, modifier = Modifier.fillMaxSize())
    return
}
```

`ui/screens/morning/components/AllDoneBanner.kt`:

```kotlin
@Composable
fun AllDoneBanner(kid: User, modifier: Modifier = Modifier) {
    val scale = remember { Animatable(0.7f) }
    LaunchedEffect(kid.id) { scale.animateTo(1.0f, animationSpec = spring(0.42f, 250f)) }
    Box(modifier.padding(horizontal = 60.dp).graphicsLayer { scaleX = scale.value; scaleY = scale.value }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Reuse KidLaneCard so visual position is consistent
            // ...actually keep card on left, render banner on right
            Spacer(Modifier.width(220.dp))  // card slot reserved
            Box(Modifier
                .weight(1f).fillMaxHeight(0.8f)
                .hardShadow(8.dp, MorningInk, 26.dp)
                .background(Brush.verticalGradient(listOf(Color(0xFFFFE26B), MorningGold)), RoundedCornerShape(26.dp))
                .border(5.dp, MorningInk, RoundedCornerShape(26.dp))
                .padding(horizontal = 36.dp), contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(28.dp)) {
                    Icon(painterResource(R.drawable.ic_trophy), null, modifier = Modifier.size(96.dp), tint = Color.Unspecified)
                    Text("All done, ${kid.displayName}!",
                        style = MorningType.fraunces(72f).copy(color = MorningInk), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Icon(painterResource(R.drawable.ic_trophy), null, modifier = Modifier.size(96.dp), tint = Color.Unspecified)
                }
            }
        }
    }
}
```

But you still need the `KidLaneCard` visible on the left of the banner. Restructure: in `KidLane`, ALWAYS render the card on the left. Right side: either `StonePath` or `AllDoneBanner` (no left padding since card is in the Row).

When `stones.isEmpty() && totalCount == 0` (no jobs today), render a softer message instead:

```kotlin
Text("☀ no jobs today", style = MorningType.fraunces(54f).copy(color = MorningInkSoft, italic = true))
```

## Step 4 — Loading / error / empty states

Audit `MorningUiState` consumers in the screen. Handle:

| State | Top bar | Lanes | Ribbon |
|---|---|---|---|
| `isLoading && everything empty` | "Good morning!" with no sub-line | both lanes show centered `CircularProgressIndicator` 80dp | hidden |
| `errorMessage != null && jobs.empty()` | offline pill in brand block | red "couldn't load — retrying" banner | hidden |
| `state.users.size < 2` | normal | render whatever users exist; do not crash; if 0 users → "Add a family member in admin" | hidden |
| normal | as designed | as designed | as designed |

Persist last-good `jobs`/`users`/`weather`/`calendarEvents` to `PreferencesManager` after every successful fetch (JSON-encode via Gson). On VM init, hydrate state from prefs immediately so the screen never starts blank.

Add an offline pill: small red dot + "offline" text inside the brand block, visible whenever the most recent fetch threw a network exception. Cleared on next successful fetch.

## Step 5 — JWT auto-refresh confidence

`TokenAuthenticator.kt` already exists. Verify it re-issues the JWT by calling `authenticate(pairingToken)` on 401. If pairing also fails, clear the saved pairing token and call `navController.navigate(Screen.Login.route)` from MainActivity.

Add a heartbeat: in `MorningPathViewModel.init`, launch a coroutine that calls `getSiteSettings()` every 12 hours just to keep auth fresh.

## Step 6 — Performance pass

Run `.\gradlew installDebug && adb shell am start -n com.kinboard.tv/.MainActivity` then profile:

```
adb shell dumpsys gfxinfo com.kinboard.tv reset
# use the app for 30s
adb shell dumpsys gfxinfo com.kinboard.tv | grep -E "Janky|frames"
```

Goal: <5% janky frames at 60Hz.

Optimizations if not met:
- Wrap each `KidLane` in `Modifier.graphicsLayer()` (forces a separate layer for the rotated card)
- Use `key()` blocks around stones so Compose preserves their state across job refreshes
- Confetti particle count cap 60; if dropping frames at burst, lower to 40
- Preload avatar + job images: in VM init, kick off `Coil.imageLoader(ctx).execute(ImageRequest.Builder(ctx).data(url).build())` for each user.avatarUrl and each job.imageUrl

## Step 7 — Visual polish pass against screenshot

Side-by-side: running app on 1080p TV emulator vs `04-morning-path-v2.png`. Verify each:

- [ ] Brand "Good morning!" italic Fraunces, "!" is red `#E85A3A`
- [ ] Sub-line lowercased
- [ ] Countdown chip: red bg, ink border, rotated -1.6deg, 8dp ink hardShadow, big italic number
- [ ] Weather card rotations: -3, +1, -1 deg (in this order)
- [ ] TODAY pill on first card, rotated -3deg
- [ ] Wear cue: pink/orange chip with raincoat icon, Quicksand 800 18sp
- [ ] Kid cards: vertical stack, avatar 96dp, name italic 38sp, X/Y pill
- [ ] Pill gold when doneCount>0, white when zero
- [ ] Path strip tan / green respectively
- [ ] Stone borders red when NEXT, gold when focused, ink otherwise
- [ ] Walker sits above NEXT stone with hop animation
- [ ] Ribbon at bottom with up to 3 events, alt rotations -1, +0.6, -0.8 deg
- [ ] Event dots purple `#8B5CF6`

## Step 8 — Build signed release APK

Existing keystore config in `app/build.gradle.kts` reads env vars. Either:

**Option A — reuse existing keystore** (if user has one):
```powershell
$env:KEYSTORE_PATH = "C:\Users\TyronGower\kinboard-tv.jks"
$env:KEYSTORE_PASSWORD = "<pw>"
$env:KEY_ALIAS = "kinboard"
$env:KEY_PASSWORD = "<pw>"
.\gradlew assembleRelease
```

**Option B — generate one-off**:
```powershell
keytool -genkey -v -keystore C:\Users\TyronGower\kinboard-tv.jks -keyalg RSA -keysize 2048 -validity 10000 -alias kinboard
# follow prompts; then export env vars and run assembleRelease
```

Output APK lives at `app/build/outputs/apk/release/app-release.apk`.

If env vars unset, build falls back to debug-signing — that still installs but won't be acceptable for permanent install. Insist on a real signing key for production.

## Step 9 — Sideload to the family Android TV

```powershell
adb connect <TV-IP>:5555
adb install -r C:\Projects\Kinboard\kinboard-tv\app\build\outputs\apk\release\app-release.apk
```

App appears in the TV's leanback launcher (manifest already includes `LEANBACK_LAUNCHER` from the existing project). Launch it; the existing Login flow runs; paste the production kiosk URL + token; lands on Morning Path.

## Step 10 — End-to-end acceptance walkthrough

Sit on the couch with the TV remote. Verbalise each step:

1. Power TV on, launch Kinboard.
2. App shows the Login screen (unchanged from before).
3. Type / paste URL `https://kinboard.gower.tools` and kiosk token. Submit.
4. App routes to **Morning Path** screen.
5. Header shows current weekday/date, "mist" condition, 13°C.
6. Countdown chip ticks down minute-by-minute toward `schoolStartTime`.
7. Three weather cards show today/tomorrow/Thursday with the right icons and the "raincoat" cue.
8. Two lanes: Waverley + Matilda with their real avatars, names, fractions.
9. Stones show real job artwork in each circle.
10. D-pad LEFT/RIGHT moves between stones; UP/DOWN switches lanes; OK toggles complete.
11. Press OK on Waverley's NEXT stone (Brush Hair). **Confetti pops.** Within 10s the stone disappears, the pill ticks `4/11 → 5/11`, the walker hops to the next stone.
12. Complete every remaining Matilda stone. After the last one, the lane shows **"All done, Matilda!"** trophy banner with bounce-in animation.
13. Ribbon at the bottom shows 3 real events with local times.
14. Leave the TV on for 1 hour. No crash, no leak, frame rate steady.
15. Power-cycle the TV. App auto-launches (Leanback) into the same authenticated state → Morning Path → no login required.

If every step passes the project is **DONE**.

---

## ⛔ Built-in review checkpoint #1 — after Step 3

- [ ] Toggle a stone — confetti pops at the focused lane's vertical centre
- [ ] Confetti uses brand colors (gold, red, kid pink, kid blue, purple, white)
- [ ] No confetti on uncomplete
- [ ] When kid finishes all stones, the trophy banner replaces the stone path
- [ ] When admin remotely uncompletes a job, the banner disappears and the stone returns within `choresRefreshSeconds`
- [ ] When kid has zero jobs today at all, "☀ no jobs today" placeholder shows (not the trophy)

## ⛔ Built-in review checkpoint #2 — after Step 4

Pull TV off network. Relaunch.
- [ ] Top bar still renders with last-good cached weather (preserved across restart)
- [ ] Lanes still render last-known stones
- [ ] D-pad still navigates without crash
- [ ] Toggling a stone shows a snackbar/toast "saving when online"
- [ ] On reconnect, polling tick silently reconciles state

## ⛔ Built-in review checkpoint #3 — after Step 6

`adb shell dumpsys gfxinfo com.kinboard.tv` — verify <5% janky frames during a session that includes:
- One walker hop cycle on each lane
- Three D-pad keypresses
- One toggle-complete (confetti burst)

If above 5%, apply optimizations from Step 6 and re-measure.

## ⛔ Built-in review checkpoint #4 — final acceptance (after Step 10)

This is the master review. Photograph the running TV next to a print of `04-morning-path-v2.png`. Side-by-side:

- [ ] Header arrangement identical to within 10dp
- [ ] Weather card colors and wear cue chips identical
- [ ] Countdown chip identical: red, rotated, big number, "be ready by" line
- [ ] Both kid cards positioned at lane start, vertical content stack
- [ ] Stone artwork visible inside white circles
- [ ] NEXT stone has red outline + label + walker
- [ ] Calendar ribbon at the bottom with 3 events

Any element off by > 10dp or > one shade → fix, re-build, re-photograph.

---

## Success criteria — MASTER ACCEPTANCE (15 items)

1. **Login screen**: untouched from original; kiosk pairing flow works as before
2. **Post-login**: navigates to **Morning Path** (not Jobs)
3. **Header**: brand, school countdown chip (driven by `schoolStartTime`), 3-day weather strip with auto wear-cues
4. **Lanes**: two kids only, each with avatar card + horizontal stones + walker on NEXT
5. **Stones**: real `.webp` artwork via Coil, shrink-to-fit horizontally
6. **D-pad**: L/R within lane, U/D between lanes, OK toggles completion
7. **API integration**: complete/uncomplete via existing endpoints; refresh polls every `choresRefreshSeconds`
8. **Confetti**: fires on each toggle-to-done
9. **All-done banner**: shows when kid's visible stones reach zero (and they had any jobs today)
10. **Calendar ribbon**: up to 3 events in local time, source colour
11. **Offline tolerance**: last-good cache shown via PreferencesManager, no crash, silent retry
12. **Token rotation**: 401 triggers re-pair; failed re-pair routes back to Login
13. **Visual parity**: side-by-side with `04-morning-path-v2.png` matches at ~10dp tolerance
14. **APK installs** signed release on family Android TV via Leanback launcher
15. **Stability**: 1h idle, no crash, no leak, frame rate steady

All 15 pass = project DONE.

---

## Final commit

```
feat(tv): plan 04 — confetti, all-done, polish, signed release

- Konfetti burst on toggle-to-complete (per stone)
- AllDoneBanner with trophy + "All done, {name}!" when kid's stones hit zero
- "☀ no jobs today" placeholder when kid has no assignments
- PreferencesManager caches last-good jobs/users/weather/calendar for offline boot
- Offline pill in brand block when fetch fails
- 401 → re-pair via TokenAuthenticator; persistent failure routes to Login
- Performance: image preload, RepaintBoundary per lane
- Signed release APK built and sideloaded to family TV

Closes the 4-plan Morning Path implementation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Open a PR titled "Kinboard TV — Morning Path screen" against `main`.

After PR merge, leave `JobsScreen.kt` + `JobsViewModel.kt` in the repo as fallback / dev reference. If after a fortnight of stable Morning Path use the family hasn't needed Jobs, raise a follow-up PR to delete those files and the `Screen.Jobs` route.
