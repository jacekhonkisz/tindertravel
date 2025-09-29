# Glintz Travel App - Passwordless Authentication

This document describes the passwordless authentication system implemented for the Glintz travel app.

## Overview

The app uses a secure, passwordless authentication system based on:
- **OTP (One-Time Password)** codes sent via email
- **JWT tokens** for persistent authentication
- **Automatic login persistence** - users stay logged in until they manually logout

## Features

✅ **Passwordless Login**: Users only need their email address  
✅ **OTP Verification**: 6-digit codes sent via email  
✅ **Persistent Sessions**: Users stay logged in across app restarts  
✅ **Secure JWT Tokens**: 30-day expiration with automatic validation  
✅ **Beautiful UI**: Modern gradient design with smooth animations  
✅ **Rate Limiting**: Protection against spam and abuse  
✅ **Auto-focus**: Seamless OTP input experience  

## User Flow

1. **Email Entry**: User enters their email address
2. **OTP Request**: System sends 6-digit code to email
3. **Code Verification**: User enters the code in the app
4. **Automatic Login**: User is authenticated and can use the app
5. **Persistent Session**: User stays logged in until manual logout

## Technical Implementation

### Frontend (React Native)
- **Login Screen**: Email input with validation
- **OTP Screen**: 6-digit code input with auto-focus
- **State Management**: Zustand store with persistent auth state
- **API Integration**: Axios client with automatic token management

### Backend (Node.js + Express)
- **OTP Generation**: Secure 6-digit random codes
- **Email Service**: Nodemailer with HTML templates
- **JWT Tokens**: 30-day expiration with secure signing
- **Database**: Supabase with users and otp_codes tables
- **Rate Limiting**: Protection against abuse

### Database Schema

#### Users Table
```sql
- id: UUID (primary key)
- email: VARCHAR(255) (unique)
- name: VARCHAR(255) (optional)
- created_at: TIMESTAMP
- last_login_at: TIMESTAMP
```

#### OTP Codes Table
```sql
- id: UUID (primary key)
- email: VARCHAR(255)
- code: VARCHAR(6)
- expires_at: TIMESTAMP
- attempts: INTEGER
- created_at: TIMESTAMP
```

## API Endpoints

### POST /api/auth/request-otp
Request an OTP code for email authentication.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

### POST /api/auth/verify-otp
Verify OTP code and authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here",
  "message": "Successfully authenticated"
}
```

### GET /api/auth/verify-token
Verify if JWT token is still valid.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Environment Variables

### API (.env)
```env
# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration (optional - will log to console if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Glintz <noreply@glintz.com>

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Security Features

- **Rate Limiting**: Prevents spam and brute force attacks
- **OTP Expiration**: Codes expire after 10 minutes
- **Attempt Limiting**: Max 5 attempts per OTP code
- **JWT Expiration**: Tokens expire after 30 days
- **Secure Storage**: Tokens stored securely in AsyncStorage
- **Input Validation**: Email format and code validation
- **HTTPS Only**: All API calls use secure connections

## Development Setup

1. **Install Dependencies**:
   ```bash
   cd api && npm install
   cd ../app && npm install
   ```

2. **Setup Database**:
   - Run the SQL functions in `api/auth-tables.sql` in your Supabase dashboard
   - Or they will be created automatically when the API starts

3. **Configure Environment**:
   - Copy `.env.example` to `.env` in the `api` directory
   - Fill in your Supabase and email credentials

4. **Start Development**:
   ```bash
   # Start API
   cd api && npm run dev
   
   # Start App
   cd app && npm start
   ```

## Testing the Authentication

### Quick Test with Test Account
1. **Start the app** and you'll see the login screen
2. **Enter email**: `test@glintz.io`
3. **Tap "Send Verification Code"**
4. **Enter OTP code**: `123456` (permanent test code)
5. **You're logged in!** Test persistence by closing and reopening the app
6. **Test logout** by tapping the logout button in the profile screen

### Test with Your Own Email
1. **Start the app** and you'll see the login screen
2. **Enter your email** and tap "Send Verification Code"
3. **Check your email** for the 6-digit code (or console logs in development)
4. **Enter the code** and you'll be automatically logged in
5. **Test persistence** by closing and reopening the app
6. **Test logout** by tapping the logout button in the profile screen

### Test Account Details
- **Email**: `test@glintz.io`
- **OTP Code**: `123456` (permanent, never expires)
- **Features**: No rate limiting, no expiration, unlimited attempts
- **Purpose**: Development and testing only

## Production Considerations

- [ ] Set up proper SMTP service (SendGrid, AWS SES, etc.)
- [ ] Use strong JWT secret (generate with `openssl rand -base64 32`)
- [ ] Enable HTTPS for all API endpoints
- [ ] Set up proper error monitoring (Sentry, etc.)
- [ ] Configure rate limiting based on production needs
- [ ] Set up email templates with proper branding
- [ ] Add user profile management features
- [ ] Implement password reset flow (if needed)

## Troubleshooting

### OTP Not Received
- Check spam folder
- Verify SMTP configuration
- Check API logs for email sending errors
- In development, codes are logged to console

### Token Expired
- Tokens expire after 30 days
- User will be automatically logged out
- Simply login again to get a new token

### API Connection Issues
- Verify API is running on correct port
- Check network connectivity
- Verify API base URL in app configuration

---

**Note**: This authentication system is designed for simplicity and security. It eliminates the need for users to remember passwords while maintaining strong security through email verification and JWT tokens. 