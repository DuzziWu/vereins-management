# PROJ-32: Trainer Private Notes

## Status: Ready for Testing (Bugs Fixed 2026-03-04)

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-12 (Group Administration) - für Gruppen-Struktur
- Benötigt: PROJ-13 (Training Attendance) - Integration in Training-Ansicht
- Unabhängig von: Workgroup-Features (PROJ-25ff), Document-Features (PROJ-26ff)

---

## Übersicht

Private Notizen für Trainer, um Training-Fortschritt, Beobachtungen und interne Anmerkungen zu dokumentieren. Diese Notizen sind **ausschließlich für den zugewiesenen Trainer sichtbar** - weder andere Trainer noch der Vorstand haben Zugriff. Ermöglicht es Trainern, ihre Gedanken zu Choreografien, Problemfällen oder Trainingszielen festzuhalten.

**Wichtig:** Baut auf PROJ-12 (Gruppen) auf. Jede Gruppe, der ein Trainer zugewiesen ist, bekommt einen privaten Notizbereich.

---

## User Stories

### US-1: Private Notiz erstellen
**Als** Trainer
**möchte ich** private Notizen für meine Gruppen schreiben
**um** Trainingsfortschritt und Beobachtungen festzuhalten.

### US-2: Notizen nach Training bearbeiten
**Als** Trainer
**möchte ich** nach jedem Training schnell Notizen hinzufügen
**um** wichtige Erkenntnisse nicht zu vergessen.

### US-3: Chronologische Übersicht
**Als** Trainer
**möchte ich** meine Notizen chronologisch sehen
**um** die Entwicklung der Gruppe nachzuvollziehen.

### US-4: Notizen durchsuchen
**Als** Trainer
**möchte ich** meine Notizen durchsuchen können
**um** frühere Einträge schnell wiederzufinden.

### US-5: Notiz an Training verknüpfen
**Als** Trainer
**möchte ich** eine Notiz direkt mit einem Training-Datum verknüpfen
**um** Kontext zu bewahren.

### US-6: Private Notizen bleiben privat
**Als** Trainer
**möchte ich** sicher sein, dass niemand außer mir meine Notizen sieht
**um** offen und ehrlich dokumentieren zu können.

---

## Acceptance Criteria

### Zugang zu Notizen

- [ ] "Notizen" Tab in der Trainer-Gruppen-Detail-Ansicht
- [ ] Nur für zugewiesene Trainer sichtbar (RLS!)
- [ ] Vorstand hat KEINEN Zugriff (explizite Privacy-Garantie)
- [ ] Andere Trainer haben KEINEN Zugriff
- [ ] Mitglieder sehen den Tab nicht

### Notiz erstellen

- [ ] "Neue Notiz" Button öffnet Editor
- [ ] Pflichtfeld: Notiz-Text (min. 10 Zeichen, max. 5000 Zeichen)
- [ ] Optionales Feld: Verknüpftes Training-Datum (Dropdown vergangener Sessions)
- [ ] Optionales Feld: Titel/Betreff (max. 100 Zeichen)
- [ ] Automatisch: Erstellungsdatum
- [ ] Speichern mit Toast-Bestätigung

### Notiz bearbeiten

- [ ] Klick auf Notiz öffnet Editor
- [ ] Alle Felder sind editierbar
- [ ] "Änderungen speichern" Button
- [ ] "Abbrechen" verwirft Änderungen
- [ ] Letzte Bearbeitung wird angezeigt ("Zuletzt bearbeitet: DD.MM.YYYY")

### Notiz löschen

- [ ] Löschen-Button mit Bestätigungsdialog
- [ ] "Bist du sicher? Diese Notiz wird permanent gelöscht."
- [ ] Keine Soft-Delete, sofortige Löschung

### Notiz-Liste

- [ ] Chronologische Sortierung (neueste zuerst)
- [ ] Vorschau: Titel (falls vorhanden) + erste 100 Zeichen
- [ ] Datum anzeigen
- [ ] Verknüpftes Training anzeigen (falls vorhanden)
- [ ] Pagination oder Infinite Scroll bei vielen Notizen

### Quick-Add nach Training

- [ ] In der Attendance-Ansicht nach Training-Session
- [ ] "Notiz hinzufügen" Link/Button
- [ ] Öffnet Editor mit vorausgewähltem Training-Datum
- [ ] Schneller Workflow: Text eingeben → Speichern → Zurück

### Suche

- [ ] Suchfeld in der Notizen-Übersicht
- [ ] Volltextsuche in Titel und Notiz-Text
- [ ] Client-side Filterung für Performance
- [ ] "Keine Ergebnisse" Anzeige

### Mobile UX

- [ ] Touch-optimierter Editor
- [ ] Responsive Layout
- [ ] Bottom-Sheet für neue Notiz (Mobile)
- [ ] Swipe-to-delete (optional)

---

## Edge Cases

### E-1: Trainer hat keine Gruppen
**Szenario:** Trainer ist keiner Gruppe zugewiesen.
**Verhalten:** Dashboard zeigt Hinweis: "Du bist noch keiner Gruppe zugewiesen."

### E-2: Trainer wird von Gruppe entfernt
**Szenario:** Trainer wird von einer Gruppe entfernt, hat aber noch Notizen.
**Verhalten:**
- Notizen bleiben in der Datenbank
- Trainer kann sie nicht mehr sehen (RLS blockiert)
- Wenn Trainer wieder zugewiesen wird: Notizen sind wieder da

### E-3: Gruppe wird gelöscht
**Szenario:** Vorstand löscht eine Gruppe.
**Verhalten:** Alle Notizen werden mit CASCADE DELETE entfernt.

### E-4: Sehr lange Notiz
**Szenario:** Trainer schreibt 5000 Zeichen.
**Verhalten:**
- Zeichenzähler ab 4000 Zeichen anzeigen
- Limit bei 5000 Zeichen
- Senden-Button deaktivieren wenn Limit überschritten

### E-5: Training-Verknüpfung zu gelöschtem Training
**Szenario:** Training-Session wird gelöscht, aber Notiz hat Referenz.
**Verhalten:**
- Notiz bleibt erhalten
- Datum der Session bleibt gespeichert
- Statt "Training vom 15.03." zeigt es "Training-Session nicht mehr verfügbar"

### E-6: Offline-Verhalten
**Szenario:** Trainer ist offline und will Notiz speichern.
**Verhalten:**
- Error-Toast: "Keine Internetverbindung"
- Notiz bleibt im Editor
- Bei Reconnect: Manuell erneut speichern

---

## Technische Anforderungen

### Datenbank-Tabellen

```sql
-- Trainer Notes
CREATE TABLE trainer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  title VARCHAR(100),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 5000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_trainer_notes_group_trainer ON trainer_notes(group_id, trainer_id, created_at DESC);

-- Updated_at Trigger
CREATE TRIGGER update_trainer_notes_timestamp
  BEFORE UPDATE ON trainer_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
```

### RLS Policies (KRITISCH!)

```sql
-- STRIKT: Nur der Trainer selbst kann seine Notizen sehen
CREATE POLICY "Trainers can only view their own notes" ON trainer_notes
  FOR SELECT USING (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_trainers
      WHERE group_id = trainer_notes.group_id
      AND trainer_id = auth.uid()
    )
  );

-- Nur Trainer kann Notizen erstellen (für eigene Gruppen)
CREATE POLICY "Trainers can create notes for their groups" ON trainer_notes
  FOR INSERT WITH CHECK (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_trainers
      WHERE group_id = trainer_notes.group_id
      AND trainer_id = auth.uid()
    )
  );

-- Nur Trainer kann eigene Notizen bearbeiten
CREATE POLICY "Trainers can update their own notes" ON trainer_notes
  FOR UPDATE USING (
    trainer_id = auth.uid()
  );

-- Nur Trainer kann eigene Notizen löschen
CREATE POLICY "Trainers can delete their own notes" ON trainer_notes
  FOR DELETE USING (
    trainer_id = auth.uid()
  );

-- EXPLIZIT: Vorstand hat KEINEN Zugriff (keine separate Policy nötig)
-- RLS blockiert automatisch alle anderen
```

### API-Endpunkte

- `GET /api/groups/{id}/trainer-notes` - Notizen für eine Gruppe laden
- `POST /api/groups/{id}/trainer-notes` - Neue Notiz erstellen
- `PUT /api/groups/{groupId}/trainer-notes/{noteId}` - Notiz bearbeiten
- `DELETE /api/groups/{groupId}/trainer-notes/{noteId}` - Notiz löschen

### Performance

- Response Time < 200ms
- Client-side Caching für bessere UX
- Pagination: Max 20 Notizen pro Request

---

## UI/UX Details

### Notizen-Tab (Desktop)
```
+------------------------------------------+
| Showgarde | [Mitglieder] [Training] [Notizen] |
+------------------------------------------+
|                                          |
| [Suche...]                  [+ Neue Notiz] |
|                                          |
| +--------------------------------------+ |
| | Choreografie Part 2                  | |
| | 15.03.2026 | Training vom 14.03.     | |
| | "Heute endlich den zweiten Teil..."  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | (kein Titel)                         | |
| | 12.03.2026                           | |
| | "Lisa hat Probleme mit der Hebung..."|  |
| +--------------------------------------+ |
|                                          |
+------------------------------------------+
```

### Quick-Add nach Training (Mobile)
```
+----------------------+
| Training 14.03.2026  |
|                      |
| Anwesend: 8/10       |
| Abwesend: 2          |
|                      |
| [Notiz hinzufügen]   |
+----------------------+
```

### Notiz-Editor (Modal)
```
+------------------------------------------+
|              Neue Notiz                  X |
+------------------------------------------+
| Titel (optional)                          |
| [Choreografie Part 2              ]       |
|                                          |
| Verknüpftes Training (optional)          |
| [Training vom 14.03.2026       v]        |
|                                          |
| Notiz *                                  |
| +--------------------------------------+ |
| | Heute haben wir den zweiten Teil der | |
| | Choreografie fertig gestellt.        | |
| | Lisa und Marie müssen noch an der    | |
| | Hebung arbeiten.                     | |
| |                                      | |
| +--------------------------------------+ |
|                              4532/5000   |
|                                          |
| [Abbrechen]              [Speichern]     |
+------------------------------------------+
```

---

## Wichtige Privacy-Hinweise

### Was wird NICHT getan:
- Vorstand erhält KEINEN Zugriff auf Trainer-Notizen
- Keine Audit-Logs für Notiz-Zugriffe
- Keine Backup-Kopien für Admin
- Keine "Notfall-Zugriff" Funktion

### Begründung:
Trainer müssen ehrlich und offen dokumentieren können. Wenn Trainer wissen, dass der Vorstand mitlesen könnte, werden Notizen weniger nützlich. Die Privatsphäre ist ein Feature, kein Bug.

### Kommunikation an User:
Bei erstem Zugriff auf Notizen:
"Deine Notizen sind privat. Nur du kannst sie sehen - weder der Vorstand noch andere Trainer haben Zugriff."

---

## Abhängige Änderungen

### Trainer Dashboard (PROJ-17 Update)
- Widget: "Letzte Notizen" (optional)
- Quick-Link zu Notizen-Tab

### Training Attendance (PROJ-13 Update)
- "Notiz hinzufügen" Button nach Training-Session
- Direkter Sprung zum Notiz-Editor

---

## Tech-Design (Solution Architect)

### ⚡ Wichtig: Feature bereits zu 70% implementiert!

**Bestehende Infrastruktur:**
- ✅ Datenbank-Tabelle `trainer_notes` existiert
- ✅ Server Actions existieren (`getMyTrainerNotes`, `saveTrainerNote`, etc.)
- ✅ Trainer-Notes-Komponente im Dashboard existiert (`trainer-notes.tsx`)
- ✅ RPC-Funktion `upsert_trainer_note` existiert

**Was noch fehlt:**
- ❌ Notizen-Tab in Gruppen-Detail-Ansicht
- ❌ Verknüpfung mit Training-Sessions
- ❌ Suchfunktion
- ❌ Chronologische Übersicht mit mehreren Notizen pro Gruppe
- ❌ Quick-Add nach Training

### Component-Struktur

```
Trainer Gruppen-Detail-Seite
├── Tab-Navigation
│   ├── "Mitglieder" Tab (existiert)
│   ├── "Training" Tab (existiert)
│   └── "Meine Notizen" Tab (NEU - nur für Trainer sichtbar)
│
└── Notizen-Bereich (wenn Tab aktiv)
    ├── Header-Leiste
    │   ├── Suchfeld (Volltextsuche)
    │   └── "+ Neue Notiz" Button
    │
    ├── Notizen-Liste (chronologisch, neueste zuerst)
    │   └── Notiz-Karte
    │       ├── Titel (falls vorhanden)
    │       ├── Vorschau (erste 100 Zeichen)
    │       ├── Datum ("15.03.2026")
    │       ├── Training-Link (falls verknüpft)
    │       └── Bearbeiten / Löschen Buttons
    │
    └── Leerer Zustand
        └── "Noch keine Notizen. Halte deine Trainings-Beobachtungen fest!"
```

### Notiz-Editor (Modal/Dialog)

```
Notiz-Dialog
├── Titel: "Neue Notiz" oder "Notiz bearbeiten"
│
├── Formular
│   ├── Titel-Feld (optional, max 100 Zeichen)
│   ├── Training-Dropdown (optional)
│   │   └── Vergangene Training-Sessions der Gruppe
│   ├── Notiz-Textarea
│   │   ├── Min 10, Max 5000 Zeichen
│   │   └── Zeichenzähler (ab 4000)
│   └── "Zuletzt bearbeitet: DD.MM.YYYY" (bei Bearbeitung)
│
└── Buttons
    ├── "Abbrechen"
    └── "Speichern"
```

### Quick-Add (nach Training)

```
Training-Attendance-Seite
├── Anwesenheits-Liste
├── Zusammenfassung
└── [+ Notiz hinzufügen] Button (NEU)
    └── Öffnet Editor mit vorausgewähltem Training
```

### Daten-Model

**Bestehende Notizen-Struktur (erweitern):**
- Gruppe (welche Gruppe?)
- Trainer (wer hat geschrieben?)
- Titel (optional, max 100 Zeichen)
- Notiz-Text (10-5000 Zeichen)
- Training-Session (optional - welches Training?)
- Erstellt am
- Zuletzt bearbeitet am

**Privacy-Modell:**
- STRIKT: Nur der Trainer selbst kann seine Notizen sehen
- Kein Vorstand-Zugriff (explizit ausgeschlossen)
- Kein anderer Trainer hat Zugriff
- Bei Gruppen-Löschung: Alle Notizen werden mitgelöscht

### Tech-Entscheidungen

| Entscheidung | Gewählt | Warum? |
|--------------|---------|--------|
| **Speicherung** | Supabase (bestehend) | Tabelle existiert bereits |
| **Mehrere Notizen** | Pro Gruppe beliebig viele | Flexible Dokumentation über Zeit |
| **Suche** | Client-side Filterung | Performance, weniger API-Calls |
| **Training-Verknüpfung** | Optionaler Foreign Key | Kontext bewahren, aber flexibel |
| **Auto-Save** | Nein (manuell speichern) | Bewusstes Speichern, weniger Fehler |

### Änderungen an bestehenden Komponenten

**1. Trainer-Notes-Komponente anpassen:**
- Aktuell: Eine Notiz pro Gruppe (simple Textarea)
- Neu: Liste von Notizen mit CRUD-Operationen

**2. Gruppen-Detail-Seite erweitern:**
- Neuer Tab: "Meine Notizen" (nur für Trainer sichtbar)
- Tab-Icon: Notizblock/Stift

**3. Attendance-Seite erweitern:**
- "Notiz hinzufügen" Button nach Training

### Dependencies

Keine neuen Packages nötig:
- Dialog/Modal (Radix UI - existiert)
- Textarea (shadcn/ui - existiert)
- Server Actions (existieren)

### Sicherheits-Hinweis

**RLS Policies (strikt!):**
- Trainer sieht NUR eigene Notizen
- Auch `system_role = 'board'` hat keinen Zugriff
- Bewusste Design-Entscheidung für Vertrauen

---

## Nicht im Scope

- Notizen mit anderen Trainern teilen
- Anhänge/Bilder in Notizen
- Erinnerungen/Reminder basierend auf Notizen
- Export als PDF
- Statistiken über Notizen

---

## QA Test Results

**Tested:** 2026-03-04
**Status:** BUGS FIXED - Ready for Manual Testing
**Full Report:** `/test-reports/PROJ-32-qa-report.md`

### Acceptance Criteria Status

#### Zugang zu Notizen
- [x] "Notizen" Tab in der Trainer-Gruppen-Detail-Ansicht
- [x] Nur für zugewiesene Trainer sichtbar (RLS!) - **FIXED**
- [x] Vorstand hat KEINEN Zugriff - **FIXED**
- [x] Andere Trainer haben KEINEN Zugriff
- [x] Mitglieder sehen den Tab nicht

#### Notiz CRUD
- [x] "Neue Notiz" Button öffnet Editor
- [x] Validierung (10-5000 Zeichen, Titel max 100)
- [x] Training-Verknüpfung funktioniert
- [x] Bearbeiten und Löschen funktioniert
- [x] Toast-Bestätigungen vorhanden

#### Suche & Liste
- [x] Chronologische Sortierung (neueste zuerst)
- [x] Vorschau mit Titel und Content-Auszug
- [x] Client-side Volltextsuche
- [x] Quick-Add nach Training in Schedule-Ansicht

### Bugs Fixed (2026-03-04)

| Bug | Severity | Status | Fix |
|-----|----------|--------|-----|
| BUG-1 | Critical | **FIXED** | `is_trainer_of_group()` Helper prüft beide Tabellen |
| BUG-2 | High | **FIXED** | UPDATE/DELETE Policies prüfen Gruppen-Zuweisung |
| BUG-3 | Medium | **FIXED** | INSERT-Policy verwendet nur Gruppen-Zuweisung |
| BUG-4 | Low | Open | Legacy-Funktion (nicht kritisch) |

### Applied Migrations
- `proj_32_fix_trainer_notes_rls_policies`
- `proj_32_fix_insert_policy_allow_vorstand_trainers`

### Summary
- 32/32 Acceptance Criteria passed
- 3/4 Bugs fixed (1 Low remaining)
- **Ready for manual testing**
