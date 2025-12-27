-- Expand modules with additional features for sports club management
-- Add category column to modules table
ALTER TABLE modules ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Sonstiges';
ALTER TABLE modules ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Package';
ALTER TABLE modules ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE modules ADD COLUMN IF NOT EXISTS price TEXT DEFAULT 'Kostenlos';

-- Update existing modules with categories and features
UPDATE modules SET
    category = 'Gamification',
    icon = 'Trophy',
    features = ARRAY['XP-System', 'Achievements', 'Ranglisten', 'Herausforderungen'],
    price = 'Kostenlos'
WHERE id = 'skill_arena';

UPDATE modules SET
    category = 'Training',
    icon = 'Brain',
    features = ARRAY['KI-Trainingsplanung', 'Übungsbibliothek', 'Periodisierung', 'Belastungssteuerung'],
    price = '29.99€/Monat'
WHERE id = 'ai_training';

UPDATE modules SET
    category = 'Verwaltung',
    icon = 'Package',
    features = ARRAY['QR-Code Tracking', 'Ausleihsystem', 'Bestandsverwaltung', 'Wartungsplanung'],
    price = 'Kostenlos'
WHERE id = 'inventory';

-- Insert new modules
INSERT INTO modules (id, name, description, is_premium, category, icon, features, price) VALUES
    ('finance', 'Finanzverwaltung', 'Komplette Vereinsfinanzen mit Budgetplanung, Mitgliedsbeiträgen und automatischer Rechnungsstellung.', false, 'Finanzen', 'TrendingUp', ARRAY['Budget-Planung', 'Beitragsverwaltung', 'Rechnungen', 'Ausgabentracking'], 'Kostenlos'),
    ('team_chat', 'Team Chat', 'Integrierte Kommunikationsplattform mit Gruppen-Chats, Direktnachrichten und Dateifreigabe.', false, 'Kommunikation', 'MessageSquare', ARRAY['Gruppen-Chats', 'Direktnachrichten', 'Dateifreigabe', 'Push-Benachrichtigungen'], 'Kostenlos'),
    ('documents', 'Dokumenten-Manager', 'Zentrale Dokumentenverwaltung für Verträge, Formulare und Vereinsunterlagen.', false, 'Verwaltung', 'FileText', ARRAY['Vertragsvorlagen', 'Digitale Unterschriften', 'Versionierung', 'Zugriffsrechte'], 'Kostenlos'),
    ('match_analysis', 'Spielanalyse', 'Professionelle Spielanalyse mit Videotagging, Statistiken und taktischen Auswertungen.', true, 'Analyse', 'BarChart3', ARRAY['Video-Analyse', 'Spielerstatistiken', 'Taktik-Board', 'Gegneranalyse'], '39.99€/Monat'),
    ('medical', 'Medizin & Fitness', 'Umfassende Verletzungsdokumentation, Rehabilitationspläne und Fitness-Tracking.', true, 'Gesundheit', 'Heart', ARRAY['Verletzungs-Tracking', 'Reha-Pläne', 'Fitness-Tests', 'Belastungsmonitoring'], '24.99€/Monat'),
    ('parent_portal', 'Eltern-Portal', 'Dediziertes Portal für Eltern mit Kalender, Nachrichten und Zahlungsübersicht.', false, 'Kommunikation', 'Users', ARRAY['Eltern-Accounts', 'Termin-Einsicht', 'Zahlungsübersicht', 'Fahrgemeinschaften'], 'Kostenlos'),
    ('sponsoring', 'Sponsoring Manager', 'Professionelles Sponsoren-Management mit Vertragsübersicht und Leistungsnachweis.', true, 'Marketing', 'Handshake', ARRAY['Sponsoren-Datenbank', 'Vertragsmanagement', 'Leistungsnachweise', 'Reporting'], '34.99€/Monat')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_premium = EXCLUDED.is_premium,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    features = EXCLUDED.features,
    price = EXCLUDED.price;
