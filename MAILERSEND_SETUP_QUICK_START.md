# MailerSend Quick Start Guide - 5 Minutes Setup ⚡

Get your OTP emails working in 5 minutes with MailerSend's FREE tier (3,000 emails/month).

---

## 🎯 Why MailerSend?

| Feature | MailerSend | Resend |
|---------|-----------|--------|
| **Free Tier** | 3,000 emails/month | 100 emails/month |
| **Setup Time** | 5 minutes | 5 minutes |
| **Deliverability** | Excellent | Good |
| **Dashboard** | Full-featured | Basic |
| **Cost** | FREE → $25/mo | FREE → $20/mo |

**Winner**: MailerSend (30x more free emails!)

---

## ⚡ 5-Minute Setup

### Step 1: Create Account (2 minutes)

1. Go to **https://www.mailersend.com/**
2. Click **"Sign Up Free"**
3. Enter your email and password
4. Verify your email (check inbox)

### Step 2: Get API Key (1 minute)

1. Log in to MailerSend Dashboard
2. Click **Settings** (gear icon) → **API Tokens**
3. Click **"Generate New Token"**
4. Name it: `Glintz Production`
5. Select scope: **Full access**
6. Click **"Generate"**
7. **COPY THE KEY** (you won't see it again!)

### Step 3: Configure Environment (1 minute)

Open `/api/.env` and add:

```bash
# MailerSend Configuration
MAILERSEND_API_KEY=mlsn.1234567890abcdef1234567890abcdef1234567890
FROM_EMAIL=noreply@trial.mailersend.com
FROM_NAME=Glintz Travel
```

> **Note**: Using `@trial.mailersend.com` lets you send emails immediately without domain verification. Perfect for getting started!

### Step 4: Test It! (1 minute)

```bash
# Start your API server
cd api
npm run dev

# In another terminal, test email
curl -X POST http://localhost:3001/api/auth/test-email
```

✅ Should return: `{"success": true, "message": "Email service configured correctly"}`

### Step 5: Try Full OTP Flow (30 seconds)

```bash
# Request OTP
curl -X POST http://localhost:3001/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'

# Check your inbox for the OTP code!
```

🎉 **You're done!** Check your email for a beautiful OTP code.

---

## 🎨 What Your Users Will See

### OTP Email Preview

```
┌──────────────────────────────────────┐
│        ✈️ Glintz                     │
│                                       │
│  Your verification code is:          │
│                                       │
│  ┌─────────────────────────────┐    │
│  │        1 2 3 4 5 6          │    │
│  └─────────────────────────────┘    │
│                                       │
│  Enter this code in the app to       │
│  complete your login.                │
│                                       │
│  ┌───────────────────────────────┐  │
│  │ ⏰ This code expires in 10 min │  │
│  │ 🔒 Never share this code      │  │
│  └───────────────────────────────┘  │
│                                       │
│  Happy travels! 🌍                   │
└──────────────────────────────────────┘
```

Professional, beautiful, and mobile-optimized!

---

## 🚀 Advanced Setup (Optional)

### Verify Your Own Domain (Better Deliverability)

For production, verify your own domain:

1. Go to **Domains** in MailerSend
2. Click **"Add Domain"**
3. Enter your domain: `glintz.com`
4. Add these DNS records:

   ```
   Type: TXT
   Name: @
   Value: [MailerSend will provide]

   Type: CNAME
   Name: _mailersend
   Value: [MailerSend will provide]
   ```

5. Wait 5-30 minutes for verification
6. Update `.env`:
   ```bash
   FROM_EMAIL=noreply@glintz.com
   ```

✅ **Benefits**:
- Better email deliverability
- Professional sender address
- Full branding control
- Higher sending limits

---

## 📊 Monitor Your Emails

### MailerSend Dashboard

View real-time stats:
- **Sent**: Total emails sent
- **Delivered**: Successfully delivered
- **Opened**: User opened the email
- **Bounced**: Failed deliveries
- **Complaints**: Spam reports

### API Statistics

Check OTP usage:

```bash
curl http://localhost:3001/api/auth/otp-stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalActive": 5,
    "totalExpired": 23,
    "recentCreated": 8
  }
}
```

---

## 💰 Pricing & Limits

### Free Tier
- **3,000 emails/month** (100/day)
- Full API access
- Email analytics
- 99.9% uptime SLA
- Perfect for MVP & testing

### Paid Plans (if you grow)
- **Essential**: $25/mo → 50,000 emails
- **Advanced**: $85/mo → 100,000 emails
- **Enterprise**: Custom pricing

**For context**: 3,000 emails/month = ~100 user signups/day 🚀

---

## 🛡️ Security Best Practices

✅ **Keep API Key Secret**
- Never commit to git
- Use environment variables
- Rotate keys regularly

✅ **Monitor for Abuse**
- Check dashboard daily
- Watch for spam complaints
- Set up alerts

✅ **Rate Limiting**
- Already implemented (5 OTP/15min)
- Prevents abuse
- Protects your quota

---

## 🐛 Common Issues

### "Email not received"

1. **Check spam folder** (most common!)
2. Verify API key is correct
3. Check MailerSend dashboard for delivery status
4. Try different email address

### "API key invalid"

1. Copy the key again (no extra spaces)
2. Verify key has full access scope
3. Key might be expired - generate new one

### "Domain not verified"

Using `@trial.mailersend.com`? Should work immediately.
Using your domain? Wait 30 min for DNS propagation.

### "Quota exceeded"

Free tier = 3,000/month. Check dashboard:
- **Domains** → **Usage**
- Reset on 1st of each month
- Upgrade if needed

---

## 🎓 Resources

### MailerSend
- **Dashboard**: https://app.mailersend.com
- **Documentation**: https://developers.mailersend.com
- **Status Page**: https://status.mailersend.com
- **Support**: support@mailersend.com

### Alternative Email Services

If you need more emails/month:

| Service | Free Tier | Best For |
|---------|-----------|----------|
| **MailerSend** | 3,000/mo | MVP & small apps |
| **SendGrid** | 100/day | Mid-size apps |
| **Amazon SES** | 62,000/mo* | Large scale |
| **Mailgun** | 100/day | Developers |

*\*With AWS Free Tier*

---

## ✅ Verification Checklist

You're ready when:

- [ ] MailerSend account created
- [ ] API key generated and saved
- [ ] `.env` file updated
- [ ] Test email successful
- [ ] OTP email received in inbox
- [ ] Full authentication flow tested
- [ ] Emails look great on mobile
- [ ] Dashboard shows sent emails

---

## 🎉 Success!

Your production-ready email system is configured!

**What you now have:**
- ✅ Beautiful, professional OTP emails
- ✅ 3,000 free emails per month
- ✅ Real-time delivery tracking
- ✅ 99.9% uptime guarantee
- ✅ Spam-compliant sending
- ✅ Mobile-optimized design

**Start sending OTP emails in production!** 🚀

---

## 📞 Need Help?

- **MailerSend Support**: support@mailersend.com
- **Documentation**: https://developers.mailersend.com
- **Community**: https://community.mailersend.com

Happy sending! 📧✨

