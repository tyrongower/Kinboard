# KINBOARD TV - FLUTTER GOOGLE TV APP DESIGN SPECIFICATION

## APP IDENTITY
- **Name**: Kinboard TV
- **Platform**: Google TV (Android TV)
- **Framework**: Flutter
- **Theme**: Dark mode only

---

## DESIGN SYSTEM

### COLOR PALETTE

#### Primary Colors
```
primary: #60a5fa (blue-400) - Main brand color, focus rings, highlights
primaryContainer: #1e3a8a (blue-900)
onPrimary: #ffffff
onPrimaryContainer: #dbeafe (blue-100)
```

#### Secondary/Accent Colors
```
secondary: #34d399 (emerald-400) - Success states, "All done" text
secondaryContainer: #064e3b (emerald-900)
onSecondary: #ffffff
onSecondaryContainer: #d1fae5 (emerald-100)
```

#### Tertiary Colors
```
tertiary: #22d3ee (cyan-400) - Warnings, additional accents
tertiaryContainer: #083344 (cyan-900)
onTertiary: #ffffff
onTertiaryContainer: #cffafe (cyan-100)
```

#### Status Colors
```
error: #f87171 (red-400)
errorContainer: #7f1d1d (red-900)
onError: #ffffff
onErrorContainer: #fecaca (red-200)
success: #22c55e (green-500)
warning: #fbbf24 (amber-400)
```

#### Background & Surface Colors
```
background: #0f1419 - Main app background
onBackground: #f1f5f9 - Primary text on background
surface: #232936 - Card backgrounds, elevated surfaces
onSurface: #f1f5f9 - Primary text on surfaces
surfaceVariant: #2d3548 - Hover states, secondary surfaces
onSurfaceVariant: #94a3b8 - Secondary text, muted content
```

#### Border & Outline Colors
```
outline: #334155 (slate-700) - Dividers, borders
outlineVariant: #475569 (slate-600)
borderSubtle: rgba(255,255,255,0.12) - Subtle borders on buttons
```

#### Elevation Levels (Surface tints)
```
level0: transparent
level1: #1a1f2e - Elevated background
level2: #232936
level3: #2d3548 - Focused button backgrounds
level4: #334155
level5: #3e4c5e
```

#### Disabled States
```
surfaceDisabled: rgba(241, 245, 249, 0.12)
onSurfaceDisabled: rgba(241, 245, 249, 0.38)
backdrop: rgba(15, 20, 25, 0.7)
```

### DYNAMIC COLORS FROM API
- **User colors**: Each user has a `colorHex` field (e.g., "#6366f1") used for:
  - Person card left border
  - Progress bar fill color
  - Avatar background (when no image)
  - Completed checkbox icon color
- **Default user color**: #6366f1 (indigo)
- **Unassigned jobs color**: #94a3b8 (slate-400)

---

### TYPOGRAPHY

#### Font Family
- System font (San Francisco on iOS, Roboto on Android/TV)

#### Type Scale
```
displayLarge:  fontSize: 57, fontWeight: 400, lineHeight: 64
displayMedium: fontSize: 45, fontWeight: 400, lineHeight: 52
displaySmall:  fontSize: 36, fontWeight: 400, lineHeight: 44
headlineLarge: fontSize: 32, fontWeight: 600, lineHeight: 40
headlineMedium: fontSize: 28, fontWeight: 600, lineHeight: 36
headlineSmall: fontSize: 24, fontWeight: 600, lineHeight: 32
titleLarge:    fontSize: 20, fontWeight: 600, lineHeight: 28
titleMedium:   fontSize: 16, fontWeight: 600, lineHeight: 24, letterSpacing: 0.15
titleSmall:    fontSize: 14, fontWeight: 500, lineHeight: 20, letterSpacing: 0.1
bodyLarge:     fontSize: 16, fontWeight: 400, lineHeight: 24, letterSpacing: 0.5
bodyMedium:    fontSize: 14, fontWeight: 400, lineHeight: 20, letterSpacing: 0.25
bodySmall:     fontSize: 12, fontWeight: 400, lineHeight: 16, letterSpacing: 0.4
labelLarge:    fontSize: 14, fontWeight: 500, lineHeight: 20, letterSpacing: 0.1
labelMedium:   fontSize: 12, fontWeight: 500, lineHeight: 16, letterSpacing: 0.5
labelSmall:    fontSize: 11, fontWeight: 500, lineHeight: 16, letterSpacing: 0.5
```

---

### SPACING & SIZING

#### Spacing Scale
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
xxl: 24px
xxxl: 32px
```


#### Border Radius Scale
```
sm: 8px
md: 12px - Default roundness
lg: 16px
xl: 20px
full: 9999px - Circular elements
```

---

### SHADOWS

#### Small Shadow
```
shadowColor: #000000
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.05
shadowRadius: 2
elevation: 1
```

#### Medium Shadow
```
shadowColor: #000000
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.07
shadowRadius: 6
elevation: 3
```

#### Large Shadow
```
shadowColor: #000000
shadowOffset: { width: 0, height: 10 }
shadowOpacity: 0.1
shadowRadius: 15
elevation: 5
```

#### Focus Shadow (TV)
```
shadowColor: primary (#60a5fa)
shadowOpacity: 0.45
shadowRadius: 12
shadowOffset: { width: 0, height: 0 }
elevation: 6
```

---


## SCREEN LAYOUTS

### KIOSK LOGIN SCREEN

#### Layout
- Centered content, max width 400px
- Vertical stack layout
- Padding: 20px

#### Components (top to bottom)
1. **Logo**: 80x80px, borderRadius 20px
2. **Title**: "Kinboard TV" - displaySmall, primary color, bold, centered
3. **Subtitle**: "Enter your kiosk token to continue" - titleMedium, onSurfaceVariant, centered, marginBottom 32px
4. **Server URL Input**: outlined text field, marginBottom 16px
5. **Kiosk Token Input**: outlined text field, marginBottom 16px
6. **Authenticate Button**: contained/filled style, marginBottom 16px, paddingVertical 6px
7. **Help Text**: "Contact your administrator for a valid kiosk token" - bodySmall, onSurfaceDisabled, centered

#### Error/Warning Cards
- Outlined card style
- Error title: error color (#f87171)
- Warning title: tertiary color (#22d3ee)
- Body text: onSurfaceVariant

---

### JOBS SCREEN


#### Header Section
- **Row layout**: title/date on left, navigation buttons on right
- **Title**: "Jobs" - headlineLarge
- **Date subtitle**: formatted as "Wed, Jan 9" - titleLarge, opacity 0.9, marginTop 2px
- **Header margin bottom**: 24px (TV mode)

#### Date Navigation Buttons (horizontal row)
- Gap between buttons: 12px
- Button style:
  - borderRadius: 12px
  - paddingHorizontal: 16px
  - paddingVertical: 10px
  - borderWidth: 1px
  - borderColor: rgba(255,255,255,0.12)
- Button text: titleMedium, onSurface color
- Focused state: backgroundColor elevation.level3 (#2d3548)
- Buttons: "Prev", "Today", "Next"

#### Person Cards Container
- **IMPORTANT LAYOUT CHANGE**: Display 4 person cards horizontally across the screen (not vertical stack)
- Cards should be arranged in a horizontal row
- Equal width distribution across available space
- Gap between cards: 16px
- Horizontal scroll if more than 4 people
- paddingBottom: 8px

---

### PERSON JOB CARD

#### Card Wrapper (TV focus container)
- borderWidth: 3px
- borderRadius: 18px
- borderColor: transparent (unfocused) | primary (when any child focused)
- Shadow when active: primary color, opacity 0.45, radius 14, elevation 10

#### Card Component
- Left border: 4px solid [user.colorHex]
- Background: surface color (#232936)
- Default border radius from theme (12px)

#### Card Header
- **Row layout**: avatar + text on left, toggle button on right
- marginBottom: 12px

##### User Avatar
- Size: 48px (default)
- If avatarUrl exists: circular image
- If no avatar: circular background with user.colorHex, first letter of name (uppercase), white text

##### User Info (next to avatar)
- marginLeft: 12px
- **Name**: titleMedium
- **Stats**: bodySmall, "X of Y completed"

##### Hide/Show Toggle Button (eye icon)
- Size: 44x44px
- borderRadius: 12px
- borderWidth: 1px (unfocused) | 2px (focused)
- borderColor: rgba(255,255,255,0.12)
- Icon: "eye" or "eye-off" (24px), onSurface color

#### Progress Bar
- Height: 6px
- borderRadius: 3px
- marginBottom: 12px
- Fill color: user.colorHex
- Background: surfaceVariant

#### Jobs List
- Vertical stack of JobItem components
- Empty state: centered "✓ All done!" text, #34d399 (emerald), paddingVertical 24px

---

### JOB ITEM

#### Container
- marginTop: 8px between items
- borderRadius: 12px

#### Card
- borderRadius: 12px
- elevation: 1
- Completed state: opacity 0.6

#### Content Row
- flexDirection: row
- alignItems: center
- padding: 8px all sides

#### Components (left to right)
1. **Job Image** (optional): 40px circular avatar, marginRight 12px
2. **Text Container** (flex: 1):
   - **Title**: bodyMedium, onSurface color
   - **Title (completed)**: line-through, onSurfaceVariant color
   - **Description** (optional): bodySmall, marginTop 2px
3. **Checkbox Icon**: 28px
   - Uncompleted: "checkbox-blank-circle-outline", onSurfaceVariant color
   - Completed: "checkbox-marked-circle", user.colorHex color

---

## API SPECIFICATION

### Base Configuration
- **Base URL**: User-configurable (stored locally)
- **Content-Type**: application/json
- **Timeout**: 30000ms
- **Authentication**: Bearer token in Authorization header

### Authentication

#### Kiosk Login
```
POST /api/auth/kiosk/authenticate
Content-Type: application/json

Request Body:
{
  "token": string  // Kiosk token provided by admin
}

Response (200 OK):
{
  "accessToken": string,  // JWT token for subsequent requests
  "role": "kiosk",
  "user": null
}

Response (401 Unauthorized):
{
  "message": "Invalid kiosk token"
}
```

#### Check Auth Status
```
GET /api/auth/status
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "accessToken": "",
  "role": "kiosk",
  "user": null
}
```

### Jobs API

#### Get Jobs by Date
```
GET /api/jobs?date={YYYY-MM-DD}
Authorization: Bearer {accessToken}

Response (200 OK):
[
  {
    "id": number,
    "title": string,
    "description": string | null,
    "imageUrl": string | null,  // Relative path like "/job-images/job_1.webp"
    "createdAt": string,  // ISO datetime
    "recurrence": string | null,  // RRULE format
    "recurrenceStartDate": string | null,
    "recurrenceEndDate": string | null,
    "recurrenceIndefinite": boolean,
    "useSharedRecurrence": boolean,
    "assignments": [
      {
        "id": number,
        "jobId": number,
        "userId": number,
        "user": {
          "id": number,
          "displayName": string,
          "colorHex": string,  // e.g., "#6366f1"
          "avatarUrl": string | null,
          "displayOrder": number
        },
        "recurrence": string | null,
        "recurrenceStartDate": string | null,
        "recurrenceEndDate": string | null,
        "recurrenceIndefinite": boolean,
        "displayOrder": number,
        "isCompleted": boolean,
        "completedAt": string | null  // ISO datetime
      }
    ],
    "occurrenceDate": string | null
  }
]
```

#### Complete Job Assignment
```
POST /api/jobs/{jobId}/assignments/{assignmentId}/complete?date={YYYY-MM-DD}
Authorization: Bearer {accessToken}

Response (200 OK): empty body
```

#### Uncomplete Job Assignment
```
DELETE /api/jobs/{jobId}/assignments/{assignmentId}/complete?date={YYYY-MM-DD}
Authorization: Bearer {accessToken}

Response (204 No Content)
```

### Users API

#### Get All Users
```
GET /api/users
Authorization: Bearer {accessToken}

Response (200 OK):
[
  {
    "id": number,
    "displayName": string,
    "colorHex": string,  // e.g., "#6366f1" - USE THIS FOR CARD BORDERS, PROGRESS BARS, AVATARS
    "avatarUrl": string | null,  // Relative path like "/avatars/user_1.webp"
    "displayOrder": number,
    "hideCompletedInKiosk": boolean
  }
]

Note: For kiosk role, email, passwordHash, and isAdmin are not returned
```

#### Toggle Hide Completed
```
PATCH /api/users/{userId}/hide-completed
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "hideCompletedInKiosk": boolean
}
```

### Site Settings API

#### Get Settings
```
GET /api/sitesettings
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "id": number,
  "defaultView": "Day" | "Week" | "Month",
  "completionMode": "Today" | "VisibleRange" | null,
  "jobsRefreshSeconds": number | null
}
```

---

## DATA MODELS

### Job
```typescript
{
  id: number
  title: string
  description?: string
  imageUrl?: string | null  // Prepend base URL for full path
  createdAt: string
  recurrence?: string
  recurrenceStartDate?: string | null
  recurrenceEndDate?: string | null
  recurrenceIndefinite?: boolean
  useSharedRecurrence?: boolean
  assignments?: JobAssignment[]
  occurrenceDate?: string | null
}
```

### JobAssignment
```typescript
{
  id: number
  jobId: number
  userId: number
  user?: User | null
  recurrence?: string
  recurrenceStartDate?: string | null
  recurrenceEndDate?: string | null
  recurrenceIndefinite?: boolean
  displayOrder: number
  isCompleted?: boolean
  completedAt?: string | null
}
```

### User
```typescript
{
  id: number
  displayName: string
  colorHex: string  // IMPORTANT: Use for visual theming per user
  hideCompletedInKiosk?: boolean
  avatarUrl?: string | null  // Prepend base URL for full path
  displayOrder?: number
}
```

### AuthResponse
```typescript
{
  accessToken: string
  role: "kiosk"
  user: null  // Always null for kiosk auth
}
```

---

## BEHAVIOR SPECIFICATIONS

### Jobs Screen Data Flow
1. On mount: Fetch users (GET /api/users) and jobs for selected date (GET /api/jobs?date=YYYY-MM-DD)
2. Auto-refresh jobs every 10 seconds
3. Group jobs by user based on assignments
4. Jobs without assignments go to "Unassigned" group (color: #94a3b8)
5. Sort users by displayOrder

### Job Completion Toggle
1. User focuses on job item and presses select/enter
2. If not completed: POST complete endpoint
3. If completed: DELETE complete endpoint
4. Invalidate jobs query to refresh data

### Hide Completed Toggle
1. User focuses on eye icon button and presses select/enter
2. Toggle local state immediately for responsive UI
3. State persists per-user based on hideCompletedInKiosk
4. When hidden: Filter out jobs where isCompleted === true

### Date Navigation
- "Prev": Subtract 1 day from selected date
- "Today": Set to current date
- "Next": Add 1 day to selected date
- Date change triggers jobs refetch

### Image URLs
- All image URLs from API are relative paths
- Prepend the configured base URL to get full URL
- Example: baseUrl + "/avatars/user_1.webp"
- Add cache-busting query param if needed: "?v={timestamp}"

---

## ERROR HANDLING

### 401 Unauthorized
- Clear stored tokens
- Navigate to login screen
- Show "Session expired" message

### Network Errors
- Show error state with retry option
- Don't crash the app

### Invalid Token on Login
- Show "Invalid kiosk token" alert
- Keep user on login screen

---

## ACCESSIBILITY

### Focus Management
- All interactive elements must be focusable via D-pad
- Logical focus order: header buttons → person cards (left to right) → job items within cards
- Focus should wrap appropriately at screen edges

### Labels
- All buttons need accessibility labels
- Job items: "Mark {title} as completed" or "Mark {title} as not completed"
- Toggle buttons: "Show completed for {name}" or "Hide completed for {name}"
- Navigation: "Previous day", "Go to today", "Next day"
