# PROJ-26: Document Folder-System

## Status: Planned

## Abhangigkeiten
- Benotigt: PROJ-1 (User Authentication) - fur eingeloggte User-Checks
- Benotigt: PROJ-3 (Role-Based Dashboards) - fur rollenbasierte Sichtbarkeit
- Unabhangig von: Workgroup-Features (PROJ-25ff)

---

## Ubersicht

Ein sicheres, hierarchisches Ordner-System fur Vereinsdokumente. Vorstand kann Ordnerstrukturen erstellen und verwalten. Berechtigungen werden hierarchisch vererbt - Zugriff auf einen Ordner bedeutet automatisch Zugriff auf alle Unterordner.

**Wichtig:** Dies ist das Basis-Feature fur DOC-01. Document-Upload, Tiered Access Control und Read Confirmations werden in separaten Features spezifiziert.

---

## User Stories

### US-1: Ordner erstellen
**Als** Vorstand
**mochte ich** Ordner mit Namen und optionaler Beschreibung erstellen
**um** Dokumente thematisch zu organisieren.

### US-2: Ordner verschachteln
**Als** Vorstand
**mochte ich** Unterordner innerhalb von Ordnern erstellen
**um** eine logische Hierarchie aufzubauen.

### US-3: Ordner umbenennen
**Als** Vorstand
**mochte ich** bestehende Ordner umbenennen
**um** die Struktur anzupassen.

### US-4: Ordnerstruktur navigieren
**Als** Vereinsmitglied
**mochte ich** durch die Ordnerstruktur navigieren
**um** Dokumente zu finden.

### US-5: Breadcrumb-Navigation
**Als** User
**mochte ich** jederzeit sehen wo ich mich in der Ordnerstruktur befinde
**um** mich zu orientieren.

### US-6: Ordner loschen
**Als** Vorstand
**mochte ich** leere Ordner loschen konnen
**um** die Struktur aufzuraumen.

---

## Acceptance Criteria

### Ordner CRUD

- [ ] Neuer Menupunkt "Dokumente" in Navigation (alle Rollen)
- [ ] Vorstand sieht alle Ordner, Mitglieder nur freigegebene
- [ ] "Neuer Ordner" Button (nur Vorstand) offnet Dialog
- [ ] Pflichtfeld: Name (min. 2, max. 100 Zeichen)
- [ ] Optionales Feld: Beschreibung (max. 500 Zeichen)
- [ ] Ordner umbenennen uber Kontext-Menu (Rechtsklick oder [...]-Button)
- [ ] Ordner loschen mit Bestatigungsdialog
- [ ] Nur leere Ordner konnen geloscht werden

### Hierarchie & Verschachtelung

- [ ] Maximale Verschachtelungstiefe: 5 Ebenen
- [ ] Unterordner erben automatisch die Berechtigungen des Eltern-Ordners
- [ ] Ordner konnen per Drag & Drop verschoben werden (optional, nice-to-have)
- [ ] Verschieben eines Ordners aktualisiert alle Unterordner-Pfade
- [ ] Zirkulare Referenzen werden verhindert (Ordner kann nicht in sich selbst verschoben werden)

### Berechtigungsvererbung (Hierarchisch)

- [ ] Root-Ordner haben Standard-Berechtigung: "Nur Vorstand"
- [ ] Berechtigung wird an alle Unterordner vererbt
- [ ] Vererbte Berechtigung kann in Unterordnern NICHT eingeschrankt werden
- [ ] Vererbte Berechtigung kann in Unterordnern erweitert werden (z.B. Gruppe hinzufugen)
- [ ] Icon zeigt an ob Berechtigung vererbt (Kettensymbol) oder explizit gesetzt

### Navigation & UI

- [ ] Ordner werden als Baum-Struktur angezeigt (wie Datei-Explorer)
- [ ] Ordner konnen auf-/zugeklappt werden (Collapse/Expand)
- [ ] Breadcrumb zeigt aktuellen Pfad: Home > Protokolle > 2026 > Januar
- [ ] Breadcrumb-Elemente sind klickbar fur schnelle Navigation
- [ ] Leerer Ordner zeigt Platzhalter: "Dieser Ordner ist leer"
- [ ] Ordner-Icons unterscheiden zwischen leer/nicht-leer

### Sortierung & Filterung

- [ ] Standard-Sortierung: Alphabetisch nach Name
- [ ] Alternative: Nach Erstelldatum (neueste zuerst)
- [ ] Suchfeld fur Ordner-Namen (durchsucht aktuelle Ebene + Unterordner)

### System-Ordner (Vordefiniert)

- [ ] Bei Erstinstallation werden Default-Ordner angelegt:
  - "Protokolle" (nur Vorstand)
  - "Allgemeine Infos" (alle Mitglieder)
  - "Formulare" (alle Mitglieder)
- [ ] System-Ordner konnen umbenannt aber nicht geloscht werden
- [ ] System-Ordner sind mit Lock-Icon gekennzeichnet

---

## Edge Cases

### E-1: Ordner mit Dokumenten loschen
- **Szenario:** Vorstand versucht Ordner zu loschen der Dokumente enthalt
- **Losung:** Loschen blockiert
- **Meldung:** "Dieser Ordner enthalt X Dokumente. Bitte zuerst alle Dokumente loschen oder verschieben."

### E-2: Ordner mit Unterordnern loschen
- **Szenario:** Vorstand versucht Ordner zu loschen der Unterordner enthalt
- **Losung:** Loschen blockiert
- **Meldung:** "Dieser Ordner enthalt X Unterordner. Bitte zuerst alle Unterordner loschen."

### E-3: Maximale Verschachtelungstiefe erreicht
- **Szenario:** User versucht Ordner auf Ebene 6 zu erstellen
- **Losung:** Erstellen blockiert
- **Meldung:** "Maximale Ordner-Tiefe erreicht. Bitte einen Ordner weiter oben wahlen."

### E-4: Doppelter Ordnername auf gleicher Ebene
- **Szenario:** Zwei Ordner mit gleichem Namen im selben Parent-Ordner
- **Losung:** Nicht erlaubt (Unique-Constraint pro Parent)
- **Meldung:** "Ein Ordner mit diesem Namen existiert bereits in diesem Verzeichnis."

### E-5: Ordner in sich selbst verschieben
- **Szenario:** User versucht Ordner per Drag & Drop in seinen eigenen Unterordner zu verschieben
- **Losung:** Operation wird abgelehnt
- **Meldung:** "Ein Ordner kann nicht in sich selbst verschoben werden."

### E-6: Zugriff auf nicht-freigegebenen Ordner via URL
- **Szenario:** Mitglied versucht uber direkte URL auf nicht-freigegebenen Ordner zuzugreifen
- **Losung:** 403 Forbidden, Redirect zu Dokumente-Startseite
- **Meldung:** "Du hast keinen Zugriff auf diesen Ordner."

### E-7: Langer Ordner-Pfad in Breadcrumb
- **Szenario:** Pfad hat 5 Ebenen und passt nicht in die Breite
- **Losung:** Mittlere Elemente werden mit "..." kollabiert
- **Anzeige:** Home > ... > Unterordner > Aktuell

---

## Technische Anforderungen

### Datenbank (Supabase)

```sql
-- folders: Ordner-Hierarchie
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES folders(id) ON DELETE RESTRICT,
  path TEXT NOT NULL, -- Materialized Path: /uuid1/uuid2/uuid3
  depth INT NOT NULL DEFAULT 0,
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique name per parent (NULL parent = root level)
  CONSTRAINT folders_name_parent_unique UNIQUE (parent_id, name),
  -- Max depth constraint
  CONSTRAINT folders_max_depth CHECK (depth <= 5)
);

-- Index fur schnelle Pfad-Abfragen
CREATE INDEX idx_folders_path ON folders USING BTREE (path);
CREATE INDEX idx_folders_parent ON folders(parent_id);

-- folder_permissions: Zugriffsrechte
CREATE TABLE folder_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  -- Einer dieser drei muss gesetzt sein:
  role VARCHAR(20), -- 'vorstand', 'trainer', 'member'
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_inherited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Mindestens ein Ziel muss gesetzt sein
  CONSTRAINT folder_permissions_target CHECK (
    (role IS NOT NULL)::int +
    (group_id IS NOT NULL)::int +
    (profile_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_folder_permissions_folder ON folder_permissions(folder_id);

-- Default-Ordner einfugen (Migration)
-- Wird nach Projekt-Setup ausgefuhrt

-- RLS Policies
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_permissions ENABLE ROW LEVEL SECURITY;

-- Folders: Sichtbar wenn Berechtigung existiert
CREATE POLICY "folders_select" ON folders
  FOR SELECT TO authenticated USING (
    is_vorstand(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM folder_permissions fp
      WHERE (
        -- Direkter Ordner oder Parent-Ordner (Vererbung)
        folders.path LIKE fp.folder_id::text || '%' OR
        fp.folder_id = folders.id
      )
      AND (
        fp.role = get_user_role(auth.uid()) OR
        fp.group_id IN (SELECT group_id FROM group_members WHERE profile_id = auth.uid()) OR
        fp.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "folders_insert" ON folders
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "folders_update" ON folders
  FOR UPDATE TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "folders_delete" ON folders
  FOR DELETE TO authenticated USING (
    is_vorstand(auth.uid()) AND is_system_default = false
  );

-- Folder Permissions: Nur Vorstand verwaltet
CREATE POLICY "folder_permissions_select" ON folder_permissions
  FOR SELECT TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "folder_permissions_insert" ON folder_permissions
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "folder_permissions_delete" ON folder_permissions
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Funktion: Berechtigungen vererben bei neuem Unterordner
CREATE OR REPLACE FUNCTION inherit_folder_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    INSERT INTO folder_permissions (folder_id, role, group_id, profile_id, is_inherited)
    SELECT NEW.id, role, group_id, profile_id, true
    FROM folder_permissions
    WHERE folder_id = NEW.parent_id;
  ELSE
    -- Root-Ordner: Default = nur Vorstand
    INSERT INTO folder_permissions (folder_id, role, is_inherited)
    VALUES (NEW.id, 'vorstand', false);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inherit_folder_permissions
  AFTER INSERT ON folders
  FOR EACH ROW EXECUTE FUNCTION inherit_folder_permissions();
```

### Performance

- Materialized Path ermoglicht schnelle Unterordner-Abfragen: `WHERE path LIKE '/parent-uuid/%'`
- Depth-Column verhindert rekursive Abfragen fur Tiefenprufung
- Berechtigungen werden per JOIN mit Folders geladen

### Neue Dateien

```
src/app/(dashboard)/[role]/documents/page.tsx      - Hauptseite
src/app/(dashboard)/[role]/documents/[id]/page.tsx - Ordner-Ansicht
src/components/documents/folder-tree.tsx           - Baum-Komponente
src/components/documents/folder-breadcrumb.tsx     - Breadcrumb
src/components/documents/folder-form.tsx           - Erstellen/Bearbeiten Dialog
src/components/documents/folder-item.tsx           - Einzelner Ordner in Liste
src/lib/validations/folders.ts                     - Zod Schemas
src/hooks/use-folder-navigation.ts                 - Navigation State
```

---

## UI/UX Anforderungen

### Ordner-Ubersicht (Baum-Ansicht)

```
+-------------------------------------------------------------+
| Dokumente                                    [+ Neuer Ordner]|
+-------------------------------------------------------------+
| [Suche nach Ordnern oder Dokumenten...]                     |
+-------------------------------------------------------------+
|                                                              |
|  v Protokolle                                    [...]      |
|    > 2025                                                    |
|    v 2026                                                    |
|      > Januar                                                |
|      > Februar                                               |
|                                                              |
|  > Allgemeine Infos                              [...]      |
|                                                              |
|  > Formulare                                     [...]      |
|                                                              |
+-------------------------------------------------------------+
```

### Ordner-Ansicht (Inhalt)

```
+-------------------------------------------------------------+
| Home > Protokolle > 2026                                     |
+-------------------------------------------------------------+
| 2026                                      [+ Neuer Ordner]  |
| Protokolle aus dem Jahr 2026                [+ Dokument]    |
+-------------------------------------------------------------+
|                                                              |
|  [Ordner] Januar                            04.01.2026      |
|  [Ordner] Februar                           01.02.2026      |
|                                                              |
|  --- Dokumente ---                                          |
|  [PDF] Jahresplanung.pdf                    05.01.2026      |
|  [PDF] Budget.pdf                           05.01.2026      |
|                                                              |
+-------------------------------------------------------------+
```

### Ordner-Formular

```
+---------------------------------------------+
| Neuer Ordner                                |
+---------------------------------------------+
| Name *                                      |
| [                                    ]      |
|                                             |
| Beschreibung                                |
| [                                    ]      |
| [                                    ]      |
|                                             |
| Ubergeordneter Ordner                       |
| [Protokolle > 2026                  v]      |
|                                             |
| Berechtigungen (geerbt von: Protokolle)     |
| [x] Vorstand (geerbt, nicht anderbar)       |
| [ ] Trainer                                 |
| [ ] Alle Mitglieder                         |
| [ ] Spezifische Gruppen...                  |
|                                             |
+---------------------------------------------+
|              [Abbrechen]  [Erstellen]       |
+---------------------------------------------+
```

### Breadcrumb (Langer Pfad)

```
Normal:    Home > Protokolle > 2026 > Januar
Kollabiert: Home > ... > Januar   (bei Platzmangel)
                    ^
                    Klick zeigt Dropdown mit vollem Pfad
```

---

## Nicht im Scope

- Document-Upload & Versioning (PROJ-27)
- Tiered Access Control UI (PROJ-28) - hier nur Basis-Vererbung
- Read Confirmations (PROJ-29)
- Drag & Drop fur Ordner (Nice-to-Have, kann spater kommen)
- Papierkorb / Soft-Delete fur Ordner
- Ordner-Favoriten
- Ordner-Tags/Labels

---

## Folge-Features

Nach PROJ-26 werden diese Features die Document Cloud erweitern:

1. **PROJ-27: Document-Upload & Versioning** - Dokumente hochladen, Versionen verwalten
2. **PROJ-28: Tiered Access Control** - Granulare Berechtigungs-UI
3. **PROJ-29: Read Confirmations** - Lesebestatigungen tracken

---

## Checklist vor Abschluss

- [x] Fragen gestellt: User hat alle wichtigen Fragen beantwortet
- [x] User Stories komplett: 6 User Stories definiert
- [x] Acceptance Criteria konkret: Jedes Kriterium ist testbar
- [x] Edge Cases identifiziert: 7 Edge Cases dokumentiert
- [x] Feature-ID vergeben: PROJ-26
- [x] File gespeichert: `/features/PROJ-26-document-folder-system.md`
- [x] Status gesetzt: Planned
- [ ] User Review: Ausstehend

---

## Git Workflow

```bash
git commit -m "feat(PROJ-26): Add document folder system specification"
```
