# Quick Fix Guide - API Connection Issues

## 🚨 Problem: App Not Loading Hotels

### Symptom:
- App shows "Failed to load hotels" or timeout errors
- Request timeout after 30 seconds

### ⚡ Quick Fix (2 minutes):

#### Step 1: Check Server IP
```bash
# Start your server if not running
cd api && npm start

# Look for this section in the output:
📱 MOBILE APP CONFIGURATION:
   Update API_BASE_URL in app/src/api/client.ts to:
   👉 http://192.168.1.XXX:3001  <-- This is your IP!
```

#### Step 2: Update App Configuration
```bash
# Open this file:
open app/src/config/api.ts

# Find this line (around line 55):
baseUrl: 'http://192.168.1.102:3001',

# Change it to match your server's IP from Step 1
baseUrl: 'http://192.168.1.XXX:3001',  <-- Use YOUR IP here!

# Save the file
```

#### Step 3: Restart App
```bash
# Kill the app (Cmd+C in the terminal)
# Start it again
cd app && npx expo start

# Press 'i' for iOS simulator
```

### ✅ Done!

The app should now connect successfully and load hotels.

---

## 🔍 Troubleshooting

### Problem: "Cannot find server IP"

**Solution:**
```bash
# Find your network IP manually
ifconfig | grep "inet " | grep -v 127.0.0.1

# Look for something like:
# inet 192.168.1.102 netmask ...
# The IP is: 192.168.1.102
```

### Problem: "Server not running"

**Solution:**
```bash
# Check if server is running
lsof -i TCP:3001

# If nothing appears, start the server:
cd api
npm run build
npm start
```

### Problem: "Still can't connect"

**Solution:**
```bash
# Test the connection directly
curl http://YOUR_IP:3001/health

# Should return:
# {"status":"ok","seeded":true,"hotelCount":525}

# If this works but app doesn't, double-check:
# 1. IP in app/src/config/api.ts matches
# 2. You restarted the app after changing config
# 3. Your device/simulator is on same network
```

---

## 📱 Complete Restart Procedure

If all else fails:

```bash
# 1. Stop everything
# Kill both terminals (Cmd+C)

# 2. Restart server
cd api
npm start
# Note the Network IP from the output

# 3. Update app config
open app/src/config/api.ts
# Update baseUrl to match server IP

# 4. Clear cache and restart app
cd app
npx expo start -c
# Press 'i' for iOS

# 5. Check logs
# Look for:
# ✅ API connection validated successfully
```

---

## 💡 Prevention

To avoid this issue in the future:

1. **Always check server startup logs** - They show the correct IP
2. **Update config immediately** if your network IP changes
3. **Keep server running** while developing
4. **Use the health endpoint** to test: `curl http://YOUR_IP:3001/health`

---

## 📞 Quick Commands

```bash
# Check server status
lsof -i TCP:3001

# Check your network IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Test API connection
curl http://YOUR_IP:3001/health

# Test hotels endpoint
curl http://YOUR_IP:3001/api/hotels?limit=1

# Restart server
cd api && npm start

# Restart app (clear cache)
cd app && npx expo start -c
```

---

**Need more help?** See:
- `SETUP_INSTRUCTIONS.md` - Complete setup guide
- `API_CONNECTION_AUDIT.md` - Detailed diagnostics
- `PRODUCTION_READY_CONNECTION_SUMMARY.md` - Full implementation details

---

**Last Updated:** October 8, 2025  
**Status:** Production Ready ✅

