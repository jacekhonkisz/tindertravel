# 🚀 Glintz Build Guide for Cursor

> **✅ WORKING - Build successful on Oct 7, 2025**
> - Structure cleaned (see `CLEANUP_AUDIT_REPORT.md`)
> - Code signing fixed (see `FINAL_BUILD_FIX_SUMMARY.md`)  
> - App running on iPhone 17 Pro Simulator

## Quick Start - Build & Run iOS App

### Option 1: Using Cursor Commands (Recommended)

1. **Press `Cmd+Shift+B`** (macOS) to open the build menu
2. Select **"🚀 Run iOS App (Simulator)"**
3. The app will build and launch automatically in the iOS Simulator

### Option 2: Using Terminal Commands

```bash
# From project root
npm run ios

# Or from app folder
cd app && npm run ios
```

### Option 3: Using NPM Scripts in Cursor

1. Open the Terminal in Cursor (`Ctrl+~`)
2. Run: `npm run ios`

---

## Available Build Commands

### iOS Development

| Command | Description |
|---------|-------------|
| `npm run ios` | Build and run iOS app (default) |
| `npm run ios:build` | Build iOS app in Release mode |
| `npm run ios:device` | Run on physical iOS device |
| `npm run dev:app` | Start Metro bundler only |

### Full Stack Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both API server and app |
| `npm run dev:api` | Run API server only |
| `npm run dev:app` | Run app Metro bundler only |

### Maintenance

| Command | Description |
|---------|-------------|
| `npm run clean:ios` | Clean iOS build artifacts |
| `npm run prebuild` | Regenerate native iOS/Android folders |
| `npm run install:all` | Install all dependencies (root + API + app) |

---

## Cursor Keyboard Shortcuts

- **`Cmd+Shift+B`** - Open build tasks menu
- **`Cmd+Shift+P`** → "Tasks: Run Task" - View all available tasks
- **`Ctrl+~`** - Open integrated terminal

---

## Workflow for Development

### First Time Setup
```bash
npm run install:all
npm run ios
```

### Daily Development
```bash
# Start the app
npm run ios

# Or run both API + App together
npm run dev
```

### If Build Fails
```bash
# Clean and rebuild
npm run clean:ios
npm run ios
```

---

## Development Build vs Expo Go

This project uses **custom development builds** (not Expo Go) because it includes:
- Native iOS code (SwiftUI components)
- Google Maps SDK
- Custom native modules

**Always use:**
- ✅ `npm run ios` or `expo run:ios`
- ✅ `npm run dev:app` with `--dev-client` flag

**Never use:**
- ❌ `expo start --ios` (tries to use Expo Go)
- ❌ Opening Expo Go app manually

---

## Troubleshooting

### Port 8081 Already in Use
```bash
# Kill existing Metro process
pkill -f "expo|metro"
npm run ios
```

### Simulator Won't Open
```bash
# Open simulator manually
open -a Simulator

# Then run
npm run ios
```

### Pod Install Issues
```bash
cd app/ios
pod deintegrate
pod install
cd ../..
npm run ios
```

### Complete Clean Rebuild
```bash
npm run clean:ios
rm -rf app/node_modules
npm install
cd app && npm install
npm run ios
```

---

## VS Code Tasks Available in Cursor

All these tasks are accessible via `Cmd+Shift+B`:

- 🚀 Run iOS App (Development Build) - **Default**
- 📱 Start Metro (Dev Client)
- 🔨 Build iOS (Release)
- 🧹 Clean iOS Build
- 🔄 Full Dev (API + App)
- 📦 Install All Dependencies
- 🔧 Rebuild iOS Native

---

## File Structure (✅ Clean - No Duplicates)

```
tindertravel/
├── app/                    # React Native app (SINGLE SOURCE)
│   ├── ios/               # Native iOS code (ONLY location)
│   ├── assets/            # App assets (ONLY location)
│   ├── .expo/             # Expo cache (ONLY location)
│   ├── index.ts           # Entry point (ONLY location)
│   ├── tsconfig.json      # TS config (ONLY location)
│   ├── src/               # App source code
│   └── package.json       # App dependencies
├── api/                    # Backend API workspace
├── app.json               # Root Expo config (points to app/)
└── package.json           # Root workspace scripts

✅ All duplicates removed (ios/, assets/, .expo/, index.js, tsconfig.json at root)
```

---

## Notes

- First build takes 3-5 minutes (compiles native code)
- Subsequent builds are faster (2-3 minutes)
- Metro bundler runs in background after first build
- Changes to JS/TS hot reload automatically
- Changes to native code require full rebuild

---

**Happy coding! 🎉**
