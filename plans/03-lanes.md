# Plan 03 — Kid lanes, stones, walker, D-pad, route flip

**Goal**: Fill the middle band of `MorningPathScreen` with two kid lanes — each with `KidLaneCard` (avatar + name + "X / Y" pill), a `LanePathStrip` (tan or green), a horizontal `StonePath` of focusable `StoneTile`s with a `Walker` perched on the NEXT stone. Wire D-pad navigation (L/R within lane, U/D between lanes, OK toggles complete). Flip the post-login nav target from `Jobs` to `Morning`.

By end of Plan 03: launching the app → Login (unchanged) → kiosk auth → Morning Path with both real kids' lanes populated from `/api/jobs?date=today`, D-pad navigation works, OK button toggles assignments via API.

**Do NOT** build confetti, all-done banner, or setup polish — Plan 04.

---

## Cold-start briefing (context cleared — read first)

You are in `C:\Projects\Kinboard\kinboard-tv/`. Plans 01 + 02 done. Confirm before starting:
- `ui/screens/morning/MorningPathScreen.kt` exists with scenery + top bar + ribbon
- Middle band (`y` in 280..905 dp) is empty
- `MorningPathViewModel.state` includes `users`, `jobs`, `focusedKidIndex`, `focusedStoneIndex`, `celebrateAssignmentId`
- `KinboardApi.completeJob` and `uncompleteJob` exist (verify with grep)
- `MainActivity` has 3 routes registered; post-login destination is still `Jobs`

Design references:
- `design-mockups/tv/04-morning-path-v2.html` — open in Chrome; focus on `.kids`, `.lane`, `.kid-card`, `.stations`, `.stone`, `.walker` CSS
- `design-mockups/tv/04-morning-path-v2.png` — screenshot reference

Test data shape (when authenticated to `https://kinboard.gower.tools` with the test token):
- 2 users: Waverley (id=2, `#EC4899`, `hideCompletedInKiosk=true`), Matilda (id=3, `#3B82F6`, `hideCompletedInKiosk=true`)
- 11 jobs today, each 1-2 assignments, ordered by `Job.displayOrder`
- Each assignment has `isCompleted`, `userId`

Per-kid visible stones: filter `job.assignments` where `userId == kid.id`. If `kid.hideCompletedInKiosk == true`, also filter out `isCompleted == true`. Sort by `job.displayOrder` ascending. The FIRST visible stone is the NEXT.

Middle band canvas region: `Modifier.offset(y=280.dp).fillMaxWidth().height(625.dp)`.

---

## Step 1 — `MorningKidsBand` widget

`ui/screens/morning/components/MorningKidsBand.kt`:

```kotlin
@Composable
fun MorningKidsBand(state: MorningUiState, vm: MorningPathViewModel, modifier: Modifier = Modifier) {
    val kids = state.users.filter { (it.id) > 0 }.take(2)  // 2 kids only
    if (kids.isEmpty()) return
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        kids.forEachIndexed { laneIndex, kid ->
            KidLane(kid = kid, jobs = state.jobs, laneIndex = laneIndex,
                isAnyFocused = state.focusedKidIndex == laneIndex,
                focusedStoneIndex = state.focusedStoneIndex,
                onFocusStone = { stoneIdx -> vm.setFocus(laneIndex, stoneIdx) },
                onToggleStone = { job, asg -> vm.toggleAssignment(job, asg) },
                modifier = Modifier.weight(1f).fillMaxWidth())
        }
    }
}
```

Add to `MorningPathScreen.kt` inside the scaled Box, between top bar and ribbon:

```kotlin
MorningKidsBand(state = state, vm = vm, modifier = Modifier
    .offset(y = 280.dp).fillMaxWidth().height(625.dp))
```

## Step 2 — `KidLane`

`ui/screens/morning/components/KidLane.kt`:

```kotlin
data class StoneData(val job: Job, val asg: JobAssignment)

@Composable
fun KidLane(
    kid: User,
    jobs: List<Job>,
    laneIndex: Int,
    isAnyFocused: Boolean,
    focusedStoneIndex: Int,
    onFocusStone: (Int) -> Unit,
    onToggleStone: (Job, JobAssignment) -> Unit,
    modifier: Modifier = Modifier,
) {
    val (stones, doneCount, totalCount) = remember(jobs, kid) { buildLaneData(jobs, kid) }
    Box(modifier) {
        // Path strip behind everything
        LanePathStrip(laneIndex = laneIndex, modifier = Modifier
            .matchParentSize().padding(start = 280.dp, end = 60.dp))
        // Card + stones row
        Row(Modifier.fillMaxSize().padding(horizontal = 60.dp),
            verticalAlignment = Alignment.CenterVertically) {
            KidLaneCard(
                kid = kid, doneCount = doneCount, totalCount = totalCount, laneIndex = laneIndex,
                modifier = Modifier.width(220.dp))
            Spacer(Modifier.width(0.dp))  // path strip starts at x=280 so no extra gap
            StonePath(
                stones = stones, kid = kid, laneIndex = laneIndex,
                isLaneFocused = isAnyFocused, focusedStoneIndex = focusedStoneIndex,
                onFocusStone = onFocusStone, onToggleStone = onToggleStone,
                modifier = Modifier.weight(1f).fillMaxHeight())
        }
    }
}

private fun buildLaneData(jobs: List<Job>, kid: User): Triple<List<StoneData>, Int, Int> {
    val visible = mutableListOf<StoneData>()
    var done = 0; var total = 0
    val sortedJobs = jobs.sortedBy { it.assignments?.find { a -> a.userId == kid.id }?.displayOrder ?: Int.MAX_VALUE }
        .ifEmpty { jobs }
    // Use job.displayOrder primarily; assignment.displayOrder secondarily
    for (j in jobs.sortedBy { it.id }) {  // stable order; replace with displayOrder field
        for (a in j.assignments.orEmpty()) {
            if (a.userId != kid.id) continue
            total += 1
            val isDone = a.isCompleted == true
            if (isDone) done += 1
            if (isDone && kid.hideCompletedInKiosk == true) continue
            visible += StoneData(j, a)
        }
    }
    return Triple(visible, done, total)
}
```

NOTE: the existing `Job` data class needs a `displayOrder: Int?` field if missing — check `Job.kt`. If absent, add it (mirror of `description`/`imageUrl` style). Sort jobs by `displayOrder` ascending; ties broken by `job.id`.

## Step 3 — `KidLaneCard`

`ui/screens/morning/components/KidLaneCard.kt`:

Vertical Column inside a Box. White bg, 5dp ink border, 26dp radius, 8dp ink hardShadow. Rotated -1.4f for lane 0, +1f for lane 1. Width 200dp, justify start, height intrinsic.

```kotlin
@Composable
fun KidLaneCard(kid: User, doneCount: Int, totalCount: Int, laneIndex: Int, modifier: Modifier = Modifier) {
    val bgRing = if (laneIndex == 0) MorningKidWavBg else MorningKidMatBg
    val inkName = if (laneIndex == 0) MorningKidWavInk else MorningKidMatInk
    val rotation = if (laneIndex == 0) -1.4f else 1.0f
    val pillBg = if (doneCount == 0) Color.White else MorningGold
    Box(modifier.width(200.dp).rotate(rotation)
        .hardShadow(offsetY = 8.dp, color = MorningInk, radius = 26.dp)
        .background(Color.White, RoundedCornerShape(26.dp))
        .border(5.dp, MorningInk, RoundedCornerShape(26.dp))
        .padding(top = 14.dp, start = 12.dp, end = 12.dp, bottom = 12.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // Avatar 96dp circle
            Box(Modifier.size(96.dp).clip(CircleShape).background(bgRing)
                .border(5.dp, MorningInk, CircleShape).hardShadow(4.dp, MorningInk, 48.dp), contentAlignment = Alignment.Center) {
                AsyncImage(
                    model = "${ApiClient.BASE_URL}${kid.avatarUrl ?: ""}",
                    contentDescription = kid.displayName,
                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                    contentScale = ContentScale.Crop,
                )
            }
            // Name
            Text(kid.displayName, style = MorningType.fraunces(38f).copy(color = inkName), maxLines = 1, overflow = TextOverflow.Ellipsis)
            // Pill "X / Y"
            Box(Modifier
                .hardShadow(4.dp, MorningInk, 18.dp)
                .background(pillBg, RoundedCornerShape(18.dp))
                .border(3.dp, MorningInk, RoundedCornerShape(18.dp))
                .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                Text("$doneCount / $totalCount", style = MorningType.fraunces(28f).copy(color = MorningInk))
            }
        }
    }
}
```

`ApiClient.BASE_URL` must be exposed as a public const. If it's currently private, expose a getter via `SessionManager` or `ApiClient`.

## Step 4 — `LanePathStrip`

`ui/screens/morning/components/LanePathStrip.kt`:

Use Compose `Canvas` to draw:
- A 54dp-tall horizontal strip with vertical gradient (tan1→tan2 lane 0, green1→green2 lane 1)
- Top + bottom dashed ink line (4dp stroke, dash 14, gap 10)
- A faint center dashed line (6dp stroke, dash 14, gap 12, ink 40% alpha)

```kotlin
@Composable
fun LanePathStrip(laneIndex: Int, modifier: Modifier = Modifier) {
    val grad = if (laneIndex == 0) Brush.verticalGradient(listOf(MorningPathTan1, MorningPathTan2))
               else Brush.verticalGradient(listOf(MorningPathGreen1, MorningPathGreen2))
    Canvas(modifier) {
        val h = 54.dp.toPx()
        val cy = size.height / 2
        val stripRect = Rect(0f, cy - h/2, size.width, cy + h/2)
        drawRect(brush = grad, topLeft = stripRect.topLeft, size = stripRect.size)
        val dashEffect = PathEffect.dashPathEffect(floatArrayOf(14.dp.toPx(), 10.dp.toPx()))
        drawLine(MorningInk, Offset(0f, stripRect.top), Offset(size.width, stripRect.top), 4.dp.toPx(), pathEffect = dashEffect)
        drawLine(MorningInk, Offset(0f, stripRect.bottom), Offset(size.width, stripRect.bottom), 4.dp.toPx(), pathEffect = dashEffect)
        val centerDash = PathEffect.dashPathEffect(floatArrayOf(14.dp.toPx(), 12.dp.toPx()))
        drawLine(MorningInk.copy(alpha = 0.4f), Offset(0f, cy), Offset(size.width, cy), 6.dp.toPx(), pathEffect = centerDash)
    }
}
```

## Step 5 — `StonePath`

`ui/screens/morning/components/StonePath.kt`:

```kotlin
@Composable
fun StonePath(
    stones: List<StoneData>, kid: User, laneIndex: Int,
    isLaneFocused: Boolean, focusedStoneIndex: Int,
    onFocusStone: (Int) -> Unit,
    onToggleStone: (Job, JobAssignment) -> Unit,
    modifier: Modifier = Modifier,
) {
    BoxWithConstraints(modifier) {
        val count = stones.size
        if (count == 0) return@BoxWithConstraints
        // Shrink-to-fit: slot width
        val slot = maxWidth / count
        val stoneSize = minOf(120.dp, slot - 12.dp)
        val focusReqs = remember(count) { List(count) { FocusRequester() } }
        // Auto-focus first stone when lane gains focus
        LaunchedEffect(isLaneFocused) {
            if (isLaneFocused) focusReqs.getOrNull(focusedStoneIndex)?.requestFocus()
        }
        Row(Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            stones.forEachIndexed { i, sd ->
                Box(Modifier.width(slot).fillMaxHeight(), contentAlignment = Alignment.Center) {
                    StoneTile(
                        data = sd, kid = kid, size = stoneSize,
                        isNext = i == 0,
                        showWalker = i == 0,
                        focusRequester = focusReqs[i],
                        onFocused = { onFocusStone(i) },
                        onToggle = { onToggleStone(sd.job, sd.asg) },
                    )
                }
            }
        }
    }
}
```

## Step 6 — `StoneTile`

`ui/screens/morning/components/StoneTile.kt`:

```kotlin
@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun StoneTile(
    data: StoneData, kid: User, size: Dp,
    isNext: Boolean, showWalker: Boolean,
    focusRequester: FocusRequester,
    onFocused: () -> Unit, onToggle: () -> Unit,
) {
    var isFocused by remember { mutableStateOf(false) }
    Box(Modifier.width(size + 30.dp).height(size + 80.dp)) {
        // NEXT badge (only if isNext)
        if (isNext) {
            NextBadge(Modifier.align(Alignment.TopCenter).offset(y = (-30).dp))
        }
        // Walker (only if showWalker)
        if (showWalker) {
            Walker(kidAvatarUrl = kid.avatarUrl,
                modifier = Modifier.align(Alignment.TopCenter).offset(y = (-58).dp))
        }
        // Body — circle, white bg, ink border + shadow
        Surface(
            onClick = onToggle,
            modifier = Modifier
                .size(size).align(Alignment.Center)
                .offset(y = 0.dp)
                .focusRequester(focusRequester)
                .onFocusChanged { fs ->
                    isFocused = fs.isFocused
                    if (fs.isFocused) onFocused()
                },
            shape = ClickableSurfaceDefaults.shape(shape = CircleShape),
            colors = ClickableSurfaceDefaults.colors(
                containerColor = Color.White, focusedContainerColor = Color.White,
            ),
            scale = ClickableSurfaceDefaults.scale(focusedScale = 1.0f),
            border = ClickableSurfaceDefaults.border(
                border = Border(BorderStroke(5.dp, if (isNext) MorningRed else MorningInk), shape = CircleShape),
                focusedBorder = Border(BorderStroke(6.dp, MorningGold), shape = CircleShape),
            ),
        ) {
            // Inner image
            Box(Modifier.fillMaxSize().padding(8.dp), contentAlignment = Alignment.Center) {
                AsyncImage(
                    model = "${ApiClient.BASE_URL}${data.job.imageUrl ?: ""}",
                    contentDescription = data.job.title,
                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                    contentScale = ContentScale.Crop,
                )
            }
        }
        // Label pill below the stone
        StoneLabel(text = data.job.title, modifier = Modifier
            .align(Alignment.BottomCenter)
            .offset(y = (-4).dp))
    }
}
```

`NextBadge` = red rounded pill ("NEXT", Quicksand 800 13sp letterSpacing .22em, white text), 3dp ink border, 4dp ink shadow.

`StoneLabel` = white rounded pill (Quicksand 700 22sp ink, max 1 line, ellipsis), 3dp ink border, 4dp ink shadow.

## Step 7 — `Walker`

`ui/screens/morning/components/Walker.kt`:

62dp circle, white bg, 4dp ink border, 5dp ink hardShadow. Inside: kid avatar `AsyncImage` clipped to circle. Triangle pointer below pointing down (8dp ink). Hop animation: `infiniteRepeatable` translateY 0 → -4dp → 0, 1.6s, Ease in/out.

```kotlin
@Composable
fun Walker(kidAvatarUrl: String?, modifier: Modifier = Modifier) {
    val infinite = rememberInfiniteTransition(label = "walker")
    val hop by infinite.animateFloat(
        initialValue = 0f, targetValue = -4f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 800, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "hop",
    )
    Box(modifier.offset(y = hop.dp)) {
        Box(Modifier.size(62.dp).clip(CircleShape).background(Color.White)
            .border(4.dp, MorningInk, CircleShape)
            .hardShadow(5.dp, MorningInk, 31.dp), contentAlignment = Alignment.Center) {
            AsyncImage(
                model = "${ApiClient.BASE_URL}${kidAvatarUrl ?: ""}",
                contentDescription = null,
                modifier = Modifier.fillMaxSize().clip(CircleShape),
                contentScale = ContentScale.Crop,
            )
        }
        // Pointer triangle
        Canvas(Modifier.align(Alignment.BottomCenter).size(16.dp, 8.dp).offset(y = 6.dp)) {
            val p = Path().apply {
                moveTo(0f, 0f); lineTo(size.width, 0f); lineTo(size.width/2, size.height); close()
            }
            drawPath(p, MorningInk)
        }
    }
}
```

## Step 8 — D-pad cross-lane navigation

`androidx.tv` directional focus handles up/down between lanes automatically if both lanes are siblings in the same `FocusGroup`. Wrap `MorningKidsBand` in:

```kotlin
@OptIn(ExperimentalComposeUiApi::class)
Column(modifier
    .focusGroup()
    .focusProperties { canFocus = true }, ...)
```

For each `KidLane`, also `Modifier.focusGroup()`. The first `StoneTile` in each lane is focusable; pressing DPAD_DOWN from lane 0 finds the nearest focusable in lane 1 below the current x position.

Auto-restore focus when jobs refresh: `MorningPathViewModel` exposes `focusedKidIndex` and `focusedStoneIndex`; after polling refreshes `state.jobs`, the `LaunchedEffect(isLaneFocused)` in `StonePath` re-requests focus on the saved index.

Stone OK (DPAD_CENTER): `Surface(onClick = onToggle)` already handles DPAD_CENTER and ENTER on TV Compose.

## Step 9 — Flip post-login nav to `morning`

In `MainActivity.kt`, change the `LaunchedEffect(loginState.isAuthenticated)` block:

```kotlin
LaunchedEffect(loginState.isAuthenticated) {
    if (loginState.isAuthenticated) {
        navController.navigate(Screen.Morning.route) {        // ← was Screen.Jobs.route
            popUpTo(Screen.Login.route) { inclusive = true }
        }
    } else {
        navController.navigate(Screen.Login.route) {
            popUpTo(Screen.Morning.route) { inclusive = true } // ← was Screen.Jobs.route
        }
    }
}
```

The `Jobs` route remains registered in `NavHost` — it just isn't reached by the standard flow. A developer can still navigate to it manually via `navController.navigate("jobs")` for testing.

---

## ⛔ Built-in review checkpoint #1 — after Step 7

Hot reload. Without D-pad (just looking):

- [ ] Both kid cards render with real `avatarUrl` images loaded via Coil (not placeholder)
- [ ] Pill: Waverley shows `"4 / 11"` gold bg; Matilda shows `"0 / 9"` white bg (zero variant)
- [ ] Name "Waverley" fits inside the 200dp card with no overflow
- [ ] Stones load real `.webp` artwork (per-job image)
- [ ] First stone has NEXT badge above + walker badge above the badge
- [ ] Walker has gentle hop animation (Y oscillates 0 ↔ -4 dp over 1.6s)
- [ ] Stone labels do not wrap (1 line, ellipsis when long)
- [ ] Path strip color: tan beneath lane 0 (Waverley), green beneath lane 1 (Matilda)
- [ ] Both lanes fit within the canvas height; nothing clipped at top or bottom

## ⛔ Built-in review checkpoint #2 — after Step 8

With Android TV emulator + remote (or `adb shell input keyevent`):

- [ ] `adb shell input keyevent 22` (DPAD_RIGHT) — focus moves to next stone in current lane
- [ ] `adb shell input keyevent 21` (DPAD_LEFT) — focus moves back
- [ ] `adb shell input keyevent 20` (DPAD_DOWN) — focus crosses to the other lane near the same x position
- [ ] `adb shell input keyevent 19` (DPAD_UP) — focus crosses back
- [ ] `adb shell input keyevent 23` (DPAD_CENTER) — toggles focused stone's completion; within `choresRefreshSeconds` the stone vanishes (hideCompletedInKiosk) and the next stone becomes NEXT; walker hops onto it
- [ ] Pill ticks `4 / 11` → `5 / 11` (and visible stone count drops 7 → 6) for Waverley
- [ ] Focused stone has a gold 6dp border (`focusedBorder`)
- [ ] NEXT stone (first remaining) has a red border whether focused or not

Verify via API:
```
curl https://kinboard.gower.tools/api/jobs?date=2026-05-26 -H "Authorization: Bearer <jwt>" | jq '.[].assignments[] | select(.userId==2) | {jobId,isCompleted}'
```

## ⛔ Built-in review checkpoint #3 — after Step 9

- [ ] Sign out → log in fresh with kiosk token → lands directly on Morning Path screen (no Jobs screen in between)
- [ ] Manually navigate to `jobs` route via debug action → existing JobsScreen renders untouched (proves it's preserved)

---

## Success criteria

1. **Build**: `.\gradlew assembleDebug` zero errors.
2. **Real two kids visible**: Waverley + Matilda render with correct avatars, names, colored pills.
3. **Correct stone count after `hideCompletedInKiosk`**: Waverley has 7 visible stones (11 total − 4 done); Matilda has 9 visible (9 − 0). If real data differs, the difference is explained by recent admin/kid action.
4. **Stone ordering**: stones follow `Job.displayOrder` ascending, ties by `job.id`.
5. **Real job artwork**: each stone shows the admin-uploaded `.webp` (Coil cached).
6. **NEXT marker**: only the first remaining stone in each lane has the NEXT badge + walker overlay.
7. **D-pad**:
   - Left/right within lane
   - Up/down between lanes
   - Center toggles complete and API call lands
8. **API integration**: on toggle, network log shows `POST /api/jobs/{id}/assignments/{aid}/complete?date=YYYY-MM-DD` 200/204. Subsequent `GET /api/jobs?date=...` shows the assignment's `isCompleted` flipped.
9. **Walker animation**: continuous gentle hop, 1.6s period, no stutter.
10. **Shrink-to-fit**: with 9 stones in one lane and 7 in the other, no stone clips horizontally. Both lanes fit within `[60, 1860]dp` x-range.
11. **Route flip**: post-login destination is `Morning`. `Jobs` route still registered and reachable via direct nav.
12. **No regressions**: `JobsScreen.kt`, `JobsViewModel.kt`, `LoginScreen.kt`, `LoginViewModel.kt` are byte-identical to their previous state.

---

## Hand-off → Plan 04

Commit:
```
feat(tv): plan 03 — kid lanes, stones, walker, D-pad, route swap

- KidLane + KidLaneCard (avatar + name + X/Y pill)
- LanePathStrip via Canvas (tan/green, dashed borders + center line)
- StonePath (shrink-to-fit) + StoneTile (focusable, OK toggles via API)
- Walker with hop animation perched on NEXT
- Filter assignments per user.hideCompletedInKiosk
- D-pad cross-lane navigation via focusGroup
- Post-login nav: Login → Morning (Jobs route preserved for fallback)

JobsScreen.kt left untouched as fallback / dev reference.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Plan 04 adds: confetti animation on each toggle-to-done, all-done trophy banner when a kid's visible stones hit zero, loading/error/empty edge cases, performance pass, and signed release APK + sideload instructions + final 15-item acceptance checklist.
