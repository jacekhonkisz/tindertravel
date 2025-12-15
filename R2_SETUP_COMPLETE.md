# Cloudflare R2 Setup - Next Steps

## ✅ What's Done

1. ✅ R2 bucket created: `glintz-hotel-photos`
2. ✅ API credentials configured
3. ✅ Connection tested successfully
4. ✅ Sync script created

## 🔗 Get Your Public R2 URL

To serve photos publicly, you need to enable public access:

1. Go to: https://dash.cloudflare.com
2. Click **"R2"** in sidebar
3. Click on bucket: **`glintz-hotel-photos`**
4. Go to **"Settings"** tab
5. Under **"Public access"**, click **"Allow Access"**
6. Choose: **"r2.dev subdomain"** (free option)
7. Click **"Allow Access"**

You'll get a URL like:
```
https://pub-xxxxx.r2.dev
```

## 📝 Update Sync Script

Once you have the public URL, update this line in `sync-dropbox-to-r2.js`:

```javascript
const R2_PUBLIC_URL = 'https://pub-xxxxx.r2.dev'; // Your actual URL
```

## 🚀 Run the Sync

### Test Run (Dry Run - No Uploads)
```bash
cd api
node sync-dropbox-to-r2.js --dry-run
```

### Actual Sync (Uploads Photos)
```bash
cd api
node sync-dropbox-to-r2.js
```

## 📊 What the Sync Does

1. Fetches all active partners from Partners API
2. Lists photos in each partner's Dropbox folder
3. Downloads photos from Dropbox
4. Uploads to R2 with structure: `partners/{partner-id}/{index}-{filename}`
5. Returns R2 URLs for each photo

## 📁 R2 Folder Structure

```
glintz-hotel-photos/
├── partners/
│   ├── 595a0ff2-c12e-4ca5-b98c-55665ee70033/  (Locanda al Colle)
│   │   ├── 001-_DSC6550.jpg
│   │   ├── 002-Locanda_al-Colle_Exteriors_11.png
│   │   └── ...
│   ├── 845efd99-082f-44ec-9c29-b651f0b10be9/  (Eremito)
│   │   └── ...
│   └── ...
```

## 🔄 After Sync

The sync script will create a JSON file with all R2 URLs:
- `sync-results-{timestamp}.json`

You can use this to:
1. Update your database with R2 URLs
2. Update the app to use R2 URLs instead of Dropbox
3. Set up automated sync (daily/weekly)

## ⚙️ Automated Sync (Optional)

You can set up a cron job or scheduled task to run sync daily:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/api && node sync-dropbox-to-r2.js
```

Or use Railway/Heroku scheduler, GitHub Actions, etc.

## 💰 Cost Estimate

**Cloudflare R2 Pricing:**
- Storage: $0.015/GB/month
- Egress: **FREE** (unlimited!)
- Operations: $4.50/million Class A, $0.36/million Class B

**For 200 hotels with ~10 photos each (avg 2MB):**
- Storage: ~4GB = **$0.06/month**
- Bandwidth: **FREE**
- Total: **~$0.10/month** for serving unlimited traffic!

## 🎯 Next Steps

1. Get your public R2 URL from Cloudflare dashboard
2. Update `R2_PUBLIC_URL` in sync script
3. Run `node sync-dropbox-to-r2.js --dry-run` to test
4. Run `node sync-dropbox-to-r2.js` to sync all photos
5. Update app to use R2 URLs (I'll help with this)

