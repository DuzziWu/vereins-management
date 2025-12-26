-- Performance indexes for RLS queries

-- Profiles
CREATE INDEX idx_profiles_club_id ON profiles(club_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Teams
CREATE INDEX idx_teams_club_id ON teams(club_id);

-- Team members
CREATE INDEX idx_team_members_profile_id ON team_members(profile_id);

-- Locations
CREATE INDEX idx_locations_club_id ON locations(club_id);

-- Events
CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_team_id ON events(team_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_type ON events(type);

-- Matches
CREATE INDEX idx_matches_event_id ON matches(event_id);
CREATE INDEX idx_matches_start_time ON matches(start_time);

-- Attendance
CREATE INDEX idx_attendance_event_id ON attendance(event_id);
CREATE INDEX idx_attendance_profile_id ON attendance(profile_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Finances
CREATE INDEX idx_finances_club_id ON finances(club_id);
CREATE INDEX idx_finances_profile_id ON finances(profile_id);
CREATE INDEX idx_finances_status ON finances(status);
CREATE INDEX idx_finances_type ON finances(type);

-- Budgets
CREATE INDEX idx_budgets_club_id ON budgets(club_id);
CREATE INDEX idx_budgets_team_id ON budgets(team_id);

-- Tasks
CREATE INDEX idx_tasks_club_id ON tasks(club_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Club invites
CREATE INDEX idx_club_invites_club_id ON club_invites(club_id);
CREATE INDEX idx_club_invites_token ON club_invites(token);
CREATE INDEX idx_club_invites_email ON club_invites(email);

-- Club modules
CREATE INDEX idx_club_modules_club_id ON club_modules(club_id);
