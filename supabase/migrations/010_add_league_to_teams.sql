-- Add league column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS league TEXT;

-- Add comment for documentation
COMMENT ON COLUMN teams.league IS 'The league the team plays in, e.g., "Oberliga", "Bezirksliga"';
