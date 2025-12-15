# R2 Photo Integration - Complete Guide

## ✅ What's Been Integrated

### 1. Backend Integration (`api/src/index.ts`)
- ✅ Updated `/api/hotels/partners` endpoint to use R2 photos
- ✅ Falls back to Dropbox if R2 photos not available
- ✅ Loads photo mapping from `sync-results-final.json`

### 2. R2 Photo Mapping Service (`api/src/services/r2PhotoMapping.ts`)
- ✅ Loads sync results JSON file
- ✅ Maps partner IDs to R2 photo URLs
- ✅ Caches mapping for 5 minutes
- ✅ Auto-reloads after sync

### 3. Frontend Client (`app/src/api/client.ts`)
- ✅ Ready to receive R2 photo URLs from backend
- ✅ No changes needed - backend handles photo fetching

---

## 🔄 How It Works

### Flow:
```
1. App requests hotels → GET /api/hotels/partners?include_photos=true
2. Backend fetches partners from Partners API
3. Backend loads R2 photo mapping from sync-results-final.json
4. Backend matches partner.id → R2 photo URLs
5. Backend returns hotels with R2 photo URLs
6. App displays photos from R2 CDN
```

### Photo URL Pattern:
```
https://pub-80c0117878c14da1a0792cf1c8708824.r2.dev/partners/{partner-id}/{index}-{filename}
```

---

## 📁 Required Files

### 1. Sync Results File
**Location:** `api/sync-results-final.json`

This file contains the mapping of partner IDs to R2 photo URLs. The backend automatically loads this file.

**After running sync, ensure this file exists:**
```bash
cd api
ls -la sync-results-final.json
```

### 2. Sync Script
**Location:** `api/sync-dropbox-to-r2.js`

Run this to sync new photos:
```bash
cd api
node sync-dropbox-to-r2.js
```

---

## 🧪 Testing

### Test Backend Endpoint:
```bash
curl "http://192.168.1.107:3001/api/hotels/partners?page=1&per_page=3&include_photos=true" | jq '.hotels[0] | {name, photos: .photos | length, firstPhoto: .photos[0]}'
```

### Test R2 Photo Directly:
```bash
curl -I "https://pub-80c0117878c14da1a0792cf1c8708824.r2.dev/partners/595a0ff2-c12e-4ca5-b98c-55665ee70033/001-_DSC6550.jpg"
# Should return: HTTP/1.1 200 OK
```

---

## 🔄 After Adding New Photos

### 1. Run Sync:
```bash
cd api
node sync-dropbox-to-r2.js
```

### 2. Reload Mapping (Optional):
The backend auto-reloads every 5 minutes, or restart the server:
```bash
# Restart backend server
cd api
npm run dev
```

### 3. Verify:
Check that new photos appear in the app.

---

## 📊 Current Status

| Partner | R2 Photos | Status |
|---------|-----------|--------|
| Loconda al Colle | 9 | ✅ |
| Eremito | 9 | ✅ |
| Casa Bonay | 10 | ✅ |
| Haritha Villas + Spa | 18 | ✅ |
| Pico Bonito | 14 | ✅ |
| Hattvika Lodge | 10 | ✅ |
| **Total** | **70** | ✅ |

---

## 🚀 Next Steps

1. **Restart Backend** to load R2 photo mapping
2. **Test in App** - Hotels should now show R2 photos
3. **Set Up Automated Sync** (optional):
   ```bash
   # Cron job - runs daily at 2 AM
   0 2 * * * cd /path/to/api && node sync-dropbox-to-r2.js >> sync.log 2>&1
   ```

---

## 🐛 Troubleshooting

### Photos Not Showing?

1. **Check sync results file exists:**
   ```bash
   ls -la api/sync-results-final.json
   ```

2. **Check backend logs:**
   - Look for: `✅ Loaded R2 photos for X partners`
   - Look for: `✅ Using R2 photos for {hotel_name}`

3. **Verify R2 URLs work:**
   ```bash
   curl -I "https://pub-80c0117878c14da1a0792cf1c8708824.r2.dev/partners/{partner-id}/001-{filename}"
   ```

4. **Check partner ID matches:**
   - Partner ID in sync results must match Partner ID from API

### Backend Not Loading Photos?

1. **Restart backend server**
2. **Check file path** - sync results should be in `api/` directory
3. **Check file format** - must be valid JSON

---

## 📝 Files Modified

1. ✅ `api/src/index.ts` - Updated to use R2 photos
2. ✅ `api/src/services/r2PhotoMapping.ts` - New service for R2 photos
3. ✅ `app/src/api/client.ts` - Updated comment (no code changes needed)

---

## ✅ Integration Complete!

The app is now configured to use R2 photos. Just restart the backend server and test!

