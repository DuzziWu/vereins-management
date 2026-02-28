-- ============================================================
-- PROJ-31: Workgroup Chat
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Workgroup Messages
CREATE TABLE workgroup_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workgroup_id UUID NOT NULL REFERENCES workgroups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_display_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Read Status (one row per user per workgroup, tracks last read timestamp)
CREATE TABLE workgroup_message_reads (
  workgroup_id UUID NOT NULL REFERENCES workgroups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workgroup_id, profile_id)
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

-- Fast cursor-based pagination per workgroup
CREATE INDEX idx_workgroup_messages_workgroup_created
  ON workgroup_messages(workgroup_id, created_at DESC);

-- ============================================================
-- 3. ENABLE SUPABASE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE workgroup_messages;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE workgroup_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workgroup_message_reads ENABLE ROW LEVEL SECURITY;

-- workgroup_messages: SELECT
-- Members see their workgroup's messages; Vorstand sees all (oversight role)
CREATE POLICY "workgroup_messages_select"
  ON workgroup_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workgroup_members
      WHERE workgroup_id = workgroup_messages.workgroup_id
        AND profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'vorstand'
    )
  );

-- workgroup_messages: INSERT
-- Only members can send; sender_id must be the authenticated user
CREATE POLICY "workgroup_messages_insert"
  ON workgroup_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workgroup_members
      WHERE workgroup_id = workgroup_messages.workgroup_id
        AND profile_id = auth.uid()
    )
  );

-- workgroup_messages: DELETE — not allowed via API
-- (Messages are deleted via CASCADE when workgroup is archived)

-- workgroup_message_reads: SELECT
-- Users see their own read status; Vorstand sees all
CREATE POLICY "workgroup_message_reads_select"
  ON workgroup_message_reads FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'vorstand'
    )
  );

-- workgroup_message_reads: INSERT — only own rows
CREATE POLICY "workgroup_message_reads_insert"
  ON workgroup_message_reads FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- workgroup_message_reads: UPDATE — only own rows
CREATE POLICY "workgroup_message_reads_update"
  ON workgroup_message_reads FOR UPDATE
  USING (profile_id = auth.uid());

-- ============================================================
-- 5. TRIGGER: Auto-set sender_display_name for Privacy
-- Sets "Vorname I." (e.g. "Max M.") — never stores full last name in chat
-- ============================================================

CREATE OR REPLACE FUNCTION set_workgroup_message_display_name()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_initial TEXT;
BEGIN
  SELECT
    first_name,
    UPPER(LEFT(last_name, 1))
  INTO v_first_name, v_last_initial
  FROM profiles
  WHERE id = NEW.sender_id;

  IF v_first_name IS NOT NULL THEN
    NEW.sender_display_name :=
      v_first_name || ' ' || COALESCE(v_last_initial || '.', '');
  ELSE
    NEW.sender_display_name := 'Mitglied';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_workgroup_message_display_name
  BEFORE INSERT ON workgroup_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_workgroup_message_display_name();

-- ============================================================
-- 6. RATE LIMIT FUNCTION
-- Counts workgroup messages sent by a profile in the last N seconds.
-- Returns TRUE if within limit, FALSE if exceeded.
-- ============================================================

CREATE OR REPLACE FUNCTION check_workgroup_chat_rate_limit(
  p_profile_id UUID,
  p_max_count INT DEFAULT 10,
  p_window_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM workgroup_messages
  WHERE sender_id = p_profile_id
    AND created_at > NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  RETURN v_count < p_max_count;
END;
$$;

-- ============================================================
-- DONE
-- Next steps:
-- 1. Verify tables in Supabase Dashboard → Table Editor
-- 2. Check RLS Policies in Authentication → Policies
-- 3. Verify Realtime in Database → Replication
-- 4. Deploy API routes (already done in codebase)
-- ============================================================
