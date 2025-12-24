import crypto from 'crypto';
import { supabase } from '../supabase';

/**
 * OTP Service - Production-ready OTP generation, storage, and verification
 * 
 * Features:
 * - Secure random 6-digit code generation
 * - Database storage with expiration (10 minutes)
 * - Rate limiting (max 5 attempts per code)
 * - Automatic cleanup of expired codes
 * - Comprehensive logging
 */

export interface OTPRecord {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  attempts: number;
  created_at: string;
}

export class OTPService {
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly MAX_CODES_PER_EMAIL_PER_HOUR = 5; // Production-ready rate limit
  private readonly MIN_SECONDS_BETWEEN_REQUESTS = 60; // Minimum 60 seconds between OTP requests

  /**
   * Generate a cryptographically secure random 6-digit OTP code
   */
  generateCode(): string {
    // Use crypto.randomInt for cryptographically secure random numbers
    const code = crypto.randomInt(100000, 999999).toString();
    console.log('🔐 Generated new OTP code (length:', code.length, ')');
    return code;
  }

  /**
   * Create and store a new OTP code for an email address
   * Includes rate limiting to prevent abuse (disabled in development)
   */
  async createOTP(email: string): Promise<{ success: boolean; message?: string; error?: string; code?: string; waitSeconds?: number }> {
    try {
      console.log('📧 Creating OTP for email:', email);

      // Skip rate limiting in development mode
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      
      console.log('🔍 OTP Service - Environment check:');
      console.log('   NODE_ENV:', process.env.NODE_ENV || '(not set)');
      console.log('   isDevelopment:', isDevelopment);
      
      if (isDevelopment) {
        console.log('🔓 Development mode: OTP rate limiting DISABLED - skipping all checks');
      } else {
        console.log('🔒 Production mode: OTP rate limiting ENABLED');
      }
      
      if (!isDevelopment) {
        // PRODUCTION: Check minimum time between requests (last request within 60 seconds)
        const minSecondsAgo = new Date(Date.now() - this.MIN_SECONDS_BETWEEN_REQUESTS * 1000).toISOString();
        const { data: veryRecentCodes, error: recentError } = await supabase
          .from('otp_codes')
          .select('created_at')
          .eq('email', email.toLowerCase())
          .gte('created_at', minSecondsAgo)
          .order('created_at', { ascending: false })
          .limit(1);

        if (recentError) {
          console.error('❌ Error checking recent requests:', recentError);
          throw recentError;
        }

        if (veryRecentCodes && veryRecentCodes.length > 0) {
          const lastRequest = new Date(veryRecentCodes[0].created_at);
          const timeSinceLastRequest = Math.floor((Date.now() - lastRequest.getTime()) / 1000);
          const waitSeconds = this.MIN_SECONDS_BETWEEN_REQUESTS - timeSinceLastRequest;
          
          console.warn('⚠️  Too soon to request another code for email:', email);
          console.warn('⚠️  Wait', waitSeconds, 'more seconds');
          
          return {
            success: false,
            error: `Please wait ${waitSeconds} seconds before requesting another code.`,
            waitSeconds
          };
        }

        // PRODUCTION: Check hourly rate limiting
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentCodes, error: countError } = await supabase
          .from('otp_codes')
          .select('id')
          .eq('email', email.toLowerCase())
          .gte('created_at', oneHourAgo);

        if (countError) {
          console.error('❌ Error checking rate limit:', countError);
          throw countError;
        }

        if (recentCodes && recentCodes.length >= this.MAX_CODES_PER_EMAIL_PER_HOUR) {
          console.warn('⚠️  Hourly rate limit exceeded for email:', email);
          return {
            success: false,
            error: 'Too many OTP requests. Please try again in an hour.'
          };
        }
      } else {
        console.log('🔓 Development mode: Rate limiting disabled');
      }

      // Invalidate any existing active codes for this email
      const { error: invalidateError } = await supabase
        .from('otp_codes')
        .update({ expires_at: new Date().toISOString() })
        .eq('email', email)
        .gt('expires_at', new Date().toISOString());

      if (invalidateError) {
        console.error('❌ Error invalidating old codes:', invalidateError);
      }

      // Generate new code
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      // Store in database
      const { data, error: insertError } = await supabase
        .from('otp_codes')
        .insert({
          email: email.toLowerCase(),
          code,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error storing OTP code:', insertError);
        throw insertError;
      }

      console.log('✅ OTP code created and stored successfully');
      console.log('   Email:', email);
      console.log('   Expires at:', expiresAt.toISOString());
      console.log('   Code ID:', data.id);

      return {
        success: true,
        message: 'OTP code generated successfully',
        code: code
      };
    } catch (error) {
      console.error('❌ Failed to create OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create OTP'
      };
    }
  }

  /**
   * Verify an OTP code for an email address
   * Includes attempt limiting and expiration checking
   */
  async verifyOTP(email: string, code: string): Promise<{ 
    success: boolean; 
    message?: string; 
    error?: string;
    attemptsRemaining?: number;
  }> {
    try {
      console.log('🔍 Verifying OTP for email:', email);

      // Find the most recent valid OTP for this email
      const { data: otpRecords, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('❌ Error fetching OTP:', fetchError);
        throw fetchError;
      }

      if (!otpRecords || otpRecords.length === 0) {
        console.warn('⚠️  No valid OTP found for email:', email);
        return {
          success: false,
          error: 'No valid OTP found. Please request a new code.'
        };
      }

      const otpRecord = otpRecords[0] as OTPRecord;

      // Check if max attempts exceeded
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        console.warn('⚠️  Max attempts exceeded for OTP:', otpRecord.id);
        // Expire the code
        await supabase
          .from('otp_codes')
          .update({ expires_at: new Date().toISOString() })
          .eq('id', otpRecord.id);

        return {
          success: false,
          error: 'Maximum verification attempts exceeded. Please request a new code.'
        };
      }

      // Increment attempt counter
      const newAttempts = otpRecord.attempts + 1;
      await supabase
        .from('otp_codes')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);

      // Verify the code
      console.log('🔍 Comparing codes:');
      console.log('   Stored code:', otpRecord.code);
      console.log('   Provided code:', code);
      console.log('   Codes match:', otpRecord.code === code);
      
      if (otpRecord.code !== code) {
        console.warn('⚠️  Invalid OTP code provided for email:', email);
        const attemptsRemaining = this.MAX_ATTEMPTS - newAttempts;
        return {
          success: false,
          error: `Invalid OTP code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
          attemptsRemaining
        };
      }

      // Success! Expire the code so it can't be reused
      await supabase
        .from('otp_codes')
        .update({ expires_at: new Date().toISOString() })
        .eq('id', otpRecord.id);

      console.log('✅ OTP verified successfully for email:', email);
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('❌ Failed to verify OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP'
      };
    }
  }

  /**
   * Clean up expired OTP codes (should be run periodically)
   */
  async cleanupExpiredCodes(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired OTP codes...');
      const { data, error } = await supabase
        .from('otp_codes')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        console.error('❌ Error cleaning up expired codes:', error);
        throw error;
      }

      console.log(`✅ Cleaned up ${data?.length || 0} expired OTP codes`);
    } catch (error) {
      console.error('❌ Failed to cleanup expired codes:', error);
    }
  }

  /**
   * Get OTP statistics for monitoring
   */
  async getOTPStats(): Promise<{
    totalActive: number;
    totalExpired: number;
    recentCreated: number;
  }> {
    try {
      const now = new Date().toISOString();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Count active codes
      const { count: activeCount } = await supabase
        .from('otp_codes')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', now);

      // Count expired codes
      const { count: expiredCount } = await supabase
        .from('otp_codes')
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', now);

      // Count recent codes (last hour)
      const { count: recentCount } = await supabase
        .from('otp_codes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      return {
        totalActive: activeCount || 0,
        totalExpired: expiredCount || 0,
        recentCreated: recentCount || 0
      };
    } catch (error) {
      console.error('❌ Failed to get OTP stats:', error);
      return {
        totalActive: 0,
        totalExpired: 0,
        recentCreated: 0
      };
    }
  }
}

export const otpService = new OTPService();

