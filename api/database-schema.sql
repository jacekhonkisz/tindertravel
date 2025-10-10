-- ============================================
-- Glintz Production Database Schema
-- Production-ready OTP Authentication System
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT otp_codes_email_lowercase CHECK (email = LOWER(email)),
  CONSTRAINT otp_codes_code_length CHECK (LENGTH(code) = 6),
  CONSTRAINT otp_codes_attempts_positive CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at ON otp_codes(created_at DESC);

-- User preferences table (for personalization)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country_affinity JSONB DEFAULT '{}',
  amenity_affinity JSONB DEFAULT '{}',
  seen_hotels TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- User interactions table (swipe history)
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'like', 'superlike', 'dismiss'
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_interactions_action_type_check 
    CHECK (action_type IN ('like', 'superlike', 'dismiss'))
);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_hotel_id ON user_interactions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);

-- User saved hotels table
CREATE TABLE IF NOT EXISTS user_saved_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id VARCHAR(255) NOT NULL,
  save_type VARCHAR(50) NOT NULL, -- 'like', 'superlike'
  hotel_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_saved_hotels_save_type_check 
    CHECK (save_type IN ('like', 'superlike')),
  CONSTRAINT user_saved_hotels_unique UNIQUE (user_id, hotel_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_hotels_user_id ON user_saved_hotels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_hotels_save_type ON user_saved_hotels(save_type);
CREATE INDEX IF NOT EXISTS idx_user_saved_hotels_created_at ON user_saved_hotels(created_at DESC);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to clean up expired OTP codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_interactions BIGINT,
  likes BIGINT,
  superlikes BIGINT,
  dismisses BIGINT,
  saved_likes BIGINT,
  saved_superlikes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_interactions,
    COUNT(*) FILTER (WHERE action_type = 'like')::BIGINT AS likes,
    COUNT(*) FILTER (WHERE action_type = 'superlike')::BIGINT AS superlikes,
    COUNT(*) FILTER (WHERE action_type = 'dismiss')::BIGINT AS dismisses,
    (SELECT COUNT(*)::BIGINT FROM user_saved_hotels WHERE user_id = p_user_id AND save_type = 'like') AS saved_likes,
    (SELECT COUNT(*)::BIGINT FROM user_saved_hotels WHERE user_id = p_user_id AND save_type = 'superlike') AS saved_superlikes
  FROM user_interactions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE users IS 'User accounts for the Glintz application';
COMMENT ON TABLE otp_codes IS 'One-time password codes for email authentication';
COMMENT ON TABLE user_preferences IS 'User personalization preferences and seen hotels';
COMMENT ON TABLE user_interactions IS 'History of all user swipe interactions';
COMMENT ON TABLE user_saved_hotels IS 'Hotels saved by users (likes and superlikes)';

COMMENT ON COLUMN otp_codes.expires_at IS 'Expiration timestamp for OTP code (10 minutes from creation)';
COMMENT ON COLUMN otp_codes.attempts IS 'Number of verification attempts (max 5)';
COMMENT ON COLUMN user_preferences.country_affinity IS 'JSON object tracking user preferences by country';
COMMENT ON COLUMN user_preferences.amenity_affinity IS 'JSON object tracking user preferences by amenity';
COMMENT ON COLUMN user_preferences.seen_hotels IS 'Array of hotel IDs user has already seen';

-- ============================================
-- Row Level Security (RLS) - Optional
-- ============================================

-- Enable RLS on tables (uncomment if using Supabase with RLS)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_saved_hotels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (uncomment and customize if using Supabase with RLS)
-- CREATE POLICY "Users can view their own data" ON users
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update their own data" ON users
--   FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_action 
  ON user_interactions(user_id, action_type);

CREATE INDEX IF NOT EXISTS idx_user_saved_hotels_user_type 
  ON user_saved_hotels(user_id, save_type);

-- ============================================
-- Sample Data (for development/testing)
-- ============================================

-- Uncomment to insert test user
-- INSERT INTO users (email, name, created_at, last_login_at)
-- VALUES ('test@glintz.io', 'Test User', NOW(), NOW())
-- ON CONFLICT (email) DO NOTHING;

