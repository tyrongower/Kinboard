


# KINBOARD MOBILE - FEATURE IMPLEMENTATION PROMPTS

## RULES MANDATORY REQUIREMENTS:
•
Feature parity must be exact (no missing features, flows, or states).
•
Business logic and user flows must behave identically to the frontend.
•
API usage must match the frontend unless Android-specific improvements are required.
•
Branding (colors, typography, iconography, tone) must remain consistent.
•
UX and layout MUST be redesigned and optimized for:
◦
Phones
◦
Tablets
•
Phone and tablet layouts may differ significantly where justified.
•
Follow Material Design 3 where it does not conflict with existing branding.
•
No web-style layouts copied directly; redesign for native Android ergonomics.
•
No TV UX patterns reused unless explicitly appropriate.
ANDROID-SPECIFIC REQUIREMENTS:
•
Use modern Android architecture (recommended by Google).
•
Clear separation of UI, state, and business logic.
•
Proper handling of:
◦
Orientation changes
◦
Window size classes
◦
Accessibility (TalkBack, contrast, touch targets)
◦
Back navigation and system gestures
•
Smooth performance on mid-range devices.
ROLE AND AUTHORITY:
•
You are the final authority on Android UI/UX decisions.
•
If a web UX pattern is suboptimal for mobile/tablet, redesign it.
•
If phone and tablet require different UX, implement separate layouts.
•
Do not ask for approval on UX decisions unless functionality would change.

## JOBS/CHORES FEATURE PROMPT

### API_ENDPOINTS
```
GET /api/jobs?date={YYYY-MM-DD} -> Job[]
POST /api/jobs/{jobId}/assignments/{assignmentId}/complete?date={YYYY-MM-DD}
DELETE /api/jobs/{jobId}/assignments/{assignmentId}/complete?date={YYYY-MM-DD}
GET /api/users -> User[]
PATCH /api/users/{userId}/hide-completed -> {hideCompletedInKiosk: boolean}
GET /api/sitesettings -> SiteSettings
```

### DATA_MODELS
```kotlin
data class Job(val id: Int, val title: String, val description: String?, val imageUrl: String?, val createdAt: String, val recurrence: String?, val recurrenceStartDate: String?, val recurrenceEndDate: String?, val recurrenceIndefinite: Boolean?, val useSharedRecurrence: Boolean?, val assignments: List<JobAssignment>?, val occurrenceDate: String?)
data class JobAssignment(val id: Int, val jobId: Int, val userId: Int, val user: User?, val recurrence: String?, val recurrenceStartDate: String?, val recurrenceEndDate: String?, val recurrenceIndefinite: Boolean?, val displayOrder: Int, val isCompleted: Boolean?, val completedAt: String?)
data class User(val id: Int, val displayName: String, val colorHex: String, val hideCompletedInKiosk: Boolean?, val avatarUrl: String?, val displayOrder: Int?, val email: String?, val isAdmin: Boolean?)
data class SiteSettings(val id: Int, val defaultView: String, val completionMode: String?, val jobsRefreshSeconds: Int?, val calendarRefreshSeconds: Int?, val weatherRefreshSeconds: Int?, val weatherApiKey: String?, val weatherLocation: String?)
```

### KIOSK_BUSINESS_LOGIC
- Fetch jobs by selected date on mount and date change
- Auto-refresh every N seconds (from settings.jobsRefreshSeconds, default 10)
- Group jobs by user based on assignments
- Jobs without assignments -> "Unassigned" group with fallback color
- Sort users by displayOrder
- Per-user hide completed toggle (default: hidden, persisted via API)
- Progress bar: completed/total percentage per user
- Job completion toggle: POST complete if not completed, DELETE if completed
- Show user avatar or colored circle with initial
- Empty state per user: "All done!" with checkmark icon when no visible jobs
- Card background tinted with user color (alpha 0.14)
- Checkbox uses user color when completed

### KIOSK_UI_SPECS
- LazyVerticalGrid with 2 columns on phone, 3-4 on tablet
- Each person card: avatar (56dp), name, stats text, eye toggle button (top-right absolute)
- Progress bar: 6dp height, rounded, user color fill
- Job items: clickable card, 12dp rounded, image (48dp circular if present), title, description, checkbox (28dp)
- Completed jobs: opacity 0.6, line-through title, filled checkbox with user color
- Eye icon: show/hide completed toggle, muted when hidden
- Loading state: centered spinner with "Loading jobs..." text
- Card grid spacing: 16dp gap

### ADMIN_BUSINESS_LOGIC
- Fetch all jobs (no date filter) on mount
- CRUD operations: create, update, delete jobs
- Job form fields: title (required), description, recurrence, recurrenceStartDate, recurrenceEndDate, recurrenceIndefinite, useSharedRecurrence
- Image upload: POST /api/jobs/{id}/image with multipart form data
- Image delete: DELETE /api/jobs/{id}/image
- Assignment management: add/remove/reorder assignments per job
- Assignment fields: userId, recurrence (optional override), displayOrder
- Reorder assignments: PUT /api/jobs/{jobId}/assignments/order with array of assignment IDs
- Validation: title required, dates must be valid ISO format
- Delete confirmation dialog before deletion
- Success/error toast messages

### ADMIN_UI_SPECS
- List view: LazyColumn with job cards showing title, description preview, image thumbnail, assignment count
- Add button: FAB bottom-right
- Job card actions: Edit, Delete icons
- Edit dialog/screen: full form with all fields, image picker, assignment list
- Assignment list: draggable items with user avatar, name, recurrence info, delete button
- Add assignment: dropdown/dialog to select user, optional recurrence override
- Image picker: system image picker, show preview, delete option
- Form validation: red error text below invalid fields
- Loading states: shimmer effect on list, progress indicator on save

### EDGE_CASES
- No jobs: empty state "No jobs yet" with add button
- No users: show warning "Create users first in Users tab"
- Job without assignments: show in "Unassigned" section
- Multi-assignment job: appears in multiple user cards in kiosk
- Image load failure: show placeholder icon
- Network error: retry button, cached data if available
- Concurrent edits: last write wins, show conflict warning
- Date navigation: handle timezone correctly, use ISO date strings
- Recurrence: display human-readable format (e.g., "Daily", "Weekly on Mon, Wed")

---

## CALENDAR FEATURE PROMPT

### API_ENDPOINTS
```
GET /api/calendars -> CalendarSource[]
POST /api/calendars -> CalendarSource
PUT /api/calendars/{id} -> void
DELETE /api/calendars/{id} -> void
PUT /api/calendars/order -> void (body: number[])
GET /api/calendar/events?start={ISO}&end={ISO}&include={ids} -> CalendarEventItem[]
GET /api/sitesettings -> SiteSettings
GET /api/users -> User[]
GET /api/jobs?date={YYYY-MM-DD} -> Job[] (for completion pills)
```

### DATA_MODELS
```kotlin
data class CalendarSource(val id: Int, val name: String, val icalUrl: String, val colorHex: String, val enabled: Boolean, val displayOrder: Int)
data class CalendarEventItem(val sourceId: Int, val sourceName: String, val colorHex: String, val title: String, val start: String, val end: String, val allDay: Boolean)
```

### KIOSK_BUSINESS_LOGIC
- Three view modes: Day, Week, Month (default from settings.defaultView)
- Fetch calendar sources and settings on mount
- Calculate date range based on view: Day (00:00 to 23:59), Week (Mon-Sun), Month (full calendar grid with padding weeks)
- Fetch events for visible sources only (enabled sources)
- Auto-refresh every N seconds (settings.calendarRefreshSeconds, default 30)
- Source filter toggle: show/hide individual calendar sources
- Completion pills: fetch jobs for date range, calculate open/total per user
- Completion mode: "Today" (only selected date) or "VisibleRange" (entire view range)
- Today highlighting: primary color border on current date
- Week starts Monday
- Time formatting: locale-aware, 12/24hr based on system

### KIOSK_UI_SPECS
- View selector: segmented control (Day/Week/Month tabs)
- Filter button: only shown if multiple sources, opens source toggle chips
- Today button: navigates to current date
- Completion pills: horizontal scroll, user avatar + name + "open/total" count, tinted with user color
- Day view: vertical list of event cards, full details (title, time range, source badge)
- Week view: 7-column grid, compact event chips, max 4 events shown per day, "+N more" overflow
- Month view: 7x6 grid, day headers (Mon-Sun), event dots, max 3 events per day, "+N more" overflow
- Event card: left border (4dp) with source color, background tinted (alpha 0.14), title, time, source badge
- Event chip: compact, left border (3dp), time + title truncated
- Event dot: small colored rectangle with title
- Empty state: mailbox emoji, "No events scheduled"
- Out-of-month days: 50% opacity in month view

### ADMIN_BUSINESS_LOGIC
- Fetch all calendar sources on mount
- CRUD operations: create, update, delete sources
- Source form fields: name (required), icalUrl (required, validate URL format), colorHex (color picker), enabled (toggle)
- Reorder sources: drag-and-drop, PUT /api/calendars/order
- Validation: name required, icalUrl must be valid URL, colorHex must be valid hex color
- Delete confirmation dialog
- Test iCal URL: attempt to fetch and parse, show success/error
- Success/error toast messages

### ADMIN_UI_SPECS
- List view: draggable cards with color swatch, name, URL preview, enabled toggle, edit/delete actions
- Drag handle: visible on hover/long-press
- Add button: FAB bottom-right
- Edit dialog: form with name input, URL input, color picker, enabled toggle, test button
- Color picker: preset colors + custom hex input
- Test button: shows loading spinner, then success/error message
- Enabled toggle: switch component, updates immediately
- Reorder: visual feedback during drag, save on drop
- Empty state: "No calendar sources" with add button

### EDGE_CASES
- No sources: empty state in kiosk and admin
- Invalid iCal URL: show error, prevent save
- iCal fetch failure: show warning in admin, hide source in kiosk
- All sources disabled: show "No calendars enabled" in kiosk
- Event spans multiple days: show in all relevant day cells
- All-day events: show at top, "All day" label
- Timezone handling: convert to local timezone for display
- Overlapping events: stack vertically, no overlap
- Very long event titles: truncate with ellipsis
- Color contrast: ensure text readable on colored backgrounds

---

## SHOPPING LISTS FEATURE PROMPT

### API_ENDPOINTS
```
GET /api/shoppinglists -> ShoppingList[]
POST /api/shoppinglists -> ShoppingList
PUT /api/shoppinglists/{id} -> void
DELETE /api/shoppinglists/{id} -> void
PUT /api/shoppinglists/order -> void (body: number[])
POST /api/shoppinglists/{id}/avatar -> {avatarUrl: string}
DELETE /api/shoppinglists/{id}/avatar -> void
GET /api/shoppinglists/{listId}/items -> ShoppingItem[]
POST /api/shoppinglists/{listId}/items -> ShoppingItem
PUT /api/shoppinglists/{listId}/items/{id} -> void
DELETE /api/shoppinglists/{listId}/items/{id} -> void
POST /api/shoppinglists/{listId}/items/{id}/toggle -> ShoppingItem
POST /api/shoppinglists/{listId}/items/{id}/important -> ShoppingItem
PUT /api/shoppinglists/{listId}/items/order -> void (body: number[])
DELETE /api/shoppinglists/{listId}/items/bought -> void
```

### DATA_MODELS
```kotlin
data class ShoppingList(val id: Int, val name: String, val colorHex: String, val avatarUrl: String?, val displayOrder: Int, val items: List<ShoppingItem>)
data class ShoppingItem(val id: Int, val shoppingListId: Int, val name: String, val isBought: Boolean, val isImportant: Boolean, val displayOrder: Int, val createdAt: String)
```

### KIOSK_BUSINESS_LOGIC
- Fetch all lists with items on mount
- Auto-refresh every 30 seconds
- Per-list hide bought toggle (default: hidden, local state only)
- Two view modes: Grid (default) and Full-screen (per list)
- Grid view: show max 5 unbought items, 3 bought items, "+N more" overflow
- Full-screen view: show all items, add input at top
- Item sorting: important first, then by displayOrder
- Toggle item bought: POST toggle endpoint, optimistic UI update
- Toggle important: POST important endpoint, optimistic UI update
- Add item: POST create, clear input, focus back to input
- Delete item: DELETE endpoint (full-screen only)
- Clear bought: DELETE bought endpoint, confirmation dialog
- Empty list: "List is empty" with sparkle emoji
- No lists: "No Shopping Lists" with cart emoji

### KIOSK_UI_SPECS
- Grid view: LazyVerticalGrid, 2 columns phone, 3-4 tablet
- List card: avatar/initial (56dp), name, item count, important badge, eye toggle, clear button
- Card background: tinted with list color (alpha 0.14)
- Important badge: warning color, count + warning emoji
- Item row: checkbox (28dp), name, important icon (if flagged), delete button (full-screen only)
- Important items: warning background tint, warning border
- Bought items: opacity 0.6, line-through text, filled checkbox
- Add input: text field, Add button, Enter key submits
- Full-screen: fixed overlay, header with back button, scrollable content
- "Open Full List" button: full width, list color background
- Eye toggle: show/hide bought items
- Clear button: trash icon, error color, only shown if bought items exist

### ADMIN_BUSINESS_LOGIC
- Fetch all lists on mount
- CRUD operations: create, update, delete lists
- List form fields: name (required), colorHex (color picker)
- Avatar upload: POST avatar with multipart form data
- Avatar delete: DELETE avatar endpoint
- Reorder lists: drag-and-drop, PUT order endpoint
- Item management: done in kiosk view (no separate admin item management)
- Validation: name required, colorHex valid hex
- Delete confirmation: warn if list has items
- Success/error toast messages

### ADMIN_UI_SPECS
- List view: draggable cards with avatar/initial, name, color swatch, item count, edit/delete actions
- Drag handle: visible on hover/long-press
- Add button: FAB bottom-right
- Edit dialog: name input, color picker, avatar picker (camera/gallery), avatar preview with delete option
- Color picker: preset colors + custom hex input
- Avatar picker: system image picker, crop to square, max 2MB
- Reorder: visual feedback during drag, save on drop
- Delete confirmation: "This list has N items. Delete anyway?"
- Empty state: "No shopping lists" with add button

### EDGE_CASES
- No lists: empty state in kiosk and admin
- Empty list: show empty state per list
- All items bought: show "All done!" when hide bought enabled
- Very long item names: truncate with ellipsis
- Image upload failure: show error, keep existing avatar
- Network error on toggle: revert optimistic update, show error
- Concurrent item additions: refresh list after add
- Input validation: trim whitespace, prevent empty items
- iOS keyboard: prevent zoom with fontSize 16px on input
- Rapid toggles: debounce or queue requests

---

## USERS MANAGEMENT PROMPT

### API_ENDPOINTS
```
GET /api/users -> User[]
POST /api/users -> User
PUT /api/users/{id} -> void
DELETE /api/users/{id} -> void
PUT /api/users/order -> void (body: number[])
POST /api/users/{id}/avatar -> {avatarUrl: string}
DELETE /api/users/{id}/avatar -> void
```

### DATA_MODELS
```kotlin
data class User(val id: Int, val displayName: String, val colorHex: String, val hideCompletedInKiosk: Boolean?, val avatarUrl: String?, val displayOrder: Int?, val email: String?, val isAdmin: Boolean?)
```

### ADMIN_BUSINESS_LOGIC
- Fetch all users on mount
- CRUD operations: create, update, delete users
- User form fields: displayName (required), colorHex (color picker), email (optional, for admin users), isAdmin (toggle)
- Avatar upload: POST avatar with multipart form data
- Avatar delete: DELETE avatar endpoint
- Reorder users: drag-and-drop, PUT order endpoint
- Validation: displayName required, email valid format if provided, colorHex valid hex
- Delete confirmation: warn if user has job assignments or shopping items
- Password management: not implemented in mobile (admin web only)
- Success/error toast messages

### ADMIN_UI_SPECS
- List view: draggable cards with avatar/initial, name, color swatch, admin badge, edit/delete actions
- Drag handle: visible on hover/long-press
- Add button: FAB bottom-right
- Edit dialog: displayName input, colorHex picker, email input, isAdmin toggle, avatar picker
- Color picker: preset colors + custom hex input
- Avatar picker: system image picker, crop to square, max 2MB
- Admin badge: shown if isAdmin true
- Reorder: visual feedback during drag, save on drop
- Delete confirmation: "This user has N job assignments. Delete anyway?"
- Empty state: "No users" with add button

### EDGE_CASES
- No users: empty state, warn in jobs/calendar features
- Duplicate names: allow but show warning
- Invalid email: show error, prevent save if provided
- Delete user with assignments: show count, confirm deletion
- Avatar upload failure: show error, keep existing
- Color contrast: ensure readable text on colored backgrounds

---

## KIOSK TOKENS MANAGEMENT PROMPT

### API_ENDPOINTS
```
GET /api/auth/kiosk/tokens -> KioskToken[]
POST /api/auth/kiosk/tokens -> KioskTokenResponse (body: {name: string})
DELETE /api/auth/kiosk/tokens/{id} -> void
```

### DATA_MODELS
```kotlin
data class KioskToken(val id: Int, val name: String, val createdAt: String, val isActive: Boolean)
data class KioskTokenResponse(val id: Int, val token: String, val name: String, val createdAt: String)
```

### ADMIN_BUSINESS_LOGIC
- Fetch all tokens on mount
- Create token: POST with name, returns full token (only shown once)
- Revoke token: DELETE endpoint, confirmation dialog
- Token display: show full token in dialog after creation, copy to clipboard button
- Token list: show name, created date, active status (always true for existing tokens)
- Validation: name required
- Success/error toast messages
- Security warning: token shown only once, must be saved

### ADMIN_UI_SPECS
- List view: cards with name, created date, revoke button
- Add button: FAB bottom-right
- Create dialog: name input, create button
- Token display dialog: large text showing token, copy button, QR code (optional), warning text
- Copy button: copies token to clipboard, shows "Copied!" feedback
- Revoke confirmation: "Revoke token '{name}'? Devices using this token will lose access."
- Empty state: "No kiosk tokens" with add button
- Created date: relative format (e.g., "2 days ago")

### EDGE_CASES
- No tokens: empty state
- Token just created: show in prominent dialog, must dismiss to continue
- Copy failure: show error, allow manual selection
- Revoke active token: warn that devices will lose access immediately
- Very long token names: truncate with ellipsis

---

## SITE SETTINGS PROMPT

### API_ENDPOINTS
```
GET /api/sitesettings -> SiteSettings
PUT /api/sitesettings -> void
```

### DATA_MODELS
```kotlin
data class SiteSettings(val id: Int, val defaultView: String, val completionMode: String?, val jobsRefreshSeconds: Int?, val calendarRefreshSeconds: Int?, val weatherRefreshSeconds: Int?, val weatherApiKey: String?, val weatherLocation: String?)
```

### ADMIN_BUSINESS_LOGIC
- Fetch settings on mount
- Update settings: PUT endpoint with all fields
- Form fields: defaultView (dropdown: Day/Week/Month), completionMode (dropdown: Today/VisibleRange), jobsRefreshSeconds (number, min 5), calendarRefreshSeconds (number, min 5), weatherRefreshSeconds (number, min 300), weatherApiKey (text, optional), weatherLocation (text, optional)
- Validation: refresh intervals must be >= minimum values
- Auto-save on change or explicit save button
- Success/error toast messages

### ADMIN_UI_SPECS
- Form layout: vertical list of labeled fields
- Default view: segmented control or dropdown (Day/Week/Month)
- Completion mode: segmented control or dropdown (Today/VisibleRange)
- Refresh intervals: number inputs with "seconds" suffix, helper text showing minimum
- Weather fields: text inputs, helper text explaining format
- Save button: bottom of form, disabled if no changes
- Reset button: revert to last saved state
- Helper text: explain each setting's purpose

### EDGE_CASES
- Invalid intervals: show error, prevent save
- Weather API key validation: optional, no format check
- Unsaved changes: warn on navigation away
- Network error: show error, keep form editable

---

## PERFORMANCE METRICS PROMPT

### API_ENDPOINTS
```
GET /api/perf/data?startTime={ISO}&endTime={ISO}&endpoint={string}&method={string}&statusCodeMin={int}&statusCodeMax={int} -> PerformanceMetricsResponse
```

### DATA_MODELS
```kotlin
data class PerformanceMetricsResponse(val endpoints: List<EndpointMetrics>, val startTime: String, val endTime: String, val totalRequests: Int)
data class EndpointMetrics(val endpoint: String, val method: String, val requestCount: Int, val avgRequestTimeMs: Double, val p50RequestTimeMs: Double, val p95RequestTimeMs: Double, val p99RequestTimeMs: Double, val avgDependencyTimeMs: Double, val errorRate: Double, val throughputPerMinute: Double, val avgQueryCount: Double)
```

### ADMIN_BUSINESS_LOGIC
- Fetch metrics on mount with default time range (last 24 hours)
- Filter options: time range (last hour/day/week/custom), endpoint filter, method filter, status code range
- Display metrics: table or cards showing endpoint, method, request count, avg time, percentiles, error rate, throughput
- Sort by: request count, avg time, error rate (descending)
- Refresh button: manual refresh
- Auto-refresh: optional, every 30 seconds
- Export: optional, CSV download

### ADMIN_UI_SPECS
- Filter bar: time range selector, endpoint search, method dropdown, status code inputs
- Metrics list: cards or table rows with endpoint, method, key metrics
- Metric cards: endpoint name, method badge, request count, avg time (with color coding), error rate (red if >5%)
- Sort dropdown: request count, avg time, error rate
- Refresh button: top-right
- Empty state: "No metrics for selected filters"
- Loading state: shimmer effect on cards

### EDGE_CASES
- No metrics: empty state
- Invalid time range: show error
- Very large datasets: pagination or virtual scrolling
- Slow API: show loading state, timeout after 30s
- Error rate calculation: handle division by zero

---

## AUTHENTICATION SYSTEM PROMPT

### API_ENDPOINTS
```
POST /api/auth/admin/login -> AuthResponse (body: {email: string, password: string})
POST /api/auth/admin/refresh -> AuthResponse
POST /api/auth/admin/logout -> void
POST /api/auth/kiosk/authenticate -> AuthResponse (body: {token: string})
GET /api/auth/status -> AuthResponse
```

### DATA_MODELS
```kotlin
data class AuthResponse(val accessToken: String, val role: String, val user: AdminUser?)
data class AdminUser(val id: Int, val email: String, val displayName: String)
```

### BUSINESS_LOGIC
- Two auth modes: Admin (email/password) and Kiosk (token)
- Admin login: POST login, store accessToken and refreshToken (HttpOnly cookie)
- Kiosk auth: POST authenticate, store accessToken and original token
- Token refresh: Admin uses refresh endpoint, Kiosk re-authenticates with original token
- Auto-refresh: every 14 minutes (tokens expire in 15)
- Token storage: encrypted SharedPreferences or DataStore
- Auth state: global state (ViewModel or Repository)
- Logout: clear tokens, navigate to login
- 401 handling: attempt refresh once, logout if fails
- Role-based navigation: Admin sees all tabs, Kiosk sees limited tabs

### UI_SPECS
- Login screen: email input, password input, login button, "Login as Kiosk" link
- Kiosk auth screen: server URL input, token input, authenticate button
- Loading state: full-screen spinner during auth
- Error display: toast or inline error text
- Remember me: optional checkbox to persist login
- Biometric auth: optional, after initial login
- Logout button: in settings or profile menu

### EDGE_CASES
- Invalid credentials: show error, keep on login screen
- Network error: show error, allow retry
- Token expired: auto-refresh, logout if refresh fails
- Server URL validation: must be valid URL format
- Empty fields: disable login button
- Concurrent requests: queue or cancel previous

---

## DESIGN SYSTEM PROMPT

### COLORS
```kotlin
// Dark theme (default)
val ColorBg = Color(0xFF0F1419)
val ColorBgElevated = Color(0xFF1A1F2E)
val ColorSurface = Color(0xFF232936)
val ColorSurfaceHover = Color(0xFF2D3548)
val ColorText = Color(0xFFF1F5F9)
val ColorTextSecondary = Color(0xFF94A3B8)
val ColorTextMuted = Color(0xFF64748B)
val ColorDivider = Color(0xFF334155)
val ColorPrimary = Color(0xFF60A5FA)
val ColorPrimaryHover = Color(0xFF3B82F6)
val ColorAccent = Color(0xFF34D399)
val ColorAccentHover = Color(0xFF10B981)
val ColorSuccess = Color(0xFF22C55E)
val ColorWarning = Color(0xFFFBBF24)
val ColorError = Color(0xFFF87171)
```

### TYPOGRAPHY
```kotlin
val Typography = Typography(
    displayLarge = TextStyle(fontSize = 57.sp, fontWeight = FontWeight.Normal, lineHeight = 64.sp),
    displayMedium = TextStyle(fontSize = 45.sp, fontWeight = FontWeight.Normal, lineHeight = 52.sp),
    displaySmall = TextStyle(fontSize = 36.sp, fontWeight = FontWeight.Normal, lineHeight = 44.sp),
    headlineLarge = TextStyle(fontSize = 32.sp, fontWeight = FontWeight.SemiBold, lineHeight = 40.sp),
    headlineMedium = TextStyle(fontSize = 28.sp, fontWeight = FontWeight.SemiBold, lineHeight = 36.sp),
    headlineSmall = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.SemiBold, lineHeight = 32.sp),
    titleLarge = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.SemiBold, lineHeight = 28.sp),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold, lineHeight = 24.sp),
    titleSmall = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium, lineHeight = 20.sp),
    bodyLarge = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Normal, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Normal, lineHeight = 20.sp),
    bodySmall = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Normal, lineHeight = 16.sp),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium, lineHeight = 20.sp),
    labelMedium = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, lineHeight = 16.sp),
    labelSmall = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Medium, lineHeight = 16.sp)
)
```

### SPACING
```kotlin
val SpacingXs = 4.dp
val SpacingSm = 8.dp
val SpacingMd = 12.dp
val SpacingLg = 16.dp
val SpacingXl = 20.dp
val SpacingXxl = 24.dp
val SpacingXxxl = 32.dp
```

### SHAPES
```kotlin
val Shapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(20.dp)
)
```

### TOUCH_TARGETS
```kotlin
val TouchTargetMin = 44.dp
val TouchTargetLarge = 56.dp
```

---

## ARCHITECTURE PROMPT

### STRUCTURE
```
app/src/main/java/io/tyrongower/kinboard/
├── data/
│   ├── api/
│   │   ├── KinboardApi.kt (Retrofit interface)
│   │   ├── AuthInterceptor.kt
│   │   └── ApiModule.kt (Hilt module)
│   ├── model/ (data classes)
│   ├── repository/
│   └── local/ (DataStore, Room if needed)
├── ui/
│   ├── theme/ (colors, typography, shapes)
│   ├── components/ (reusable composables)
│   ├── kiosk/
│   │   ├── KioskScreen.kt (main container)
│   │   ├── jobs/
│   │   ├── calendar/
│   │   └── shopping/
│   ├── admin/
│   │   ├── AdminScreen.kt (main container)
│   │   ├── jobs/
│   │   ├── users/
│   │   ├── calendars/
│   │   ├── shopping/
│   │   ├── tokens/
│   │   ├── settings/
│   │   └── performance/
│   └── auth/
├── viewmodel/
├── navigation/
├── util/
└── KinboardApplication.kt
```

### DEPENDENCIES
```kotlin
// Compose
implementation("androidx.compose.ui:ui:1.6.0")
implementation("androidx.compose.material3:material3:1.2.0")
implementation("androidx.compose.ui:ui-tooling-preview:1.6.0")
implementation("androidx.activity:activity-compose:1.8.0")
implementation("androidx.navigation:navigation-compose:2.7.0")

// Lifecycle
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")

// Networking
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.retrofit2:converter-gson:2.9.0")
implementation("com.squareup.okhttp3:okhttp:4.12.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

// DI
implementation("com.google.dagger:hilt-android:2.48")
kapt("com.google.dagger:hilt-compiler:2.48")
implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

// Image loading
implementation("io.coil-kt:coil-compose:2.5.0")

// DataStore
implementation("androidx.datastore:datastore-preferences:1.0.0")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

// Serialization
implementation("com.google.code.gson:gson:2.10.1")
```

### PATTERNS
- MVVM architecture with Compose
- Repository pattern for data access
- Hilt for dependency injection
- StateFlow for state management
- Sealed classes for UI state and events
- Single Activity with Compose Navigation
- Material 3 theming with custom colors
- Coil for image loading with caching
- DataStore for preferences and tokens
- Retrofit with OkHttp for networking
- Coroutines for async operations
- Error handling with Result wrapper or sealed class
