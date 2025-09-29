-- Function to create users table if it doesn't exist
CREATE OR REPLACE FUNCTION create_users_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create index on email for faster lookups
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  -- Enable Row Level Security
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;

  -- Create policy to allow users to read their own data
  DROP POLICY IF EXISTS "Users can view own profile" ON users;
  CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

  -- Create policy to allow users to update their own data
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

  -- Create trigger to automatically update updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

END;
$$;

-- Function to create OTP codes table if it doesn't exist
CREATE OR REPLACE FUNCTION create_otp_codes_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create index on email for faster lookups
  CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);

  -- Create index on expires_at for cleanup
  CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

  -- Enable Row Level Security
  ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

  -- Create policy to allow service role to manage OTP codes
  DROP POLICY IF EXISTS "Service role can manage OTP codes" ON otp_codes;
  CREATE POLICY "Service role can manage OTP codes" ON otp_codes
    FOR ALL USING (true);

  -- Create function to clean up expired OTP codes
  CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
  RETURNS void
  LANGUAGE plpgsql
  AS $cleanup$
  BEGIN
    DELETE FROM otp_codes WHERE expires_at < NOW();
  END;
  $cleanup$;

END;
$$; 