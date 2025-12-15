# OTP Request Failure Audit Report

**Date:** 2025-01-27  
**Issue:** Network request failed when requesting OTP code  
**Error:** `TypeError: Network request failed`  
**Endpoint:** `http://192.168.1.107:3001/api/auth/request-otp`

---

## 🔍 Root Cause Analysis

### Primary Issue: **Backend Server Not Running**

The audit reveals that the backend API server is **not currently running** on port 3001.

**Evidence:**
- `lsof -i TCP:3001` returned no results (server not listening)
- Network IP verification: `192.168.1.107` is correct (matches current network interface)
- App is correctly configured to use `http://192.168.1.107:3001`

### Error Flow

1. **App Configuration** ✅
   - API client configured with base URL: `http://192.168.1.107:3001`
   - Configuration file: `app/src/config/api.ts` (line 61)
   - IP address matches current network: `192.168.1.107` ✅

2. **Request Attempt** ✅
   - App correctly attempts: `POST http://192.168.1.107:3001/api/auth/request-otp`
   - Headers and body formatting correct
   - Timeout configured: 30 seconds

3. **Network Failure** ❌
   - Server not listening on port 3001
   - Connection refused / Network request failed
   - No server to handle the request

---

## 📋 Verification Checklist

### ✅ What's Working
- [x] App API client configuration is correct
- [x] Network IP address is correct (`192.168.1.107`)
- [x] Request format and headers are correct
- [x] Error handling and logging are in place

### ❌ What's Not Working
- [ ] **Backend server is not running**
- [ ] No process listening on port 3001
- [ ] Cannot establish connection to API

---

## 🔧 Solution Steps

### Step 1: Start the Backend Server

Navigate to the API directory and start the server:

```bash
cd /Users/ala/tindertravel/api
npm run dev
# OR
npm start
# OR if using TypeScript directly:
npx ts-node src/index.ts
```

**Expected Output:**
```
🌐 GLINTZ API SERVER - CONNECTION INFORMATION
============================================================

📱 MOBILE APP CONFIGURATION:
   Update API_BASE_URL in app/src/api/client.ts to:
   👉 http://192.168.1.107:3001

🔗 Available Endpoints:
   Local:     http://localhost:3001
   Network:   http://192.168.1.107:3001

🧪 Quick Test:
   curl http://192.168.1.107:3001/health
```

### Step 2: Verify Server is Running

**Check if server is listening:**
```bash
lsof -i TCP:3001
```

**Expected output:**
```
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    12345 user   23u  IPv4  ...      0t0  TCP *:3001 (LISTEN)
```

**Test the health endpoint:**
```bash
curl http://192.168.1.107:3001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "seeded": true,
  "hotelCount": 1234
}
```

### Step 3: Test OTP Endpoint Directly

**Test the OTP request endpoint:**
```bash
curl -X POST http://192.168.1.107:3001/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"contact@glintz.co"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "OTP code sent to email"
}
```

### Step 4: Restart the Mobile App

After the server is running:
1. Restart your Expo/React Native app
2. Try requesting OTP again
3. Check the server logs for incoming requests

---

## 🐛 Common Issues & Solutions

### Issue 1: Server Starts But Connection Still Fails

**Possible Causes:**
- Firewall blocking port 3001
- Device not on same network
- IP address changed

**Solutions:**
1. **Check firewall:**
   ```bash
   # macOS: Check if firewall is blocking
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
   ```

2. **Verify network:**
   - Ensure mobile device/simulator is on same Wi-Fi network
   - Check IP address hasn't changed: `ifconfig | grep "inet "`

3. **Try localhost (for simulator):**
   - If using iOS Simulator on same machine, try `http://localhost:3001`
   - Update `app/src/config/api.ts` to use `localhost` for simulator

### Issue 2: Server Crashes on Startup

**Check server logs for errors:**
- Missing environment variables
- Database connection issues
- Port already in use

**Solutions:**
1. **Check for port conflicts:**
   ```bash
   lsof -i TCP:3001
   # Kill existing process if needed
   kill -9 <PID>
   ```

2. **Verify environment variables:**
   ```bash
   cd api
   cat .env
   # Ensure required variables are set
   ```

3. **Check database connection:**
   - Verify Supabase credentials in `.env`
   - Test database connection separately

### Issue 3: IP Address Changed

**If your network IP changes:**

1. **Find new IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Update configuration:**
   - Edit `app/src/config/api.ts`
   - Update `baseUrl` in `development` config (line 61)
   - Restart the app

---

## 📊 Code References

### API Client Configuration
```56:78:app/src/config/api.ts
const configs: Record<Environment, Partial<ApiConfig>> = {
  development: {
    // Local backend for app services (auth, user data, etc.)
    // Partners API (Railway) is called directly in client.ts for hotel data
    baseUrl: 'http://192.168.1.107:3001',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  staging: {
    baseUrl: 'https://staging-api.glintz.com',
    timeout: 20000,
    retryAttempts: 2,
    retryDelay: 1000,
  },
  production: {
    baseUrl: 'https://api.glintz.com',
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 2000,
  },
};
```

### OTP Request Implementation
```179:194:app/src/api/client.ts
  // Request OTP code via email
  async requestOTP(data: OTPRequest): Promise<AuthResponse> {
    console.log('🌐 API Client: Requesting OTP for', data.email);
    console.log('🌐 API Client: Base URL', this.baseUrl);
    
    try {
      const response = await this.request<AuthResponse>('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('🌐 API Client: OTP Response', response);
      return response;
    } catch (error) {
      console.log('🌐 API Client: OTP Error', error);
      throw error;
    }
  }
```

### Backend OTP Endpoint
```232:302:api/src/index.ts
app.post('/api/auth/request-otp', otpLimiter, async (req, res) => {
  console.log('🚨 OTP ENDPOINT CALLED');
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    console.log('📧 Processing OTP request for:', email);

    // Generate and store OTP
    const otpResult = await otpService.createOTP(email);

    if (!otpResult.success) {
      console.error('❌ Failed to create OTP:', otpResult.error);
      // Rate limiting should return 400, not 500
      const isRateLimit = otpResult.error?.includes('Too many OTP requests');
      return res.status(isRateLimit ? 400 : 500).json({
        success: false,
        error: otpResult.error || 'Failed to create OTP',
      });
    }

    if (!otpResult.code) {
      console.error('❌ OTP code not returned from service');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate OTP code',
      });
    }

    // Send OTP email
    console.log('📨 Sending OTP email to:', email);
    const emailResult = await emailService.sendOTPEmail(email, otpResult.code);

    if (!emailResult.success) {
      console.error('❌ Failed to send OTP email:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      });
    }

    console.log('✅ OTP request completed successfully');
    console.log('🔐 ============================================');
    console.log('🔐 OTP CODE FOR TESTING:');
    console.log('🔐 Email:', email);
    console.log('🔐 Code:', otpResult.code);
    console.log('🔐 Use this code in the app!');
    console.log('🔐 ============================================');
    
    res.json({
      success: true,
      message: 'OTP code sent to email',
    });
  } catch (error) {
    console.error('❌ OTP request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});
```

---

## 🎯 Quick Fix Command

**Start the server immediately:**
```bash
cd /Users/ala/tindertravel/api && npm run dev
```

**In a separate terminal, verify it's working:**
```bash
curl http://192.168.1.107:3001/health
```

**Then test OTP:**
```bash
curl -X POST http://192.168.1.107:3001/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"contact@glintz.co"}'
```

---

## 📝 Summary

**Root Cause:** Backend API server is not running on port 3001.

**Solution:** Start the backend server using `npm run dev` in the `api` directory.

**Prevention:** 
- Add a startup script that checks if server is running
- Add connection validation on app startup
- Consider using a process manager (PM2) for development

**Next Steps:**
1. ✅ Start the backend server
2. ✅ Verify health endpoint responds
3. ✅ Test OTP endpoint directly
4. ✅ Restart mobile app and retry OTP request

---

**Status:** 🔴 **CRITICAL** - Server must be started before OTP requests will work

