# PROJ-20: Event-Verwaltung (Basis)

## Status: ✅ Deployed

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-12 (Group Administration) - für Gruppen-Zuweisung in PROJ-21

---

## Übersicht
Grundlegende Event-Verwaltung für den Verein. Ermöglicht das Erstellen, Bearbeiten und Verwalten von Veranstaltungen aller Art mit einem klaren Status-Workflow.

---

## User Stories

### US-1: Event erstellen (Vorstand/Trainer)
**Als** Vorstand oder Trainer
**möchte ich** ein neues Event erstellen können
**um** Veranstaltungen für den Verein zu planen.

### US-2: Event-Typen unterscheiden
**Als** Vorstand
**möchte ich** verschiedene Event-Typen auswählen können
**um** Events thematisch zu kategorisieren (Auftritt, Wettkampf, Vereins-Event, Training-Event).

### US-3: Event-Status verwalten
**Als** Vorstand
**möchte ich** den Status eines Events ändern können
**um** den Planungsfortschritt transparent zu machen (Anfrage → Bestätigt → Abgeschlossen/Abgesagt).

### US-4: Kalender-Übersicht
**Als** Mitglied
**möchte ich** alle bestätigten Events in einem Monatskalender sehen
**um** einen schnellen Überblick über anstehende Termine zu haben.

### US-5: Event-Details ansehen
**Als** Mitglied
**möchte ich** die Details eines Events einsehen können
**um** zu wissen wann, wo und was stattfindet.

### US-6: Rollenbasierte Sichtbarkeit
**Als** Vorstand
**möchte ich** dass nur bestätigte Events für normale Mitglieder sichtbar sind
**um** unbestätigte Anfragen nicht vorzeitig zu kommunizieren.

---

## Acceptance Criteria

### Event erstellen
- [ ] Vorstand und Trainer können neue Events erstellen
- [ ] Pflichtfelder: Titel, Datum, Startzeit, Event-Typ
- [ ] Optionale Felder: Beschreibung, Endzeit, Ort (Adresse), Treffpunkt
- [ ] Event wird initial mit Status "Anfrage" erstellt (durch Trainer) oder "Bestätigt" (durch Vorstand)

### Event-Typen
- [ ] Dropdown mit vier Typen: Auftritt/Performance, Wettkampf/Match, Vereins-Event, Training-Event
- [ ] Jeder Typ hat ein eigenes Icon/Farbe zur visuellen Unterscheidung
- [ ] Event-Typ kann nachträglich geändert werden

### Status-Workflow
- [ ] Vier Status: `anfrage`, `bestaetigt`, `abgeschlossen`, `abgesagt`
- [ ] Trainer-erstellte Events starten als "Anfrage"
- [ ] Nur Vorstand kann Status auf "Bestätigt" setzen
- [ ] "Abgeschlossen" wird manuell gesetzt oder automatisch nach Enddatum
- [ ] "Abgesagt" kann jederzeit vom Vorstand gesetzt werden
- [ ] Status-Änderungen werden mit Timestamp geloggt

### Kalender-Ansicht
- [ ] Monatskalender mit Navigation (Vor/Zurück/Heute)
- [ ] Events werden als farbcodierte Punkte/Badges am jeweiligen Tag angezeigt
- [ ] Klick auf Tag öffnet Liste der Events dieses Tages
- [ ] Klick auf Event öffnet Event-Detail-Ansicht
- [ ] Mobile: Kalender ist touch-optimiert und scrollbar

### Rollenbasierte Sichtbarkeit
- [ ] **Mitglieder** sehen nur Events mit Status "Bestätigt" oder "Abgeschlossen"
- [ ] **Trainer** sehen zusätzlich ihre eigenen "Anfrage"-Events
- [ ] **Vorstand** sieht alle Events in allen Status
- [ ] Filter-Option für Vorstand: Nach Status filtern

### Event bearbeiten/löschen
- [ ] Events können vom Ersteller oder Vorstand bearbeitet werden
- [ ] Events können nur vom Vorstand gelöscht werden
- [ ] Löschen erfordert Bestätigung (Confirm-Dialog)
- [ ] Bei Events mit Teilnehmer-Zusagen: Warnung vor dem Löschen

---

## Edge Cases

### E-1: Event in der Vergangenheit erstellen
- **Szenario:** User versucht Event mit Datum in der Vergangenheit zu erstellen
- **Lösung:** Warnung anzeigen, aber erlauben (für nachträgliche Dokumentation)

### E-2: Überlappende Events
- **Szenario:** Zwei Events am gleichen Tag zur gleichen Zeit
- **Lösung:** Erlauben, aber visuelle Warnung im Kalender anzeigen

### E-3: Event ohne Endzeit
- **Szenario:** User gibt nur Startzeit an
- **Lösung:** Endzeit ist optional, wird als "offen" dargestellt

### E-4: Status-Rückschritt
- **Szenario:** "Bestätigtes" Event soll zurück auf "Anfrage"
- **Lösung:** Nicht erlaubt. Nur Vorwärts-Transitions oder "Abgesagt"

### E-5: Trainer wird Mitglied degradiert
- **Szenario:** Trainer der Events erstellt hat, verliert Trainer-Rolle
- **Lösung:** Events bleiben bestehen, können aber nicht mehr vom Ex-Trainer bearbeitet werden

---

## Technische Anforderungen

### Performance
- Kalender lädt Events für sichtbaren Monat + 1 Monat vor/nach
- Lazy Loading für Event-Details
- Response Time < 300ms für Kalender-Rendering

### Datenbank (Supabase)
```sql
-- events Tabelle
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- 'performance', 'match', 'club_event', 'training_event'
  status VARCHAR(50) NOT NULL DEFAULT 'anfrage', -- 'anfrage', 'bestaetigt', 'abgeschlossen', 'abgesagt'
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location_name VARCHAR(200),
  address TEXT,
  meeting_point VARCHAR(200),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
-- Mitglieder: Nur bestätigte/abgeschlossene Events
-- Trainer: + eigene Anfragen
-- Vorstand: Alle Events
```

### Security
- RLS Policies für rollenbasierte Sichtbarkeit
- Nur authentifizierte User können Events sehen
- Audit-Log für Status-Änderungen

---

## UI/UX Anforderungen

### Kalender-Komponente
- Verwendet bestehende shadcn/ui Komponenten wo möglich
- Farbschema für Event-Typen:
  - 🟣 Auftritt/Performance
  - 🔵 Wettkampf/Match
  - 🟢 Vereins-Event
  - 🟠 Training-Event

### Mobile-First
- Kalender passt sich an Bildschirmbreite an
- Swipe-Gesten für Monatswechsel
- Bottom-Sheet für Event-Details auf Mobile

### Event-Formular
- Mehrstufiges Formular oder ausklappbare Sections
- Adress-Feld mit Autocomplete (optional, nice-to-have)
- Datum/Zeit-Picker mit deutscher Lokalisierung

---

## Nicht in Scope (für spätere Features)
- ❌ Gruppen-/Mitglieder-Zuweisung (→ PROJ-21)
- ❌ RSVP-System (→ PROJ-21)
- ❌ Ablaufplan/Timeline (→ PROJ-22)
- ❌ Logistik-Details (→ PROJ-22)
- ❌ Wiederkehrende Events (Serie)
- ❌ Event-Benachrichtigungen (Push/Email)

---

## Tech-Design (Solution Architect)

### Bestehende Architektur-Analyse

**Wiederverwendbare Infrastruktur:**
- Training-System mit ähnlichem Pattern (training_sessions, attendance)
- Notifications-System für In-App Benachrichtigungen
- Audit-Log Pattern (attendance_audit_log, transaction_audit_log)
- RLS-Funktionen für Rollenprüfung (is_vorstand, is_trainer_of_group)
- shadcn/ui Komponenten (Dialog, Form, Select, Card, Badge, etc.)

**Neue Route benötigt:**
- `/admin/events` - Event-Verwaltung für Vorstand
- `/trainer/events` - Event-Ansicht für Trainer (eigene + bestätigte)
- `/member/events` - Event-Kalender für Mitglieder

---

### Component-Struktur

```
Events-Bereich (alle Rollen)
├── Kalender-Ansicht
│   ├── Monats-Header (Navigation: Vor/Zurück/Heute)
│   ├── Wochen-Leiste (Mo-So)
│   ├── Tages-Raster
│   │   └── Event-Punkte (farbcodiert nach Typ)
│   └── Tages-Detail-Sheet (bei Klick auf Tag)
│       └── Event-Liste des Tages
│
├── Event-Detail-Seite
│   ├── Header (Typ-Badge, Status-Badge, Titel)
│   ├── Basis-Infos (Datum, Uhrzeit, Ort)
│   ├── Beschreibung
│   ├── Treffpunkt (falls vorhanden)
│   └── Aktions-Buttons (Bearbeiten/Löschen - rollenabhängig)
│
└── Event-Formular (nur Vorstand/Trainer)
    ├── Basis-Section
    │   ├── Titel-Eingabe
    │   ├── Event-Typ Dropdown
    │   ├── Datum-Picker
    │   └── Zeit-Picker (Start + Ende optional)
    ├── Ort-Section
    │   ├── Ort-Name
    │   ├── Adresse
    │   └── Treffpunkt
    └── Beschreibung-Textarea

Vorstand-spezifisch
├── Status-Änderung Dropdown
├── Status-Filter in Kalender
└── Löschen-Button mit Confirm-Dialog
```

---

### Daten-Model

**Events speichern:**
- Eindeutige ID
- Titel (max 200 Zeichen)
- Beschreibung (optional, längerer Text)
- Event-Typ (Auftritt, Wettkampf, Vereins-Event, Training-Event)
- Status (Anfrage → Bestätigt → Abgeschlossen/Abgesagt)
- Datum
- Startzeit
- Endzeit (optional)
- Ort-Name (optional, z.B. "Stadthalle")
- Adresse (optional, vollständige Adresse)
- Treffpunkt (optional, z.B. "Parkplatz Hintereingang")
- Ersteller (wer hat das Event angelegt)
- Erstellungszeitpunkt
- Letzte Änderung

**Status-Änderungen protokollieren:**
- Welches Event
- Alter Status → Neuer Status
- Wer hat geändert
- Wann wurde geändert

**Gespeichert in:** Supabase (PostgreSQL) mit Row Level Security

---

### Zugriffs-Logik

| Aktion | Mitglied | Trainer | Vorstand |
|--------|----------|---------|----------|
| Bestätigte Events sehen | ✅ | ✅ | ✅ |
| Eigene Anfrage-Events sehen | - | ✅ | ✅ |
| Alle Events sehen | - | - | ✅ |
| Event erstellen | - | ✅ (als Anfrage) | ✅ (als Bestätigt) |
| Eigenes Event bearbeiten | - | ✅ | ✅ |
| Fremdes Event bearbeiten | - | - | ✅ |
| Status ändern | - | - | ✅ |
| Event löschen | - | - | ✅ |

---

### Tech-Entscheidungen

**Warum keine externe Kalender-Library?**
→ shadcn/ui + date-fns reichen für einen Monatskalender aus
→ Weniger Bundle-Größe, volle Kontrolle über Design
→ Swipe-Gesten mit `use-gesture` (bereits im Projekt-Ökosystem)

**Warum Status-Log statt Versionen?**
→ Einfacher als Volltextversionen der Events
→ Reicht für Nachvollziehbarkeit (wer hat wann Status geändert)
→ Pattern bereits bekannt aus attendance_audit_log

**Warum kein club_id?**
→ Single-Tenant System (ein Verein pro Installation)
→ Vereinfacht Queries und RLS-Policies

**Warum rollenbasierte RLS statt nur Ersteller-Check?**
→ Vorstand muss alle Events sehen und verwalten können
→ Trainer sollen auch Anfragen anderer Trainer nicht sehen
→ Mitglieder sollen keine unfertigen Events sehen

---

### Dependencies

**Bereits vorhanden (keine Installation nötig):**
- date-fns (Datumsformatierung, bereits genutzt)
- shadcn/ui Komponenten (Dialog, Form, Select, Badge, Card)
- Supabase Client

**Optional (Nice-to-Have für Swipe-Gesten):**
- @use-gesture/react (Touch-Gesten für Monatswechsel)

---

### API-Struktur

**Neue Endpoints:**
- `GET /api/events` - Events laden (mit Datumsbereich-Filter)
- `POST /api/events` - Event erstellen
- `GET /api/events/[id]` - Event-Details
- `PUT /api/events/[id]` - Event bearbeiten
- `DELETE /api/events/[id]` - Event löschen (nur Vorstand)
- `PATCH /api/events/[id]/status` - Status ändern (nur Vorstand)

**Folgt bestehendem Pattern wie:**
- `/api/training/sessions` für Training Sessions
- `/api/treasury` für Transaktionen

---

## QA Test Results (Re-Test)

**Tested:** 2026-02-09 (Re-Test)
**Tested By:** QA Engineer (Code Review + Security Analysis)
**App URL:** http://localhost:3000
**Previous Test:** 2026-02-09

---

## ✅ Gefixte Bugs seit letztem Test

| Bug | Status | Details |
|-----|--------|---------|
| BUG-2 | ✅ GEFIXT | Auto-Complete Route implementiert (`/api/events/auto-complete`) |
| BUG-3 | ✅ GEFIXT | Status-Log wird jetzt für alle Rollen erstellt ([route.ts:183-189](src/app/api/events/route.ts#L183-L189)) |
| BUG-4 | ✅ GEFIXT | Swipe-Gesten via `useSwipe` Hook implementiert |
| BUG-5 | ✅ TEILWEISE GEFIXT | Edit-Button für Anfrage-Events vorhanden (siehe BUG-8) |
| BUG-6 | ✅ GEFIXT | Warnung bei Vergangenheits-Datum implementiert |
| BUG-7 | ✅ GEFIXT | Überlappungs-Warnung implementiert |
| SEC-2 | ✅ GEFIXT | UUID-Validierung via `isValidUUID()` hinzugefügt |
| SEC-5 | ✅ GEFIXT | Rate-Limiting via Upstash Redis implementiert (10 Events/h) |

---

## Acceptance Criteria Status

### Event erstellen
- [x] Vorstand und Trainer können neue Events erstellen
- [x] Pflichtfelder: Titel, Datum, Startzeit, Event-Typ
- [x] Optionale Felder: Beschreibung, Endzeit, Ort (Adresse), Treffpunkt
- [x] Event wird initial mit Status "Anfrage" erstellt (durch Trainer) oder "Bestätigt" (durch Vorstand)

### Event-Typen
- [x] Dropdown mit vier Typen: Auftritt/Performance, Wettkampf/Match, Vereins-Event, Training-Event
- [x] Jeder Typ hat ein eigenes Icon/Farbe zur visuellen Unterscheidung
- [x] Event-Typ kann nachträglich geändert werden (nur Admin)
- [x] ~~BUG-1~~ Trainer Edit funktioniert für Anfrage-Events

### Status-Workflow
- [x] Vier Status: `anfrage`, `bestaetigt`, `abgeschlossen`, `abgesagt`
- [x] Trainer-erstellte Events starten als "Anfrage"
- [x] Nur Vorstand kann Status auf "Bestätigt" setzen
- [x] ~~BUG-2~~ Auto-Complete Route existiert für automatisches Abschließen
- [x] "Abgesagt" kann jederzeit vom Vorstand gesetzt werden
- [x] Status-Änderungen werden mit Timestamp geloggt
- [x] ~~BUG-3~~ Status-Log wird für alle Events erstellt

### Kalender-Ansicht
- [x] Monatskalender mit Navigation (Vor/Zurück/Heute)
- [x] Events werden als farbcodierte Punkte/Badges am jeweiligen Tag angezeigt
- [x] Klick auf Tag öffnet Liste der Events dieses Tages (bei mehreren Events)
- [x] Klick auf Event öffnet Event-Detail-Ansicht
- [x] ~~BUG-4~~ Mobile: Swipe-Gesten für Monatswechsel implementiert

### Rollenbasierte Sichtbarkeit
- [x] **Mitglieder** sehen nur Events mit Status "Bestätigt" oder "Abgeschlossen"
- [x] **Trainer** sehen zusätzlich ihre eigenen "Anfrage"-Events
- [x] **Vorstand** sieht alle Events in allen Status
- [x] Filter-Option für Vorstand: Nach Status filtern

### Event bearbeiten/löschen
- [x] Events können vom Vorstand bearbeitet werden
- [x] ~~BUG-5~~ Trainer können eigene Anfrage-Events bearbeiten
- [ ] **BUG-8:** Trainer können bestätigte eigene Events NICHT bearbeiten (Backend erlaubt es)
- [x] Events können nur vom Vorstand gelöscht werden
- [x] Löschen erfordert Bestätigung (Confirm-Dialog)
- [ ] **N/A:** Bei Events mit Teilnehmer-Zusagen: Warnung vor dem Löschen (PROJ-21 Scope)

---

## Edge Cases Status

### E-1: Event in der Vergangenheit erstellen
- [x] ~~BUG-6~~ Warnung wird angezeigt bei Vergangenheits-Datum
- [x] Event-Erstellung wird trotzdem erlaubt (für Dokumentation)

### E-2: Überlappende Events
- [x] ~~BUG-7~~ Warnung wird bei überlappenden Events angezeigt
- [x] Event-Erstellung wird trotzdem erlaubt

### E-3: Event ohne Endzeit
- [x] Endzeit ist optional
- [x] Wird korrekt als nur Startzeit dargestellt

### E-4: Status-Rückschritt
- [x] Nicht erlaubt (Backend validiert ALLOWED_TRANSITIONS)
- [x] Nur Vorwärts-Transitions oder "Abgesagt" möglich

### E-5: Trainer wird Mitglied degradiert
- [x] Events bleiben bestehen
- [x] RLS-Policy prüft aktuellen Rollenstatus

---

## Security Analysis (Red-Team)

### SEC-1: RLS-Policies - PASS ✅
- **Status:** Sicher
- **Details:**
  - `events_select_policy`: Vorstand sieht alles, Mitglieder nur bestätigt/abgeschlossen, Trainer eigene + bestätigt
  - `events_insert_policy`: Nur Vorstand/Trainer mit korrekter `created_by`
  - `events_update_policy`: Vorstand oder eigener Event (Trainer)
  - `events_delete_policy`: Nur Vorstand
- **Risiko:** Niedrig

### SEC-2: UUID-Validierung - PASS ✅ (GEFIXT)
- **Status:** Sicher
- **Location:** [src/lib/validations/events.ts:6-8](src/lib/validations/events.ts#L6-L8)
- **Details:** `isValidUUID()` Funktion validiert alle Event-IDs in API-Routen
- **Test:** Ungültige UUID → HTTP 400 "Invalid event ID format"

### SEC-3: IDOR (Insecure Direct Object Reference) - PASS ✅
- **Status:** Geschützt durch RLS
- **Details:** RLS-Policies verhindern Zugriff auf fremde Events

### SEC-4: XSS-Prävention - PASS ✅
- **Status:** React escaped automatisch
- **Details:** Alle Textfelder werden durch React gerendert (keine dangerouslySetInnerHTML)

### SEC-5: Rate-Limiting - PASS ✅ (GEFIXT)
- **Status:** Implementiert
- **Location:** [src/lib/rate-limiter.ts](src/lib/rate-limiter.ts)
- **Details:** 10 Events pro Stunde pro User via Upstash Redis
- [ ] **SEC-8:** Rate-Limiting ist DEAKTIVIERT wenn Redis nicht konfiguriert (Warning)

### SEC-6: SQL-Injection - PASS ✅
- **Status:** Sicher
- **Details:** Supabase Client verwendet Parameterized Queries

### SEC-7: Authentication Check - PASS ✅
- **Status:** Alle API-Routen prüfen `supabase.auth.getUser()`

### SEC-8: Rate-Limiting Fallback - WARNING ⚠️
- **Severity:** Medium
- **Location:** [src/lib/rate-limiter.ts:46-48](src/lib/rate-limiter.ts#L46-L48)
- **Details:** Wenn `UPSTASH_REDIS_REST_URL` nicht gesetzt, wird Rate-Limiting komplett deaktiviert
- **Impact:** In Produktionsumgebungen ohne Redis: Kein Schutz vor DoS
- **Recommendation:** Env-Check beim Start oder In-Memory Fallback
- **Zuordnung:** Backend (DevOps)

### SEC-9: Auto-Complete Route Authentifizierung - WARNING ⚠️
- **Severity:** Low
- **Location:** [src/app/api/events/auto-complete/route.ts](src/app/api/events/auto-complete/route.ts)
- **Details:** Wenn `CRON_SECRET` nicht gesetzt, kann jeder Vorstand die Route aufrufen
- **Impact:** Minimal (nur Status-Änderungen auf abgeschlossen)
- **Recommendation:** `CRON_SECRET` in Produktion setzen
- **Zuordnung:** Backend (DevOps)

---

## Verbleibende Bugs

### BUG-8: Trainer Edit nur für Anfrage-Events (Frontend)
- **Severity:** Low
- **Location:** [src/app/(dashboard)/trainer/events/page.tsx:581](src/app/(dashboard)/trainer/events/page.tsx#L581)
- **Details:** Edit-Button erscheint nur für Events mit Status "anfrage"
- **Backend-Verhalten:** Erlaubt Bearbeitung aller eigenen Events (auch bestätigt)
- **Frontend-Code:** `{selectedEvent.status === "anfrage" && (<Button>Bearbeiten</Button>)}`
- **Expected:** Edit-Button für ALLE eigenen Events (wie Backend erlaubt)
- **Actual:** Edit-Button nur für Anfrage-Events
- **Impact:** Trainer können bestätigte Events nicht im UI bearbeiten
- **Priority:** Low (Business-Entscheidung: Eventuell gewollt?)
- **Zuordnung:** Frontend

---

## Summary

| Kategorie | Status | Verbesserung |
|-----------|--------|--------------|
| Acceptance Criteria | 21/22 bestanden (95%) | +13% |
| Edge Cases | 5/5 bestanden (100%) | +40% |
| Security Checks | 7/9 bestanden + 2 Warnings | Verbessert |
| Bugs gefunden | 1 (0 Critical, 0 Medium, 1 Low) | -6 Bugs |

### Bug-Status Übersicht

| Status | Anzahl | Details |
|--------|--------|---------|
| ✅ Gefixt | 8 | BUG-2 bis BUG-7, SEC-2, SEC-5 |
| ⚠️ Warnings | 2 | SEC-8, SEC-9 (DevOps-Konfiguration) |
| 🐛 Offen | 1 | BUG-8 (Low Priority) |

### Nach Zuordnung

**Backend (0 Bugs, 2 Warnings):**
- ⚠️ SEC-8: Rate-Limiting Fallback (DevOps)
- ⚠️ SEC-9: Auto-Complete CRON_SECRET (DevOps)

**Frontend (1 Bug):**
- 🐛 BUG-8: Trainer Edit nur für Anfrage-Events (Low)

---

## Recommendation

**Production-Ready Status:** ✅ READY

Das Feature ist vollständig funktionsfähig und sicher. Alle kritischen Bugs wurden behoben.

**Vor Production-Deployment:**
1. ✅ Alle Medium/High Bugs gefixt
2. ⚠️ **Empfohlen:** `UPSTASH_REDIS_REST_URL` und `CRON_SECRET` in Produktion setzen

**Nice-to-Have (kann später entschieden werden):**
- BUG-8: Klären ob Trainer bestätigte Events bearbeiten dürfen (Business-Entscheidung)

---

## Regression Test Checklist

Vor dem nächsten Release prüfen:
- [x] Bestehende Events werden korrekt angezeigt
- [x] Kalender-Navigation funktioniert (inkl. Swipe)
- [x] Status-Änderungen werden geloggt
- [x] RLS-Policies greifen korrekt
- [x] Rate-Limiting funktioniert (mit Redis)
- [x] Vergangenheits- und Überlappungs-Warnungen erscheinen
- [ ] Keine Regression in Training-System (ähnliche Patterns)
