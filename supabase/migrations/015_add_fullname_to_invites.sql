-- Add full_name field to club_invites for storing invited person's name
ALTER TABLE club_invites ADD COLUMN IF NOT EXISTS full_name TEXT;
