# Dropbox Integration Audit - Display Images from Dropbox

## 🔍 Current Status

### ✅ What's Working
- Partners API endpoint exists and is accessible
- Partners have Dropbox folders assigned (`dropbox_folder_id` and `dropbox_path`)
- Server-side photos endpoint exists: `GET /api/partners/:id/photos`
- Error message is clear and helpful

### ❌ What's Missing
- **DROPBOX_ACCESS_TOKEN** environment variable is not set
- Dropbox API authentication is not configured
- Photos endpoint returns error instead of photo URLs

## 🚨 Error Details

**Current Error:**
```json
{
  "error": "Dropbox not configured: DROPBOX_ACCESS_TOKEN not configured. Set it in .env file or environment variables."
}
```

**Endpoint:** `GET /api/partners/:id/photos`

**Test Command:**
```bash
curl -H "X-API-Key: javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8" \
     "https://web-production-b200.up.railway.app/api/partners/595a0ff2-c12e-4ca5-b98c-55665ee70033/photos"
```

## 📋 Required Steps to Enable Dropbox Photos

### Step 1: Get Dropbox Access Token

#### Option A: Dropbox App Access Token (Recommended for Server)

1. **Go to Dropbox App Console:**
   - Visit: https://www.dropbox.com/developers/apps
   - Sign in with your Dropbox account

2. **Create a New App:**
   - Click "Create app"
   - Choose:
     - **API**: Dropbox API
     - **Type**: Scoped access
     - **Access**: Full Dropbox (or specific folder like `/Glintz/Partners_Photos`)
   - Name your app (e.g., "Glintz Partners Photos")

3. **Generate Access Token:**
   - Go to your app settings
   - Under "OAuth 2" section
   - Click "Generate access token"
   - Copy the token (starts with `sl.`)

4. **Set Permissions:**
   - Ensure the app has access to:
     - `files.content.read` - Read file contents
     - `files.metadata.read` - Read file metadata
     - `sharing.read` - Read sharing info (for temporary links)

#### Option B: OAuth 2.0 Flow (For User-Specific Access)

If you need user-specific access:
1. Set up OAuth 2.0 flow
2. Get refresh token
3. Exchange for access token
4. Store securely

**For server-side use, Option A (App Access Token) is simpler and recommended.**

### Step 2: Configure Environment Variable

#### For Local Development (.env file)

Create or update `api/.env`:

```env
# Dropbox Configuration
DROPBOX_ACCESS_TOKEN=sl.your_access_token_here
```

**⚠️ Important:** Add `.env` to `.gitignore` if not already there!

#### For Production (Railway/Server)

1. **Railway Dashboard:**
   - Go to your Railway project: https://railway.app
   - Navigate to your service
   - Go to "Variables" tab
   - Click "New Variable"
   - Add:
     - **Name:** `DROPBOX_ACCESS_TOKEN`
     - **Value:** `sl.your_access_token_here`
   - Save

2. **Or via Railway CLI:**
   ```bash
   railway variables set DROPBOX_ACCESS_TOKEN=sl.your_access_token_here
   ```

3. **Restart the service** after adding the variable

### Step 3: Verify Server Implementation

The server endpoint should:
1. ✅ Check for `DROPBOX_ACCESS_TOKEN` environment variable (already implemented)
2. ✅ Use Dropbox API to:
   - List files in partner's Dropbox folder
   - Filter for image files (jpg, png, etc.)
   - Generate temporary download URLs (4-hour validity)
   - Return photo URLs

**Expected Server Code Pattern:**
```typescript
// Server should use Dropbox SDK or API
const dropboxToken = process.env.DROPBOX_ACCESS_TOKEN;
if (!dropboxToken) {
  return res.status(500).json({
    error: "Dropbox not configured: DROPBOX_ACCESS_TOKEN not configured"
  });
}

// Use Dropbox API to:
// 1. List folder contents
// 2. Filter image files
// 3. Generate temporary links
// 4. Return photo data
```

### Step 4: Test the Integration

After setting the token and restarting the server:

```bash
# Test photos endpoint
curl -H "X-API-Key: javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8" \
     "https://web-production-b200.up.railway.app/api/partners/595a0ff2-c12e-4ca5-b98c-55665ee70033/photos"
```

**Expected Success Response:**
```json
{
  "photos": [
    {
      "name": "hotel-exterior.jpg",
      "path": "/Glintz/Partners_Photos/Locanda al Colle/hotel-exterior.jpg",
      "url": "https://dl.dropboxusercontent.com/...",
      "size": 2048576,
      "modified": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "folder_path": "/Glintz/Partners_Photos/Locanda al Colle",
  "partner_name": "Loconda al Colle"
}
```

## 📦 Dropbox API Requirements

### Required Scopes/Permissions

The Dropbox app needs these permissions:

1. **`files.content.read`** - Read file contents
2. **`files.metadata.read`** - Read file/folder metadata
3. **`sharing.read`** - Read sharing info (for temporary links)

### Supported Image Formats

According to documentation:
- `.jpg`, `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.bmp`
- `.svg`
- `.heic`, `.heif`

### API Endpoints Used

1. **`files/list_folder`** - List files in partner's folder
2. **`files/get_temporary_link`** - Generate temporary download URLs (4-hour validity)
3. **`files/list_folder/continue`** - Pagination for large folders

## 🏨 Current Partners with Dropbox Folders

Based on test data, these partners have Dropbox folders:

1. **Loconda al Colle**
   - Folder ID: `id:yIpyTPWj1YwAAAAAAAAAyA`
   - Path: `/Glintz/Partners_Photos/Locanda al Colle`

2. **Eremito**
   - Folder ID: `id:yIpyTPWj1YwAAAAAAAAA1A`
   - Path: `/Glintz/Partners_Photos/Eremito`

3. **Casa Bonay**
   - Folder ID: `id:yIpyTPWj1YwAAAAAAAAA0g`
   - Path: `/Glintz/Partners_Photos/Casa Bonay`

4. **Haritha Villas + Spa**
   - Folder ID: `id:yIpyTPWj1YwAAAAAAAAAlA`
   - Path: `/Glintz/Partners_Photos/Haritha Villas`

## ✅ Implementation Checklist

### Server-Side
- [ ] Create Dropbox app in Dropbox Developer Console
- [ ] Generate access token
- [ ] Set `DROPBOX_ACCESS_TOKEN` environment variable on Railway
- [ ] Restart Railway service
- [ ] Verify server can access Dropbox API
- [ ] Test photos endpoint with real partner ID
- [ ] Verify temporary URLs are generated correctly
- [ ] Test with all partners that have Dropbox folders

### Client-Side (Already Done)
- [x] Partners API service created
- [x] Photos endpoint integration ready
- [x] Error handling implemented
- [ ] Test photo display in app (once server is configured)
- [ ] Handle photo URL expiration (4-hour validity)
- [ ] Add photo caching/fallbacks

### Testing
- [ ] Test with partner that has photos
- [ ] Test with partner that has no photos
- [ ] Test with partner that has no Dropbox folder
- [ ] Test photo URL expiration handling
- [ ] Test error scenarios (invalid token, folder not found, etc.)

## 🔒 Security Considerations

1. **Never commit access token to git**
   - Use environment variables only
   - Add `.env` to `.gitignore`
   - Use Railway's encrypted variables

2. **Token Storage**
   - Store in secure environment variables
   - Use Railway's encrypted variables
   - Rotate tokens periodically (every 90 days recommended)

3. **Access Scope**
   - Use scoped access (specific folder) if possible
   - Limit to read-only permissions
   - Don't grant unnecessary permissions

4. **Rate Limiting**
   - Dropbox API has rate limits (check current limits)
   - Implement caching for photo URLs
   - Consider CDN for frequently accessed images

## 🐛 Troubleshooting

### Error: "Dropbox not configured"
- **Solution:** Set `DROPBOX_ACCESS_TOKEN` environment variable
- **Check:** Verify variable name is exactly `DROPBOX_ACCESS_TOKEN`
- **Check:** Restart server after setting variable

### Error: "401 Unauthorized"
- **Solution:** Check if token is valid, regenerate if needed
- **Check:** Verify token hasn't expired
- **Check:** Verify app permissions are correct

### Error: "404 Not Found" (folder)
- **Solution:** Verify folder path exists in Dropbox
- **Check:** Check if folder was moved or deleted
- **Check:** Verify folder path matches exactly (case-sensitive)

### Error: "500 Internal Server Error"
- **Solution:** Check server logs for Dropbox API errors
- **Check:** Verify token has correct permissions
- **Check:** Check if Dropbox API is accessible from server
- **Check:** Verify Dropbox SDK/package is installed

### Photos Not Loading in App
- **Solution:** 
  - Check if URLs are expired (4-hour validity)
  - Verify image file formats are supported
  - Check browser console for CORS errors
  - Verify photo URLs are accessible

## 📚 Resources

- **Dropbox API Documentation:** https://www.dropbox.com/developers/documentation
- **Dropbox App Console:** https://www.dropbox.com/developers/apps
- **Dropbox API Explorer:** https://dropbox.github.io/dropbox-api-v2-explorer/
- **Partners API Documentation:** `PARTNERS_API_DOCUMENTATION.md`
- **Dropbox Node.js SDK:** https://github.com/dropbox/dropbox-sdk-js

## 🎯 Quick Start Guide

### 5-Minute Setup

1. **Get Token (2 min):**
   - Go to https://www.dropbox.com/developers/apps
   - Create app → Generate token → Copy token

2. **Set Variable (1 min):**
   - Railway Dashboard → Variables → Add `DROPBOX_ACCESS_TOKEN`

3. **Restart (1 min):**
   - Railway Dashboard → Deployments → Redeploy

4. **Test (1 min):**
   ```bash
   curl -H "X-API-Key: javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8" \
        "https://web-production-b200.up.railway.app/api/partners/595a0ff2-c12e-4ca5-b98c-55665ee70033/photos"
   ```

**Total time: ~5 minutes**

## 📊 Summary

**Current Issue:**
- ❌ `DROPBOX_ACCESS_TOKEN` environment variable is missing

**Solution:**
1. Get Dropbox access token from Dropbox Developer Console
2. Set `DROPBOX_ACCESS_TOKEN` in Railway environment variables
3. Restart Railway service
4. Test photos endpoint

**Once configured:**
- ✅ Photos will automatically load for all partners with Dropbox folders
- ✅ Temporary URLs will be generated (4-hour validity)
- ✅ All image formats will be supported
- ✅ Photos will appear in hotel cards automatically

**Estimated Time to Fix:** 5-10 minutes

---

**Next Action:** Get Dropbox access token and set environment variable on Railway.

