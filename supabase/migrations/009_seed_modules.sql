-- Seed default modules
INSERT INTO modules (id, name, description, is_premium) VALUES
    ('skill_arena', 'Skill Arena', 'Gamification mit XP-System, Levels und Achievements für Spieler', false),
    ('ai_training', 'KI-Trainings-Assistent', 'Automatische Trainingsplan-Generierung mit künstlicher Intelligenz', true),
    ('inventory', 'Inventar-Manager', 'Equipment-Verwaltung mit QR-Code System für Ausleihe und Tracking', false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_premium = EXCLUDED.is_premium;
