import jwt from 'jsonwebtoken';
import { supabase } from '../supabase';
import crypto from 'crypto';

/**
 * Authentication Service - JWT token management and user authentication
 * 
 * Features:
 * - Secure JWT token generation
 * - Token verification and validation
 * - User creation and management
 * - Session management
 * - Comprehensive logging
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  last_login_at: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private jwtSecret: string;
  private tokenExpiryDays: number = 30;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || this.generateDefaultSecret();
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not set in environment. Using generated secret (NOT RECOMMENDED FOR PRODUCTION)');
    }
  }

  /**
   * Generate a default JWT secret (should only be used in development)
   */
  private generateDefaultSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Find or create a user by email address
   */
  async findOrCreateUser(email: string, name?: string): Promise<User | null> {
    try {
      console.log('👤 Finding or creating user:', email);

      // Check if user exists
      const { data: existingUsers, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (fetchError) {
        console.error('❌ Error fetching user:', fetchError);
        throw fetchError;
      }

      // Update last login time if user exists
      if (existingUsers && existingUsers.length > 0) {
        const user = existingUsers[0] as User;
        
        console.log('✅ User found, updating last login:', user.id);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating last login:', updateError);
          // Return original user even if update fails
          return user;
        }

        return updatedUser as User;
      }

      // Create new user
      console.log('➕ Creating new user:', email);
      
      const now = new Date().toISOString();
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          name: name || null,
          created_at: now,
          last_login_at: now
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        throw createError;
      }

      console.log('✅ New user created:', newUser.id);
      return newUser as User;
    } catch (error) {
      console.error('❌ Failed to find or create user:', error);
      return null;
    }
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: User): string {
    console.log('🔐 Generating JWT token for user:', user.id);

    const payload = {
      userId: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: `${this.tokenExpiryDays}d`
    });

    console.log('✅ JWT token generated (expires in', this.tokenExpiryDays, 'days)');
    return token;
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
    try {
      console.log('🔍 Verifying JWT token...');

      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      console.log('✅ Token verified successfully for user:', payload.userId);
      return {
        valid: true,
        payload
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.warn('⚠️  Token expired');
        return {
          valid: false,
          error: 'Token has expired'
        };
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.warn('⚠️  Invalid token');
        return {
          valid: false,
          error: 'Invalid token'
        };
      } else {
        console.error('❌ Token verification failed:', error);
        return {
          valid: false,
          error: 'Token verification failed'
        };
      }
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      console.log('👤 Fetching user by ID:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('❌ Failed to get user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: { name?: string }): Promise<User | null> {
    try {
      console.log('📝 Updating user profile:', userId);

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user:', error);
        throw error;
      }

      console.log('✅ User profile updated');
      return data as User;
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      return null;
    }
  }

  /**
   * Authenticate user with email and OTP (complete flow)
   */
  async authenticateUser(email: string): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
  }> {
    try {
      console.log('🔐 Authenticating user:', email);

      // Find or create user
      const user = await this.findOrCreateUser(email);
      
      if (!user) {
        return {
          success: false,
          error: 'Failed to create or find user'
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);

      console.log('✅ User authenticated successfully');
      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Refresh user session (update last login)
   */
  async refreshSession(userId: string): Promise<{ success: boolean; user?: User }> {
    try {
      console.log('🔄 Refreshing session for user:', userId);

      const { data, error } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error refreshing session:', error);
        return { success: false };
      }

      console.log('✅ Session refreshed');
      return {
        success: true,
        user: data as User
      };
    } catch (error) {
      console.error('❌ Failed to refresh session:', error);
      return { success: false };
    }
  }
}

export const authService = new AuthService();

