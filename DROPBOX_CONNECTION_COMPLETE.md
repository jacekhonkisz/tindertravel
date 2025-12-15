# Dropbox Connection Complete ✅

## Successfully Connected!

Your Dropbox app credentials are working! I've obtained an access token and tested the connection.

## Your App Credentials

- **App Key:** `4421f082idh572q`
- **App Secret:** `2cyyu8ov1zqqi60`
- **Status:** ✅ Connected and working

## Access Token

The access token was successfully obtained using client credentials flow. However, **this token expires in ~4 hours**.

### For Production Use

You have two options:

#### Option 1: Use Generated Token (Recommended for Production)

1. Go to: https://www.dropbox.com/developers/apps
2. Find your app (Key: `4421f082idh572q`)
3. Go to "Settings" → "OAuth 2"
4. Click "Generate access token" (long-lived token)
5. Use that token instead

#### Option 2: Auto-Generate Token (Current Method)

The current method generates a short-lived token (~4 hours). For production, you can:

1. **Set up automatic token refresh** in your server code
2. **Or use the generated token** from app console (doesn't expire)

## Quick Setup

### Get Current Token

Run this command to get a fresh token:

```bash
curl -X POST https://api.dropboxapi.com/oauth2/token \
  -d "grant_type=client_credentials" \
  -u "4421f082idh572q:2cyyu8ov1zqqi60"
```

Extract the `access_token` from the response.

### Set Environment Variable

#### For Railway (Production)

1. Go to Railway Dashboard → Variables
2. Add: `DROPBOX_ACCESS_TOKEN` = `your_token_here`
3. Redeploy service

#### For Local Development

Add to `api/.env`:
```env
DROPBOX_ACCESS_TOKEN=your_token_here
```

## Test the Connection

After setting the token:

```bash
# Test photos endpoint
curl -H "X-API-Key: javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8" \
     "https://web-production-b200.up.railway.app/api/partners/595a0ff2-c12e-4ca5-b98c-55665ee70033/photos"
```

## Automated Token Refresh (Optional)

If you want to use the auto-generated tokens, you can set up token refresh in your server:

```javascript
// In your server code
async function getDropboxToken() {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from('4421f082idh572q:2cyyu8ov1zqqi60').toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return data.access_token;
}

// Cache token and refresh every 3 hours
let cachedToken = null;
let tokenExpiry = null;

async function getCachedToken() {
  if (!cachedToken || Date.now() > tokenExpiry) {
    cachedToken = await getDropboxToken();
    tokenExpiry = Date.now() + (3 * 60 * 60 * 1000); // 3 hours
  }
  return cachedToken;
}
```

## Next Steps

1. ✅ **Get a long-lived token** from Dropbox App Console (recommended)
2. ✅ **Set `DROPBOX_ACCESS_TOKEN`** in Railway environment variables
3. ✅ **Restart/Redeploy** your Railway service
4. ✅ **Test photos endpoint** - should work immediately!

## Summary

- ✅ App credentials verified
- ✅ Access token obtained successfully
- ✅ Connection tested
- ⚠️ Token expires in ~4 hours (use generated token for production)

**Once you set the token in Railway, photos will automatically load for all partners!**

