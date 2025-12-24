# Development Mode - Rate Limiting Disabled

## Overview
Rate limiting has been disabled in development mode to allow faster testing and iteration without hitting "Too Many Requests" errors.

## Changes Made

### Backend (`api/src/services/otp-service.ts`)

```typescript
// Skip rate limiting in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

if (!isDevelopment) {
  // PRODUCTION: Check minimum time between requests (60 seconds)
  // PRODUCTION: Check hourly rate limiting (5 per hour)
} else {
  console.log('🔓 Development mode: Rate limiting disabled');
}
```

**In Development:**
- ✅ No 60-second cooldown between requests
- ✅ No 5 requests per hour limit
- ✅ Can request OTP codes as many times as needed
- ✅ Instant testing without waiting

**In Production:**
- ✅ Full rate limiting enabled (60s cooldown + 5/hour limit)
- ✅ All security measures active

### Frontend (`app/src/screens/AuthScreen.tsx`)

```typescript
// Client-side rate limiting: prevent rapid-fire requests (disabled in dev)
const isDevelopment = __DEV__;

if (!isDevelopment) {
  // Check 3-second minimum between requests
} else {
  console.log('🔓 Development mode: Client-side rate limiting disabled');
}
```

**In Development:**
- ✅ No 3-second client-side throttling
- ✅ Can tap "Continue" or "Resend" as fast as you want
- ✅ No artificial delays for testing

**In Production:**
- ✅ 3-second minimum between button clicks
- ✅ Prevents accidental double-taps

## How It Works

### Environment Detection

**Backend:**
```typescript
process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
```
- Checks for explicit "development" environment
- Also treats undefined/missing NODE_ENV as development (safe default for local testing)

**Frontend:**
```typescript
__DEV__
```
- React Native's built-in development flag
- `true` in development builds
- `false` in production builds

### What's Still Enforced

Even in development mode, these security features remain active:

1. **OTP Code Expiration**: 10 minutes
2. **Verification Attempts**: Max 5 attempts per code
3. **Cryptographic Security**: Secure random code generation
4. **Code Invalidation**: Old codes expire when new one requested

### Testing Now

You can now test the OTP flow freely:

```bash
# Request code
# ✅ Works immediately

# Request again
# ✅ Works immediately (no 60s wait)

# Request 10 times in a row
# ✅ All work (no rate limiting)

# Resend code
# ✅ Works immediately
```

## Production Deployment

When deploying to production:

### Backend
Set the environment variable:
```bash
NODE_ENV=production
```

### Frontend
Build with production flag:
```bash
# React Native production build
npm run build
# or
expo build
```

The `__DEV__` flag automatically becomes `false` in production builds.

## Monitoring

### Development Logs
Look for these messages to confirm rate limiting is disabled:
```
🔓 Development mode: Rate limiting disabled (backend)
🔓 Development mode: Client-side rate limiting disabled (frontend)
```

### Production Logs
In production, you'll see normal rate limiting messages:
```
⚠️  Too soon to request another code for email: user@example.com
⚠️  Wait 42 more seconds
```

## Switching Modes

### Enable Rate Limiting (Production)
```bash
# Backend
export NODE_ENV=production
npm start

# Frontend
npm run build # or production build command
```

### Disable Rate Limiting (Development)
```bash
# Backend
export NODE_ENV=development
# or just unset NODE_ENV
npm run dev

# Frontend
npm start # dev mode by default
```

## Summary

✅ **Development**: Rate limiting completely disabled for fast iteration  
✅ **Production**: Full rate limiting enabled for security  
✅ **Automatic**: Detects environment automatically  
✅ **Safe**: Security features (expiration, attempt limits) still active  

Now you can test OTP flows without any rate limiting delays! 🚀

