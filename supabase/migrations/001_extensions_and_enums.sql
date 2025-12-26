-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'player');

-- Event types enum
CREATE TYPE event_type AS ENUM ('training', 'matchday', 'meeting', 'social');

-- Attendance status enum
CREATE TYPE attendance_status AS ENUM ('confirmed', 'declined', 'pending', 'late');

-- Finance type enum
CREATE TYPE finance_type AS ENUM ('contribution', 'expense', 'sponsorship');

-- Finance status enum
CREATE TYPE finance_status AS ENUM ('open', 'approved', 'paid', 'rejected');

-- Task status enum
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
