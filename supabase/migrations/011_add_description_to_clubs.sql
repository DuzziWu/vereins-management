-- Add description column to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clubs.description IS 'Short description of the club';
