# PROJ-29: Workgroup Kanban-Board

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-25 (Workgroup-Verwaltung) - für Workgroup-Struktur und Mitglieder
- Unabhängig von: Document-Features (PROJ-26ff), Inventory-Features (PROJ-27ff)

---

## Übersicht

Ein flexibles Kanban-Board für Workgroups mit anpassbaren Spalten, Drag & Drop Tasks und Dateianhängen. Ermöglicht Workgroup-Mitgliedern, Aufgaben zu organisieren und den Fortschritt von Vereinsprojekten zu tracken.

**Wichtig:** Baut auf PROJ-25 (Workgroup-Verwaltung) auf. Jede Workgroup bekommt automatisch ein eigenes Kanban-Board.

---

## User Stories

### US-1: Kanban-Board anzeigen
**Als** Workgroup-Mitglied
**möchte ich** das Kanban-Board meiner Workgroup sehen
**um** einen Überblick über alle Aufgaben zu haben.

### US-2: Spalten verwalten
**Als** Vorstand
**möchte ich** Spalten erstellen, umbenennen und löschen
**um** den Workflow an die Projektanforderungen anzupassen.

### US-3: Task erstellen
**Als** Workgroup-Mitglied
**möchte ich** neue Tasks mit Titel, Beschreibung und optionaler Zuweisung erstellen
**um** Aufgaben zu dokumentieren.

### US-4: Task verschieben
**Als** Workgroup-Mitglied
**möchte ich** Tasks per Drag & Drop zwischen Spalten verschieben
**um** den Fortschritt zu aktualisieren.

### US-5: Task zuweisen
**Als** Workgroup-Mitglied
**möchte ich** Tasks an mich selbst oder andere Mitglieder zuweisen
**um** Verantwortlichkeiten zu klären.

### US-6: Task-Details bearbeiten
**Als** Workgroup-Mitglied
**möchte ich** Task-Details wie Beschreibung, Checkliste und Deadline bearbeiten
**um** alle relevanten Informationen zu erfassen.

### US-7: Dateianhänge hinzufügen
**Als** Workgroup-Mitglied
**möchte ich** Dateien an Tasks anhängen
**um** relevante Dokumente oder Bilder zu teilen.

### US-8: Meine Tasks sehen
**Als** Vereinsmitglied
**möchte ich** alle mir zugewiesenen Tasks über alle Workgroups sehen
**um** meine Aufgaben im Blick zu haben.

---

## Acceptance Criteria

### Kanban-Board Grundstruktur

- [ ] Kanban-Board ersetzt den Platzhalter in der Workgroup-Detail-Seite
- [ ] Horizontales Scrolling bei vielen Spalten (mobile-friendly)
- [ ] Spalten werden nebeneinander angezeigt
- [ ] Tasks innerhalb einer Spalte sind vertikal gestapelt
- [ ] Board zeigt Workgroup-Name und Mitgliederanzahl im Header

### Spalten-Verwaltung (nur Vorstand)

- [ ] Default-Spalten bei neuer Workgroup: "Zu erledigen", "In Arbeit", "Erledigt"
- [ ] "Neue Spalte" Button am Ende der Spalten-Reihe
- [ ] Spalten-Name editierbar (Doppelklick oder Stift-Icon)
- [ ] Spalten per Drag & Drop neu anordnen
- [ ] Spalte löschen mit Bestätigungsdialog
- [ ] Spalte löschen: Tasks müssen erst verschoben werden (Dropdown: "Wohin verschieben?")
- [ ] Mindestens eine Spalte muss existieren
- [ ] Max. 10 Spalten pro Board
- [ ] Farbcodierung pro Spalte (optional, 8 Farben zur Auswahl)

### Task CRUD

- [ ] "Neuer Task" Button in jeder Spalte (Quick-Add mit nur Titel)
- [ ] Pflichtfeld: Titel (min. 1, max. 200 Zeichen)
- [ ] Optionale Felder:
  - Beschreibung (max. 2000 Zeichen, Markdown unterstützt)
  - Zugewiesen an (Multi-Select aus Workgroup-Mitgliedern)
  - Deadline (Datum + optionale Uhrzeit)
  - Priorität (Niedrig, Normal, Hoch, Dringend)
  - Checkliste (unbegrenzte Unterpunkte)
  - Labels/Tags (aus vordefinierter Liste)
- [ ] Task bearbeiten: Klick auf Task öffnet Detail-Panel (Slide-over von rechts)
- [ ] Task löschen mit Bestätigungsdialog
- [ ] Erstelldatum und "Erstellt von" werden automatisch gespeichert

### Drag & Drop

- [ ] Tasks per Drag & Drop zwischen Spalten verschieben
- [ ] Tasks innerhalb einer Spalte neu sortieren
- [ ] Touch-Support für mobile Geräte
- [ ] Visuelle Feedback während Drag (Ghost-Element, Drop-Zone Highlight)
- [ ] Optimistic UI: Sofortige Anzeige, Server-Sync im Hintergrund
- [ ] Konflikt-Handling: Bei gleichzeitiger Änderung Refresh-Hinweis

### Task-Ansicht

- [ ] Kompakte Task-Karte in Spalte zeigt:
  - Titel (max. 2 Zeilen, dann abgeschnitten)
  - Zugewiesene Mitglieder (Avatare, max. 3 + "+X")
  - Deadline-Badge (rot wenn überfällig, gelb wenn heute)
  - Prioritäts-Indikator (farbiger Streifen links)
  - Anhang-Icon mit Anzahl (wenn vorhanden)
  - Checklisten-Fortschritt (z.B. "3/5")
- [ ] Detail-Panel zeigt alle Felder + Aktivitäts-Log

### Dateianhänge

- [ ] "Datei anhängen" Button im Task-Detail
- [ ] Drag & Drop Dateien direkt auf Task-Karte
- [ ] Max. 5 Dateien pro Task
- [ ] Max. 10 MB pro Datei
- [ ] Erlaubte Typen: PDF, Office, Bilder, ZIP
- [ ] Datei-Vorschau für Bilder
- [ ] Anhänge können gelöscht werden (nur Ersteller oder Vorstand)

### Checklisten

- [ ] Checkliste im Task-Detail erstellen/bearbeiten
- [ ] Unterpunkte können abgehakt werden (alle Mitglieder)
- [ ] Fortschritt wird auf Task-Karte angezeigt (z.B. "3/5 ✓")
- [ ] Unterpunkte können neu sortiert werden (Drag & Drop)
- [ ] Erledigte Unterpunkte ans Ende verschieben (optional)

### Labels/Tags

- [ ] Vordefinierte Labels pro Workgroup (Vorstand erstellt)
- [ ] Label hat Name + Farbe
- [ ] Multi-Select: Task kann mehrere Labels haben
- [ ] Labels werden auf Task-Karte als Chips angezeigt
- [ ] Filter-Möglichkeit nach Label

### Filter & Suche

- [ ] Suchfeld: Suche nach Task-Titel
- [ ] Filter nach zugewiesenem Mitglied
- [ ] Filter nach Label
- [ ] Filter nach Priorität
- [ ] Filter "Nur meine Tasks"
- [ ] Filter "Überfällige Tasks"
- [ ] Filter werden in URL gespeichert (teilbar)

### Meine Tasks (Dashboard-Widget)

- [ ] Widget auf Member-Dashboard: "Meine Tasks"
- [ ] Zeigt alle Tasks aus allen Workgroups, die mir zugewiesen sind
- [ ] Sortiert nach Deadline (überfällig zuerst)
- [ ] Klick öffnet Task in der jeweiligen Workgroup
- [ ] Max. 5 Tasks anzeigen, "Alle anzeigen" Link

---

## Edge Cases

### E-1: Spalte mit Tasks löschen
- **Szenario:** Vorstand löscht Spalte die Tasks enthält
- **Lösung:** Erst Tasks verschieben
- **Dialog:** "Diese Spalte enthält X Tasks. Wohin verschieben?" [Dropdown mit anderen Spalten]

### E-2: Letzte Spalte löschen
- **Szenario:** Vorstand versucht letzte Spalte zu löschen
- **Lösung:** Nicht erlaubt
- **Meldung:** "Mindestens eine Spalte muss existieren."

### E-3: Gleichzeitige Drag & Drop
- **Szenario:** Zwei User verschieben denselben Task gleichzeitig
- **Lösung:** Optimistic UI mit Konflikt-Erkennung
- **Verhalten:** Letzter Commit gewinnt, andere User sehen Refresh-Banner

### E-4: Task-Zuweisung an entferntes Mitglied
- **Szenario:** Mitglied wird aus Workgroup entfernt, hat aber Tasks zugewiesen
- **Lösung:** Tasks bleiben erhalten, Zuweisung wird entfernt
- **Verhalten:** Task zeigt "Nicht zugewiesen" statt altem Namen

### E-5: Workgroup archiviert
- **Szenario:** Workgroup wird archiviert mit offenen Tasks
- **Lösung:** Board wird readonly
- **Verhalten:** Tasks sind sichtbar aber nicht editierbar, Banner "Archiviert"

### E-6: Sehr viele Tasks (>100 pro Spalte)
- **Szenario:** Spalte hat sehr viele Tasks
- **Lösung:** Virtualisierte Liste, Lazy-Loading
- **Performance:** Nur sichtbare Tasks rendern

### E-7: Anhang-Upload während offline
- **Szenario:** Dateiupload bei schlechter Verbindung
- **Lösung:** Retry-Mechanismus
- **Meldung:** "Upload fehlgeschlagen. [Erneut versuchen]"

### E-8: Deadline in der Vergangenheit
- **Szenario:** User setzt Deadline auf vergangenes Datum
- **Lösung:** Erlaubt (für Dokumentation), aber Warnung
- **Anzeige:** Sofort als "Überfällig" markiert

---

## Technische Anforderungen

### Datenbank (Supabase)

```sql
-- kanban_columns: Spalten pro Workgroup
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workgroup_id UUID NOT NULL REFERENCES workgroups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7), -- Hex-Color z.B. "#FF5733"
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- kanban_tasks: Aufgaben
CREATE TABLE kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(10) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  deadline TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- kanban_task_assignees: Zuweisungen (M:N)
CREATE TABLE kanban_task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT kanban_task_assignees_unique UNIQUE (task_id, profile_id)
);

-- kanban_task_labels: Labels für Workgroup
CREATE TABLE kanban_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workgroup_id UUID NOT NULL REFERENCES workgroups(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Hex-Color
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT kanban_labels_unique UNIQUE (workgroup_id, name)
);

-- kanban_task_label_assignments: Label-Zuweisungen (M:N)
CREATE TABLE kanban_task_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES kanban_labels(id) ON DELETE CASCADE,

  CONSTRAINT kanban_task_label_assignments_unique UNIQUE (task_id, label_id)
);

-- kanban_checklist_items: Checklisten-Einträge
CREATE TABLE kanban_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  text VARCHAR(500) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- kanban_task_attachments: Dateianhänge
CREATE TABLE kanban_task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kanban_columns_workgroup ON kanban_columns(workgroup_id);
CREATE INDEX idx_kanban_tasks_column ON kanban_tasks(column_id);
CREATE INDEX idx_kanban_tasks_deadline ON kanban_tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_kanban_task_assignees_task ON kanban_task_assignees(task_id);
CREATE INDEX idx_kanban_task_assignees_profile ON kanban_task_assignees(profile_id);
CREATE INDEX idx_kanban_checklist_items_task ON kanban_checklist_items(task_id);
CREATE INDEX idx_kanban_task_attachments_task ON kanban_task_attachments(task_id);

-- RLS Policies
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_task_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_task_attachments ENABLE ROW LEVEL SECURITY;

-- Columns: Workgroup-Mitglieder lesen, Vorstand schreiben
CREATE POLICY "kanban_columns_select" ON kanban_columns
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workgroup_members wm
      WHERE wm.workgroup_id = kanban_columns.workgroup_id
      AND wm.profile_id = get_profile_id_for_user(auth.uid())
    ) OR is_vorstand(auth.uid())
  );

CREATE POLICY "kanban_columns_insert" ON kanban_columns
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "kanban_columns_update" ON kanban_columns
  FOR UPDATE TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "kanban_columns_delete" ON kanban_columns
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Tasks: Workgroup-Mitglieder lesen/schreiben
CREATE POLICY "kanban_tasks_select" ON kanban_tasks
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM kanban_columns kc
      JOIN workgroup_members wm ON wm.workgroup_id = kc.workgroup_id
      WHERE kc.id = column_id
      AND wm.profile_id = get_profile_id_for_user(auth.uid())
    ) OR is_vorstand(auth.uid())
  );

CREATE POLICY "kanban_tasks_insert" ON kanban_tasks
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM kanban_columns kc
      JOIN workgroup_members wm ON wm.workgroup_id = kc.workgroup_id
      WHERE kc.id = column_id
      AND wm.profile_id = get_profile_id_for_user(auth.uid())
    ) OR is_vorstand(auth.uid())
  );

CREATE POLICY "kanban_tasks_update" ON kanban_tasks
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM kanban_columns kc
      JOIN workgroup_members wm ON wm.workgroup_id = kc.workgroup_id
      WHERE kc.id = column_id
      AND wm.profile_id = get_profile_id_for_user(auth.uid())
    ) OR is_vorstand(auth.uid())
  );

CREATE POLICY "kanban_tasks_delete" ON kanban_tasks
  FOR DELETE TO authenticated USING (
    created_by = get_profile_id_for_user(auth.uid()) OR is_vorstand(auth.uid())
  );

-- Assignees, Labels, Checklist, Attachments: Gleiche Regeln wie Tasks
-- (SELECT für Workgroup-Mitglieder, INSERT/UPDATE/DELETE für Mitglieder)

-- Trigger: Default-Spalten bei neuer Workgroup erstellen
CREATE OR REPLACE FUNCTION create_default_kanban_columns()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kanban_columns (workgroup_id, name, sort_order) VALUES
    (NEW.id, 'Zu erledigen', 0),
    (NEW.id, 'In Arbeit', 1),
    (NEW.id, 'Erledigt', 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_kanban_columns
  AFTER INSERT ON workgroups
  FOR EACH ROW EXECUTE FUNCTION create_default_kanban_columns();
```

### Supabase Storage

```
Bucket: kanban-attachments
Struktur: /{workgroup_id}/{task_id}/{attachment_id}.{ext}

Policies:
- SELECT: Workgroup-Mitglieder
- INSERT: Workgroup-Mitglieder
- DELETE: Uploader oder Vorstand

Limits:
- Max. 10 MB pro Datei
- Max. 5 Dateien pro Task
```

### Neue Dateien

```
src/components/kanban/kanban-board.tsx          - Board-Container
src/components/kanban/kanban-column.tsx         - Einzelne Spalte
src/components/kanban/kanban-task-card.tsx      - Task-Karte (kompakt)
src/components/kanban/kanban-task-detail.tsx    - Task-Detail-Panel
src/components/kanban/kanban-column-form.tsx    - Spalte erstellen/bearbeiten
src/components/kanban/kanban-task-form.tsx      - Task erstellen/bearbeiten
src/components/kanban/kanban-checklist.tsx      - Checklisten-Editor
src/components/kanban/kanban-label-picker.tsx   - Label-Auswahl
src/components/kanban/kanban-attachment.tsx     - Dateianhang
src/components/kanban/kanban-filters.tsx        - Filter-Leiste
src/components/dashboard/my-tasks-widget.tsx    - "Meine Tasks" Widget
src/hooks/use-kanban-dnd.ts                     - Drag & Drop Logic
src/lib/validations/kanban.ts                   - Zod Schemas
```

### Dependencies

```
@dnd-kit/core          - Drag & Drop Engine
@dnd-kit/sortable      - Sortierbare Listen
@dnd-kit/utilities     - Hilfsfunktionen
```

---

## UI/UX Anforderungen

### Kanban-Board Hauptansicht

```
+-----------------------------------------------------------------------+
| Wagenbau 2026                                      [Filter] [+ Spalte] |
| 12 Mitglieder                                                          |
+-----------------------------------------------------------------------+
|                                                                         |
| +-------------------+ +-------------------+ +-------------------+       |
| | ZU ERLEDIGEN (5)  | | IN ARBEIT (3)     | | ERLEDIGT (8)      |       |
| | [+ Neuer Task]    | | [+ Neuer Task]    | | [+ Neuer Task]    |       |
| +-------------------+ +-------------------+ +-------------------+       |
| |                   | |                   | |                   |       |
| | +--------------+  | | +--------------+  | | +--------------+  |       |
| | | Holz kaufen  |  | | | Chassis      |  | | | Design       |  |       |
| | | 🔴 Dringend   |  | | | bauen        |  | | | fertigstellen|  |       |
| | | 👤 Max M.     |  | | | 👤👤 2        |  | | |              |  |       |
| | | 📎 2  ☑ 3/5   |  | | | ⏰ 20.02.     |  | | | ✓ Erledigt   |  |       |
| | +--------------+  | | +--------------+  | | +--------------+  |       |
| |                   | |                   | |                   |       |
| | +--------------+  | | +--------------+  | | ...               |       |
| | | Farbe        |  | | | ...           |  | |                   |       |
| | | besorgen     |  | | |               |  | |                   |       |
| | +--------------+  | | +--------------+  | |                   |       |
| |                   | |                   | |                   |       |
| | ...               | |                   | |                   |       |
| +-------------------+ +-------------------+ +-------------------+       |
|                                                                         |
+-----------------------------------------------------------------------+
```

### Task-Detail-Panel (Slide-over)

```
+--------------------------------------------------+
| Holz kaufen für Grundgerüst              [X]     |
+--------------------------------------------------+
|                                                   |
| Status: Zu erledigen                              |
| Priorität: [🔴 Dringend        v]                |
| Deadline: [20.02.2026          📅]               |
|                                                   |
| Beschreibung                                      |
| [                                              ]  |
| [Baumarkt-Besuch planen. Benötigt:            ]  |
| [- 10x Balken 3m                              ]  |
| [- 20x Latten                                 ]  |
| [                                              ]  |
|                                                   |
| Zugewiesen an                                     |
| [👤 Max M.] [x] [👤 Lisa S.] [x]  [+ Hinzufügen] |
|                                                   |
| Labels                                            |
| [Material] [Einkauf]              [+ Label]      |
|                                                   |
| Checkliste (3/5)                                  |
| [x] Maße ermitteln                               |
| [x] Preise vergleichen                           |
| [x] Transporter organisieren                      |
| [ ] Einkaufen                                     |
| [ ] Material liefern                              |
| [+ Punkt hinzufügen]                             |
|                                                   |
| Anhänge (2)                                       |
| [📄 Materialliste.pdf] [x]                       |
| [🖼 Skizze.jpg]        [x]                       |
| [+ Datei anhängen]                               |
|                                                   |
+--------------------------------------------------+
| Erstellt von Max M. am 10.02.2026                |
+--------------------------------------------------+
|              [Task löschen]  [Speichern]         |
+--------------------------------------------------+
```

### Filter-Leiste

```
+-----------------------------------------------------------------------+
| [🔍 Suchen...]  [Zugewiesen: Alle v] [Label: Alle v] [Nur meine ☐]   |
| [Priorität: Alle v] [Überfällige anzeigen ☐]                         |
+-----------------------------------------------------------------------+
```

### "Meine Tasks" Dashboard-Widget

```
+------------------------------------------+
| Meine Tasks                   [Alle →]   |
+------------------------------------------+
| 🔴 Holz kaufen                           |
|    Wagenbau 2026 | Fällig: 20.02.        |
| ⚠️ Budget erstellen                      |
|    Sommerfest Orga | Fällig: HEUTE       |
| 🟡 Kostüme ausmessen                     |
|    Kostüm-Team | Fällig: 25.02.          |
+------------------------------------------+
```

---

## Nicht im Scope

- Automatische Task-Zuweisung
- Zeiterfassung pro Task
- Gantt-Diagramm Ansicht
- Sprint-Planung / Story Points
- Task-Vorlagen
- Automatische Benachrichtigungen (außer Dashboard-Widget)
- Integration mit externen Tools (Slack, Teams)
- Workgroup-übergreifende Abhängigkeiten

---

## Folge-Features

Nach PROJ-29 könnte erweitert werden:

1. **PROJ-32: Workgroup-Chat** - Echtzeit-Kommunikation mit Auto-Löschung
2. **PROJ-33: Task-Kommentare** - Diskussion direkt am Task
3. **PROJ-34: Benachrichtigungen** - Push/Email bei Zuweisung oder Deadline

---

## Checklist vor Abschluss

- [x] Fragen gestellt: User hat alle wichtigen Fragen beantwortet
- [x] User Stories komplett: 8 User Stories definiert
- [x] Acceptance Criteria konkret: Jedes Kriterium ist testbar
- [x] Edge Cases identifiziert: 8 Edge Cases dokumentiert
- [x] Feature-ID vergeben: PROJ-29
- [x] File gespeichert: `/features/PROJ-29-workgroup-kanban.md`
- [x] Status gesetzt: 🔵 Planned
- [ ] User Review: Ausstehend

---

## Git Workflow

```bash
git commit -m "feat(PROJ-29): Add workgroup kanban-board specification"
```
