# PROJ-6: Beitrags-Dashboard (Fee Overview)

## Status: ✅ Deployed (2026-01-27)
**Production URL:** https://vereins-management.vercel.app/admin/finances/fees

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-3 (Role-Based Dashboards) - für Admin-Bereich Navigation
- Benötigt: PROJ-4 (Member Management) - Mitglieder- und Familiendaten
- Benötigt: PROJ-5 (Membership Types) - Beitragsarten für Betragsberechnung

## Übersicht
Zentrale Übersicht aller Mitgliedsbeiträge für das aktuelle Kalenderjahr. Zeigt den Zahlungsstatus (Bezahlt/Teilweise/Offen) für Einzelpersonen und Familien. Familien werden als aufklappbare Blöcke dargestellt.

**Route:** `/admin/finances/fees` (nur für Board-Rolle)

---

## User Stories

### US-1: Beitrags-Übersicht anzeigen
**Als** Vorstandsmitglied
**möchte ich** alle Mitglieder und Familien mit ihrem Beitragsstatus sehen
**um** offene Zahlungen auf einen Blick zu erkennen.

### US-2: Nach Status filtern
**Als** Vorstandsmitglied
**möchte ich** die Liste nach "Offen", "Teilweise bezahlt" oder "Bezahlt" filtern
**um** gezielt säumige Zahler zu identifizieren.

### US-3: Familien aufklappen
**Als** Vorstandsmitglied
**möchte ich** eine Familie aufklappen und alle Mitglieder sehen
**um** zu verstehen, wie sich der Familienbeitrag zusammensetzt.

### US-4: Jahresbeiträge generieren
**Als** Vorstandsmitglied
**möchte ich** zum Jahreswechsel die Beiträge für alle Mitglieder generieren
**um** die Beitragsperiode zu starten.

### US-5: Beitrag manuell anpassen
**Als** Vorstandsmitglied
**möchte ich** den Sollbetrag für ein Mitglied/Familie manuell anpassen können
**um** auf Sonderfälle (Beitritt Mitte Jahr, Ermäßigung) zu reagieren.

### US-6: Statistik-Übersicht sehen
**Als** Vorstandsmitglied
**möchte ich** eine Zusammenfassung (Gesamt-Soll, Gesamt-Ist, Offene Summe) sehen
**um** den Finanzstatus des Vereins zu kennen.

---

## Acceptance Criteria

### Beitrags-Tabelle (Hauptansicht)
- [ ] **Zwei Ansichtsmodi:**
  - "Alle" - Zeigt Einzelmitglieder UND Familien gemischt
  - "Nur Familien" - Zeigt nur Familien-Blöcke (Einzelpersonen ohne Familie ausgeblendet)
- [ ] **Spalten für Einzelpersonen:**
  - Name (Vor- + Nachname)
  - Beitragsart (aus PROJ-5)
  - Soll (Jahresbeitrag)
  - Bezahlt (Summe aller Zahlungen)
  - Offen (Soll - Bezahlt)
  - Status (Badge: Bezahlt/Teilweise/Offen)
  - Aktionen
- [ ] **Familien-Zeilen:**
  - Collapsible (aufklappbar)
  - Familienname + Anzahl Mitglieder
  - Bei Familie-Flat: Gesamt-Soll = Familien-Pauschale
  - Bei Einzel-Abrechnung: Gesamt-Soll = Summe aller Mitglieder
  - Aufklappen zeigt alle Familienmitglieder mit Einzeldetails

### Status-Badges
- [ ] **Bezahlt (Grün):** Offen = 0 €
- [ ] **Teilweise (Gelb):** Offen > 0 € UND mindestens eine Zahlung existiert
- [ ] **Offen (Rot):** Keine Zahlung für dieses Jahr

### Filter & Suche
- [ ] **Suche:** Nach Name (Mitglied oder Familie)
- [ ] **Filter Status:** Alle / Bezahlt / Teilweise / Offen
- [ ] **Filter Jahr:** Dropdown mit verfügbaren Jahren (Default: aktuelles Jahr)
- [ ] **Schnellfilter:** "Nur offene anzeigen" Toggle

### Statistik-Karten (Header)
- [ ] **Karte 1:** Gesamt-Soll (Summe aller erwarteten Beiträge)
- [ ] **Karte 2:** Eingegangen (Summe aller Zahlungen)
- [ ] **Karte 3:** Offen (Gesamt-Soll - Eingegangen)
- [ ] **Karte 4:** Zahlungsquote (Eingegangen / Gesamt-Soll in %)
- [ ] Karten aktualisieren sich bei Filteränderung

### Jahresbeiträge generieren (Button)
- [ ] Button "Beiträge für [Jahr] generieren" (nur sichtbar wenn Jahr noch keine Beiträge hat)
- [ ] **Bestätigungs-Dialog:**
  - Zeigt Vorschau: X Mitglieder, Y Familien, Gesamt-Soll: Z €
  - Warnung wenn Mitglieder ohne Beitragsart existieren
  - Button "Beiträge generieren"
- [ ] **Logik:**
  - Für jedes Mitglied MIT Beitragsart: Eintrag in `membership_fees`
  - Für Familie-Flat: Ein Eintrag pro Familie (nicht pro Mitglied)
  - Mitglieder OHNE Beitragsart: Werden übersprungen (kein Beitrag)

### Beitrag manuell anpassen (Modal)
- [ ] Öffnet sich durch Klick auf "Bearbeiten" bei einem Beitrag
- [ ] Felder:
  - Aktueller Soll-Betrag (readonly, zur Info)
  - Neuer Soll-Betrag (editierbar)
  - Grund für Anpassung (Freitext, Pflicht)
- [ ] Änderungshistorie wird gespeichert

---

## Edge Cases

### Jahresbeiträge generieren
- **Beiträge für dieses Jahr existieren bereits?** → Button ausgeblendet, Hinweis: "Beiträge für [Jahr] wurden bereits generiert"
- **Neues Mitglied nach Generierung?** → Manuell Beitrag zuweisen oder "Nachgenerierung" für einzelnes Mitglied
- **Mitglied ohne Beitragsart?** → Wird übersprungen, Warnung in Vorschau
- **Familie mit Familie-Flat UND Einzel-Beitragsarten?** → Familie-Flat hat Vorrang, Einzelbeitragsarten werden ignoriert

### Anpassungen
- **Soll-Betrag auf 0 € setzen?** → Erlaubt (z.B. Härtefall), Grund muss angegeben werden
- **Soll-Betrag erhöhen?** → Erlaubt, Grund muss angegeben werden
- **Bereits bezahlter Beitrag wird reduziert?** → Hinweis: "Achtung: Es wurden bereits [X €] bezahlt"

### Familien
- **Familie wechselt Abrechnungsart mitten im Jahr?** → Nicht unterstützt, gilt erst ab nächstem Jahr
- **Mitglied wird in Familie aufgenommen nachdem Beitrag generiert?** → Einzelbeitrag bleibt bestehen
- **Familie wird aufgelöst?** → Familien-Beitrag bleibt der Ex-Primärkontakt-Person zugeordnet

### Jahre
- **Vergangene Jahre anschauen?** → Readonly, keine Änderungen möglich
- **Zukünftige Jahre generieren?** → Nicht möglich (nur aktuelles Jahr + 1)

---

## Technische Anforderungen

### Datenbank-Schema

```sql
-- Neue Tabelle: membership_fees (Jahresbeiträge)
CREATE TABLE membership_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  -- Entweder Mitglied ODER Familie (nicht beides)
  profile_id UUID REFERENCES profiles(id),
  family_id UUID REFERENCES families(id),
  -- Beträge
  amount_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- Soll-Betrag
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Bereits bezahlt (Cache)
  -- Metadaten
  membership_type_id UUID REFERENCES membership_types(id),
  adjustment_reason TEXT,  -- Falls manuell angepasst
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraints
  CONSTRAINT fee_has_owner CHECK (
    (profile_id IS NOT NULL AND family_id IS NULL) OR
    (profile_id IS NULL AND family_id IS NOT NULL)
  ),
  CONSTRAINT unique_fee_per_year_profile UNIQUE (year, profile_id),
  CONSTRAINT unique_fee_per_year_family UNIQUE (year, family_id)
);

-- RLS Policies
CREATE POLICY "vorstand_all_membership_fees" ON membership_fees
FOR ALL TO authenticated USING (is_vorstand());

-- Index für Performance
CREATE INDEX idx_membership_fees_year ON membership_fees(year);
CREATE INDEX idx_membership_fees_status ON membership_fees(year, amount_due, amount_paid);
```

### API-Endpunkte

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/fees` | Liste aller Beiträge (mit Filter year, status) |
| GET | `/api/fees/stats` | Statistik für Jahr (Soll, Ist, Offen) |
| POST | `/api/fees/generate` | Jahresbeiträge generieren |
| PATCH | `/api/fees/:id` | Beitrag anpassen (Soll-Betrag) |

### Komponenten-Struktur

```
src/
├── app/
│   └── (dashboard)/
│       └── admin/
│           └── finances/
│               └── fees/
│                   └── page.tsx              # Beitrags-Dashboard
├── components/
│   └── finances/
│       ├── fee-stats-cards.tsx               # Statistik-Karten
│       ├── fees-table.tsx                    # Haupttabelle
│       ├── fees-toolbar.tsx                  # Filter & Suche
│       ├── family-fee-row.tsx                # Aufklappbare Familien-Zeile
│       ├── fee-adjustment-modal.tsx          # Beitrag anpassen
│       └── generate-fees-dialog.tsx          # Jahresbeiträge generieren
```

---

## UI/UX Spezifikationen

### Layout der Seite
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: "Beiträge 2026"                    [Beiträge generieren]│
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐     │
│ │ Soll      │ │ Bezahlt   │ │ Offen     │ │ Quote         │     │
│ │ 12.450 €  │ │ 9.800 €   │ │ 2.650 €   │ │ 78,7%         │     │
│ └───────────┘ └───────────┘ └───────────┘ └───────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│ [🔍 Suche...]  [Status ▼]  [Jahr: 2026 ▼]  ☐ Nur offene        │
├─────────────────────────────────────────────────────────────────┤
│ Name               │ Beitragsart   │ Soll    │ Bezahlt │ Status │
│─────────────────────────────────────────────────────────────────│
│ ▸ Familie Müller (3)│ Familie-Flat │ 200,00€ │ 200,00€ │ ✅     │
│   ├─ Max Müller     │ (Flat)       │ –       │ –       │        │
│   ├─ Lisa Müller    │ (Flat)       │ –       │ –       │        │
│   └─ Tim Müller     │ (Flat)       │ –       │ –       │        │
│─────────────────────────────────────────────────────────────────│
│ Anna Schmidt       │ Erwachsener   │ 120,00€ │ 60,00€  │ 🟡     │
│─────────────────────────────────────────────────────────────────│
│ ▸ Familie Weber (2) │ Einzel       │ 180,00€ │ 0,00€   │ 🔴     │
│   ├─ Klaus Weber    │ Erwachsener  │ 120,00€ │ 0,00€   │ 🔴     │
│   └─ Marie Weber    │ Kind         │ 60,00€  │ 0,00€   │ 🔴     │
└─────────────────────────────────────────────────────────────────┘
```

### Familien-Darstellung
- **Familie-Flat:** Gesamtbetrag nur auf Familien-Ebene, Mitglieder zeigen "–"
- **Einzel-Abrechnung:** Mitglieder haben eigene Beträge, Familie zeigt Summe
- Aufklappen/Zuklappen mit Chevron-Icon

### Fortschrittsbalken
- Jede Zeile kann optional einen mini Progress-Bar haben
- Grün gefüllt bis zur Quote (Bezahlt/Soll)

---

## Nicht im Scope

- Automatische Zahlungserinnerungen (Mahnwesen)
- SEPA-Lastschrift Integration
- Rechnungserstellung (PDF)
- Teilzahlungspläne
- Beitragsbefreiung beantragen (Self-Service)

---

## Tech-Design (Solution Architect)

### Überblick
PROJ-6 ist die **zentrale Übersicht aller Mitgliedsbeiträge**. Es nutzt die Beitragsarten aus PROJ-5 und berechnet die Jahresbeiträge für alle Mitglieder/Familien.

### Component-Struktur
```
Admin-Bereich
└── Finanzen
    └── Beitrags-Dashboard
        ├── Kopfzeile
        │   ├── Jahres-Auswahl (Dropdown)
        │   └── "Beiträge generieren" Button (nur wenn Jahr noch leer)
        │
        ├── Statistik-Karten (4 nebeneinander)
        │   ├── Gesamt-Soll (Summe erwarteter Beiträge)
        │   ├── Eingegangen (Summe aller Zahlungen)
        │   ├── Offen (Soll - Eingegangen)
        │   └── Zahlungsquote (% bezahlt)
        │
        ├── Filter-Leiste
        │   ├── Suche nach Name
        │   ├── Status-Filter (Alle/Bezahlt/Teilweise/Offen)
        │   └── "Nur offene anzeigen" Toggle
        │
        └── Beitrags-Tabelle
            ├── Einzelpersonen-Zeilen
            │   └── Name, Beitragsart, Soll, Bezahlt, Offen, Status
            └── Familien-Zeilen (aufklappbar)
                ├── Familienname, Gesamt-Soll, Gesamt-Bezahlt
                └── [aufgeklappt] → Liste aller Familienmitglieder

Modal-Dialoge
├── "Beiträge generieren" Bestätigung mit Vorschau
└── "Beitrag anpassen" für Sonderfälle
```

### Daten-Model (vereinfacht)
```
Jahresbeiträge (membership_fees):
├── Zugehörigkeit: Mitglied ODER Familie (nicht beides)
├── Jahr (z.B. 2026)
├── Soll-Betrag (aus Beitragsart übernommen)
├── Bezahlt-Betrag (Summe aller Zahlungen)
├── Beitragsart-Referenz
└── Anpassungs-Grund (falls manuell geändert)

Speicherort: Supabase Datenbank (neue Tabelle)
Berechnung: Offen = Soll - Bezahlt
Status:
  - Bezahlt (grün): Offen = 0
  - Teilweise (gelb): Mindestens eine Zahlung, aber Offen > 0
  - Offen (rot): Keine Zahlung
```

### Wiederverwendung bestehender Komponenten
- ✅ **Collapsible** von shadcn/ui für aufklappbare Familien
- ✅ **Badge** für Status-Anzeige (bereits in Members verwendet)
- ✅ **Card** für Statistik-Karten
- ✅ **DataTable-Muster** von Mitglieder-Tabelle
- ✅ **Filter-Toolbar** von Members-Toolbar als Vorlage

### Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Jahresbeiträge manuell generieren | Vorstand entscheidet Zeitpunkt, keine automatische Generierung |
| Familien aufklappbar | Übersichtlich: Familie als Einheit, Details bei Bedarf |
| Bezahlt-Summe als Cache | Performance: Nicht jedes Mal alle Zahlungen summieren |
| Familie-Flat vs. Einzel | Wenn Familie-Flat zugewiesen → nur ein Beitrag für Familie |

### Dependencies
Keine neuen Packages erforderlich:
- Bestehende UI-Komponenten reichen aus
- Supabase für Datenbankzugriff

### Zusammenspiel mit anderen Features
```
PROJ-5 (Beitragsarten) ──► PROJ-6 verwendet Beträge für Generierung
PROJ-4 (Mitglieder)    ──► PROJ-6 zeigt alle Mitglieder mit Status
PROJ-7 (Zahlungen)     ──► PROJ-6 wird um "Zahlung erfassen" erweitert
```

### Implementierungs-Reihenfolge
1. Datenbank-Tabelle für Jahresbeiträge erstellen
2. API-Endpoints (Liste, Generieren, Anpassen)
3. Statistik-Karten Komponente
4. Beitrags-Tabelle mit aufklappbaren Familien
5. "Beiträge generieren" Dialog mit Vorschau
6. "Beitrag anpassen" Modal für Sonderfälle

---

## Checkliste vor Abschluss

- [x] User Stories definiert (6 Stories)
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases identifiziert
- [x] Technische Anforderungen dokumentiert
- [x] Feature-ID vergeben: PROJ-6
- [x] Status gesetzt: Planned
- [ ] User Review: Ausstehend

---

## QA Test Results

**Tested:** 2026-01-27 (Re-Test nach Bug-Fixes)
**Status:** ✅ PRODUCTION-READY

📄 **Vollständiger Test-Report:** [test-reports/PROJ-6-fee-dashboard-qa-report.md](../test-reports/PROJ-6-fee-dashboard-qa-report.md)

### Zusammenfassung

| Kategorie | Vorher | Nachher |
|-----------|--------|---------|
| Acceptance Criteria | 19/24 (79%) | **24/24 (100%)** |
| Edge Cases | 4/8 (50%) | **8/8 (100%)** |
| Bugs | 6 | **0** |
| Security Issues | 2 | **0** |

### Behobene Bugs

| Bug | Status | Fix |
|-----|--------|-----|
| BUG-1 | ✅ FIXED | Ansichtsmodi Toggle implementiert |
| BUG-2 | ✅ FIXED | Hinweis-Text hinzugefügt |
| BUG-3 | ✅ FIXED | fee_adjustments Tabelle + Historie |
| BUG-4 | ✅ FIXED | AddSingleFeeDialog für Nachgenerierung |
| BUG-5 | ✅ FIXED | Readonly-Modus für vergangene Jahre |
| BUG-6 | ✅ FIXED | Year-Validierung für Generierung |
| SECURITY-1 | ✅ FIXED | RLS Policy WITH CHECK hinzugefügt |
| SECURITY-2 | ✅ FIXED | is_family_flat DB-Feld statt String-Check |

### Empfehlung
Feature kann deployed werden.
