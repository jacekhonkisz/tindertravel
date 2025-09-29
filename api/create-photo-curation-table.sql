-- Create photo_curations table for storing manual photo curation data
CREATE TABLE IF NOT EXISTS photo_curations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  original_photos TEXT[] NOT NULL DEFAULT '{}',
  curated_photos TEXT[] NOT NULL DEFAULT '{}',
  removed_photos TEXT[] NOT NULL DEFAULT '{}',
  photo_order INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one curation per hotel
  UNIQUE(hotel_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_photo_curations_hotel_id ON photo_curations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_photo_curations_updated_at ON photo_curations(updated_at);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE photo_curations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on photo_curations" ON photo_curations
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photo_curation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_photo_curation_updated_at_trigger
  BEFORE UPDATE ON photo_curations
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_curation_updated_at();

-- Add comments for documentation
COMMENT ON TABLE photo_curations IS 'Stores manual photo curation data for hotels';
COMMENT ON COLUMN photo_curations.hotel_id IS 'Reference to the hotel being curated';
COMMENT ON COLUMN photo_curations.original_photos IS 'Original photos before curation';
COMMENT ON COLUMN photo_curations.curated_photos IS 'Photos after curation (reordered, some removed)';
COMMENT ON COLUMN photo_curations.removed_photos IS 'Photos that were removed during curation';
COMMENT ON COLUMN photo_curations.photo_order IS 'Order indices for the curated photos'; 