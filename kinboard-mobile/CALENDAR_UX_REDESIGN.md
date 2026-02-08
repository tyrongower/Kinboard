# Calendar UX Redesign for Android Mobile/Tablet

## Problem Analysis

### Current Frontend Design Issues
1. **Multiple scroll containers**: User pills (horizontal) + calendar content (vertical)
2. **Nested scrolling conflicts**: Hard to scroll the right section on touch devices
3. **Poor mobile ergonomics**: Horizontal scrolling is awkward on phones
4. **Hidden content**: Users may not discover all users in horizontal scroll
5. **Accessibility problems**: Screen readers struggle with nested scrolling

## Android Best Practices

### Material Design 3 Recommendations
- Avoid nested scrolling whenever possible
- Use single scroll direction per screen
- Prioritize vertical scrolling (natural thumb movement)
- Use bottom sheets or dialogs for secondary content
- Implement proper window size classes for tablets

### Android Calendar Patterns
1. **Google Calendar approach**: Single scroll, integrated views
2. **Collapsing headers**: User info collapses as you scroll
3. **Bottom navigation**: Switch between views
4. **Floating Action Button**: Quick actions

## Proposed Redesign

### Phone Layout (Compact)

#### Option A: Integrated Single Scroll (RECOMMENDED)
```
┌─────────────────────┐
│ [< Today >] [Filter]│ ← Sticky header
├─────────────────────┤
│ [Day|Week|Month]    │ ← View tabs (sticky)
├─────────────────────┤
│                     │
│ ┌─────────────────┐ │
│ │ User Pills      │ │ ← Scrolls with content
│ │ [👤][👤][👤]    │ │    (not separate scroll)
│ └─────────────────┘ │
│                     │
│ Calendar Content    │
│ ┌─────────────────┐ │
│ │ Event 1         │ │
│ ├─────────────────┤ │
│ │ Event 2         │ │ ← Single vertical scroll
│ ├─────────────────┤ │
│ │ Event 3         │ │
│ └─────────────────┘ │
│                     │
│                     │
└─────────────────────┘
```

**Benefits:**
- Single scroll direction (vertical only)
- No scroll conflicts
- User pills visible initially, scroll away naturally
- Simple, predictable behavior
- Excellent accessibility

#### Option B: Bottom Sheet for User Filter
```
┌─────────────────────┐
│ [< Today >] [Users] │ ← Tap "Users" opens bottom sheet
├─────────────────────┤
│ [Day|Week|Month]    │
├─────────────────────┤
│                     │
│ Calendar Content    │
│ ┌─────────────────┐ │
│ │ Event 1         │ │
│ ├─────────────────┤ │
│ │ Event 2         │ │ ← Single scroll
│ ├─────────────────┤ │
│ │ Event 3         │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘

Bottom Sheet (when opened):
┌─────────────────────┐
│ Filter by User      │
│ ☑ John (3/5)        │
│ ☑ Sarah (2/4)       │
│ ☑ Mike (1/3)        │
│ [Apply] [Cancel]    │
└─────────────────────┘
```

**Benefits:**
- Cleaner main screen
- No horizontal scrolling
- User selection is explicit action
- More space for calendar content

### Tablet Layout (Medium/Expanded)

#### Two-Pane Layout
```
┌─────────────────────────────────────────────┐
│ [< Today >] [Day|Week|Month]      [Filter]  │
├──────────────┬──────────────────────────────┤
│              │                              │
│ User Panel   │  Calendar Content            │
│              │                              │
│ ┌──────────┐│  ┌────────────────────────┐  │
│ │👤 John   ││  │ Event 1                │  │
│ │  3/5     ││  ├────────────────────────┤  │
│ ├──────────┤│  │ Event 2                │  │
│ │👤 Sarah  ││  ├────────────────────────┤  │
│ │  2/4     ││  │ Event 3                │  │
│ ├──────────┤│  └────────────────────────┘  │
│ │👤 Mike   ││                              │
│ │  1/3     ││                              │
│ └──────────┘│                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

**Benefits:**
- Utilizes tablet screen space
- Persistent user panel (no scrolling needed)
- Side-by-side layout is natural for tablets
- Follows Material Design adaptive layouts

## Implementation Plan

### 1. Phone Implementation (Priority)
- Use Option A (Integrated Single Scroll)
- LazyColumn for entire screen
- Sticky header with date navigation
- User pills as first LazyColumn item
- Calendar events as subsequent items
- Pull-to-refresh support

### 2. Tablet Implementation
- Detect window size class
- Use two-pane layout for Medium/Expanded
- Persistent side panel for users
- Larger touch targets
- Optimized spacing

### 3. View-Specific Layouts

#### Day View
- List of events with time
- Group by time slots
- All-day events at top
- Empty state: "No events today"

#### Week View
- Horizontal pager with 7 days
- Swipe between days
- Mini calendar indicator at top
- Current day highlighted

#### Month View
- Calendar grid (7x5/6)
- Event dots (max 3 per day)
- Tap day to see details in bottom sheet
- Current day highlighted

### 4. Accessibility
- Proper content descriptions
- TalkBack support
- Minimum 48dp touch targets
- High contrast mode support
- Semantic grouping

### 5. Performance
- LazyColumn for efficient scrolling
- Image loading with Coil
- Pagination for large date ranges
- Cache calendar data locally

## Technical Implementation

### Key Components
1. `CalendarScreen.kt` - Main screen composable
2. `CalendarViewModel.kt` - State management
3. `CalendarRepository.kt` - Data layer
4. `UserFilterBottomSheet.kt` - Optional user filter
5. `DayView.kt`, `WeekView.kt`, `MonthView.kt` - View implementations

### State Management
```kotlin
data class CalendarUiState(
    val selectedDate: LocalDate,
    val viewType: CalendarViewType,
    val events: List<CalendarEvent>,
    val users: List<User>,
    val selectedUserIds: Set<Int>,
    val isLoading: Boolean,
    val error: String?
)
```

### Window Size Classes
```kotlin
when (windowSizeClass.widthSizeClass) {
    WindowWidthSizeClass.Compact -> PhoneLayout()
    WindowWidthSizeClass.Medium -> TabletLayout()
    WindowWidthSizeClass.Expanded -> TabletLayout()
}
```

## Conclusion

**Recommended Approach:**
- **Phone**: Option A (Integrated Single Scroll) - Simple, accessible, no scroll conflicts
- **Tablet**: Two-pane layout - Efficient use of space, persistent user panel

This design:
✅ Eliminates nested scrolling issues
✅ Follows Android best practices
✅ Implements Material Design 3 patterns
✅ Provides excellent accessibility
✅ Scales from phone to tablet
✅ Maintains feature parity with frontend
✅ Improves upon web UX for mobile context
