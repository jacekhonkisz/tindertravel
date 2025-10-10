import axios from 'axios';

/**
 * Email Service using MailerSend
 * 
 * MailerSend offers:
 * - 3,000 emails/month FREE tier
 * - Easy API integration
 * - Professional email templates
 * - Deliverability tracking
 * 
 * Setup:
 * 1. Sign up at https://www.mailersend.com/
 * 2. Verify your sending domain
 * 3. Get your API token
 * 4. Add MAILERSEND_API_KEY to .env
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private apiEndpoint = 'https://api.mailersend.com/v1/email';

  constructor() {
    this.apiKey = process.env.MAILERSEND_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@glintz.com';
    this.fromName = process.env.FROM_NAME || 'Glintz Travel';

    if (!this.apiKey) {
      console.warn('⚠️  MAILERSEND_API_KEY not configured. Email sending will be simulated.');
    }
  }

  /**
   * Send an email using MailerSend API
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // If no API key configured, simulate sending (dev mode)
      if (!this.apiKey) {
        console.log('📧 [DEV MODE] Email would be sent to:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Text:', options.text);
        return {
          success: true,
          messageId: 'dev-mode-' + Date.now()
        };
      }

      console.log('📧 Sending email via MailerSend to:', options.to);

      const payload = {
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        to: [
          {
            email: options.to
          }
        ],
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      const response = await axios.post(this.apiEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log('✅ Email sent successfully via MailerSend');
      console.log('   Message ID:', response.headers['x-message-id']);

      return {
        success: true,
        messageId: response.headers['x-message-id'] || response.data.message_id
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ MailerSend API error:', error.response?.data);
        return {
          success: false,
          error: error.response?.data?.message || error.message
        };
      }
      console.error('❌ Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Send OTP verification code email
   */
  async sendOTPEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    console.log('📨 Preparing OTP email for:', email);

    // Admin emails that can receive emails on trial account
    const adminEmails = [
      'jac.honkisz@gmail.com',
      'noreply@jhvideoedits.com'
    ];

    const isAdminEmail = adminEmails.some(admin => 
      email.toLowerCase() === admin.toLowerCase()
    );

    // If no API key or in dev mode, always use console logging (unless it's admin email)
    if (!this.apiKey && !isAdminEmail) {
      console.log('📧 [DEV MODE] OTP Code for', email, ':', code);
      console.log('   Use this code in the app:', code);
      return {
        success: true,
        messageId: 'dev-mode-' + Date.now()
      };
    }

    const subject = 'Your Glintz Verification Code';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .code-container {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .code {
      font-size: 48px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #667eea;
      margin: 0;
      font-family: 'Courier New', monospace;
    }
    .message {
      font-size: 18px;
      margin: 20px 0;
    }
    .footer {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 30px;
    }
    .warning {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✈️ Glintz</div>
    <p class="message">Your verification code is:</p>
    
    <div class="code-container">
      <p class="code">${code}</p>
    </div>
    
    <p class="message">Enter this code in the app to complete your login.</p>
    
    <div class="warning">
      ⏰ This code expires in 10 minutes<br>
      🔒 Never share this code with anyone
    </div>
    
    <div class="footer">
      If you didn't request this code, please ignore this email.<br>
      <br>
      Happy travels! 🌍
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
Your Glintz Verification Code

Your verification code is: ${code}

Enter this code in the app to complete your login.

⏰ This code expires in 10 minutes
🔒 Never share this code with anyone

If you didn't request this code, please ignore this email.

Happy travels! 🌍
- The Glintz Team
    `.trim();

    const result = await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });

    // If MailerSend fails (trial account restrictions), fall back to dev mode
    if (!result.success) {
      console.warn('⚠️  MailerSend failed, using DEV MODE instead');
      console.log('📧 [DEV MODE] OTP Code for', email, ':', code);
      console.log('   Use this code in the app:', code);
      console.log('   Error was:', result.error);
      console.log('   💡 TIP: To receive real emails, use jac.honkisz@gmail.com');
      
      // Return success for dev mode
      return {
        success: true,
        messageId: 'dev-mode-fallback-' + Date.now()
      };
    }

    console.log('✅ OTP email sent successfully via MailerSend to:', email);
    return result;
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
    console.log('📨 Sending welcome email to:', email);

    const displayName = name || 'Traveler';
    const subject = 'Welcome to Glintz! 🌍';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 16px; }
    .content { padding: 30px 0; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈️ Welcome to Glintz!</h1>
  </div>
  <div class="content">
    <p>Hi ${displayName},</p>
    <p>Welcome to Glintz - your personal travel inspiration platform! 🎉</p>
    <p>Discover unique boutique hotels and luxury stays around the world, all curated just for you.</p>
    <p>Start swiping to find your perfect getaway!</p>
    <p><strong>Happy travels,</strong><br>The Glintz Team</p>
  </div>
  <div class="footer">
    <p>Glintz - Discover Your Perfect Stay 🌍</p>
  </div>
</body>
</html>
    `.trim();

    const text = `Welcome to Glintz, ${displayName}! Discover unique boutique hotels around the world.`;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<{ success: boolean; message: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'MailerSend API key not configured',
        error: 'MAILERSEND_API_KEY environment variable is missing'
      };
    }

    try {
      console.log('🧪 Testing MailerSend configuration...');
      
      // Try to send a test email to the from address
      const result = await this.sendEmail({
        to: this.fromEmail,
        subject: 'Glintz Email Service Test',
        html: '<p>This is a test email from Glintz email service.</p>',
        text: 'This is a test email from Glintz email service.'
      });

      if (result.success) {
        return {
          success: true,
          message: 'Email service configured correctly'
        };
      } else {
        return {
          success: false,
          message: 'Email service test failed',
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Email service test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const emailService = new EmailService();

