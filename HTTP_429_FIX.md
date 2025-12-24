# HTTP 429 Rate Limiting Fix

## Problem
The auth screen was showing HTTP 429 errors when users requested OTP codes too frequently. This happens when the backend rate limits requests to prevent abuse.

## Solution Implemented

### 1. Enhanced Error Handling in API Client (`/app/src/api/client.ts`)

**Changes:**
- Modified the `request` method to attach status codes to error objects
- Updated `requestOTP` method to catch and handle 429 errors specifically
- Returns user-friendly error messages for rate limit errors

```typescript
// Now errors include status codes
const error: any = new Error(errorMessage);
error.status = response.status;
error.response = { status: response.status, data: errorData };

// requestOTP now handles 429 specifically
if (error.status === 429 || error.response?.status === 429) {
  return {
    success: false,
    error: 'Too many requests. Please wait a moment before trying again.',
  };
}
```

### 2. Client-Side Rate Limiting (`/app/src/screens/AuthScreen.tsx`)

**New Features:**
- Added `rateLimitCooldown` state to track cooldown timer
- Implemented `startCooldownTimer` function for countdown
- Enhanced `handleContinue` to detect and handle 429 errors
- Updated UI to show countdown timer on button

**User Experience:**
- When rate limited: Button shows "Wait Xs" instead of "Continue"
- Button is disabled during cooldown
- Cooldown timer counts down from 60 seconds
- Clear error message explains the wait time

```typescript
// Rate limit state
const [rateLimitCooldown, setRateLimitCooldown] = useState<number>(0);

// Cooldown timer
const startCooldownTimer = (seconds: number) => {
  const interval = setInterval(() => {
    setRateLimitCooldown((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};

// UI shows countdown
<TouchableOpacity
  style={[
    dynamicStyles.primaryButton,
    rateLimitCooldown > 0 && { opacity: 0.5 }
  ]}
  disabled={rateLimitCooldown > 0}
>
  <Text style={dynamicStyles.buttonText}>
    {rateLimitCooldown > 0 ? `Wait ${rateLimitCooldown}s` : 'Continue'}
  </Text>
</TouchableOpacity>
```

## How It Works

### Normal Flow
1. User enters email and clicks "Continue"
2. OTP is requested from backend
3. User proceeds to OTP entry screen

### Rate Limited Flow
1. User enters email and clicks "Continue" (too soon after previous request)
2. Backend returns HTTP 429 error
3. App detects the 429 status code
4. Sets 60-second cooldown timer
5. Button shows "Wait 60s" and is disabled
6. Timer counts down: "Wait 59s", "Wait 58s", etc.
7. After 60 seconds, button becomes "Continue" again
8. User can retry

### Error Detection
The system checks for rate limiting in multiple ways:
- HTTP status code 429
- Error message containing "429"
- Error message containing "rate limit" or "too many"
- Response status from error object

## Benefits

✅ **Prevents spam:** Users can't accidentally spam the OTP endpoint  
✅ **Clear feedback:** Users know exactly how long to wait  
✅ **Better UX:** Visual countdown instead of confusing error messages  
✅ **Graceful degradation:** Works even if backend changes error format  
✅ **No server changes needed:** Pure client-side solution

## Testing

To test the rate limiting:
1. Enter email and click "Continue"
2. Go back (if on OTP screen)
3. Immediately click "Continue" again (repeat 2-3 times quickly)
4. You should see "Wait 60s" on the button
5. Watch it count down to 0
6. Button becomes "Continue" again

## Backend Rate Limit Configuration

The backend should ideally return:
- Status: `429 Too Many Requests`
- Headers: `Retry-After: 60` (optional, for future enhancement)
- Body: `{ "error": "Too many requests. Please try again later." }`

Currently, the frontend assumes a 60-second cooldown, but this could be made dynamic based on backend response headers.

## Future Enhancements

1. **Dynamic cooldown:** Read `Retry-After` header from backend response
2. **Local storage:** Remember last request time across app restarts
3. **Exponential backoff:** Increase cooldown for repeated violations
4. **Server-time sync:** Use server timestamp to prevent client-side manipulation

## Files Modified

- `/app/src/api/client.ts` - Enhanced error handling
- `/app/src/screens/AuthScreen.tsx` - Added rate limiting and countdown timer

---

**Status:** ✅ Fixed  
**Tested:** Yes  
**Linter Errors:** 0

