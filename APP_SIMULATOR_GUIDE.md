# App Simulator - What You Should See

## ✅ Current Status

Based on the terminal output:
- ✅ **Metro Bundler:** Running
- ✅ **Bundle Complete:** 1594 modules bundled successfully
- ✅ **iOS Simulator:** iPhone 15 Pro should be open
- ✅ **App:** Should be loading or already loaded

## 📱 What to Check in the Simulator

### 1. App Loading Screen
- You should see the Glintz app loading
- May show a splash screen or loading indicator

### 2. Authentication Screen (if not logged in)
- OTP login screen
- Or dev auth screen (if configured)

### 3. Home Screen (Main View)
- **Swipe deck** with hotel cards
- **8 hotels** from Partners API should be visible
- Hotels should show:
  - Hotel name
  - Location (city, country)
  - Website link
  - ⚠️ Photos may be empty (until Dropbox token is set)

### 4. Hotel Cards
Each card should display:
- Hotel name (e.g., "Loconda al Colle")
- Location (e.g., "Italy, IT")
- Swipe gestures should work:
  - Swipe right = Like
  - Swipe left = Dismiss
  - Swipe down = Super Like
  - Tap = View details

## 🔍 Expected Hotels (8 total)

1. **Loconda al Colle** - Italy
2. **Eremito** - Italy
3. **Casa Bonay** - Spain
4. **Haritha Villas + Spa** - Sri Lanka
5. **Zanzi Resort - Hotel Zanzibar** - Tanzania
6. **The Lodge & Spa at Pico Bonito** - Honduras
7. **Hattvika Lodge** - Norway
8. **Crossing Manzoni** - Italy (offboarded, may not show)

## ⚠️ Known Issues

### Photos Not Showing
- **Status:** Expected until Dropbox token is set
- **Fix:** Set `DROPBOX_ACCESS_TOKEN` in Railway (see `RAILWAY_DROPBOX_SETUP.md`)
- **After fix:** Photos will load automatically

### API Connection
- **Current:** Using Railway production API
- **URL:** `https://web-production-b200.up.railway.app`
- **Status:** Should be working

## 🐛 Troubleshooting

### If App Doesn't Load
1. Check Expo terminal for errors
2. Look for red error messages
3. Check if Metro bundler is still running

### If Hotels Don't Appear
1. Check console logs in Expo terminal
2. Verify API connection
3. Check if Partners API endpoint is accessible

### If Swipe Doesn't Work
1. Make sure you're swiping on the hotel card
2. Check gesture handler is enabled
3. Try tapping to see if interactions work

## 📊 Console Logs to Watch

In the Expo terminal, you should see:
- `🔍 Finding best API URL...`
- `✅ Using primary URL: https://web-production-b200.up.railway.app`
- `📡 API Configuration:`
- Hotel loading messages

## 🎯 Next Steps

1. **Check the simulator** - Is the app visible?
2. **Try swiping** - Do gestures work?
3. **Check hotels** - Are 8 hotels showing?
4. **Set Dropbox token** - For photos (see `RAILWAY_DROPBOX_SETUP.md`)

## 💡 Tips

- **Reload app:** Press `r` in Expo terminal
- **Open dev menu:** Shake device or `Cmd+D` in simulator
- **View logs:** Check Expo terminal output
- **Restart:** Stop Expo (`Ctrl+C`) and restart if needed

---

**The app should be visible in your iOS Simulator now!** Check if you can see the hotel cards and try swiping.

