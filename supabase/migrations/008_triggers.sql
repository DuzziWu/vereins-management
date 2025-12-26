-- Trigger: Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Update budget spent_amount when expense is paid
CREATE OR REPLACE FUNCTION update_budget_on_expense_paid()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'paid' and it's an expense
    IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.type = 'expense' THEN
        UPDATE budgets
        SET
            spent_amount = spent_amount + ABS(NEW.amount),
            updated_at = NOW()
        WHERE
            club_id = NEW.club_id
            AND (team_id = NEW.team_id OR (team_id IS NULL AND NEW.team_id IS NULL))
            AND season = TO_CHAR(NOW(), 'YYYY') || '/' || TO_CHAR(NOW() + INTERVAL '1 year', 'YYYY');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_expense_paid
    AFTER UPDATE ON finances
    FOR EACH ROW EXECUTE FUNCTION update_budget_on_expense_paid();

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER set_updated_at_clubs
    BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_teams
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_events
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_attendance
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_finances
    BEFORE UPDATE ON finances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_budgets
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_tasks
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Set responded_at when attendance status changes
CREATE OR REPLACE FUNCTION set_attendance_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != 'pending' AND (OLD.status = 'pending' OR OLD.responded_at IS NULL) THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_attendance_response
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION set_attendance_responded_at();
