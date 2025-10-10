# Production-Ready OTP Authentication Setup Guide

This guide will help you set up the production-ready OTP authentication system with email integration.

## 🎯 Overview

The Glintz authentication system now includes:
- **Secure OTP Generation**: Cryptographically secure 6-digit codes
- **Email Delivery**: Professional emails via MailerSend
- **JWT Authentication**: 30-day secure tokens
- **Rate Limiting**: Protection against abuse
- **Comprehensive Logging**: Full audit trail
- **Database Storage**: Supabase-based persistence

---

## 📋 Prerequisites

1. **Supabase Account** - Already configured
2. **MailerSend Account** - Free tier (3,000 emails/month)
3. **Node.js 18+** - Required for API server
4. **PostgreSQL Database** - Via Supabase

---

## 🚀 Step 1: Database Setup

### Run the Database Schema

1. Open your Supabase Dashboard: https://app.supabase.com
2. Go to **SQL Editor**
3. Copy and paste the contents of `/api/database-schema.sql`
4. Click **Run** to create all tables

### Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('users', 'otp_codes', 'user_preferences', 'user_interactions', 'user_saved_hotels');
```

You should see all 5 tables listed.

---

## 📧 Step 2: MailerSend Setup

### Create MailerSend Account

1. Go to https://www.mailersend.com/
2. Click **"Sign Up Free"**
3. Verify your email address

### Get Your API Key

1. Log in to MailerSend Dashboard
2. Go to **Settings** → **API Tokens**
3. Click **"Generate New Token"**
4. Give it a name: `Glintz Production`
5. Copy the API key (save it securely!)

### Verify Your Sending Domain (Recommended)

For best deliverability:

1. Go to **Domains** in MailerSend
2. Click **"Add Domain"**
3. Enter your domain (e.g., `glintz.com`)
4. Follow the DNS setup instructions
5. Wait for verification (usually 5-30 minutes)

**Alternatively**, you can use MailerSend's shared domain for testing:
- From address: `noreply@trial.mailersend.com`
- No verification needed, but limited to 100 emails

---

## ⚙️ Step 3: Environment Configuration

### Update Your `.env` File

Open `/api/.env` and add/update these variables:

```bash
# ==================== AUTHENTICATION CONFIG ====================

# JWT Secret (IMPORTANT: Generate a strong secret for production!)
# Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ==================== EMAIL SERVICE (MailerSend) ====================

# MailerSend API Key
MAILERSEND_API_KEY=your_mailersend_api_key_here

# Email "From" Configuration
FROM_EMAIL=noreply@glintz.com
FROM_NAME=Glintz Travel

# For development/testing without MailerSend:
# Leave MAILERSEND_API_KEY empty and emails will be logged to console

# ==================== SUPABASE (Already Configured) ====================

SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Generate Strong JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as your `JWT_SECRET` value.

---

## 🔧 Step 4: Install Dependencies

The authentication services use these packages (already in package.json):

```bash
cd api
npm install
```

Key packages:
- `jsonwebtoken` - JWT token generation
- `axios` - HTTP client for MailerSend API
- `crypto` - Secure random number generation

---

## 🧪 Step 5: Test the Setup

### Test 1: Database Connection

Start your API server:

```bash
cd api
npm run dev
```

Check the startup logs for:
```
✅ Supabase service initialized
```

### Test 2: Email Service Configuration

Test email sending:

```bash
curl -X POST http://localhost:3001/api/auth/test-email
```

Expected response:
```json
{
  "success": true,
  "message": "Email service configured correctly"
}
```

### Test 3: Request OTP

Request an OTP code for your email:

```bash
curl -X POST http://localhost:3001/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

Check your email inbox for the OTP code!

### Test 4: Verify OTP

Use the code you received:

```bash
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "code": "123456"}'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "your-email@example.com",
    "name": null,
    "created_at": "2024-01-01T00:00:00Z",
    "last_login_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here",
  "message": "Authentication successful"
}
```

### Test 5: Verify Token

Use the JWT token you received:

```bash
curl -X GET http://localhost:3001/api/auth/verify-token \
  -H "Authorization: Bearer your-jwt-token-here"
```

Expected response:
```json
{
  "valid": true,
  "user": {
    "id": "uuid-here",
    "email": "your-email@example.com",
    "name": null
  }
}
```

---

## 📱 Step 6: Update Mobile App (Optional)

The mobile app should already work with the new endpoints, but verify the API client is configured correctly.

Check `/app/src/api/client.ts`:
- `requestOTP()` method points to `/api/auth/request-otp`
- `verifyOTP()` method points to `/api/auth/verify-otp`
- Auth tokens are stored and sent correctly

---

## 📊 Monitoring & Administration

### View OTP Statistics

```bash
curl http://localhost:3001/api/auth/otp-stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalActive": 3,
    "totalExpired": 12,
    "recentCreated": 5
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Clean Up Expired OTP Codes

Expired codes are automatically handled, but you can manually clean them:

```sql
-- Run in Supabase SQL Editor
SELECT cleanup_expired_otp_codes();
```

### View Recent Users

```sql
SELECT id, email, name, created_at, last_login_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 Security Features

✅ **Rate Limiting**
- Max 5 OTP requests per 15 minutes per IP
- Max 3 OTP codes per email per hour
- Max 5 verification attempts per code

✅ **Code Expiration**
- OTP codes expire after 10 minutes
- Used codes are immediately invalidated

✅ **JWT Security**
- 30-day token expiration
- Cryptographically signed tokens
- Secure random JWT secrets

✅ **Email Validation**
- Format validation
- Lowercase normalization
- SQL injection protection

✅ **Comprehensive Logging**
- All authentication attempts logged
- Failed attempts tracked
- Security audit trail

---

## 🐛 Troubleshooting

### Problem: "MAILERSEND_API_KEY not configured"

**Solution**: The system works in dev mode without MailerSend. OTP codes will be logged to console instead of sent via email. For production, add your MailerSend API key to `.env`.

### Problem: "Failed to send verification email"

**Solutions**:
1. Check MailerSend API key is correct
2. Verify domain in MailerSend dashboard
3. Check MailerSend account isn't suspended
4. Look at API server logs for detailed error

### Problem: "No valid OTP found"

**Solutions**:
1. OTP may have expired (10 minutes)
2. Check email for the most recent code
3. Request a new OTP code
4. Check database for OTP records: `SELECT * FROM otp_codes WHERE email = 'your-email' ORDER BY created_at DESC;`

### Problem: "Maximum verification attempts exceeded"

**Solution**: The OTP code has been locked after 5 failed attempts. Request a new OTP code.

### Problem: "Token has expired"

**Solution**: The JWT token expires after 30 days. User needs to log in again.

---

## 📈 Production Deployment

### Environment Variables Checklist

- [ ] `JWT_SECRET` - Strong random secret (64+ characters)
- [ ] `MAILERSEND_API_KEY` - Valid MailerSend API key
- [ ] `FROM_EMAIL` - Verified sender email
- [ ] `FROM_NAME` - Your app name
- [ ] `SUPABASE_URL` - Production Supabase URL
- [ ] `SUPABASE_ANON_KEY` - Production Supabase key

### Security Checklist

- [ ] Database has all required tables
- [ ] JWT secret is strong and unique
- [ ] Sending domain is verified in MailerSend
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced on API server
- [ ] Environment variables are not committed to git
- [ ] Error messages don't expose sensitive info

---

## 📞 Support

### MailerSend Resources

- Dashboard: https://app.mailersend.com
- Documentation: https://developers.mailersend.com
- Free tier: 3,000 emails/month
- Support: support@mailersend.com

### Supabase Resources

- Dashboard: https://app.supabase.com
- Documentation: https://supabase.com/docs
- SQL Editor: Database → SQL Editor
- Support: support@supabase.com

---

## ✅ Success Checklist

You're ready for production when:

- [x] Database schema is deployed
- [x] MailerSend account is configured
- [x] Domain is verified (or using trial domain)
- [x] Environment variables are set
- [x] JWT secret is strong and unique
- [x] All tests pass successfully
- [x] OTP emails are being received
- [x] Tokens are being generated correctly
- [x] Rate limiting is working
- [x] Logs show proper authentication flow

---

## 🎉 You're All Set!

Your production-ready OTP authentication system is now configured and ready to use!

**Key Features:**
- 🔐 Secure OTP authentication
- 📧 Professional email delivery
- 🔑 JWT token management
- 🛡️ Rate limiting & security
- 📊 Comprehensive logging
- 🗄️ Database persistence

**Next Steps:**
1. Test the full authentication flow
2. Monitor OTP statistics
3. Set up automated cleanup jobs (optional)
4. Configure custom email templates (optional)
5. Deploy to production! 🚀

