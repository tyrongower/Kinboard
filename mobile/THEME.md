# Kinboard Mobile Theme

The mobile app theme is designed to match the **Kinboard Design System** established in the frontend web application.

## Design Philosophy

The Kinboard brand is:
- **Calm & family-safe**: Suitable for always-on wall displays
- **Modern**: Clean, contemporary design patterns
- **Open-source aesthetic**: Approachable and welcoming
- **Glanceable**: Optimized for quick information consumption

## Color Palette

### Brand Colors (Dark Theme - Default)

The mobile app uses the dark-first design system as the default, matching the frontend's primary aesthetic.

| Color | Mobile | Frontend (Dark) | Usage |
|-------|--------|-----------------|-------|
| **Primary** | `#60a5fa` (blue-400) | `#60a5fa` | Primary actions, links, focus states |
| **Primary Hover** | `#3b82f6` (blue-500) | `#3b82f6` | Active states, highlights |
| **Accent** | `#34d399` (emerald-400) | `#34d399` | Success states, completion indicators |
| **Accent Hover** | `#10b981` (emerald-500) | `#10b981` | Accent highlights, active states |

### Status Colors

| Color | Value | Usage |
|-------|-------|-------|
| **Success** | `#22c55e` (green-500) | Completed tasks, success messages |
| **Warning** | `#fbbf24` (amber-400) | Warnings, important items |
| **Error** | `#f87171` (red-400) | Errors, destructive actions |

### Neutral Colors (Dark Theme)

| Color | Value | Usage |
|-------|-------|-------|
| **Background** | `#0f1419` | App background |
| **Surface** | `#232936` | Cards, elevated surfaces |
| **Surface Hover** | `#2d3548` | Alternate surfaces |
| **Text Primary** | `#f1f5f9` | Primary text |
| **Text Secondary** | `#94a3b8` | Secondary text, labels |
| **Text Muted** | `#64748b` | Disabled text, placeholders |
| **Divider** | `#334155` | Borders, dividers, outlines |

## Typography

### Font Configuration

The mobile app uses the **system font stack** for optimal performance and native feel:
- iOS: SF Pro / San Francisco
- Android: Roboto

### Type Scale

| Variant | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **Display Large** | 57px | 400 | 64px | Hero headlines |
| **Display Medium** | 45px | 400 | 52px | Large headlines |
| **Display Small** | 36px | 400 | 44px | Section headlines |
| **Headline Large** | 32px | 600 | 40px | Major headings |
| **Headline Medium** | 28px | 600 | 36px | Page titles |
| **Headline Small** | 24px | 600 | 32px | Section titles |
| **Title Large** | 20px | 600 | 28px | Card titles |
| **Title Medium** | 16px | 600 | 24px | List item titles |
| **Title Small** | 14px | 500 | 20px | Subtitles |
| **Body Large** | 16px | 400 | 24px | Large body text |
| **Body Medium** | 14px | 400 | 20px | Default body text |
| **Body Small** | 12px | 400 | 16px | Small body text |
| **Label Large** | 14px | 500 | 20px | Button labels |
| **Label Medium** | 12px | 500 | 16px | Form labels |
| **Label Small** | 11px | 500 | 16px | Small labels |

## Shape & Effects

### Border Radius

Matches frontend design tokens:

| Name | Value | Usage |
|------|-------|-------|
| **Small** | 8px | Small elements, badges |
| **Medium** | 12px | Cards, buttons (default) |
| **Large** | 16px | Large cards |
| **Extra Large** | 20px | Modals, dialogs |
| **Full** | 9999px | Pills, circular elements |

### Shadows

Shadow styles for depth and elevation:

| Name | Usage |
|------|-------|
| **Small** | Subtle elevation (buttons, chips) |
| **Medium** | Standard cards, elevated surfaces |
| **Large** | Modals, dialogs, important elevation |

Shadow implementation uses React Native's `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, and `elevation` properties for cross-platform consistency.

## Touch Targets

Following iOS and Android guidelines for accessibility:

| Target | Size | Usage |
|--------|------|-------|
| **Standard** | 44px | Buttons, interactive elements (matches frontend) |
| **Large** | 56px | Primary actions, navigation tabs |

## Spacing Scale

Consistent spacing for layouts:

| Name | Value | Usage |
|------|-------|-------|
| **XS** | 4px | Tight spacing |
| **SM** | 8px | Small gaps |
| **MD** | 12px | Default spacing |
| **LG** | 16px | Standard gaps |
| **XL** | 20px | Large spacing |
| **XXL** | 24px | Section spacing |
| **XXXL** | 32px | Major sections |

## Comparison with Frontend

### Exact Matches

The following design tokens are **identical** between mobile and frontend:

✅ **Primary color**: `#60a5fa` (blue-400)
✅ **Accent color**: `#34d399` (emerald-400)
✅ **Status colors**: Success, Warning, Error
✅ **Border radius scale**: 8px, 12px, 16px, 20px
✅ **Touch targets**: 44px minimum
✅ **Background color**: `#0f1419`
✅ **Surface color**: `#232936`
✅ **Text colors**: slate-100, slate-400, slate-500
✅ **Divider color**: `#334155`

### Platform Adaptations

The following are **adapted** for mobile platforms:

🔄 **Typography**: Uses system font stack instead of Geist Sans/Inter
🔄 **Shadows**: Platform-specific shadow implementation (iOS vs Android)
🔄 **Components**: Uses React Native Paper (Material Design 3) instead of custom components

### Key Features

✅ **Dark theme**: Mobile uses dark theme by default matching frontend
❌ **Auto theme detection**: Not yet implemented (manual dark theme override)
❌ **CSS variables**: Uses React Native theme object instead
❌ **Scrollbar styling**: Not applicable on mobile
❌ **Hover states**: Mobile uses press/active states instead

## Usage Examples

### Using Theme Colors

```typescript
import { theme, colors } from '../theme/theme';
import { useTheme } from 'react-native-paper';

// In functional components
const theme = useTheme();

// Paper component (uses theme.colors)
<Button mode="contained" buttonColor={theme.colors.primary}>
  Primary Action
</Button>

// Custom component (uses colors constants)
<View style={{ backgroundColor: colors.success }}>
  <Text style={{ color: '#fff' }}>Success!</Text>
</View>
```

### Using Spacing

```typescript
import { spacing } from '../theme/theme';

<View style={{ padding: spacing.lg, gap: spacing.md }}>
  {/* Content */}
</View>
```

### Using Border Radius

```typescript
import { radius } from '../theme/theme';

<View style={{ borderRadius: radius.md }}>
  {/* Content */}
</View>
```

### Using Shadows

```typescript
import { shadows } from '../theme/theme';

<View style={[styles.card, shadows.md]}>
  {/* Content */}
</View>
```

### Using Typography

```typescript
import { Text } from 'react-native-paper';

<Text variant="headlineMedium">Page Title</Text>
<Text variant="bodyMedium">Body text content</Text>
<Text variant="labelLarge">Button Label</Text>
```

## Material Design 3 Integration

The mobile app uses **React Native Paper** which implements Material Design 3 (MD3). Our Kinboard theme is applied on top of MD3's default dark theme:

- **MD3 Colors**: Mapped to Kinboard brand colors
- **MD3 Typography**: Extended with full type scale
- **MD3 Components**: Buttons, Cards, Chips, TextInputs inherit theme
- **MD3 Elevation**: Customized to match Kinboard shadow style

## Responsive Behavior

The theme adapts to different screen sizes through the responsive utility system:

### Breakpoints

- **Phone Portrait**: < 600px width
- **Tablet Portrait**: 600-1023px width
- **Tablet Landscape**: ≥ 1024px width

### Adaptive Values

- **Padding**: 16px on phones, 24px on tablets
- **Columns**: 1 column (phone), 2 columns (tablet portrait), 3 columns (tablet landscape)
- **Max Width**: Constrains content on large screens for readability

See `src/utils/responsive.ts` for implementation details.

## Future Enhancements

Potential theme improvements for future versions:

1. **Theme Toggle**: Allow users to switch between light/dark themes
2. **Custom Fonts**: Add Geist Sans/Geist Mono for brand consistency
3. **Dynamic Colors**: Support Material You dynamic color on Android 12+
4. **Animation Tokens**: Standardize animation durations and easing functions
5. **Accessibility Modes**: High contrast, large text options

## References

- Frontend Design System: `frontend/src/app/globals.css`
- Frontend Theme: `frontend/src/theme.ts`
- React Native Paper: https://callstack.github.io/react-native-paper/
- Material Design 3: https://m3.material.io/
