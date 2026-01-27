# PROJ-7: Zahlungs-Erfassung (Payment Recording)

## Status: ✅ Deployed (2026-01-27)

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-4 (Member Management) - Mitglieder- und Familiendaten
- Benötigt: PROJ-6 (Fee Dashboard) - Beiträge zu denen Zahlungen erfasst werden

## Übersicht
Manuelle Erfassung von Zahlungseingängen für Mitgliedsbeiträge. Der Vorstand kann Zahlungen erfassen, die Zahlungshistorie einsehen und Zahlungen korrigieren. Keine automatische Bankanbindung - rein manuelle Erfassung.

**Route:** Integriert in `/admin/finances/fees` (Modal/Slide-Over)

---

## User Stories

### US-1: Zahlung erfassen
**Als** Vorstandsmitglied
**möchte ich** eine eingegangene Zahlung (Bar oder Überweisung) erfassen
**um** den Beitragsstatus des Mitglieds/der Familie zu aktualisieren.

### US-2: Zahlungshistorie einsehen
**Als** Vorstandsmitglied
**möchte ich** alle Zahlungen eines Mitglieds/einer Familie chronologisch sehen
**um** nachzuvollziehen, wann was bezahlt wurde.

### US-3: Zahlung korrigieren
**Als** Vorstandsmitglied
**möchte ich** eine fehlerhafte Zahlung stornieren oder korrigieren können
**um** Eingabefehler zu beheben.

### US-4: Teilzahlung erfassen
**Als** Vorstandsmitglied
**möchte ich** auch Teilbeträge erfassen können
**um** Ratenzahlungen abzubilden.

### US-5: Notiz zur Zahlung hinzufügen
**Als** Vorstandsmitglied
**möchte ich** eine Notiz zur Zahlung speichern können
**um** den Kontext festzuhalten (z.B. "Bar beim Vereinsabend erhalten").

---

## Acceptance Criteria

### Zahlung erfassen (Modal)
- [ ] **Aufruf:** Button "Zahlung erfassen" in der Beitrags-Tabelle (PROJ-6) bei jedem Eintrag
- [ ] **Felder:**
  - Betrag (Pflicht): Dezimalzahl mit 2 Nachkommastellen
  - Zahlungsdatum (Pflicht): Datepicker, Default = heute
  - Zahlungsart (Pflicht): Dropdown ["Bar", "Überweisung", "Sonstiges"]
  - Notiz (Optional): Freitext, max. 500 Zeichen
- [ ] **Validierung:**
  - Betrag > 0 € (keine negativen Beträge oder 0)
  - Datum nicht in der Zukunft
  - Datum nicht vor dem Beitragsjahr
- [ ] **Vorausfüllung:** Offener Betrag als Vorschlag im Betrag-Feld
- [ ] **Speichern:** Erfolgs-Toast, Beitrags-Tabelle aktualisiert sich

### Zahlungshistorie (Modal/Slide-Over)
- [ ] **Aufruf:** Button "Historie" oder Klick auf "Bezahlt"-Betrag in der Tabelle
- [ ] **Anzeige:**
  - Liste aller Zahlungen für diesen Beitrag
  - Pro Zeile: Datum, Betrag, Zahlungsart, Notiz, erfasst von (User), Aktionen
  - Sortierung: Neueste zuerst
- [ ] **Summen-Zeile:** "Gesamt bezahlt: [Summe] €"
- [ ] **Leerer State:** "Noch keine Zahlungen erfasst"

### Zahlung stornieren
- [ ] Button "Stornieren" bei jeder Zahlung in der Historie
- [ ] **Bestätigungs-Dialog:** "Zahlung über [Betrag] € vom [Datum] wirklich stornieren?"
- [ ] **Bei Storno:**
  - Zahlung wird als "storniert" markiert (nicht gelöscht)
  - Betrag wird vom "Bezahlt"-Wert abgezogen
  - Storno-Eintrag in Historie sichtbar (durchgestrichen)
- [ ] **Storno-Grund:** Pflichtfeld im Bestätigungs-Dialog

### Zahlung bearbeiten
- [ ] Button "Bearbeiten" bei jeder nicht-stornierten Zahlung
- [ ] Nur Notiz und Zahlungsart änderbar (Betrag und Datum nicht nachträglich änderbar)
- [ ] Alternative für Betrag-Korrektur: Stornieren + Neu erfassen

### Überzahlung
- [ ] Erlaubt: Bezahlt > Soll (Überzahlung)
- [ ] **Anzeige:** Status "Überzahlt" (Blau) mit Hinweis: "+[Überschuss] € Guthaben"
- [ ] Keine automatische Verrechnung mit nächstem Jahr (manuell durch Vorstand)

### Update der Beitrags-Tabelle
- [ ] Nach jeder Zahlung: `amount_paid` in `membership_fees` wird aktualisiert
- [ ] Status-Badge aktualisiert sich automatisch
- [ ] Statistik-Karten (PROJ-6) aktualisieren sich

---

## Edge Cases

### Erfassung
- **Zahlung für komplett bezahlten Beitrag?** → Erlaubt (Überzahlung möglich)
- **Sehr hoher Betrag (>10.000 €)?** → Warnung, aber erlaubt
- **Zahlung für vergangenes Jahr erfassen?** → Erlaubt, Datum muss im Beitragsjahr liegen
- **Doppelte Zahlung (gleicher Betrag, gleiches Datum)?** → Erlaubt (kann vorkommen bei mehreren Familienmitgliedern)

### Storno
- **Einzige Zahlung stornieren?** → Erlaubt, Status wird wieder "Offen"
- **Storno rückgängig machen?** → Nicht möglich, stattdessen neue Zahlung erfassen
- **Storno bei Überzahlung?** → Erlaubt, Überzahlung wird reduziert

### Familienspezifisch
- **Zahlung für Familie-Flat?** → Wird dem Familien-Beitrag zugeordnet, nicht den Mitgliedern
- **Zahlung für Einzelmitglied in Familie?** → Wird dem Mitglieds-Beitrag zugeordnet (bei Einzel-Abrechnung)
- **Wer hat die Zahlung getätigt?** → Nicht erfasst, nur dass Zahlung eingegangen ist

### Rechte
- **Kann jeder Vorstand Zahlungen stornieren?** → Ja, alle mit Board-Rolle
- **Audit-Trail?** → Ja, `created_by` und `updated_at` bei jeder Zahlung

---

## Technische Anforderungen

### Datenbank-Schema

```sql
-- Neue Tabelle: payments (Zahlungen)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID NOT NULL REFERENCES membership_fees(id) ON DELETE RESTRICT,
  -- Zahlungsdetails
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'transfer', 'other'
  note TEXT,
  -- Status
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "vorstand_all_payments" ON payments
FOR ALL TO authenticated USING (is_vorstand());

-- Index für Performance
CREATE INDEX idx_payments_fee_id ON payments(fee_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Trigger: amount_paid in membership_fees aktualisieren
CREATE OR REPLACE FUNCTION update_fee_amount_paid()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE membership_fees
  SET amount_paid = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments
    WHERE fee_id = COALESCE(NEW.fee_id, OLD.fee_id)
    AND is_cancelled = FALSE
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.fee_id, OLD.fee_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fee_amount_paid
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION update_fee_amount_paid();
```

### API-Endpunkte

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/payments?fee_id=` | Zahlungen für einen Beitrag |
| POST | `/api/payments` | Zahlung erfassen |
| PATCH | `/api/payments/:id` | Zahlung bearbeiten (nur Notiz/Art) |
| POST | `/api/payments/:id/cancel` | Zahlung stornieren |

### Komponenten-Struktur

```
src/
├── components/
│   └── finances/
│       ├── payment-form.tsx              # Zahlung erfassen Modal
│       ├── payment-history.tsx           # Zahlungshistorie Slide-Over
│       ├── payment-row.tsx               # Einzelne Zahlung in Historie
│       └── payment-cancel-dialog.tsx     # Storno-Bestätigung
```

---

## UI/UX Spezifikationen

### Zahlung erfassen Modal
```
┌─────────────────────────────────────────────────┐
│ Zahlung erfassen                            ✕   │
│ für: Max Müller (2026)                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Offener Betrag: 60,00 €                         │
│                                                 │
│ Betrag *                                        │
│ ┌─────────────────────────────────────────┐     │
│ │ 60,00                                 € │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ Zahlungsdatum *                                 │
│ ┌─────────────────────────────────────────┐     │
│ │ 27.01.2026                           📅 │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ Zahlungsart *                                   │
│ ┌─────────────────────────────────────────┐     │
│ │ Überweisung                           ▼ │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ Notiz (optional)                                │
│ ┌─────────────────────────────────────────┐     │
│ │ Ref: VMS-2026-001                       │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
├─────────────────────────────────────────────────┤
│                    [Abbrechen] [Zahlung erfassen]│
└─────────────────────────────────────────────────┘
```

### Zahlungshistorie
```
┌─────────────────────────────────────────────────┐
│ Zahlungshistorie                            ✕   │
│ Max Müller - Beitrag 2026                       │
├─────────────────────────────────────────────────┤
│ Soll: 120,00 € │ Bezahlt: 60,00 € │ Offen: 60,00│
├─────────────────────────────────────────────────┤
│                                                 │
│ 15.01.2026 │ 60,00 € │ Überweisung │ [⋮]        │
│            │         │ "Erste Rate"            │
│                                                 │
│ ─── Storniert ───                               │
│ 10.01.2026 │ ~~30,00 €~~ │ Bar │               │
│            │ Grund: "Falscher Betrag erfasst"  │
│                                                 │
├─────────────────────────────────────────────────┤
│                          [+ Zahlung erfassen]   │
└─────────────────────────────────────────────────┘
```

### Zahlungsart Icons
- **Bar:** 💵 Banknoten-Icon
- **Überweisung:** 🏦 Bank-Icon
- **Sonstiges:** 📝 Dokument-Icon

---

## Nicht im Scope

- Automatischer Bankabgleich
- SEPA-Lastschrift Einzug
- Zahlungsaufforderungen per E-Mail
- Quittungs-/Rechnungsdruck
- Import von Kontoauszügen

---

## Tech-Design (Solution Architect)

### Überblick
PROJ-7 **erweitert das Beitrags-Dashboard (PROJ-6)** um die Möglichkeit, Zahlungseingänge zu erfassen. Es ist kein eigenständiger Bereich, sondern integriert sich nahtlos.

### Component-Struktur
```
Beitrags-Dashboard (PROJ-6 Erweiterung)
└── Beitrags-Tabelle
    └── Jede Zeile erhält neue Aktionen:
        ├── "Zahlung erfassen" Button
        └── "Historie" Button (oder Klick auf Bezahlt-Betrag)

Modal-Dialoge (neu)
├── Zahlung erfassen
│   ├── Anzeige: Offener Betrag
│   ├── Eingabe: Betrag (vorausgefüllt mit offenem Betrag)
│   ├── Eingabe: Datum (Default: heute)
│   ├── Auswahl: Zahlungsart (Bar, Überweisung, Sonstiges)
│   └── Eingabe: Notiz (optional)
│
└── Zahlungshistorie (Slide-Over)
    ├── Kopfzeile: Mitglied/Familie + Jahr
    ├── Zusammenfassung: Soll, Bezahlt, Offen
    ├── Liste aller Zahlungen
    │   └── Pro Zahlung: Datum, Betrag, Art, Notiz, Aktionen
    ├── Stornierte Zahlungen (durchgestrichen)
    └── "Zahlung erfassen" Button am Ende
```

### Daten-Model (vereinfacht)
```
Zahlungen (payments):
├── Verknüpfung zum Jahresbeitrag (welcher Beitrag wird bezahlt)
├── Betrag in Euro
├── Zahlungsdatum
├── Zahlungsart (Bar / Überweisung / Sonstiges)
├── Notiz (optional, z.B. "Bar beim Vereinsabend")
├── Wer hat erfasst (automatisch)
└── Storno-Informationen (falls storniert)

Automatische Aktualisierung:
→ Bei neuer Zahlung wird "Bezahlt"-Summe im Beitrag aktualisiert
→ Statistik-Karten im Dashboard aktualisieren sich
```

### Wiederverwendung bestehender Komponenten
- ✅ **Dialog** für Zahlung erfassen (shadcn/ui)
- ✅ **Sheet/Slide-Over** für Zahlungshistorie (shadcn/ui)
- ✅ **DatePicker** (falls vorhanden, sonst Input mit type="date")
- ✅ **Select** für Zahlungsart (shadcn/ui)
- ✅ **Toast** für Erfolgs-/Fehlermeldungen

### Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Integration in PROJ-6 | Keine separate Seite nötig, Kontext ist der Beitrag |
| Storno statt Löschen | Nachvollziehbarkeit für Kassenprüfung wichtig |
| Betrag nicht änderbar | Bei Fehler: Stornieren + neu erfassen (saubere Historie) |
| Trigger für Summen-Update | Datenbank berechnet automatisch, kein manuelles Aktualisieren |

### Dependencies
Keine neuen Packages erforderlich:
- Alle UI-Komponenten bereits vorhanden
- Supabase Trigger für automatische Berechnung

### Workflow-Beispiel
```
Vorstand erhält Überweisung von Max Müller (60 €)
                    ↓
Öffnet Beitrags-Dashboard → findet Max Müller
                    ↓
Klickt "Zahlung erfassen" → Modal öffnet sich
                    ↓
Trägt 60 € ein, Datum, "Überweisung" → Speichern
                    ↓
Tabelle aktualisiert: Status wechselt von "Offen" zu "Teilweise"
Statistik-Karten aktualisieren sich
```

### Implementierungs-Reihenfolge
1. Datenbank-Tabelle für Zahlungen + Trigger für Summen-Update
2. API-Endpoints (Erfassen, Bearbeiten, Stornieren)
3. "Zahlung erfassen" Modal
4. Zahlungshistorie Slide-Over
5. Storno-Funktionalität
6. Integration der Buttons in Beitrags-Tabelle

---

## Checkliste vor Abschluss

- [x] User Stories definiert (5 Stories)
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases identifiziert
- [x] Technische Anforderungen dokumentiert
- [x] Feature-ID vergeben: PROJ-7
- [x] Status gesetzt: Planned
- [ ] User Review: Ausstehend

---

## QA Test Results

**Tested:** 2026-01-27
**Re-Test:** 2026-01-27
**Tester:** QA Engineer (Claude)
**App URL:** http://localhost:3000
**Methode:** Code-Review + Statische Analyse

---

## Test Summary

| Kategorie | Status |
|-----------|--------|
| Acceptance Criteria | 18/18 passed (100%) |
| Edge Cases | 8/8 passed (100%) |
| Security | ✅ Keine kritischen Issues |
| Regression | ✅ Keine Regression gefunden |
| Bugs | 0 (BUG-1 behoben) |

**Status: PRODUCTION-READY**

---

## BUG-1 Fix (Re-Test 2026-01-27)

**Status:** ✅ Behoben

**Änderungen:**
1. `page.tsx:31` - Import korrigiert: `import { getPaymentStatus } from "@/lib/validations/payment"`
2. `page.tsx:180, 212` - Korrekte Funktion verwendet
3. `fees-table.tsx:30` - Typ erweitert um "overpaid"
4. `fees-table.tsx:66-71` - StatusBadge unterstützt "overpaid" mit "Überzahlt" Label
5. `fees-table.tsx:79-80` - Blaues Styling (`bg-blue-600`) für Überzahlung

---

## Acceptance Criteria Status

### AC-1: Zahlung erfassen (Modal)
- [x] Button "Zahlung erfassen" in der Beitrags-Tabelle bei jedem Eintrag
- [x] Felder korrekt implementiert (Betrag, Datum, Zahlungsart, Notiz)
- [x] Validierung: Betrag > 0, Datum nicht Zukunft, Datum >= Beitragsjahr
- [x] Vorausfüllung: Offener Betrag als Vorschlag
- [x] Speichern: Erfolgs-Toast + Tabelle aktualisiert

### AC-2: Zahlungshistorie (Modal/Slide-Over)
- [x] Button "Historie" in Dropdown-Menü
- [x] Klick auf "Bezahlt"-Betrag öffnet Historie
- [x] Liste aller Zahlungen mit Datum, Betrag, Art, Notiz, User, Aktionen
- [x] Sortierung: Neueste zuerst
- [x] Summen-Zeile + Leerer State

### AC-3: Zahlung stornieren
- [x] Button "Stornieren" bei nicht-stornierten Zahlungen
- [x] Bestätigungs-Dialog mit Storno-Grund (Pflicht)
- [x] Markierung statt Löschung + Durchgestrichene Anzeige

### AC-4: Zahlung bearbeiten
- [x] Nur Notiz + Zahlungsart änderbar
- [x] Hinweis für Betrag-Korrektur

### AC-5: Überzahlung
- [x] Erlaubt: Bezahlt > Soll
- [x] Status "Überzahlt" (Blau) in Tabelle
- [x] Guthaben-Hinweis in Historie

### AC-6: Update der Beitrags-Tabelle
- [x] amount_paid wird via Trigger aktualisiert
- [x] Status-Badge + Statistik-Karten aktualisieren sich

---

## Edge Cases Status (8/8 ✅)

- [x] EC-1: Zahlung für komplett bezahlten Beitrag → Überzahlung erlaubt
- [x] EC-2: Hoher Betrag (>10.000 €) → Warnung + Max 100.000 €
- [x] EC-3: Zahlung für vergangenes Jahr → Validierung korrekt
- [x] EC-4: Doppelte Zahlung → Erlaubt
- [x] EC-5: Einzige Zahlung stornieren → Status wird "Offen"
- [x] EC-6: Storno rückgängig → Nicht möglich (korrekt)
- [x] EC-7: Stornierte Zahlung bearbeiten → Verhindert
- [x] EC-8: Bereits stornierte Zahlung erneut stornieren → Verhindert

---

## Security Check Results

- [x] API Auth Check (getUser) + Role Check (is_vorstand)
- [x] RLS Policies auf payments Tabelle
- [x] UUID Format Validation + Zod Schema Validation
- [x] Parameterisierte Queries (kein SQL-Injection)
- [x] Storno statt Löschen (Audit-Trail)

---

## Regression Test

- [x] PROJ-6: Beitrags-Tabelle + Status-Badges (paid/partial/open/overpaid)
- [x] PROJ-6: Statistik-Karten + Beitrag anpassen

---

## QA Checklist

- [x] Bestehende Features geprüft
- [x] Feature Spec vollständig verstanden
- [x] Alle Acceptance Criteria getestet (18/18 ✅)
- [x] Alle Edge Cases getestet (8/8 ✅)
- [x] Security Check durchgeführt
- [x] Regression Test bestanden
- [x] **Production-Ready Decision: READY**

---

*Vollständiger Report: `/test-reports/PROJ-7-payment-recording-qa-report.md`*
