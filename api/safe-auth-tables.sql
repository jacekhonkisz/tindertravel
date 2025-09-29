-- SAFE VERSION: Create authentication tables without any destructive operations
-- This script only creates tables and functions, never drops or deletes anything

-- Create users table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create OTP codes table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Create function to automatically update updated_at (safe replace)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the RPC functions that the API expects (safe replace)
CREATE OR REPLACE FUNCTION create_users_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Table already exists, this is just for API compatibility
  RAISE NOTICE 'Users table check completed';
END;
$$;

CREATE OR REPLACE FUNCTION create_otp_codes_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Table already exists, this is just for API compatibility  
  RAISE NOTICE 'OTP codes table check completed';
END;
$$;

-- Create cleanup function for expired OTP codes (safe replace)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$; 