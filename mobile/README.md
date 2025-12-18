# Kinboard Mobile App

Cross-platform mobile application (iOS & Android) for the Kinboard kiosk experience, built with React Native and Expo.

## Overview

This mobile app replicates the kiosk functionality from the Next.js web frontend, providing:
- **Calendar view**: Display calendar events with day/week/month views
- **Jobs view**: View and complete jobs organized by person
- **Shopping view**: Manage shopping lists with add/toggle/delete functionality

**Excluded**: Weather widget and all admin functionality.

## Tech Stack

- **Framework**: React Native (Expo SDK 54+)
- **Navigation**: React Navigation v7 (bottom tabs + stack)
- **State Management**: TanStack Query (React Query) v5
- **HTTP Client**: Axios
- **UI Components**: React Native Paper (Material Design)
- **Calendar**: react-native-calendars
- **Secure Storage**: expo-secure-store (Keychain/Keystore)
- **Language**: TypeScript

## Architecture

### Folder Structure

```
mobile/
├── src/
│   ├── api/              # API client & service layer
│   │   ├── client.ts     # Axios instance with auth interceptor
│   │   └── index.ts      # API endpoints (jobs, calendar, shopping, users, settings)
│   ├── auth/             # Authentication layer
│   │   ├── authService.ts  # Kiosk token authentication & auto-refresh
│   │   └── storage.ts      # Secure token storage (Keychain/Keystore)
│   ├── components/       # Reusable UI components (currently none, screens are self-contained)
│   ├── navigation/       # Navigation setup
│   │   ├── AppNavigator.tsx      # Root stack navigator (Auth → Main)
│   │   └── MainTabNavigator.tsx  # Bottom tab navigator (Calendar, Jobs, Shopping)
│   ├── screens/          # Screen components
│   │   ├── AuthScreen.tsx      # Kiosk token authentication
│   │   ├── CalendarScreen.tsx  # Calendar with events
│   │   ├── JobsScreen.tsx      # Jobs by person
│   │   └── ShoppingScreen.tsx  # Shopping lists
│   ├── theme/            # Theme configuration
│   │   └── theme.ts      # React Native Paper theme + colors
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Shared types matching backend DTOs
│   └── utils/            # Utility functions
│       └── env.ts        # Environment variable configuration
├── App.tsx               # Root component with providers
├── package.json          # Dependencies and scripts
└── .env.example          # Environment variables template
```

### Web-to-Mobile Mapping

| Web Kiosk Page | Mobile Screen | Functionality |
|----------------|---------------|---------------|
| `/kiosk/auth?token=XXX` | `AuthScreen` | Kiosk token authentication, secure storage |
| `/kiosk/calendar` | `CalendarScreen` | Day/Week/Month views, calendar events, user completion pills |
| `/kiosk/jobs` | `JobsScreen` | Jobs grouped by person, completion tracking, hide completed toggle |
| `/kiosk/shopping` | `ShoppingScreen` | Shopping lists, add/toggle/delete items, important markers |

### API Endpoints Used

The mobile app uses the same backend endpoints as the web kiosk:

**Authentication:**
- `POST /api/auth/kiosk/authenticate` - Authenticate with kiosk token

**Jobs:**
- `GET /api/jobs?date={date}` - Get jobs for a specific date
- `POST /api/jobs/{jobId}/assignments/{assignmentId}/complete?date={date}` - Mark job complete
- `DELETE /api/jobs/{jobId}/assignments/{assignmentId}/complete?date={date}` - Mark job incomplete

**Calendar:**
- `GET /api/calendars` - Get all calendar sources
- `GET /api/calendar/events?start={start}&end={end}&include={ids}` - Get calendar events

**Users:**
- `GET /api/users` - Get all users
- `PATCH /api/users/{userId}/hide-completed` - Toggle hide completed preference

**Shopping:**
- `GET /api/shoppinglists` - Get all shopping lists with items
- `POST /api/shoppinglists/{listId}/items` - Add item to list
- `POST /api/shoppinglists/{listId}/items/{itemId}/toggle` - Toggle item bought status
- `POST /api/shoppinglists/{listId}/items/{itemId}/important` - Toggle item important status
- `DELETE /api/shoppinglists/{listId}/items/{itemId}` - Delete item
- `DELETE /api/shoppinglists/{listId}/items/bought` - Clear all bought items

**Settings:**
- `GET /api/sitesettings` - Get site settings (refresh intervals, default view)

## Authentication

### Kiosk Token Flow

1. Admin creates kiosk token via web admin panel
2. Admin shares deep link: `kinboard://auth?token=XXXXX` (or manual entry)
3. Mobile app receives token on `AuthScreen`
4. App authenticates with `POST /api/auth/kiosk/authenticate`
5. Backend returns JWT access token (15-minute expiry)
6. App stores:
   - Original kiosk token (Keychain/Keystore) for re-authentication
   - Access token (Keychain/Keystore) for API calls
7. App auto-refreshes access token every 14 minutes

### Token Storage

- **Kiosk Token**: Stored in `expo-secure-store` (Keychain on iOS, Keystore on Android)
- **Access Token**: Stored in `expo-secure-store`, attached to all API requests via Axios interceptor
- **Auto-refresh**: Every 14 minutes, app re-authenticates using stored kiosk token

### Token Expiry Handling

- Access token expires in 15 minutes
- App refreshes every 14 minutes proactively
- If refresh fails (e.g., kiosk token revoked), user is logged out and returned to `AuthScreen`

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For iOS: macOS with Xcode (or use Expo Go app)
- For Android: Android Studio + emulator (or use Expo Go app)

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

   This opens Expo Dev Tools in your browser. You can then:
   - Press `a` to open in Android emulator
   - Press `i` to open in iOS simulator (macOS only)
   - Scan QR code with Expo Go app on your physical device

### Running on Device

**Option 1: Expo Go App (Easiest)**
1. Install Expo Go from App Store (iOS) or Google Play (Android)
2. Run `npm start` in the mobile directory
3. Scan the QR code with Expo Go app

**Option 2: Development Build**
1. Build for Android: `npm run android`
2. Build for iOS: `npm run ios` (macOS only)

### Windows Development

This project is fully compatible with Windows development:
- Use Android Emulator via Android Studio
- Test on physical Android devices via USB debugging
- For iOS testing, use Expo Go app on physical iOS device (no macOS required)

## Usage

### First-Time Setup

1. Start the app on your device/emulator
2. On `AuthScreen`, enter your **Server URL** (provided by your administrator)
   - Example: `https://your-server:5000`
   - For local development:
     - iOS Simulator: `http://localhost:5000`
     - Android Emulator: `http://10.0.2.2:5000`
     - Physical device: use your computer's LAN IP / reachable hostname
3. Enter your kiosk token
   - Token provided by admin from web dashboard
   - Format: 40-character alphanumeric string
4. Tap "Authenticate"
5. On successful auth, app navigates to main tabs

### Navigation

The app has three main tabs at the bottom:

1. **Calendar** 📅
   - View calendar events
   - Switch between Day/Week/Month views
   - Filter by calendar source
   - See user completion pills at top
   - Tap "Today" to jump to current date

2. **Jobs** ✓
   - View jobs grouped by person
   - Tap job to toggle completion status
   - Eye icon: toggle show/hide completed jobs per person
   - Progress bar shows completion percentage
   - Auto-refreshes every 10 seconds

3. **Shopping** 🛒
   - View all shopping lists
   - Add items via text input
   - Tap item checkbox to mark as bought
   - ⚠️ icon: mark item as important
   - X icon: delete item
   - Trash icon: clear all bought items
   - Eye icon: toggle show/hide bought items
   - Auto-refreshes every 30 seconds

### Token Persistence

- Tokens are securely stored and persist across app restarts
- To log out, force-quit the app and clear app data (or revoke kiosk token via admin panel)

## Features

### Responsive Design

- Optimized for phones and tablets
- Portrait and landscape orientation support
- Uses safe area insets for notched devices
- Large tap targets (minimum 44×44pt)
- Readable typography at various screen sizes

### Like-for-Like Web Parity

**Calendar Screen:**
- ✅ Day/Week/Month view toggle
- ✅ User completion pills with open/total counts
- ✅ Calendar event cards with time, title, source
- ✅ Calendar source filtering
- ✅ Today button
- ✅ Auto-refresh (configurable interval)

**Jobs Screen:**
- ✅ Jobs grouped by person (with avatars/colors)
- ✅ Progress bar per person
- ✅ Job completion toggle
- ✅ Hide completed toggle per person
- ✅ "All done!" empty state
- ✅ Job images (if provided)
- ✅ Auto-refresh (configurable interval)

**Shopping Screen:**
- ✅ Multiple shopping lists
- ✅ Add items via text input
- ✅ Toggle bought status
- ✅ Toggle important status
- ✅ Delete items
- ✅ Clear all bought items
- ✅ Hide bought toggle per list
- ✅ Important items sorted first
- ✅ Auto-refresh (configurable interval)

**Excluded:**
- ❌ Weather widget (as specified)
- ❌ Admin functionality (no admin login, no create/edit/delete via mobile)

### Loading & Error States

- Loading spinners on initial data fetch
- Pull-to-refresh on all screens
- Error handling with retry logic (2 retries via React Query)
- 401 handling: auto-logout and redirect to auth screen
- Network error messages via alerts

## Configuration

### Server URL

The API server URL is configured at first logon on the `AuthScreen` and stored on the device (SecureStore on native, `localStorage` on web).

### Refresh Intervals

Refresh intervals are fetched from backend `SiteSettings` API:
- Jobs: `jobsRefreshSeconds` (default: 10s)
- Calendar: `calendarRefreshSeconds` (default: 30s)
- Shopping: Fixed 30s

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Enter valid kiosk token → navigates to main tabs
- [ ] Enter invalid kiosk token → shows error alert
- [ ] Token persists across app restart → stays logged in
- [ ] Revoke token on backend → app logs out on next refresh

**Calendar:**
- [ ] Day view shows today's events
- [ ] Week view shows 7 days
- [ ] Month view shows calendar grid
- [ ] Tap date on calendar → events update
- [ ] Today button → jumps to current date
- [ ] Filter by calendar source → events update
- [ ] User completion pills show correct counts

**Jobs:**
- [ ] Jobs grouped by person with correct colors/avatars
- [ ] Tap job → toggles completion status
- [ ] Eye icon → toggles hide completed
- [ ] Progress bar reflects completion percentage
- [ ] Pull to refresh → reloads jobs
- [ ] Auto-refresh every 10s (observe network requests)

**Shopping:**
- [ ] All lists display with correct colors/avatars
- [ ] Add item → appears in list
- [ ] Tap checkbox → moves to bought section
- [ ] Tap important icon → item moves to top and shows ⚠️
- [ ] Tap X → deletes item
- [ ] Trash icon → clears all bought items
- [ ] Eye icon → toggles bought visibility
- [ ] Pull to refresh → reloads lists

### Basic Unit Tests

To add unit tests in the future:

```bash
npm install --save-dev jest @testing-library/react-native
```

Test candidates:
- `src/auth/authService.ts` - token storage, refresh logic
- `src/api/client.ts` - auth interceptor, error handling
- `src/utils/*` - utility functions

## Troubleshooting

### Connection Issues

**"Network request failed" or "Connection refused"**
- Verify the **Server URL** entered on `AuthScreen` is correct and reachable from this device
- For Android emulator, use `http://10.0.2.2:5000` instead of `localhost`
- For physical device, ensure device and backend are on same network
- Check backend is running: `curl http://your-backend-url:5000/api/health`

**401 Unauthorized**
- Kiosk token may be revoked or invalid
- Clear app data and re-authenticate with new token
- Check backend logs for auth errors

### Expo/React Native Issues

**Metro bundler crashes**
- Clear cache: `expo start --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**"Unable to resolve module"**
- Ensure all dependencies are installed: `npm install`
- Restart Metro: stop expo and run `npm start` again

**Android build fails**
- Ensure Android Studio and SDK are properly installed
- Check Java version: `java -version` (should be Java 17+)

## Deployment

### Production Build

**Android APK:**
```bash
expo build:android -t apk
```

**iOS IPA (requires macOS):**
```bash
expo build:ios -t archive
```

**Alternative: EAS Build (Expo Application Services)**
```bash
npx eas-cli build --platform android
npx eas-cli build --platform ios
```

### App Store Submission

Follow Expo's guides:
- Android: https://docs.expo.dev/submit/android/
- iOS: https://docs.expo.dev/submit/ios/

## Future Enhancements

1. **Deep Linking**: Support `kinboard://auth?token=XXX` URLs
2. **Push Notifications**: Notify when jobs are assigned or shopping items added
3. **Offline Mode**: Cache data for offline viewing
4. **Dark Mode**: Add dark theme support
5. **Accessibility**: Improve screen reader support, increase contrast
6. **Unit Tests**: Add test coverage for auth and API layers
7. **E2E Tests**: Add Detox or Maestro tests
8. **Animations**: Add smooth transitions and micro-interactions
9. **Settings Screen**: Allow user to configure refresh intervals, notification preferences

## Contributing

1. Follow existing code style (Prettier + ESLint)
2. Update types in `src/types/index.ts` when backend DTOs change
3. Match web kiosk behavior exactly (like-for-like requirement)
4. Test on both iOS and Android before submitting PR

## Support

For issues or questions:
- Check backend logs for API errors
- Check Expo dev console for React Native errors
- Verify kiosk token is active in admin dashboard
- Ensure backend is running and accessible

## License

(Match parent project license)
