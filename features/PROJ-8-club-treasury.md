# PROJ-8: Vereinskasse (Club Treasury)

## Status: Deployed (2026-01-29)

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-3 (Role-Based Dashboards) - für Admin-Bereich Navigation
- Optional: PROJ-7 (Payment Recording) - Beitragszahlungen können als Einnahmen referenziert werden

## Übersicht
Einfache Buchhaltung für allgemeine Vereinseinnahmen und -ausgaben. Erfassung von Sponsoring, Spenden, Materialkosten, Veranstaltungskosten etc. mit Kategorisierung. Keine doppelte Buchführung - nur Ein-/Ausgaben-Rechnung.

**Route:** `/admin/finances/treasury` (nur für Board-Rolle)

---

## User Stories

### US-1: Einnahme erfassen
**Als** Vorstandsmitglied (Kassenwart)
**möchte ich** eine Einnahme mit Kategorie und Beschreibung erfassen
**um** den Geldeingang zu dokumentieren.

### US-2: Ausgabe erfassen
**Als** Vorstandsmitglied (Kassenwart)
**möchte ich** eine Ausgabe mit Kategorie und Beschreibung erfassen
**um** Vereinskosten zu dokumentieren.

### US-3: Kassenbuch einsehen
**Als** Vorstandsmitglied
**möchte ich** alle Buchungen chronologisch sehen
**um** einen Überblick über die Finanzbewegungen zu haben.

### US-4: Kategorien verwalten
**Als** Vorstandsmitglied
**möchte ich** Einnahme- und Ausgabe-Kategorien selbst definieren
**um** die Buchhaltung an unseren Verein anzupassen.

### US-5: Kassenstand sehen
**Als** Vorstandsmitglied
**möchte ich** den aktuellen Kassenstand und Monats-/Jahresübersicht sehen
**um** die finanzielle Lage einzuschätzen.

### US-6: Beleg-Notiz hinterlegen
**Als** Vorstandsmitglied
**möchte ich** zu jeder Buchung eine Beleg-Referenz speichern
**um** die Buchung bei einer Kassenprüfung nachweisen zu können.

---

## Acceptance Criteria

### Kassenbuch-Tabelle (Hauptansicht)
- [ ] **Spalten:**
  - Datum
  - Beschreibung
  - Kategorie (mit Icon)
  - Einnahme (grün) ODER Ausgabe (rot)
  - Beleg-Nr./Notiz
  - Saldo (laufend)
  - Aktionen
- [ ] **Sortierung:** Neueste zuerst (Default), umkehrbar
- [ ] **Filter:**
  - Zeitraum (Monat/Jahr/Benutzerdefiniert)
  - Typ (Alle/Einnahmen/Ausgaben)
  - Kategorie (Multi-Select)
- [ ] **Suche:** Nach Beschreibung durchsuchbar

### Statistik-Karten (Header)
- [ ] **Karte 1:** Kassenstand aktuell (Summe aller Einnahmen - Ausgaben)
- [ ] **Karte 2:** Einnahmen (Zeitraum)
- [ ] **Karte 3:** Ausgaben (Zeitraum)
- [ ] **Karte 4:** Differenz (Zeitraum): Einnahmen - Ausgaben
- [ ] Zeitraum wählbar: Monat / Quartal / Jahr / Gesamt

### Buchung erfassen (Modal)
- [ ] **Typ-Auswahl:** Einnahme / Ausgabe (Toggle oder Tabs)
- [ ] **Pflichtfelder:**
  - Betrag (Dezimalzahl, 2 Nachkommastellen)
  - Datum (Datepicker, Default = heute)
  - Kategorie (Dropdown mit eigenen Kategorien)
  - Beschreibung (Freitext, min. 3 Zeichen)
- [ ] **Optionale Felder:**
  - Beleg-Nummer/Referenz (Freitext, z.B. "Rechnung R-2026-042")
  - Notiz (Freitext für Details)
- [ ] **Validierung:**
  - Betrag > 0
  - Datum nicht in der Zukunft
  - Kategorie muss gewählt sein
- [ ] **Schnelleingabe:** Nach Speichern → Modal bleibt offen für nächste Buchung (Toggle)

### Buchung bearbeiten
- [ ] Alle Felder nachträglich änderbar
- [ ] Änderungshistorie wird geführt (wer hat wann was geändert)
- [ ] Bestätigungs-Dialog bei Betragsänderung: "Betrag wirklich von X auf Y ändern?"

### Buchung löschen
- [ ] Soft-Delete mit Grund-Angabe
- [ ] Gelöschte Buchungen in separatem Tab sichtbar ("Papierkorb")
- [ ] Wiederherstellung möglich (innerhalb 30 Tagen)

### Kategorien verwalten (Unterseite oder Modal)
- [ ] **Zwei Listen:** Einnahme-Kategorien / Ausgabe-Kategorien
- [ ] **Pro Kategorie:**
  - Name (Pflicht)
  - Icon (optional, aus Icon-Palette wählbar)
  - Farbe (optional)
  - Standard-Kategorien: Nicht löschbar, nur umbennennbar
- [ ] **CRUD:** Erstellen, Bearbeiten, Löschen (wenn keine Buchungen zugeordnet)
- [ ] **Standard-Einnahme-Kategorien:**
  - Mitgliedsbeiträge
  - Sponsoring
  - Spenden
  - Veranstaltungseinnahmen
  - Sonstiges
- [ ] **Standard-Ausgabe-Kategorien:**
  - Material & Equipment
  - Miete & Nebenkosten
  - Veranstaltungskosten
  - Reisekosten
  - Versicherung
  - Verwaltung
  - Sonstiges

### Monats-/Jahresübersicht
- [ ] **Monatssicht:** Balkendiagramm Einnahmen vs. Ausgaben pro Monat
- [ ] **Kategorie-Aufteilung:** Kreisdiagramm der Ausgaben nach Kategorie
- [ ] **Vergleich:** Vorjahr vs. aktuelles Jahr (optional)

---

## Edge Cases

### Buchungen
- **Buchung mit Datum in der Vergangenheit?** → Erlaubt (nachträgliche Erfassung)
- **Sehr hoher Betrag (>100.000 €)?** → Warnung, aber erlaubt
- **Negative Buchung?** → Nicht möglich, stattdessen Gegenbuchung (Storno)
- **Buchung ohne Beleg?** → Erlaubt, aber Hinweis: "Keine Beleg-Referenz angegeben"

### Kategorien
- **Kategorie löschen mit existierenden Buchungen?** → Verhindert
- **Standard-Kategorie löschen?** → Nicht möglich
- **Kategorie umbenennen?** → Erlaubt, alle Buchungen zeigen neuen Namen

### Kassenstand
- **Negativer Kassenstand?** → Erlaubt, aber Warnung anzeigen
- **Startsaldo eingeben?** → Ja, bei erster Nutzung "Anfangsbestand" als Einnahme buchen

### Beitragszahlungen
- **Werden Beitragszahlungen (PROJ-7) automatisch hier angezeigt?** → Optional: Checkbox "Beiträge in Kassenbuch anzeigen"
- **Doppelte Buchung vermeiden?** → System-generierte Beitrags-Einnahmen sind markiert und nicht editierbar

---

## Technische Anforderungen

### Datenbank-Schema

```sql
-- Tabelle: transaction_categories
CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT, -- Icon-Name aus Lucide Icons
  color TEXT, -- Hex-Farbe, z.B. #10B981
  is_system BOOLEAN DEFAULT FALSE, -- Standard-Kategorien
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, type)
);

-- Tabelle: transactions (Buchungen)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES transaction_categories(id),
  receipt_reference TEXT, -- Beleg-Nummer
  note TEXT,
  -- Verknüpfung zu Beitragszahlungen (optional)
  payment_id UUID REFERENCES payments(id),
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  deletion_reason TEXT,
  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "vorstand_all_transaction_categories" ON transaction_categories
FOR ALL TO authenticated USING (is_vorstand());

CREATE POLICY "vorstand_all_transactions" ON transactions
FOR ALL TO authenticated USING (is_vorstand());

-- Indexes
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category_id);

-- Standard-Kategorien einfügen
INSERT INTO transaction_categories (name, type, icon, is_system) VALUES
  ('Mitgliedsbeiträge', 'income', 'users', TRUE),
  ('Sponsoring', 'income', 'handshake', TRUE),
  ('Spenden', 'income', 'heart', TRUE),
  ('Veranstaltungseinnahmen', 'income', 'calendar', TRUE),
  ('Sonstiges', 'income', 'more-horizontal', TRUE),
  ('Material & Equipment', 'expense', 'package', TRUE),
  ('Miete & Nebenkosten', 'expense', 'home', TRUE),
  ('Veranstaltungskosten', 'expense', 'calendar', TRUE),
  ('Reisekosten', 'expense', 'car', TRUE),
  ('Versicherung', 'expense', 'shield', TRUE),
  ('Verwaltung', 'expense', 'file-text', TRUE),
  ('Sonstiges', 'expense', 'more-horizontal', TRUE);
```

### API-Endpunkte

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/treasury` | Buchungen (gefiltert, paginiert) |
| GET | `/api/treasury/stats` | Kassenstand und Statistiken |
| POST | `/api/treasury` | Buchung erstellen |
| PATCH | `/api/treasury/:id` | Buchung bearbeiten |
| DELETE | `/api/treasury/:id` | Buchung löschen (Soft Delete) |
| GET | `/api/treasury/categories` | Kategorien abrufen |
| POST | `/api/treasury/categories` | Kategorie erstellen |
| PATCH | `/api/treasury/categories/:id` | Kategorie bearbeiten |
| DELETE | `/api/treasury/categories/:id` | Kategorie löschen |

### Komponenten-Struktur

```
src/
├── app/
│   └── (dashboard)/
│       └── admin/
│           └── finances/
│               └── treasury/
│                   ├── page.tsx              # Kassenbuch Hauptseite
│                   └── categories/
│                       └── page.tsx          # Kategorien verwalten
├── components/
│   └── finances/
│       ├── treasury-stats.tsx                # Statistik-Karten
│       ├── treasury-table.tsx                # Buchungs-Tabelle
│       ├── treasury-toolbar.tsx              # Filter & Suche
│       ├── transaction-form.tsx              # Buchung erfassen/bearbeiten
│       ├── category-list.tsx                 # Kategorien-Liste
│       ├── category-form.tsx                 # Kategorie erstellen/bearbeiten
│       └── treasury-charts.tsx               # Diagramme (optional)
```

---

## UI/UX Spezifikationen

### Layout der Seite
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: "Vereinskasse"                    [+ Einnahme] [+ Ausgabe]
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐     │
│ │ Kassenstand│ │ Einnahmen │ │ Ausgaben  │ │ Differenz     │     │
│ │ 15.234 €  │ │ 8.450 €   │ │ 3.200 €   │ │ +5.250 €      │     │
│ │ (Gesamt)  │ │ (Jan '26) │ │ (Jan '26) │ │ (Jan '26)     │     │
│ └───────────┘ └───────────┘ └───────────┘ └───────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│ [Zeitraum: Januar 2026 ▼]  [Typ ▼]  [Kategorie ▼]  [🔍 Suche]  │
├─────────────────────────────────────────────────────────────────┤
│ Datum     │ Beschreibung          │ Kategorie  │ Betrag │ Saldo │
│───────────────────────────────────────────────────────────────│
│ 27.01.26  │ Sponsoring Firma XY   │ 💼 Spons.  │ +500€  │ 15234€│
│ 25.01.26  │ Materialkosten Deko   │ 📦 Mat.   │ -120€  │ 14734€│
│ 20.01.26  │ Saalmiete Vereinsheim │ 🏠 Miete  │ -300€  │ 14854€│
│ 15.01.26  │ Spende Fam. Schmidt   │ ❤️ Spende │ +100€  │ 15154€│
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Farbcodierung
- **Einnahmen:** Grüner Text (+500 €)
- **Ausgaben:** Roter Text (-120 €)
- **Negativer Kassenstand:** Roter Hintergrund mit Warnung

### Buchung erfassen Modal
```
┌─────────────────────────────────────────────────┐
│ [Einnahme] [Ausgabe]                        ✕   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Betrag *                                        │
│ ┌─────────────────────────────────────────┐     │
│ │ 500,00                                € │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ Datum *                                         │
│ ┌─────────────────────────────────────────┐     │
│ │ 27.01.2026                           📅 │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ Kategorie *                                     │
│ ┌─────────────────────────────────────────┐     │
│ │ 💼 Sponsoring                         ▼ │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ Beschreibung *                                  │
│ ┌─────────────────────────────────────────┐     │
│ │ Sponsoring Firma XY für Wagenbau        │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ Beleg-Referenz (optional)                       │
│ ┌─────────────────────────────────────────┐     │
│ │ R-2026-042                              │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ ☐ Nach Speichern weitere Buchung erfassen       │
│                                                 │
├─────────────────────────────────────────────────┤
│                     [Abbrechen] [Buchung speichern]│
└─────────────────────────────────────────────────┘
```

---

## Nicht im Scope

- Doppelte Buchführung (Soll/Haben)
- Mehrere Kassenkonten (Barkasse, Bankkonto)
- Automatischer Bankimport
- Umsatzsteuer-Berechnung
- Bilanz / GuV Erstellung
- Beleg-Upload (Bilder/PDFs)
- Export nach DATEV oder anderen Buchhaltungsprogrammen

---

## Tech-Design (Solution Architect)

### Überblick
PROJ-8 ist ein **eigenständiger Bereich** für die allgemeine Vereinskasse. Hier werden alle Einnahmen und Ausgaben erfasst, die NICHT Mitgliedsbeiträge sind (Sponsoring, Spenden, Materialkosten, etc.).

### Component-Struktur
```
Admin-Bereich
└── Finanzen
    └── Vereinskasse
        ├── Kopfzeile
        │   ├── "Einnahme erfassen" Button (grün)
        │   └── "Ausgabe erfassen" Button (rot)
        │
        ├── Statistik-Karten (4 nebeneinander)
        │   ├── Kassenstand (Gesamt seit Beginn)
        │   ├── Einnahmen (gewählter Zeitraum)
        │   ├── Ausgaben (gewählter Zeitraum)
        │   └── Differenz (Einnahmen - Ausgaben im Zeitraum)
        │
        ├── Filter-Leiste
        │   ├── Zeitraum (Monat/Quartal/Jahr/Gesamt)
        │   ├── Typ (Alle/Einnahmen/Ausgaben)
        │   ├── Kategorie (Multi-Select)
        │   └── Suche nach Beschreibung
        │
        └── Kassenbuch-Tabelle
            ├── Spalten: Datum, Beschreibung, Kategorie, Betrag, Saldo
            ├── Einnahmen in grün (+500 €)
            └── Ausgaben in rot (-120 €)

Unterseite: Kategorien verwalten
├── Einnahme-Kategorien (Sponsoring, Spenden, ...)
└── Ausgabe-Kategorien (Material, Miete, ...)

Modal-Dialoge
├── Buchung erfassen (Einnahme/Ausgabe Toggle)
├── Buchung bearbeiten
├── Buchung löschen (Soft-Delete mit Grund)
└── Kategorie erstellen/bearbeiten
```

### Daten-Model (vereinfacht)
```
Buchungen (transactions):
├── Typ: Einnahme oder Ausgabe
├── Betrag in Euro
├── Datum
├── Kategorie (z.B. "Sponsoring", "Material")
├── Beschreibung (z.B. "Sponsoring Firma XY")
├── Beleg-Referenz (optional, z.B. "R-2026-042")
├── Notiz (optional)
└── Wer hat erfasst (automatisch)

Kategorien (transaction_categories):
├── Name (z.B. "Sponsoring", "Material & Equipment")
├── Typ (Einnahme oder Ausgabe)
├── Icon (optional, für visuelle Unterscheidung)
└── Standard-Kategorie? (nicht löschbar)

Kassenstand-Berechnung:
→ Summe aller Einnahmen - Summe aller Ausgaben
```

### Wiederverwendung bestehender Komponenten
- ✅ **Card** für Statistik-Karten (wie PROJ-6)
- ✅ **DataTable** für Kassenbuch (wie Mitglieder/Beiträge)
- ✅ **Tabs** für Einnahme/Ausgabe Toggle (shadcn/ui)
- ✅ **Dialog** für Buchungen erfassen
- ✅ **Badge** mit Farben für Kategorien
- ✅ **DropdownMenu** für Aktionen

### Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Einfache Ein-/Ausgaben-Rechnung | Doppelte Buchführung wäre zu komplex für kleine Vereine |
| Standard-Kategorien vordefiniert | Schneller Start, trotzdem erweiterbar |
| Soft-Delete für Buchungen | Nachvollziehbarkeit bei Kassenprüfung |
| Laufender Saldo in Tabelle | Kassenstand zu jedem Zeitpunkt sichtbar |
| Optionale Beitrags-Integration | Beitragszahlungen können automatisch als Einnahme erscheinen |

### Dependencies
Keine neuen Packages erforderlich:
- Alle UI-Komponenten bereits vorhanden
- Optional: Chart-Bibliothek für Diagramme (Recharts o.ä.)

### Zusammenspiel mit anderen Features
```
PROJ-7 (Zahlungen) ──► Optional: Beitragszahlungen in Kassenbuch anzeigen
                      (Checkbox "Beiträge in Kassenbuch einbeziehen")
```

### Sidebar-Navigation Finanz-Modul (komplett)
```
📊 Finanzen (Collapsible)
├── Beitragsarten (PROJ-5)
├── Beiträge (PROJ-6 + PROJ-7)
├── Vereinskasse (PROJ-8)
└── Kategorien (PROJ-8 Unterseite)
```

### Implementierungs-Reihenfolge
1. Datenbank-Tabellen (Kategorien + Buchungen) mit Standard-Kategorien
2. API-Endpoints für Kategorien CRUD
3. API-Endpoints für Buchungen CRUD
4. Kassenbuch-Seite mit Tabelle und Statistik-Karten
5. Buchung erfassen Modal (Einnahme/Ausgabe)
6. Kategorien-Verwaltung Unterseite
7. Filter und Zeitraum-Auswahl
8. (Optional) Diagramme für Monats-/Jahresübersicht

---

## Checkliste vor Abschluss

- [x] User Stories definiert (6 Stories)
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases identifiziert
- [x] Technische Anforderungen dokumentiert
- [x] Feature-ID vergeben: PROJ-8
- [x] Status gesetzt: Planned
- [ ] User Review: Ausstehend

---

## QA Test Results (Re-Test #4)

**Tested:** 2026-01-29 (Re-Test #4 -- Vollpruefung nach Bug-Fixes)
**Tester:** QA Engineer (Code Review + DB Inspection + RLS Audit + Supabase Advisors + Build-Check)
**Method:** Statische Code-Analyse aller API Routes (10 Endpoints), Komponenten (10 Dateien), Validierungen (5 Schemas), Datenbank-Schema (3 Tabellen, 5 Migrations), RLS-Policy-Audit (10 Policies via pg_policies SQL), Supabase Security/Performance Advisors, Next.js Build, Red-Team Security Analysis
**App URL:** http://localhost:3000/admin/finances/treasury
**Full Report:** `/test-reports/PROJ-8-qa-report.md`

---

### Bug-Fix Verification (Re-Test #3 -> Re-Test #4)

| Re-Test #3 Bug | Beschreibung | Re-Test #4 Status | Evidenz |
|----------------|-------------|-------------------|---------|
| BUG-1 (Medium) | History-Dialog Datenformat-Mismatch | **BEHOBEN** | `transaction-history-dialog.tsx` Z. 172-174: Liest jetzt `entry.changes?.[field]` korrekt als `{ old?, new? }`. Z. 192: Loeschgrund via `entry.changes?.deletion_reason` |
| BUG-2 (Low) | HTML-Entity als Klartext | **BEHOBEN** | `treasury-table.tsx` Z. 203, 207, 225: Verwendet jetzt `"--"` statt `"&ndash;"` |
| BUG-3 (Low) | Grammatik-Fehler | **BEHOBEN** | `treasury-table.tsx` Z. 117: Jetzt korrekt `"Keine geloeschten Buchungen"` |

**Alle 3 Bugs aus Re-Test #3 wurden erfolgreich behoben.**

---

### Neue Bugs gefunden (Re-Test #4)

**Keine neuen Bugs gefunden.**

---

### Acceptance Criteria Status

#### AC-1: Kassenbuch-Tabelle (Hauptansicht)

**Spalten:**
- [x] Datum (DD.MM.YY, deutsch formatiert)
- [x] Beschreibung (mit optionaler Notiz darunter, truncated max 200px)
- [x] Kategorie (Badge mit Farbe via borderColor/color Style)
- [x] Einnahme (gruen) / Ausgabe (rot) -- korrekt farbcodiert (`text-green-600` / `text-red-600`)
- [x] Beleg-Nr./Notiz (Beleg als eigene Spalte, responsive hidden auf Mobile `lg:table-cell`)
- [x] Saldo (laufend) -- berechnet via `runningBalances` useMemo, negative Werte in rot
- [x] Aktionen (Edit/Delete/Historie Dropdown, nur bei nicht-system-generierten Buchungen)

**Sortierung:**
- [x] Neueste zuerst (Default, `sortOrder` State default "desc")
- [x] Umkehrbar -- Sort-Toggle-Button mit ArrowUp/ArrowDown Icon im Tabellenkopf

**Filter:**
- [x] Zeitraum: Monat / Quartal / Jahr / Gesamt / Benutzerdefiniert
- [x] Benutzerdefinierter Zeitraum mit Von/Bis Date-Inputs
- [x] Typ: Alle / Einnahmen / Ausgaben
- [x] Kategorie: Multi-Select mit Popover, Checkboxen, Badge-Anzeige, "Auswahl aufheben"

**Suche:**
- [x] Nach Beschreibung durchsuchbar (ilike-Suche serverseitig)

**Pagination:**
- [x] PAGE_SIZE=50, Zurueck/Weiter Buttons, Seitenanzeige "Seite X von Y (N Buchungen)"

**AC-1: 15/15 BESTANDEN**

---

#### AC-2: Statistik-Karten (Header)
- [x] Karte 1: Kassenstand aktuell (Gesamtsaldo via `get_treasury_balance` RPC)
- [x] Karte 2: Einnahmen (Zeitraum)
- [x] Karte 3: Ausgaben (Zeitraum)
- [x] Karte 4: Differenz (Zeitraum)
- [x] Zeitraum waehlbar: Monat / Quartal / Jahr / Gesamt / Benutzerdefiniert
- [x] Negativer Kassenstand: Rote Farbe + AlertTriangle-Icon
- [x] Loading-Skeletons waehrend Datenabruf

**AC-2: 7/7 BESTANDEN**

---

#### AC-3: Buchung erfassen (Modal)
- [x] Typ-Auswahl: Einnahme / Ausgabe (Tabs mit Farbcodierung)
- [x] Pflichtfelder: Betrag, Datum, Kategorie, Beschreibung
- [x] Optionale Felder: Beleg-Referenz, Notiz
- [x] Validierung: Betrag > 0, max 999.999,99, Datum nicht Zukunft, Kategorie Pflicht, Typ-Match
- [x] Schnelleingabe-Toggle
- [x] High-Amount-Warnung bei >100.000 EUR

**AC-3: 15/15 BESTANDEN**

---

#### AC-4: Buchung bearbeiten
- [x] Alle Felder nachtraeglich aenderbar
- [x] Aenderungshistorie wird gefuehrt (transaction_audit_log)
- [x] History-Dialog zeigt alte/neue Werte korrekt an (BUG-1 BEHOBEN)
- [x] Bestaetigungs-Dialog bei Betragsaenderung
- [x] System-generierte Buchungen (payment_id) nicht editierbar
- [x] Geloeschte Buchungen nicht editierbar
- [x] History-API + History-UI vollstaendig funktional

**AC-4: 7/7 BESTANDEN**

---

#### AC-5: Buchung loeschen
- [x] Soft-Delete mit Grund-Angabe
- [x] Dialog zeigt Buchungsdetails
- [x] Papierkorb-Tab mit Loeschgrund und Geloescht-am
- [x] Wiederherstellung moeglich (30-Tage-Window)
- [x] Papierkorb-Pagination
- [x] Audit-Log bei Loeschung und Wiederherstellung

**AC-5: 9/9 BESTANDEN**

---

#### AC-6: Kategorien verwalten
- [x] Zwei Listen (Tabs), CRUD komplett
- [x] Standard-Kategorien: 5 Einnahme + 7 Ausgabe (12 System-Kategorien)
- [x] Duplikat-Erkennung, Loeschung nur ohne Buchungen
- [x] Separate Seite mit Zurueck-Button

**AC-6: 13/13 BESTANDEN**

---

#### AC-7: Monats-/Jahresuebersicht
- [x] Balkendiagramm Einnahmen vs. Ausgaben
- [x] Kreisdiagramm nach Kategorie (umschaltbar Ausgaben/Einnahmen)
- [x] Jahresvergleich (Vorjahr vs. aktuelles Jahr)

**AC-7: 3/3 BESTANDEN**

---

### Edge Cases: 14/14 bestanden

Alle Edge Cases fuer Buchungen, Kategorien, Kassenstand und Beitragszahlungen bestanden.

---

### Security-Check (Red-Team Perspektive)

- [x] Authentication: Alle 10 Endpoints pruefen `getUser()` (401)
- [x] Authorization: Alle 10 Endpoints pruefen `is_vorstand()` (403)
- [x] RLS: Alle 3 Treasury-Tabellen mit `(SELECT is_vorstand())` Policies
- [x] Input Validation: Dreischicht (Client Zod + Server Zod + DB CHECK)
- [x] SQL Injection: Parameterisierte Queries via Supabase Client
- [x] XSS: React JSX-Escaping, kein dangerouslySetInnerHTML
- [x] IDOR: Auth + Role + RLS dreifache Absicherung
- [x] Audit Trail: INSERT-only RLS auf audit_log (keine Manipulation moeglich)
- [x] Build: `next build` erfolgreich, keine TypeScript-Fehler
- [x] Supabase Advisors: Keine Security-ERRORS fuer Treasury-Tabellen

---

### Summary

| Kategorie | Ersttest | Re-Test #1 | Re-Test #2 | Re-Test #3 | Re-Test #4 |
|-----------|----------|------------|------------|------------|------------|
| AC-1 Kassenbuch-Tabelle | 10/14 | 14/14 | 14/14 | 14/14 | **15/15** |
| AC-2 Statistik-Karten | 7/7 | 7/7 | 7/7 | 7/7 | **7/7** |
| AC-3 Buchung erfassen | 15/15 | 15/15 | 15/15 | 15/15 | **15/15** |
| AC-4 Buchung bearbeiten | 3/6 | 6/6 | 7/7 | 6/7 | **7/7** |
| AC-5 Buchung loeschen | 3/9 | 9/9 | 9/9 | 9/9 | **9/9** |
| AC-6 Kategorien | 13/13 | 13/13 | 13/13 | 13/13 | **13/13** |
| AC-7 Charts | 0/3 | 0/3 | 3/3 | 3/3 | **3/3** |
| **AC Gesamt** | **37/48 (77%)** | **64/67 (96%)** | **68/68 (100%)** | **67/68 (99%)** | **69/69 (100%)** |
| Edge Cases | 11/12 | 13/14 | 13/14 | 14/14 | **14/14** |
| Security | OK | OK | OK | OK | **OK** |
| Build | -- | -- | -- | OK | **OK** |
| Bugs | 11 (3 High) | 6 (2 Med, 4 Low) | 1 (1 Low) | 3 (1 Med, 2 Low) | **0** |

### Bug-Trend (5 Test-Iterationen)

```
Ersttest:     11 Bugs  (3 High, 3 Medium, 5 Low)
Re-Test #1:    6 Bugs  (0 High, 2 Medium, 4 Low)  -- 5 behoben
Re-Test #2:    1 Bug   (0 High, 0 Medium, 1 Low)   -- 5 behoben
Re-Test #3:    3 Bugs  (0 High, 1 Medium, 2 Low)   -- 1 behoben, 3 NEU
Re-Test #4:    0 Bugs  (0 High, 0 Medium, 0 Low)   -- 3 behoben

Gesamt:       17 von 17 Bugs behoben (100%)
```

---

### Recommendation

**Status: PRODUCTION-READY**

69 von 69 Acceptance Criteria erfuellt (100%). Alle 17 Bugs ueber 5 Test-Iterationen behoben. Security-Audit bestanden. Keine offenen Bugs. Feature ist bereit fuer Production-Deployment.
