-- Enable Row Level Security on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's club_id
CREATE OR REPLACE FUNCTION get_my_club_id()
RETURNS UUID AS $$
  SELECT club_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- CLUBS POLICIES
-- Users can view their own club
CREATE POLICY "Users can view own club" ON clubs
    FOR SELECT USING (id = get_my_club_id());

-- Only admins can update club settings
CREATE POLICY "Admins can update club" ON clubs
    FOR UPDATE USING (id = get_my_club_id() AND get_my_role() = 'admin');

-- PROFILES POLICIES
-- Users can view profiles in their club
CREATE POLICY "Users can view club members" ON profiles
    FOR SELECT USING (club_id = get_my_club_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Admins can update any profile in their club
CREATE POLICY "Admins can update club profiles" ON profiles
    FOR UPDATE USING (club_id = get_my_club_id() AND get_my_role() = 'admin');

-- Allow profile creation on signup (before club assignment)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- MODULES POLICIES
-- Everyone can view modules
CREATE POLICY "Anyone can view modules" ON modules
    FOR SELECT USING (true);

-- CLUB_MODULES POLICIES
-- Users can view their club's modules
CREATE POLICY "Users can view club modules" ON club_modules
    FOR SELECT USING (club_id = get_my_club_id());

-- Only admins can toggle modules
CREATE POLICY "Admins can manage club modules" ON club_modules
    FOR ALL USING (club_id = get_my_club_id() AND get_my_role() = 'admin');

-- CLUB_INVITES POLICIES
-- Admins and coaches can view invites
CREATE POLICY "Staff can view invites" ON club_invites
    FOR SELECT USING (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'coach'));

-- Admins and coaches can create invites
CREATE POLICY "Staff can create invites" ON club_invites
    FOR INSERT WITH CHECK (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'coach'));

-- Admins can delete invites
CREATE POLICY "Admins can delete invites" ON club_invites
    FOR DELETE USING (club_id = get_my_club_id() AND get_my_role() = 'admin');

-- TEAMS POLICIES
CREATE POLICY "Users can view club teams" ON teams
    FOR SELECT USING (club_id = get_my_club_id());

CREATE POLICY "Admins and coaches can manage teams" ON teams
    FOR ALL USING (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'coach'));

-- TEAM_MEMBERS POLICIES
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (
        team_id IN (SELECT id FROM teams WHERE club_id = get_my_club_id())
    );

CREATE POLICY "Admins and coaches can manage team members" ON team_members
    FOR ALL USING (
        team_id IN (SELECT id FROM teams WHERE club_id = get_my_club_id())
        AND get_my_role() IN ('admin', 'coach')
    );

-- LOCATIONS POLICIES
CREATE POLICY "Users can view club locations" ON locations
    FOR SELECT USING (club_id = get_my_club_id());

CREATE POLICY "Admins and coaches can manage locations" ON locations
    FOR ALL USING (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'coach'));

-- EVENTS POLICIES
CREATE POLICY "Users can view club events" ON events
    FOR SELECT USING (club_id = get_my_club_id());

CREATE POLICY "Coaches can manage events" ON events
    FOR ALL USING (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'coach'));

-- MATCHES POLICIES
CREATE POLICY "Users can view matches" ON matches
    FOR SELECT USING (
        event_id IN (SELECT id FROM events WHERE club_id = get_my_club_id())
    );

CREATE POLICY "Coaches can manage matches" ON matches
    FOR ALL USING (
        event_id IN (SELECT id FROM events WHERE club_id = get_my_club_id())
        AND get_my_role() IN ('admin', 'coach')
    );

-- ATTENDANCE POLICIES
CREATE POLICY "Users can view attendance" ON attendance
    FOR SELECT USING (
        event_id IN (SELECT id FROM events WHERE club_id = get_my_club_id())
    );

-- Players can only update their own attendance
CREATE POLICY "Users can update own attendance" ON attendance
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own attendance" ON attendance
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Coaches can manage all attendance for their events
CREATE POLICY "Coaches can manage attendance" ON attendance
    FOR ALL USING (
        event_id IN (SELECT id FROM events WHERE club_id = get_my_club_id())
        AND get_my_role() IN ('admin', 'coach')
    );

-- FINANCES POLICIES
-- Admins can see all finances
CREATE POLICY "Admins can view all finances" ON finances
    FOR SELECT USING (club_id = get_my_club_id() AND get_my_role() = 'admin');

-- Users can see their own finances
CREATE POLICY "Users can view own finances" ON finances
    FOR SELECT USING (profile_id = auth.uid());

-- Coaches can submit expenses
CREATE POLICY "Staff can submit expenses" ON finances
    FOR INSERT WITH CHECK (
        club_id = get_my_club_id()
        AND profile_id = auth.uid()
        AND get_my_role() IN ('admin', 'coach')
    );

-- Admins can manage all finances
CREATE POLICY "Admins can manage finances" ON finances
    FOR ALL USING (club_id = get_my_club_id() AND get_my_role() = 'admin');

-- BUDGETS POLICIES
CREATE POLICY "Users can view budgets" ON budgets
    FOR SELECT USING (club_id = get_my_club_id());

CREATE POLICY "Admins can manage budgets" ON budgets
    FOR ALL USING (club_id = get_my_club_id() AND get_my_role() = 'admin');

-- TASKS POLICIES
CREATE POLICY "Users can view club tasks" ON tasks
    FOR SELECT USING (club_id = get_my_club_id());

-- Users can update tasks assigned to them
CREATE POLICY "Users can update assigned tasks" ON tasks
    FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Admins can manage tasks" ON tasks
    FOR ALL USING (club_id = get_my_club_id() AND get_my_role() = 'admin');
