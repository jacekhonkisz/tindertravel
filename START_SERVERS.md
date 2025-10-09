# 🚀 How to Start Your Servers

## Quick Start (Recommended)

Open **TWO** separate terminal windows:

### Terminal 1 - Backend API
```bash
cd /Users/ala/tindertravel/api
npm run dev
```

**You'll see:**
```
🚀 Glintz API server running on port 3001
📍 Health check: http://localhost:3001/health
```

---

### Terminal 2 - iOS App with DevTools
```bash
cd /Users/ala/tindertravel/app
npm start
```

**You'll see the interactive Expo interface with:**
```
› Press i │ open iOS simulator
› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

**AND a QR code for testing on physical device!**

---

## Alternative: One Command (Both Servers)

If you want both in one terminal:

```bash
cd /Users/ala/tindertravel
npm run dev
```

But you won't get the interactive Expo interface this way.

---

## What You Should See

### ✅ Backend API Terminal
```
✅ Supabase service initialized
✅ Hotel Data Pipeline initialized
🚀 Glintz API server running on port 3001
📍 Health check: http://localhost:3001/health
```

### ✅ iOS App Terminal (Interactive!)
```
Starting Metro Bundler

› Press i │ open iOS simulator
› Press a │ open Android
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
```

**PLUS a QR code you can scan with Expo Go app!**

---

## Keyboard Shortcuts (Once Started Interactively)

In the Expo terminal, press:

- **`i`** - Open iOS Simulator (if not open yet)
- **`j`** - Open Chrome DevTools debugger
- **`r`** - Reload the app
- **`c`** - Clear cache and reload
- **`d`** - Open developer menu in simulator
- **`m`** - Toggle menu
- **`?`** - Show all available commands

---

## Access DevTools in Browser

Once servers are running, open in your browser:

- **Metro Bundler UI:** http://localhost:8081
- **Chrome Debugger:** http://localhost:8081/debugger-ui/
- **Backend API:** http://localhost:3001/health

---

## Testing on Physical Device

1. Make sure your iPhone and Mac are on the same WiFi
2. Start the servers as shown above
3. Scan the QR code with Camera app
4. App will open in Expo Go (or use `npm run ios:device`)

---

## Troubleshooting

### If you see "Port already in use"
```bash
# Kill existing processes
killall node

# Try again
cd /Users/ala/tindertravel/app
npm start
```

### If simulator doesn't open automatically
Press `i` in the Expo terminal, or:
```bash
open -a Simulator
```

### If you need to restart everything
```bash
# Terminal 1
cd /Users/ala/tindertravel/api
npm run dev

# Terminal 2
cd /Users/ala/tindertravel/app
npm start
```

---

## Pro Tip 💡

Use **iTerm2** or **Hyper** terminal with split panes:
- Left pane: Backend API
- Right pane: iOS App (with interactive shortcuts!)

This way you see both running side by side!

---

**Ready to go!** Open two terminals and follow the commands above. 🚀

