# Kinboard Mobile - Quick Start Guide

Get the mobile app running in **5 minutes**.

## Prerequisites

- Node.js 18+ installed
- Backend running at `http://localhost:5000` (or your server URL)
- Valid kiosk token from admin panel

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start the app:**
   ```bash
   npm start
   ```

## Testing

### Option A: Expo Go (Fastest - No Build Required)

1. Install **Expo Go** app:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code from terminal with Expo Go app

3. App opens on your device

### Option B: Emulator/Simulator

**Android Emulator:**
```bash
npm run android
```

**iOS Simulator (macOS only):**
```bash
npm run ios
```

## Login

1. Get kiosk token from admin panel:
   - Log into web admin at `http://localhost:3000/admin`
   - Go to "Kiosk Tokens" tab
   - Click "Create New Token"
   - Copy the token string

2. On mobile app:
   - Open app
   - Paste token into "Kiosk Token" field
   - Tap "Authenticate"
   - ✅ You're in!

## Features

- **📅 Calendar**: View events, switch Day/Week/Month
- **✓ Jobs**: Toggle completion, group by person
- **🛒 Shopping**: Add items, mark bought, delete

## Troubleshooting

**"Network request failed"**
- Check the **Server URL** entered on `AuthScreen`
- For Android emulator, use `http://10.0.2.2:5000` instead of `localhost`
- For physical device, use your computer's IP (e.g., `http://192.168.1.100:5000`)

**"Authentication Failed"**
- Verify kiosk token is active in admin panel
- Check backend is running: `curl http://localhost:5000/api/health`

**Metro bundler crashes**
- Clear cache: `expo start --clear`

## Next Steps

- Read [README.md](./README.md) for full documentation
- Read [IMPLEMENTATION.md](./IMPLEMENTATION.md) for technical details
- Test all three screens (Calendar, Jobs, Shopping)
- Try pull-to-refresh on each screen

## Support

Need help? Check:
- Backend logs for API errors
- Expo dev console for React Native errors
- README.md Troubleshooting section

---

**Happy testing! 🚀**
