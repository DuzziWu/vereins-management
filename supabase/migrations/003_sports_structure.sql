-- Teams within a club
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., "1. Herren", "U19"
    sport_type TEXT DEFAULT 'football',
    age_group TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team membership (many-to-many: profiles <-> teams)
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    position TEXT, -- e.g., "Torwart", "Sturm"
    jersey_number INTEGER,
    is_captain BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (team_id, profile_id)
);

-- Locations (training grounds, stadiums)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., "Hauptplatz", "Halle Nord"
    address TEXT,
    address_link TEXT, -- Google Maps URL
    geo_data JSONB, -- { lat: ..., lng: ... }
    created_at TIMESTAMPTZ DEFAULT NOW()
);
