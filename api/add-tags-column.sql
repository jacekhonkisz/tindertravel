-- Add tags column to hotels table
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_hotels_tags ON hotels USING GIN (tags);
