# PROJ-5: Beitragsarten-Verwaltung (Membership Types)

## Status: Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-3 (Role-Based Dashboards) - für Admin-Bereich Navigation
- Benötigt: PROJ-4 (Member Management) - Beitragsarten werden Mitgliedern zugewiesen

## Übersicht
Verwaltung der verschiedenen Beitragsarten (z.B. Erwachsener, Kind, Familie-Flat). Der Vorstand kann eigene Beitragsarten erstellen, bearbeiten und löschen. Diese Beitragsarten bilden die Grundlage für die Beitragsberechnung in PROJ-6.

**Route:** `/admin/finances/membership-types` (nur für Board-Rolle)

---

## User Stories

### US-1: Beitragsarten-Übersicht
**Als** Vorstandsmitglied
**möchte ich** alle definierten Beitragsarten in einer Liste sehen
**um** einen Überblick über die Beitragsstruktur des Vereins zu haben.

### US-2: Beitragsart erstellen
**Als** Vorstandsmitglied
**möchte ich** eine neue Beitragsart anlegen können (z.B. "Kind unter 14")
**um** die Beitragsstruktur an die Vereinsbedürfnisse anzupassen.

### US-3: Beitragsart bearbeiten
**Als** Vorstandsmitglied
**möchte ich** eine bestehende Beitragsart ändern können (Name, Betrag)
**um** auf Preisänderungen oder Umbenennungen reagieren zu können.

### US-4: Beitragsart löschen
**Als** Vorstandsmitglied
**möchte ich** eine nicht mehr benötigte Beitragsart löschen können
**um** die Liste übersichtlich zu halten.

### US-5: Beitragsart einem Mitglied zuweisen
**Als** Vorstandsmitglied
**möchte ich** einem Mitglied eine Beitragsart zuweisen können
**um** den korrekten Jahresbeitrag für diese Person festzulegen.

---

## Acceptance Criteria

### Beitragsarten-Tabelle (Hauptansicht)
- [ ] **Spalten:** Name, Jahresbetrag (€), Beschreibung, Anzahl zugewiesener Mitglieder, Aktionen
- [ ] **Sortierung:** Alphabetisch nach Name (Default)
- [ ] **Leere State:** Hinweis "Noch keine Beitragsarten definiert" + Button zum Erstellen
- [ ] **Responsive:** Auf Mobile: Name und Betrag sichtbar, Rest im Detail-View

### Beitragsart erstellen (Modal)
- [ ] **Pflichtfelder:**
  - Name (z.B. "Erwachsener", "Kind unter 14", "Familie-Flat")
  - Jahresbetrag in Euro (Dezimalzahl, 2 Nachkommastellen)
- [ ] **Optionale Felder:**
  - Beschreibung (Freitext, z.B. "Für Mitglieder ab 18 Jahren")
- [ ] **Validierung:**
  - Name: Mindestens 2 Zeichen, maximal 50 Zeichen
  - Name: Muss eindeutig sein (kein Duplikat)
  - Betrag: Positiv, mindestens 0.00 €
- [ ] **Speichern:** Button "Beitragsart erstellen" → Erfolgs-Toast → Liste aktualisieren

### Beitragsart bearbeiten (Modal)
- [ ] Öffnet sich durch Klick auf "Bearbeiten" in der Aktions-Spalte
- [ ] Alle Felder vorausgefüllt mit aktuellen Daten
- [ ] Änderungen werden erst bei "Speichern" übernommen
- [ ] Abbrechen-Button schließt ohne Änderungen
- [ ] **Hinweis:** "Änderungen gelten für zukünftige Beiträge. Bereits generierte Beiträge bleiben unverändert."

### Beitragsart löschen
- [ ] Button "Löschen" in Aktions-Dropdown
- [ ] **Bestätigungs-Dialog:** "Beitragsart '[Name]' wirklich löschen?"
- [ ] **Verhindert wenn:** Mitglieder mit dieser Beitragsart existieren
  - Fehlermeldung: "Beitragsart kann nicht gelöscht werden. X Mitglieder haben diese Beitragsart zugewiesen."
- [ ] Bei Erfolg: Erfolgs-Toast "Beitragsart gelöscht"

### Zuweisung im Mitglied-Formular (Integration mit PROJ-4)
- [ ] **Neues Feld in Mitglied-Formular:** Dropdown "Beitragsart"
- [ ] **Optionen:** Alle aktiven Beitragsarten + "Keine (beitragsfrei)"
- [ ] **Default:** "Keine" für neue Mitglieder
- [ ] **Anzeige:** In Mitglieder-Tabelle als neue Spalte "Beitragsart"

---

## Edge Cases

### Erstellung
- **Name bereits vergeben?** → Fehler: "Eine Beitragsart mit diesem Namen existiert bereits"
- **Betrag 0 €?** → Erlaubt (z.B. für Ehrenmitglieder)
- **Sehr hoher Betrag (>10.000 €)?** → Erlaubt, aber Warnung: "Betrag ungewöhnlich hoch. Fortfahren?"

### Bearbeitung
- **Betrag ändern während laufendem Jahr?** → Erlaubt, gilt nur für zukünftige Beiträge
- **Name einer zugewiesenen Beitragsart ändern?** → Erlaubt, Mitglieder-Anzeige aktualisiert sich

### Löschung
- **Beitragsart mit zugewiesenen Mitgliedern löschen?** → Verhindert (siehe AC)
- **Letzte Beitragsart löschen?** → Erlaubt (Verein kann ohne Beiträge existieren)

### Zuweisung
- **Mitglied hat Beitragsart, diese wird gelöscht?** → Kann nicht passieren (Löschung verhindert)
- **Familie mit verschiedenen Beitragsarten?** → Erlaubt (jedes Mitglied kann andere Art haben)
- **Familie-Flat: Wer bekommt die Zuweisung?** → Nur der Primärkontakt, andere Familienmitglieder bekommen "Keine"

---

## Technische Anforderungen

### Datenbank-Schema

```sql
-- Neue Tabelle: membership_types
CREATE TABLE membership_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  annual_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Erweiterung der profiles Tabelle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  membership_type_id UUID REFERENCES membership_types(id);

-- RLS Policies
-- Nur Board kann Beitragsarten sehen und verwalten
CREATE POLICY "vorstand_select_membership_types" ON membership_types
FOR SELECT TO authenticated USING (is_vorstand());

CREATE POLICY "vorstand_insert_membership_types" ON membership_types
FOR INSERT TO authenticated WITH CHECK (is_vorstand());

CREATE POLICY "vorstand_update_membership_types" ON membership_types
FOR UPDATE TO authenticated USING (is_vorstand());

CREATE POLICY "vorstand_delete_membership_types" ON membership_types
FOR DELETE TO authenticated USING (is_vorstand());
```

### API-Endpunkte

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/membership-types` | Liste aller Beitragsarten |
| POST | `/api/membership-types` | Neue Beitragsart erstellen |
| PATCH | `/api/membership-types/:id` | Beitragsart bearbeiten |
| DELETE | `/api/membership-types/:id` | Beitragsart löschen |

### Komponenten-Struktur

```
src/
├── app/
│   └── (dashboard)/
│       └── admin/
│           └── finances/
│               └── membership-types/
│                   └── page.tsx           # Hauptseite Beitragsarten
├── components/
│   └── finances/
│       ├── membership-types-table.tsx     # DataTable
│       └── membership-type-form.tsx       # Anlegen/Bearbeiten Formular
```

---

## UI/UX Spezifikationen

### Navigation
- Neuer Menüpunkt in Admin-Sidebar: "Finanzen" (Collapsible)
  - Untermenü: "Beitragsarten"
  - (später: "Beitrags-Übersicht", "Zahlungen", "Vereinskasse")

### Layout der Seite
```
┌─────────────────────────────────────────────────────────┐
│ Header: "Beitragsarten"               [+ Beitragsart]   │
├─────────────────────────────────────────────────────────┤
│ Name            │ Jahresbetrag │ Mitglieder │ Aktionen  │
│ Erwachsener     │ 120,00 €     │ 45         │ ⋮         │
│ Kind unter 14   │ 60,00 €      │ 23         │ ⋮         │
│ Familie-Flat    │ 200,00 €     │ 12         │ ⋮         │
│ Ehrenmitglied   │ 0,00 €       │ 3          │ ⋮         │
└─────────────────────────────────────────────────────────┘
```

### Betrag-Formatierung
- Immer mit 2 Dezimalstellen: "120,00 €"
- Tausender-Trennzeichen: "1.200,00 €"
- Deutsche Locale (de-DE)

---

## Nicht im Scope

- Automatische Altersberechnung für Beitragsart (Kind/Erwachsener)
- Beitragsart mit Gültigkeitszeitraum (von-bis)
- Import/Export von Beitragsarten
- Mehrere Beitragsarten pro Mitglied

---

## Checkliste vor Abschluss

- [x] User Stories definiert (5 Stories)
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases identifiziert
- [x] Technische Anforderungen dokumentiert
- [x] Feature-ID vergeben: PROJ-5
- [x] Status gesetzt: Planned
- [ ] User Review: Ausstehend
