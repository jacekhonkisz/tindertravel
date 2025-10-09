# 🛠️ DevTools Quick Reference

## ✅ Current Status

**Both servers are running:**
- ✅ Backend API: `http://localhost:3001` (977 hotels)
- ✅ iOS App: Simulator running (PID 99835)
- ✅ Metro Bundler: `http://localhost:8081` (PID 99655)

---

## 🌐 DevTools URLs

### Metro Bundler UI
**URL:** `http://localhost:8081`

This is your main development interface showing:
- Bundle progress
- Console logs
- Network requests
- Build status

### React Native Debugger
**URL:** `http://localhost:8081/debugger-ui/`

For advanced debugging with:
- Redux DevTools
- React DevTools
- Network Inspector

### Backend API Health
**URL:** `http://localhost:3001/health`

Returns JSON with API status:
```json
{
  "status": "ok",
  "seeded": true,
  "hotelCount": 977,
  "source": "supabase"
}
```

---

## ⌨️ Terminal Shortcuts

**In the terminal where Expo is running:**

| Key | Action |
|-----|--------|
| `i` | Open iOS Simulator |
| `j` | Open Chrome Debugger |
| `r` | Reload app |
| `m` | Toggle menu |
| `d` | Show dev menu in app |
| `c` | Clear Metro cache & reload |
| `shift+d` | Toggle dev menu in simulator |

---

## 📱 Simulator Shortcuts

**While iOS Simulator is focused:**

| Shortcut | Action |
|----------|--------|
| `Cmd+D` | Open developer menu |
| `Cmd+R` | Reload app |
| `Cmd+Ctrl+Z` | Shake gesture (dev menu) |
| `Cmd+K` | Toggle software keyboard |
| `Cmd+Shift+H` | Go to home screen |

---

## 🔧 Developer Menu (in Simulator)

Press `Cmd+D` to open, then choose:

- **Reload** - Refresh the app
- **Debug** - Open Chrome DevTools
- **Show Inspector** - Element inspector
- **Show Perf Monitor** - Performance overlay
- **Toggle Element Inspector** - Visual element picker
- **Enable Fast Refresh** - Auto-reload on save
- **Enable Hot Reloading** - Update without full reload

---

## 🐛 Debugging Tools

### Console Logs
View in:
1. Terminal where Expo is running (shows all logs)
2. Metro Bundler UI: `http://localhost:8081` → Logs tab
3. Chrome DevTools: `http://localhost:8081/debugger-ui/`

### Network Requests
View in:
1. Chrome DevTools → Network tab
2. React Native Debugger (standalone app)

### Redux DevTools (if using Redux)
Access via React Native Debugger or browser extension

---

## 🔄 Restart Instructions

### If simulator freezes or crashes:

```bash
# Kill all processes
cd /Users/ala/tindertravel
killall node
killall Simulator

# Restart everything
npm run dev
```

### If you need to clear cache:

```bash
cd /Users/ala/tindertravel/app

# Clear Metro cache
npx expo start --clear

# Nuclear option - clear everything
rm -rf node_modules .expo ios/build
npm install
npx expo prebuild --clean --platform ios
```

---

## 🚨 Common Issues & Solutions

### Issue: "Port 8081 already in use"
```bash
# Kill existing process
lsof -ti:8081 | xargs kill -9

# Restart Expo
cd app && npm start
```

### Issue: "Cannot connect to Metro bundler"
```bash
# Check if server is running
lsof -i:8081

# If not running, start it
cd app && npm start
```

### Issue: "DevTools showing JSON instead of UI"
✅ **FIXED!** This was caused by web platform in config.
Now removed - DevTools work properly.

### Issue: "Simulator not launching"
```bash
# Open simulator manually
open -a Simulator

# Then reload app
cd app && npm run ios
```

### Issue: "Backend API not responding"
```bash
# Check API status
curl http://localhost:3001/health

# If not running, restart
cd api && npm run dev
```

---

## 📊 Monitoring

### Check what's running:
```bash
# All Node processes
ps aux | grep node

# Specific ports
lsof -i:3001  # Backend API
lsof -i:8081  # Metro Bundler
```

### View logs:
```bash
# Backend logs
cd api && tail -f server.log

# App logs (in Expo terminal)
# Just watch the terminal output
```

---

## 🎯 Quick Commands

### Open everything in one go:
```bash
# Terminal 1 - Both servers
cd /Users/ala/tindertravel && npm run dev

# Metro Bundler UI will be at:
# http://localhost:8081
```

### Test API directly:
```bash
# Health check
curl http://localhost:3001/health

# Get hotels
curl http://localhost:3001/api/hotels?limit=5

# Pretty print
curl -s http://localhost:3001/health | python3 -m json.tool
```

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Metro Bundler | http://localhost:8081 |
| Chrome Debugger | http://localhost:8081/debugger-ui/ |
| Backend API | http://localhost:3001 |
| API Health | http://localhost:3001/health |
| API Hotels | http://localhost:3001/api/hotels |

---

## 💡 Pro Tips

1. **Keep Terminal Visible**
   - Console logs appear in real-time
   - See network requests
   - Catch errors immediately

2. **Use Fast Refresh**
   - Enabled by default
   - Edit code → auto-reload
   - Preserves component state

3. **Element Inspector**
   - Press `Cmd+D` → "Toggle Element Inspector"
   - Click any UI element
   - See its props, styles, and hierarchy

4. **Performance Monitor**
   - Press `Cmd+D` → "Show Perf Monitor"
   - See FPS, memory usage
   - Optimize animations

5. **Network Debugging**
   - Use Chrome DevTools Network tab
   - See all API calls to backend
   - Monitor response times

---

## 📱 Testing on Physical Device

### Setup:
```bash
# Make sure device and Mac are on same WiFi
# Check your IP: 192.168.1.102 (already configured)

# Run on device
cd app && npm run ios:device
```

### Debugging on device:
1. Shake device to open dev menu
2. Tap "Debug" to connect to Metro
3. View logs in terminal or browser

---

## ✅ Verification Checklist

- ✅ Backend API running (port 3001)
- ✅ Metro Bundler running (port 8081)
- ✅ iOS Simulator open with app loaded
- ✅ Can access http://localhost:8081
- ✅ Console logs visible in terminal
- ✅ Can reload with Cmd+R
- ✅ Developer menu opens with Cmd+D

---

**Last Updated:** October 8, 2025  
**Status:** ✅ All systems operational

---

