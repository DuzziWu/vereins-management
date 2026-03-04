-- ============================================================
-- PROJ-31 FIX: Correct RLS Policies for workgroup_message_reads
--
-- Problem: Original policies use "profile_id = auth.uid()" but
-- auth.uid() returns profiles.user_id (Supabase Auth UID),
-- NOT profiles.id (internal profile UUID).
--
-- Run this in Supabase SQL Editor AFTER the initial PROJ-31 migration.
-- ============================================================

-- ============================================================
-- 1. DROP existing faulty policies
-- ============================================================

DROP POLICY IF EXISTS "workgroup_message_reads_insert" ON workgroup_message_reads;
DROP POLICY IF EXISTS "workgroup_message_reads_update" ON workgroup_message_reads;
DROP POLICY IF EXISTS "workgroup_message_reads_select" ON workgroup_message_reads;

-- Also fix the messages policies that have the same issue
DROP POLICY IF EXISTS "workgroup_messages_insert" ON workgroup_messages;
DROP POLICY IF EXISTS "workgroup_messages_select" ON workgroup_messages;

-- ============================================================
-- 2. CREATE corrected policies using subquery to get profile_id
-- ============================================================

-- Helper: Get the current user's profile_id from auth.uid()
-- We use this pattern: (SELECT id FROM profiles WHERE user_id = auth.uid())

-- workgroup_message_reads: SELECT
-- Users see their own read status; Vorstand sees all
CREATE POLICY "workgroup_message_reads_select"
  ON workgroup_message_reads FOR SELECT
  USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'vorstand'
    )
  );

-- workgroup_message_reads: INSERT — only own rows
CREATE POLICY "workgroup_message_reads_insert"
  ON workgroup_message_reads FOR INSERT
  WITH CHECK (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- workgroup_message_reads: UPDATE — only own rows
CREATE POLICY "workgroup_message_reads_update"
  ON workgroup_message_reads FOR UPDATE
  USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- 3. FIX workgroup_messages policies
-- ============================================================

-- workgroup_messages: SELECT
-- Members see their workgroup's messages; Vorstand sees all (oversight role)
CREATE POLICY "workgroup_messages_select"
  ON workgroup_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workgroup_members
      WHERE workgroup_id = workgroup_messages.workgroup_id
        AND profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'vorstand'
    )
  );

-- workgroup_messages: INSERT
-- Only members can send; sender_id must be the authenticated user's profile
CREATE POLICY "workgroup_messages_insert"
  ON workgroup_messages FOR INSERT
  WITH CHECK (
    sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM workgroup_members
      WHERE workgroup_id = workgroup_messages.workgroup_id
        AND profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- DONE
-- Verify in Supabase Dashboard → Authentication → Policies
-- ============================================================