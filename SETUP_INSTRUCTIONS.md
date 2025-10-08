# Glintz App Setup Instructions

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 16+ installed
- iOS Simulator or Android Emulator (or physical device)
- Terminal access

---

## 📦 Installation

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install API dependencies
cd api
npm install

# Install app dependencies
cd ../app
npm install
```

---

## ⚙️ Configuration

### 2. Configure API Server

**Option A: Use Existing Configuration (Recommended for First Run)**

The server is pre-configured to work on your local network. No changes needed!

**Option B: Update Environment Variables**

```bash
# In the api directory
cd api
cp .env.example .env

# Edit .env with your actual credentials
# (Supabase, Amadeus, Google Places API keys)
```

### 3. Configure Mobile App

The app will automatically detect your network IP. However, if you need to update it:

```bash
# In the app directory
cd app

# Update the IP in src/config/api.ts
# Change the baseUrl to match your server's network IP
```

---

## 🏃 Running the Application

### 4. Start the API Server

```bash
# From the api directory
cd api
npm run build  # Build TypeScript
npm start      # Start server
```

**Look for this output:**
```
============================================================
🌐 GLINTZ API SERVER - CONNECTION INFORMATION
============================================================

📱 MOBILE APP CONFIGURATION:
   Update API_BASE_URL in app/src/api/client.ts to:
   👉 http://192.168.1.102:3001

🔗 Available Endpoints:
   Local:     http://localhost:3001
   Network:   http://192.168.1.102:3001
```

**IMPORTANT:** Note the Network IP address (e.g., `http://192.168.1.102:3001`)

### 5. Update Mobile App Configuration (If Needed)

If the IP shown by the server is different from `192.168.1.102`:

```bash
# Open app/src/config/api.ts
# Update this line:
baseUrl: 'http://YOUR_NETWORK_IP:3001',
```

### 6. Start the Mobile App

```bash
# From the app directory
cd app
npx expo start

# Then press:
# - 'i' for iOS Simulator
# - 'a' for Android Emulator
# - Scan QR code for physical device
```

---

## ✅ Verification

### 7. Check Connection

When the app starts, you should see:

```
============================================================
🌐 API CLIENT - CONFIGURATION
============================================================
   Environment: development
   Base URL: http://192.168.1.102:3001
   Timeout: 30000ms
   Retry Attempts: 3
============================================================

🔍 Validating API connection...
✅ API connection validated successfully
   Server Status: ok
   Database: Seeded
   Hotels Available: 543
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to server"

**Solution 1: Check Server is Running**
```bash
# Check if server is running on port 3001
lsof -i TCP:3001

# You should see output like:
# node    12345  user   12u  IPv6  ...  *:3001 (LISTEN)
```

**Solution 2: Check Network IP**
```bash
# Find your current network IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# You should see something like:
# inet 192.168.1.102 netmask 0xffffff00 broadcast 192.168.1.255
```

**Solution 3: Update App Configuration**
1. Note the IP from the server startup logs or ifconfig command
2. Open `app/src/config/api.ts`
3. Update `baseUrl` to match your IP:
   ```typescript
   baseUrl: 'http://YOUR_IP_HERE:3001'
   ```
4. Restart the app

### Problem: "Request timeout after 30000ms"

This usually means the IP address is wrong.

**Solution:**
1. Stop the app
2. Check server logs for the correct IP
3. Update `app/src/config/api.ts`
4. Restart the app

### Problem: Server runs but app can't connect

**Check Network:**
- Ensure your computer and device/simulator are on the same network
- Disable any VPNs or firewalls that might block local connections
- For iOS Simulator, it shares the same network as your Mac

**Test Connection Manually:**
```bash
# Replace IP with your server's network IP
curl http://192.168.1.102:3001/health

# You should get a JSON response like:
# {"status":"ok","timestamp":"...","seeded":true,"hotelCount":543}
```

---

## 📱 Different Environments

### Development (Local Network)
- Server runs on your computer
- App connects via local network IP
- Hot reload enabled

### Staging
- Server deployed to staging environment
- Update `baseUrl` in `app/src/config/api.ts` to staging URL
- Build app with staging configuration

### Production
- Server deployed to production
- Update `baseUrl` to production URL
- Build release version of app

---

## 🔒 Security Notes

### For Development:
- ✅ Hardcoded IPs are OK
- ✅ Open CORS is OK
- ✅ Extended timeouts are OK

### For Production:
- ❌ Use environment variables only
- ❌ Restrict CORS to your domain
- ❌ Use reasonable timeouts (5-10 seconds)
- ❌ Enable all security features

---

## 📚 Additional Resources

### Project Structure
```
tindertravel/
├── api/                  # Backend API server
│   ├── src/             # TypeScript source
│   ├── dist/            # Compiled JavaScript
│   └── package.json     # API dependencies
│
├── app/                 # React Native mobile app
│   ├── src/            # App source code
│   │   ├── api/        # API client
│   │   ├── config/     # Configuration
│   │   ├── screens/    # App screens
│   │   └── components/ # React components
│   └── package.json    # App dependencies
│
└── docs/               # Documentation
```

### Key Files
- `api/src/index.ts` - Main server file
- `api/src/network-utils.ts` - Network detection
- `app/src/config/api.ts` - API configuration
- `app/src/api/client.ts` - API client
- `app/src/store/index.ts` - State management

---

## 🎯 Common Workflows

### Workflow 1: Network IP Changed
```bash
# 1. Check new IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Update app config
# Edit app/src/config/api.ts

# 3. Restart app
# Kill and restart Expo
```

### Workflow 2: Server Not Responding
```bash
# 1. Kill existing server
lsof -i TCP:3001
kill <PID>

# 2. Restart server
cd api
npm start

# 3. Note the Network IP from startup logs

# 4. Update app if IP changed
```

### Workflow 3: Fresh Install
```bash
# 1. Clone repository
git clone <repo>

# 2. Install all dependencies
npm install
cd api && npm install
cd ../app && npm install

# 3. Start server
cd ../api
npm run build && npm start

# 4. Note the Network IP

# 5. Update app config if needed

# 6. Start app
cd ../app
npx expo start
```

---

## 💡 Pro Tips

1. **Keep Server Logs Visible**: Always check server startup logs for the correct IP
2. **Use Terminal Split**: Run server in one terminal, app in another
3. **Bookmark Health Endpoint**: `http://YOUR_IP:3001/health` for quick testing
4. **Clear Metro Cache**: If app behaves strangely, clear cache: `npx expo start -c`
5. **Check Both Ends**: Connection issues can be server OR client-side

---

## 📞 Getting Help

If you're still having issues:

1. Check the `API_CONNECTION_AUDIT.md` for detailed diagnostics
2. Look at server console logs
3. Look at app console logs (Metro bundler)
4. Test API directly with curl
5. Verify network connectivity

---

**Last Updated:** October 8, 2025
**Version:** 1.0
**Status:** Production Ready ✅

