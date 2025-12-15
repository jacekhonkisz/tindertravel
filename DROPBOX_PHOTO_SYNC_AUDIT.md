# 🔍 Dropbox Photo Synchronization - Complete Audit

**Date:** December 12, 2025  
**Status:** ⚠️ **MANUAL SYNC REQUIRED**

---

## 📋 Executive Summary

Your app uses a **semi-automatic** photo synchronization system:
- ❌ **NOT automatic** - Changes in Dropbox do NOT automatically appear in your app
- ✅ **Manual sync required** - You must run a sync script to update photos
- ⚡ **One-time sync, cached forever** - Photos are uploaded to Cloudflare R2 and served from there

---

## 🔄 How It Currently Works

### Architecture Overview

```
Dropbox (Storage)
    ↓
    ↓ [Manual Sync Script]
    ↓
Cloudflare R2 (CDN)
    ↓
    ↓ [Auto-loaded on server start]
    ↓
Backend API (Cached mapping)
    ↓
    ↓ [API Request]
    ↓
Mobile App (Displays photos)
```

### Step-by-Step Flow

1. **Photos stored in Dropbox:**
   - Partners have folders: `/Glintz/Partners_Photos/{Hotel Name}/`
   - You manually add/update/remove photos in these folders

2. **Manual sync to R2:**
   - You run: `node sync-dropbox-to-r2.js` (in `/api` folder)
   - Script downloads all photos from Dropbox
   - Script uploads to Cloudflare R2 with naming: `partners/{partner-id}/{001-filename}.jpg`
   - Script generates `sync-results-final.json` with all photo URLs

3. **Backend loads mapping:**
   - Backend reads `sync-results-final.json` on startup
   - Caches photo URLs in memory for 1 hour
   - Serves photos to app via `/api/hotels/partners` endpoint

4. **App displays photos:**
   - App fetches hotels with photos from backend
   - Photos load directly from R2 CDN (permanent URLs, very fast)

---

## ⚠️ What Happens When You Update Photos

### Scenario 1: ➕ **Add New Photos to Dropbox**

**What happens automatically:**
- ❌ Nothing - new photos stay in Dropbox only

**What you need to do:**
```bash
cd api
node sync-dropbox-to-r2.js
```

**What the script does:**
- ✅ Downloads new photos from Dropbox
- ✅ Uploads to R2
- ✅ Updates `sync-results-final.json`
- ✅ New photos will appear after backend restarts (or cache expires after 1 hour)

**Time to appear in app:** 1 hour max (or restart backend immediately)

---

### Scenario 2: 🗑️ **Remove Photos from Dropbox**

**What happens automatically:**
- ❌ Nothing - old photos remain in R2 and app

**What you need to do:**
```bash
cd api
node sync-dropbox-to-r2.js
```

**What happens:**
- ⚠️ **Photos remain in R2** - sync script only uploads, doesn't delete
- ✅ `sync-results-final.json` is updated with new list
- ⚠️ **Old photos still accessible via direct URL** (but won't show in app after cache refresh)

**To fully remove photos:**
1. Delete from Dropbox
2. Run sync script (updates JSON mapping)
3. Manually delete from R2 (via Cloudflare dashboard or AWS CLI)
4. Restart backend

**Time to stop appearing in app:** 1 hour max (or restart backend immediately)

---

### Scenario 3: 🔄 **Replace/Update Photos in Dropbox**

**What happens automatically:**
- ❌ Nothing - old photos remain in app

**What you need to do:**
```bash
cd api
node sync-dropbox-to-r2.js
```

**What happens:**
- ✅ New version uploaded to R2 (overwrites old file with same name)
- ✅ `sync-results-final.json` updated
- ⚠️ If filename changed, old photo remains in R2 (orphaned)

**Best practice:**
- Keep same filenames when replacing photos (auto-overwrites in R2)
- Or delete old files from R2 manually

**Time to appear in app:** 1 hour max (or restart backend immediately)

---

## 🚨 Critical Limitations

### 1. ❌ **No Automatic Sync**
- Changes in Dropbox don't trigger any automatic process
- You must manually run sync script every time
- No scheduled/automated sync is configured

### 2. ⚠️ **No Deletion Handling**
- Sync script only uploads, never deletes from R2
- Removed photos stay in R2 (wasted storage)
- Old URLs remain accessible (privacy concern if sensitive)

### 3. ⏰ **Cache Delay**
- Backend caches mapping for 1 hour
- New photos won't appear immediately (unless backend restarted)
- Can cause confusion if testing after sync

### 4. 📦 **Manual JSON Update**
- `sync-results-final.json` must be manually generated
- If file is corrupted/deleted, no photos will load
- No backup mechanism

---

## 📂 Current File Structure

### In Dropbox:
```
/Glintz/Partners_Photos/
├── Locanda al Colle/
│   ├── _DSC6550.jpg
│   ├── Locanda_al-Colle_Exteriors_11.png
│   └── ... (9 photos)
├── Eremito/
│   └── ... (9 photos)
├── Casa Bonay/
│   └── ... (10 photos)
├── Haritha Villas + Spa/
│   └── ... (18 photos)
├── Pico Bonito/
│   └── ... (14 photos)
└── Hattvika Lodge/
    └── ... (10 photos)
```

### In Cloudflare R2:
```
glintz-hotel-photos/
└── partners/
    ├── 595a0ff2-c12e-4ca5-b98c-55665ee70033/  (Locanda al Colle)
    │   ├── 001-_DSC6550.jpg
    │   ├── 002-Locanda_al-Colle_Exteriors_11.png
    │   └── ... (9 photos)
    ├── 845efd99-082f-44ec-9c29-b651f0b10be9/  (Eremito)
    │   └── ... (9 photos)
    └── ...
```

### In Backend:
```
api/
├── sync-dropbox-to-r2.js          (Sync script)
├── sync-results-final.json         (Photo mapping - CRITICAL FILE)
├── src/
│   └── services/
│       └── r2PhotoMapping.ts      (Loads and caches mapping)
```

---

## 🔧 Technical Details

### Sync Script: `sync-dropbox-to-r2.js`

**Location:** `/Users/ala/tindertravel/api/sync-dropbox-to-r2.js`

**What it does:**
1. Fetches all partners from Partners API
2. For each partner with `dropbox_path`:
   - Lists photos in Dropbox folder (via Dropbox API)
   - Downloads each photo (via Dropbox API)
   - Uploads to R2 (via AWS S3 API)
   - Generates permanent R2 URL
3. Saves all URLs to `sync-results-{timestamp}.json`
4. You manually rename latest to `sync-results-final.json`

**Performance:**
- ~20 photos/minute
- 70 photos = ~3-4 minutes
- Downloads + uploads = double network time

**Credentials used:**
- Dropbox: Access token (hardcoded in script - security risk!)
- R2: Access key + secret (hardcoded in script - security risk!)

---

### Backend Mapping: `r2PhotoMapping.ts`

**Location:** `/Users/ala/tindertravel/api/src/services/r2PhotoMapping.ts`

**What it does:**
1. On first request, loads `sync-results-final.json`
2. Parses JSON and creates in-memory Map: `partnerId → photo URLs[]`
3. Caches for 1 hour (60 minutes)
4. After 1 hour, reloads from file automatically

**Cache behavior:**
- ✅ Fast: No disk I/O after first load
- ⚠️ Stale: Changes not visible for up to 1 hour
- ❌ Memory-only: Lost on server restart (but reloads automatically)

**Key functions:**
- `getPartnerR2Photos(partnerId)` - Returns photo URLs for partner
- `reloadPhotoMapping()` - Force reload (not currently used)

---

### Backend Endpoint: `/api/hotels/partners`

**Location:** `/Users/ala/tindertravel/api/src/index.ts` (lines 1762-1878)

**What it does:**
1. Fetches partners from Partners API (cached for 10 minutes)
2. For each partner:
   - Calls `getPartnerR2Photos(partner.id)`
   - Gets photo URLs from cached mapping
   - Adds to hotel card response
3. Returns hotels with photos to app

**Important notes:**
- ❌ No Dropbox fallback anymore (removed for performance)
- ✅ Only R2 photos are served
- ✅ Shows ALL photos (no limit) - optimized images ~150KB each

---

## 📊 Current Photo Inventory

| Partner | Photos in R2 | Last Synced |
|---------|--------------|-------------|
| Locanda al Colle | 9 | Dec 12, 2025 |
| Eremito | 9 | Dec 12, 2025 |
| Casa Bonay | 10 | Dec 12, 2025 |
| Haritha Villas + Spa | 18 | Dec 12, 2025 |
| Pico Bonito | 14 | Dec 12, 2025 |
| Hattvika Lodge | 10 | Dec 12, 2025 |
| **TOTAL** | **70** | - |

**Storage used:** ~140 MB  
**Monthly cost:** $0.002 (practically free)

---

## ✅ Recommended Workflow

### When Adding New Partner Photos:

1. **Upload to Dropbox:**
   ```
   - Add photos to: /Glintz/Partners_Photos/{Hotel Name}/
   - Use descriptive filenames (e.g., exterior-1.jpg, pool-view.jpg)
   - Optimize photos before upload (max 2048px, ~150KB)
   ```

2. **Run Sync Script:**
   ```bash
   cd api
   node sync-dropbox-to-r2.js
   ```

3. **Update Mapping File:**
   ```bash
   # Script generates: sync-results-1234567890.json
   # Rename it:
   mv sync-results-*.json sync-results-final.json
   ```

4. **Restart Backend (optional for immediate effect):**
   ```bash
   # Kill backend server
   npm run dev
   ```

5. **Test in App:**
   - Open app
   - Navigate to partner hotel
   - Verify photos appear

**Total time:** ~5 minutes

---

### When Removing Partner Photos:

1. **Delete from Dropbox:**
   ```
   - Remove photos from: /Glintz/Partners_Photos/{Hotel Name}/
   ```

2. **Run Sync Script:**
   ```bash
   cd api
   node sync-dropbox-to-r2.js
   mv sync-results-*.json sync-results-final.json
   ```

3. **Delete from R2 (optional but recommended):**
   - Go to: https://dash.cloudflare.com
   - Navigate: R2 → glintz-hotel-photos → partners/{partner-id}/
   - Delete old photos manually
   - Or use AWS CLI: `aws s3 rm s3://glintz-hotel-photos/partners/{partner-id}/ --recursive --endpoint-url=...`

4. **Restart Backend:**
   ```bash
   npm run dev
   ```

**Total time:** ~10 minutes (including R2 cleanup)

---

### When Replacing/Updating Photos:

1. **Replace in Dropbox (keep same filename):**
   ```
   - Overwrite old file with new version
   - Same filename = R2 auto-overwrites
   ```

2. **Run Sync Script:**
   ```bash
   cd api
   node sync-dropbox-to-r2.js
   mv sync-results-*.json sync-results-final.json
   ```

3. **Restart Backend (optional):**
   ```bash
   npm run dev
   ```

**Total time:** ~5 minutes

---

## 🚀 Automation Options (Recommended)

### Option 1: Scheduled Sync (Cron Job)

**Setup a daily sync at 2 AM:**

```bash
# Edit crontab
crontab -e

# Add line:
0 2 * * * cd /Users/ala/tindertravel/api && node sync-dropbox-to-r2.js && mv sync-results-*.json sync-results-final.json >> sync.log 2>&1
```

**Pros:**
- ✅ Automatic daily sync
- ✅ New photos appear within 24 hours
- ✅ No manual intervention

**Cons:**
- ⚠️ Requires server to run cron
- ⚠️ May sync unnecessary (if no changes)

---

### Option 2: GitHub Actions (Cloud-based)

**Create `.github/workflows/sync-photos.yml`:**

```yaml
name: Sync Dropbox Photos to R2

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
        working-directory: api
      - run: node sync-dropbox-to-r2.js
        working-directory: api
      - run: mv sync-results-*.json sync-results-final.json
        working-directory: api
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "Automated photo sync"
          file_pattern: api/sync-results-final.json
```

**Pros:**
- ✅ Runs in cloud (no local server needed)
- ✅ Can trigger manually from GitHub
- ✅ Commits updated mapping to repo
- ✅ Free (GitHub Actions included)

**Cons:**
- ⚠️ Requires repo setup
- ⚠️ Credentials in GitHub Secrets

---

### Option 3: Dropbox Webhooks (Real-time)

**Advanced: React to Dropbox changes instantly:**

1. Set up Dropbox webhook endpoint
2. Dropbox notifies when files change
3. Endpoint triggers sync script automatically
4. Photos appear in app within minutes

**Pros:**
- ✅ Real-time sync (< 5 minutes)
- ✅ Only syncs when needed
- ✅ Most efficient

**Cons:**
- ❌ Complex setup
- ❌ Requires webhook server
- ❌ Need to maintain webhook endpoint

---

### Option 4: Manual Sync Button (UI)

**Create admin dashboard with "Sync Photos" button:**

1. Add admin route: `/admin/sync-photos`
2. Button triggers sync script on backend
3. Shows progress/results in UI

**Pros:**
- ✅ Simple to use
- ✅ On-demand sync
- ✅ Visual feedback

**Cons:**
- ⚠️ Still manual (but easier)
- ⚠️ Need to build UI

---

## 🔒 Security Concerns

### ⚠️ **Hardcoded Credentials in Sync Script**

**Current state:**
```javascript
const DROPBOX_TOKEN = 'sl.u.AGKdm_CD8U48...' // EXPOSED!
const R2_CONFIG = {
  accessKeyId: '186c0c52ecc9c21cb4173997b488b748', // EXPOSED!
  secretAccessKey: '77a6724c...', // EXPOSED!
}
```

**Risk:** If repo is public or compromised, attackers have full access to:
- Your Dropbox account
- Your Cloudflare R2 bucket

**Fix:** Use environment variables:

```javascript
// sync-dropbox-to-r2.js
const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
const R2_CONFIG = {
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: process.env.R2_ENDPOINT,
  bucket: process.env.R2_BUCKET,
};
```

**Then create `.env` file (add to `.gitignore`):**
```env
DROPBOX_ACCESS_TOKEN=sl.u.AGKdm_CD8U48...
R2_ACCESS_KEY_ID=186c0c52ecc9c21cb4173997b488b748
R2_SECRET_ACCESS_KEY=77a6724c...
R2_ENDPOINT=https://1aa4ad77f22f19fa066c9b9327298076.r2.cloudflarestorage.com
R2_BUCKET=glintz-hotel-photos
```

---

## 🐛 Known Issues

### Issue 1: Special Characters in Filenames

**Problem:** Some filenames cause sync errors
```
Failed: Ic+¡ar J. Carrasco - MANGO - Casa Bonay-7.jpg
```

**Solution:** Rename files to use only:
- Letters (A-Z, a-z)
- Numbers (0-9)
- Hyphens (-) and underscores (_)

**Good:** `icar-carrasco-casa-bonay-7.jpg`  
**Bad:** `Ic+¡ar J. Carrasco - MANGO - Casa Bonay-7.jpg`

---

### Issue 2: Orphaned Files in R2

**Problem:** Deleted/renamed photos stay in R2 forever

**Current state:**
- Delete photo from Dropbox → Removed from mapping
- But original file stays in R2 bucket
- Wastes storage and money (minimal but adds up)

**Solution:** Implement cleanup in sync script:
1. List all files in R2 bucket
2. Compare with current Dropbox photos
3. Delete orphaned files

---

### Issue 3: Cache Confusion

**Problem:** After sync, photos don't appear for 1 hour

**Current behavior:**
- Backend caches mapping for 1 hour
- New sync results not loaded until cache expires
- Confusing when testing

**Solutions:**
1. **Quick:** Restart backend after sync
2. **Better:** Add force-reload endpoint:
   ```typescript
   app.post('/api/admin/reload-photos', (req, res) => {
     reloadPhotoMapping();
     res.json({ success: true });
   });
   ```
3. **Best:** Reduce cache to 5 minutes

---

### Issue 4: No Sync Status/Monitoring

**Problem:** No way to know:
- When photos were last synced
- If sync is running
- If sync failed

**Solution:** Add sync metadata:
```json
// sync-results-final.json
{
  "sync_timestamp": "2025-12-12T17:03:56.666Z",
  "total_photos": 70,
  "total_partners": 6,
  "results": [...]
}
```

**Then expose via endpoint:**
```typescript
app.get('/api/admin/sync-status', (req, res) => {
  const metadata = loadSyncMetadata();
  res.json({
    last_sync: metadata.sync_timestamp,
    total_photos: metadata.total_photos,
    age_hours: (Date.now() - new Date(metadata.sync_timestamp)) / 3600000
  });
});
```

---

## 📈 Recommendations

### Immediate Actions (High Priority)

1. **🔒 Move credentials to environment variables**
   - Risk: High (credentials exposed in code)
   - Effort: 10 minutes
   - Impact: Critical security fix

2. **⏰ Reduce cache duration to 5 minutes**
   - Risk: Low
   - Effort: 2 minutes
   - Impact: Faster photo updates

3. **📋 Add sync timestamp to results file**
   - Risk: Low
   - Effort: 15 minutes
   - Impact: Better monitoring

---

### Short-term Actions (1-2 weeks)

4. **🔄 Set up automated daily sync (cron or GitHub Actions)**
   - Risk: Low
   - Effort: 30-60 minutes
   - Impact: No more manual syncs needed

5. **🗑️ Implement R2 cleanup in sync script**
   - Risk: Medium (could delete wrong files if buggy)
   - Effort: 1 hour
   - Impact: Saves storage, cleaner bucket

6. **🎛️ Add admin endpoint to force reload cache**
   - Risk: Low
   - Effort: 10 minutes
   - Impact: Faster testing workflow

---

### Long-term Actions (Optional)

7. **🌐 Build admin dashboard with sync UI**
   - Risk: Low
   - Effort: 4-8 hours
   - Impact: Better UX for photo management

8. **⚡ Implement Dropbox webhooks for real-time sync**
   - Risk: Medium (more complex)
   - Effort: 8-16 hours
   - Impact: Photos appear instantly

9. **📊 Add photo analytics/monitoring**
   - Risk: Low
   - Effort: 2-4 hours
   - Impact: Better insights into photo usage

---

## 🎯 Summary

### Current State:
- ❌ Photos DO NOT automatically sync from Dropbox
- ✅ Manual sync script works reliably
- ⚠️ Changes visible after 1 hour (or backend restart)
- ⚠️ No deletion handling (orphaned files in R2)
- ❌ Credentials hardcoded (security risk)

### To Update Photos:
```bash
# 1. Update photos in Dropbox
# 2. Run sync:
cd api
node sync-dropbox-to-r2.js
mv sync-results-*.json sync-results-final.json

# 3. Restart backend (optional for immediate effect):
npm run dev

# 4. Wait up to 1 hour, or photos appear immediately if restarted
```

### Recommended Next Steps:
1. **Fix security:** Move credentials to `.env`
2. **Improve UX:** Reduce cache to 5 minutes
3. **Automate:** Set up daily cron job or GitHub Action
4. **Clean up:** Implement R2 orphan deletion

---

**Questions? Need help setting up automation? Let me know!**


