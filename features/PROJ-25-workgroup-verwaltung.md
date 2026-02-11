# PROJ-25: Workgroup-Verwaltung

## Status: Planned

## Abhangigkeiten
- Benotigt: PROJ-1 (User Authentication) - fur eingeloggte User-Checks
- Benotigt: PROJ-4 (Member Management) - fur Mitglieder-Zuweisung
- Unabhangig von: Event-Features (PROJ-20-24)

---

## Ubersicht

Workgroups sind temporare Projektgruppen fur spezifische Vereinsaufgaben (z.B. Wagenbau, Event-Planung, Kostum-Anfertigung). Dieses Feature ermoglicht dem Vorstand, Workgroups zu erstellen, Mitglieder zuzuweisen und den Projektstatus zu verwalten.

**Wichtig:** Dies ist das Basis-Feature fur WORK-01. Kanban-Board, Task-Details und Chat werden in separaten Features (PROJ-26ff) spezifiziert.

---

## User Stories

### US-1: Workgroup erstellen
**Als** Vorstand
**mochte ich** eine neue Workgroup mit Namen, Kategorie und Beschreibung erstellen
**um** ein Vereinsprojekt zu organisieren.

### US-2: Mitglieder zuweisen
**Als** Vorstand
**mochte ich** Vereinsmitglieder zu einer Workgroup zuweisen
**um** das Projektteam zusammenzustellen.

### US-3: Workgroup-Ubersicht
**Als** Vorstand
**mochte ich** alle aktiven Workgroups mit Status und Mitgliederzahl sehen
**um** den Uberblick uber laufende Projekte zu behalten.

### US-4: Meine Workgroups sehen
**Als** Vereinsmitglied
**mochte ich** die Workgroups sehen, denen ich zugewiesen bin
**um** meine Projektaufgaben zu finden.

### US-5: Workgroup archivieren
**Als** Vorstand
**mochte ich** abgeschlossene Workgroups archivieren
**um** die aktive Liste ubersichtlich zu halten.

### US-6: Workgroup-Kategorien verwalten
**Als** Vorstand
**mochte ich** vordefinierte Kategorien nutzen oder eigene erstellen
**um** Workgroups thematisch zu gruppieren.

---

## Acceptance Criteria

### Workgroup CRUD

- [ ] Neuer Menupunkt "Workgroups" in der Admin-Navigation (nur Vorstand)
- [ ] "Neue Workgroup" Button offnet Erstellungs-Dialog
- [ ] Pflichtfelder: Name (min. 3, max. 100 Zeichen)
- [ ] Optionale Felder: Kategorie (Dropdown), Beschreibung (max. 500 Zeichen)
- [ ] Workgroup bearbeiten uber Aktions-Menu
- [ ] Workgroup archivieren (Soft-Delete) mit Bestatigungsdialog
- [ ] Archivierte Workgroups in separatem Tab anzeigen
- [ ] Archivierte Workgroups konnen wiederhergestellt werden

### Kategorien-System

- [ ] Vordefinierte Kategorien als Vorschlage:
  - Wagenbau
  - Event-Planung
  - Kostume
  - Organisation
  - Sonstiges
- [ ] Vorstand kann neue Kategorien hinzufugen
- [ ] Kategorien konnen bearbeitet und geloscht werden (nur wenn nicht verwendet)
- [ ] Kategorie-Auswahl im Workgroup-Formular als Dropdown mit "Neue Kategorie" Option

### Mitglieder-Zuweisung

- [ ] Multi-Select fur Mitglieder-Zuweisung (Combobox mit Suche)
- [ ] Anzeige: Name + Avatar/Initialen
- [ ] Mitglieder konnen jederzeit hinzugefugt/entfernt werden
- [ ] Mindestens 1 Mitglied erforderlich (der Ersteller wird automatisch hinzugefugt)
- [ ] Entfernte Mitglieder verlieren sofort Zugriff auf Workgroup

### Workgroup-Liste (Vorstand)

- [ ] Tabelle mit: Name, Kategorie, Mitgliederzahl, Status, Erstellt am
- [ ] Filter nach Kategorie und Status (Aktiv/Archiviert)
- [ ] Sortierung nach Name, Erstelldatum, Mitgliederzahl
- [ ] Suche nach Workgroup-Name
- [ ] Quick-Actions: Bearbeiten, Mitglieder, Archivieren

### Meine Workgroups (Mitglied-Ansicht)

- [ ] Neuer Menupunkt "Meine Workgroups" fur alle Rollen
- [ ] Karten-Ansicht mit: Name, Kategorie, Beschreibung (gekurzt), Mitgliederzahl
- [ ] Klick offnet Workgroup-Detail-Seite
- [ ] Nur zugewiesene Workgroups werden angezeigt
- [ ] Leerer Zustand: "Du bist noch keiner Workgroup zugewiesen"

### Workgroup-Detail-Seite

- [ ] Header mit Name, Kategorie-Badge, Beschreibung
- [ ] Mitglieder-Liste mit Avatar/Initialen + Name
- [ ] Platzhalter fur Kanban-Board (PROJ-26)
- [ ] Platzhalter fur Chat (PROJ-28)
- [ ] Breadcrumb-Navigation: Dashboard > Workgroups > [Name]

---

## Edge Cases

### E-1: Workgroup ohne Mitglieder
- **Szenario:** Letztes Mitglied wird aus Workgroup entfernt
- **Losung:** Nicht erlaubt - mindestens der Ersteller muss Mitglied bleiben
- **Meldung:** "Mindestens ein Mitglied muss der Workgroup zugewiesen sein"

### E-2: Mitglied wird aus Verein entfernt
- **Szenario:** Ein Workgroup-Mitglied verlasst den Verein oder wird deaktiviert
- **Losung:** Automatische Entfernung aus allen Workgroups bei User-Deaktivierung
- **Log:** Eintrag in Workgroup-History (spater)

### E-3: Doppelter Workgroup-Name
- **Szenario:** Vorstand erstellt Workgroup mit bereits existierendem Namen
- **Losung:** Erlaubt (kein Unique-Constraint), aber Warnung anzeigen
- **Meldung:** "Eine Workgroup mit diesem Namen existiert bereits. Trotzdem erstellen?"

### E-4: Archivierte Workgroup wiederherstellen
- **Szenario:** Vorstand mochte archivierte Workgroup reaktivieren
- **Losung:** "Wiederherstellen" Button in archivierter Liste
- **Verhalten:** Status wird auf "Aktiv" gesetzt, alle Daten bleiben erhalten

### E-5: Kategorie loschen mit zugewiesenen Workgroups
- **Szenario:** Vorstand loscht Kategorie die noch verwendet wird
- **Losung:** Loschen blockiert mit Meldung
- **Alternative:** Dialog "X Workgroups auf andere Kategorie migrieren"

### E-6: Sehr viele Mitglieder zuweisen (>50)
- **Szenario:** Workgroup soll viele Mitglieder haben
- **Losung:** Performance-Optimierung durch Paginierung in der Mitglieder-Liste
- **Limit:** Kein hartes Limit, aber Warnung ab 50 Mitgliedern

### E-7: Gleichzeitige Bearbeitung
- **Szenario:** Zwei Vorstande bearbeiten dieselbe Workgroup
- **Losung:** Optimistic UI - letzter Speichervorgang gewinnt

---

## Technische Anforderungen

### Datenbank (Supabase)

```sql
-- workgroup_categories: Kategorien fur Workgroups
CREATE TABLE workgroup_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT workgroup_categories_name_unique UNIQUE (name)
);

-- Default-Kategorien einfugen
INSERT INTO workgroup_categories (name, is_system_default, sort_order) VALUES
  ('Wagenbau', true, 1),
  ('Event-Planung', true, 2),
  ('Kostume', true, 3),
  ('Organisation', true, 4),
  ('Sonstiges', true, 5);

-- workgroups: Projektgruppen
CREATE TABLE workgroups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES workgroup_categories(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- workgroup_members: Zuweisungen
CREATE TABLE workgroup_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workgroup_id UUID NOT NULL REFERENCES workgroups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT workgroup_members_unique UNIQUE (workgroup_id, profile_id)
);

-- Indexes
CREATE INDEX idx_workgroups_status ON workgroups(status);
CREATE INDEX idx_workgroups_category ON workgroups(category_id);
CREATE INDEX idx_workgroup_members_workgroup ON workgroup_members(workgroup_id);
CREATE INDEX idx_workgroup_members_profile ON workgroup_members(profile_id);

-- RLS Policies
ALTER TABLE workgroup_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE workgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE workgroup_members ENABLE ROW LEVEL SECURITY;

-- Categories: Alle lesen, nur Vorstand schreiben
CREATE POLICY "workgroup_categories_select" ON workgroup_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "workgroup_categories_insert" ON workgroup_categories
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "workgroup_categories_update" ON workgroup_categories
  FOR UPDATE TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "workgroup_categories_delete" ON workgroup_categories
  FOR DELETE TO authenticated USING (
    is_vorstand(auth.uid()) AND is_system_default = false
  );

-- Workgroups: Mitglieder lesen ihre, Vorstand alles
CREATE POLICY "workgroups_select" ON workgroups
  FOR SELECT TO authenticated USING (
    is_vorstand(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM workgroup_members
      WHERE workgroup_id = id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "workgroups_insert" ON workgroups
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "workgroups_update" ON workgroups
  FOR UPDATE TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "workgroups_delete" ON workgroups
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Members: Sichtbar fur Workgroup-Mitglieder und Vorstand
CREATE POLICY "workgroup_members_select" ON workgroup_members
  FOR SELECT TO authenticated USING (
    is_vorstand(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM workgroup_members wm
      WHERE wm.workgroup_id = workgroup_id AND wm.profile_id = auth.uid()
    )
  );

CREATE POLICY "workgroup_members_insert" ON workgroup_members
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "workgroup_members_delete" ON workgroup_members
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));
```

### Performance

- Workgroup-Liste wird mit Mitglieder-Count per JOIN geladen
- Mitglieder-Suche nutzt existierenden Profiles-Index
- Kategorien werden gecacht (selten geandert)

### Neue Dateien

```
src/app/(dashboard)/admin/workgroups/page.tsx     - Admin Ubersicht
src/app/(dashboard)/member/workgroups/page.tsx    - Mitglied Ubersicht
src/app/(dashboard)/[role]/workgroups/[id]/page.tsx - Detail-Seite
src/components/workgroups/workgroup-form.tsx      - Erstellen/Bearbeiten Dialog
src/components/workgroups/workgroup-card.tsx      - Karten-Komponente
src/components/workgroups/member-select.tsx       - Multi-Select fur Mitglieder
src/lib/validations/workgroups.ts                 - Zod Schemas
```

---

## UI/UX Anforderungen

### Admin Workgroup-Liste

```
+-------------------------------------------------------------+
| Workgroups                               [+ Neue Workgroup]  |
+-------------------------------------------------------------+
| [Aktiv] [Archiviert]                    [Filter] [Suche___] |
+-------------------------------------------------------------+
| Name              | Kategorie    | Mitglieder | Erstellt    |
+-------------------+--------------+------------+-------------+
| Wagenbau 2026     | Wagenbau     | 12         | 15.01.2026  | [...]
| Sommerfest Orga   | Event-Plan.  | 8          | 20.01.2026  | [...]
| Neue Kostume      | Kostume      | 5          | 01.02.2026  | [...]
+-------------------------------------------------------------+
```

### Workgroup-Formular

```
+---------------------------------------------+
| Neue Workgroup erstellen                    |
+---------------------------------------------+
| Name *                                      |
| [                                    ]      |
|                                             |
| Kategorie                                   |
| [Wagenbau                           v]      |
|   + Neue Kategorie erstellen                |
|                                             |
| Beschreibung                                |
| [                                    ]      |
| [                                    ]      |
|                                             |
| Mitglieder zuweisen *                       |
| [Suche nach Mitgliedern...          ]      |
| [x] Max Mustermann                          |
| [x] Lisa Schmidt                            |
| [x] Tom Weber                               |
|                                             |
+---------------------------------------------+
|              [Abbrechen]  [Erstellen]       |
+---------------------------------------------+
```

### Mitglied: Meine Workgroups (Karten)

```
+-------------------------------------------------------------+
| Meine Workgroups                                             |
+-------------------------------------------------------------+
| +---------------------------+  +---------------------------+ |
| | Wagenbau 2026             |  | Sommerfest Orga           | |
| | [Wagenbau]                |  | [Event-Planung]           | |
| |                           |  |                           | |
| | Bau des Motivwagens       |  | Organisation des          | |
| | fur den Umzug 2026        |  | jahrlichen Sommerfests    | |
| |                           |  |                           | |
| | 12 Mitglieder             |  | 8 Mitglieder              | |
| +---------------------------+  +---------------------------+ |
+-------------------------------------------------------------+
```

---

## Nicht im Scope

- Kanban-Board (PROJ-26)
- Task-Details & Attachments (PROJ-27)
- Workgroup-Chat (PROJ-28)
- Rollen innerhalb der Workgroup (z.B. Workgroup-Admin)
- Automatische Benachrichtigungen bei Zuweisung
- Export der Workgroup-Daten
- Vorlagen fur Workgroups

---

## Folge-Features

Nach PROJ-25 werden diese Features die Workgroup-Funktionalitat erweitern:

1. **PROJ-26: Kanban-Board** - Spalten, Tasks, Drag & Drop
2. **PROJ-27: Task-Details** - Sub-Tasks, File-Attachments
3. **PROJ-28: Workgroup-Chat** - Anonymisierter Chat mit Auto-Loschung

---

## Checklist vor Abschluss

- [x] Fragen gestellt: User hat alle wichtigen Fragen beantwortet
- [x] User Stories komplett: 6 User Stories definiert
- [x] Acceptance Criteria konkret: Jedes Kriterium ist testbar
- [x] Edge Cases identifiziert: 7 Edge Cases dokumentiert
- [x] Feature-ID vergeben: PROJ-25
- [x] File gespeichert: `/features/PROJ-25-workgroup-verwaltung.md`
- [x] Status gesetzt: Planned
- [ ] User Review: Ausstehend

---

## Git Workflow

```bash
git commit -m "feat(PROJ-25): Add workgroup management specification"
```
