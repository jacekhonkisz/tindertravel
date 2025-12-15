# Dropbox Setup Guide - Using Your App Credentials

## Your Dropbox App Credentials

- **App Key:** `4421f082idh572q`
- **App Secret:** `2cyyu8ov1zqqi60`

## Quick Setup (5 Minutes)

### Step 1: Generate Access Token

1. **Go to Dropbox App Console:**
   - Visit: https://www.dropbox.com/developers/apps
   - Sign in with your Dropbox account

2. **Find Your App:**
   - Look for app with Key: `4421f082idh572q`
   - Click on the app name to open settings

3. **Generate Access Token:**
   - Scroll to **"OAuth 2"** section
   - Under **"Generated access token"**, click **"Generate"**
   - Copy the token (it starts with `sl.`)
   - ⚠️ **Save it immediately** - you can only see it once!

### Step 2: Set Environment Variable

#### For Railway (Production)

1. Go to Railway Dashboard: https://railway.app
2. Select your project
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Add:
   - **Name:** `DROPBOX_ACCESS_TOKEN`
   - **Value:** `sl.your_token_here` (paste the token you copied)
6. Click **"Add"**
7. **Redeploy** your service (or it will auto-redeploy)

#### For Local Development

1. Create or edit `api/.env` file:
   ```env
   DROPBOX_ACCESS_TOKEN=sl.your_token_here
   ```

2. **⚠️ Important:** Make sure `.env` is in `.gitignore`:
   ```bash
   echo ".env" >> api/.gitignore
   ```

### Step 3: Test the Connection

After setting the token and restarting:

```bash
# Test photos endpoint
curl -H "X-API-Key: javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8" \
     "https://web-production-b200.up.railway.app/api/partners/595a0ff2-c12e-4ca5-b98c-55665ee70033/photos"
```

**Expected Success:**
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

## App Configuration

### Verify App Settings

In your Dropbox app settings, ensure:

1. **Permissions:**
   - ✅ `files.content.read` - Read file contents
   - ✅ `files.metadata.read` - Read file/folder metadata
   - ✅ `sharing.read` - Read sharing info

2. **Access Type:**
   - Should be: **"Full Dropbox"** or **"App folder"** (if using specific folder)

3. **OAuth 2:**
   - **Generated access token** should be visible
   - Token should be active (not revoked)

## Troubleshooting

### "Dropbox not configured" Error
- ✅ Check: `DROPBOX_ACCESS_TOKEN` is set in Railway
- ✅ Check: Variable name is exactly `DROPBOX_ACCESS_TOKEN` (case-sensitive)
- ✅ Check: Token starts with `sl.`
- ✅ Check: Service was restarted after adding variable

### "401 Unauthorized" Error
- ✅ Check: Token is valid (not expired/revoked)
- ✅ Check: App permissions are correct
- ✅ Check: Token has access to the folder path

### "404 Not Found" Error
- ✅ Check: Folder path exists in Dropbox
- ✅ Check: Path matches exactly (case-sensitive)
- ✅ Check: App has access to that folder

### Token Not Working
- ✅ Regenerate token from app console
- ✅ Verify app is not suspended
- ✅ Check app permissions
- ✅ Ensure token hasn't been revoked

## Security Notes

1. **Never commit tokens to git**
   - Use environment variables only
   - Add `.env` to `.gitignore`

2. **Token Storage**
   - Store in Railway's encrypted variables
   - Don't share tokens publicly
   - Rotate tokens periodically

3. **App Security**
   - Keep app secret secure
   - Don't expose app key/secret in code
   - Use environment variables for all credentials

## Next Steps

Once the token is set:

1. ✅ Photos will automatically load for partners with Dropbox folders
2. ✅ Temporary URLs will be generated (4-hour validity)
3. ✅ All image formats will be supported
4. ✅ Photos will appear in hotel cards

## Support

If you encounter issues:

1. Check Railway logs for error messages
2. Verify token in Dropbox app console
3. Test with curl command above
4. See `DROPBOX_INTEGRATION_AUDIT.md` for detailed troubleshooting

---

**Your App Key:** `4421f082idh572q`  
**App Console:** https://www.dropbox.com/developers/apps

