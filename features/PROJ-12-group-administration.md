# PROJ-12: Gruppenverwaltung (Group Administration)

## Status: Deployed (2026-01-30)

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-3 (Role-Based Dashboards) - für Trainer/Admin Navigation
- Benötigt: PROJ-4 (Member Management) - Mitglieder müssen existieren, um zugeordnet zu werden

## Übersicht
Verwaltung von Vereinsgruppen (z.B. Showtanz, Garde, Männerballett) mit Trainer-/Co-Trainer-Zuordnung, Mitgliederverwaltung, automatischer Altersbereichs-Berechnung und erweiterten Trainingszeit-Informationen. Chat-Funktion kann pro Gruppe optional aktiviert werden.

**Routen:**
- `/admin/groups` (Vorstand: volle Verwaltung)
- `/trainer/groups` (Trainer: eigene Gruppen bearbeiten)
- `/member/groups` (Mitglied: zugewiesene Gruppen einsehen)

---

## User Stories

### US-1: Gruppe erstellen
**Als** Vorstandsmitglied
**möchte ich** eine neue Gruppe mit Name, Beschreibung, Trainingszeiten und Trainingsort erstellen
**um** eine Vereinsabteilung digital abzubilden.

### US-2: Trainer/Co-Trainer zuweisen
**Als** Vorstandsmitglied
**möchte ich** einer Gruppe einen Trainer und optional einen oder mehrere Co-Trainer zuweisen
**um** klare Verantwortlichkeiten zu definieren.

### US-3: Mitglieder einer Gruppe zuordnen
**Als** Vorstandsmitglied oder Trainer der Gruppe
**möchte ich** Mitglieder zu einer Gruppe hinzufügen oder entfernen
**um** die Gruppenzusammensetzung zu verwalten.

### US-4: Altersbereich automatisch sehen
**Als** Trainer oder Vorstandsmitglied
**möchte ich** den automatisch berechneten Altersbereich der Gruppe sehen (z.B. "6 - 11 Jahre")
**um** die Altersstruktur auf einen Blick zu erkennen.

### US-5: Meine Gruppen einsehen (Mitglied)
**Als** Mitglied
**möchte ich** sehen in welchen Gruppen ich Mitglied bin, inkl. Trainingszeiten und -ort
**um** meine Vereinsaktivitäten zu planen.

### US-6: Gruppe bearbeiten (Trainer)
**Als** Trainer der Gruppe
**möchte ich** Beschreibung, Trainingszeiten und Trainingsort meiner Gruppe bearbeiten
**um** aktuelle Informationen zu pflegen.

### US-7: Chat-Funktion für Gruppe aktivieren
**Als** Vorstandsmitglied
**möchte ich** bei der Gruppenerstellung wählen, ob die Gruppe eine Chat-Funktion erhält
**um** die Kommunikation nur dort zu aktivieren, wo sie sinnvoll ist (z.B. ältere Gruppen).

### US-8: Max-Teilnehmer festlegen
**Als** Vorstandsmitglied oder Trainer
**möchte ich** eine maximale Teilnehmerzahl für die Gruppe festlegen
**um** die Gruppengröße zu kontrollieren und bei Erreichen des Limits gewarnt zu werden.

---

## Acceptance Criteria

### Gruppen-Übersicht (Admin)
- [ ] Liste aller Gruppen mit: Name, Trainer, Mitgliederanzahl, Altersbereich, Status (aktiv/inaktiv)
- [ ] Suchfeld zum Filtern nach Gruppenname
- [ ] Button "Neue Gruppe erstellen"
- [ ] Gruppen können aktiviert/deaktiviert werden
- [ ] Responsive: Tabelle auf Desktop, Karten auf Mobile (ResponsiveTable-Komponente)

### Gruppe erstellen/bearbeiten (Formular)
- [ ] **Pflichtfelder:** Name, mindestens ein Trainer
- [ ] **Optionale Felder:** Beschreibung, Trainingstag (Wochentag-Select), Trainingszeit (Start/Ende), Trainingsort (Freitext), Max-Teilnehmer
- [ ] **Chat aktivieren:** Checkbox "Gruppen-Chat aktivieren" (nur bei Erstellung, nicht nachträglich deaktivierbar)
- [ ] **Trainer-Auswahl:** Dropdown mit allen Profilen die Rolle "trainer" oder "vorstand" haben
- [ ] **Co-Trainer-Auswahl:** Multi-Select für weitere Trainer (optional)
- [ ] Validierung: Gruppenname muss einzigartig sein
- [ ] Validierung: Trainingszeit-Ende muss nach Start liegen

### Trainer-Verwaltung (Regeln)
- [ ] Eine Gruppe kann einen Trainer und beliebig viele Co-Trainer haben
- [ ] Wird der Trainer entfernt und es gibt Co-Trainer → der erste Co-Trainer wird automatisch zum Trainer
- [ ] Wird der Trainer entfernt und es gibt KEINE Co-Trainer → Warnung: "Gruppe hat keinen Trainer. Bitte neuen Trainer zuweisen."
- [ ] Gruppe darf nicht ohne Trainer gespeichert werden (bei Erstellung)
- [ ] Vorstand kann jederzeit Trainer/Co-Trainer ändern
- [ ] Trainer selbst können KEINE Trainer-Zuordnung ändern (nur Vorstand)

### Mitglieder-Zuordnung
- [ ] Searchable Multi-Select für Mitglieder (aus allen aktiven Profilen)
- [ ] Anzeige: Name, Alter, funktionale Tags des Mitglieds
- [ ] Mitglied kann in mehreren Gruppen gleichzeitig sein
- [ ] Wenn Max-Teilnehmer gesetzt und erreicht → Warnung beim Hinzufügen (aber nicht blockierend)
- [ ] Vorstand und zugewiesener Trainer/Co-Trainer können Mitglieder verwalten

### Altersbereich-Berechnung
- [ ] Automatisch basierend auf `date_of_birth` aller Gruppenmitglieder
- [ ] Format: "X - Y Jahre" (jüngstes bis ältestes Mitglied)
- [ ] Wenn keine Mitglieder zugewiesen → "Keine Mitglieder"
- [ ] Berechnung erfolgt live (nicht gespeichert), basierend auf aktuellem Datum

### Meine Gruppen (Mitglied-Ansicht)
- [ ] Liste der Gruppen in denen das Mitglied zugeordnet ist
- [ ] Pro Gruppe: Name, Trainingstag & -zeit, Trainingsort, Trainer-Name
- [ ] Kein Bearbeiten möglich für Mitglieder
- [ ] Chat-Button sichtbar wenn Chat für die Gruppe aktiviert ist (→ PROJ-14)

### Trainer-Ansicht
- [ ] Trainer sieht nur seine eigenen Gruppen (als Trainer oder Co-Trainer)
- [ ] Kann Mitglieder hinzufügen/entfernen
- [ ] Kann Beschreibung, Trainingszeiten, Trainingsort bearbeiten
- [ ] Kann NICHT: Gruppe erstellen/löschen, Trainer ändern, Chat-Option ändern

### Berechtigungen (RBAC)
- [ ] **Vorstand:** Voller Zugriff (CRUD auf alle Gruppen)
- [ ] **Trainer:** Lesen/Bearbeiten eigener Gruppen + Mitglieder verwalten
- [ ] **Mitglied:** Nur Lesen (eigene Gruppen)
- [ ] RLS-Policies auf Datenbankebene enforced

---

## Edge Cases

### E-1: Trainer wird aus dem Verein entfernt
- Wenn ein Trainer-Profil deaktiviert wird → System prüft ob er Trainer einer Gruppe ist
- Falls ja: Co-Trainer übernimmt automatisch. Falls kein Co-Trainer → Notification an Vorstand: "Gruppe X hat keinen Trainer mehr"

### E-2: Gruppe ohne Mitglieder
- Erlaubt (z.B. beim Erstellen). Altersbereich zeigt "Keine Mitglieder"
- Gruppe kann trotzdem bearbeitet und Trainer zugewiesen werden

### E-3: Mitglied in mehreren Gruppen
- Kein Limit. Ein Mitglied kann in beliebig vielen Gruppen sein
- In der Mitglieder-Tabelle (PROJ-4) soll eine Spalte "Gruppen" anzeigen

### E-4: Doppelter Gruppenname
- Validierung verhindert doppelte Gruppennamen (case-insensitive)
- Fehlermeldung: "Eine Gruppe mit diesem Namen existiert bereits"

### E-5: Max-Teilnehmer überschritten
- Warnung wird angezeigt, aber nicht blockierend (Vorstand kann Override)
- Badge in Gruppenübersicht zeigt "X/Y Mitglieder" mit roter Markierung bei Überschreitung

### E-6: Trainer ist gleichzeitig Co-Trainer
- Nicht erlaubt. System verhindert, dass dieselbe Person sowohl Trainer als auch Co-Trainer ist
- Fehlermeldung: "Diese Person ist bereits als Trainer zugewiesen"

---

## Technische Anforderungen

### Bestehende DB-Tabellen erweitern
- `groups`: Neue Spalten: `training_day` (text), `training_start_time` (time), `training_end_time` (time), `training_location` (text), `max_members` (integer), `chat_enabled` (boolean, default false)
- `groups`: `trainer_id` bleibt als Haupt-Trainer
- **Neue Tabelle:** `group_trainers` für Co-Trainer: `id`, `group_id`, `profile_id`, `role` (enum: 'trainer' | 'co_trainer'), `created_at`
- `group_members`: Bestehende Tabelle nutzen (group_id, profile_id)

### Performance
- Altersbereich-Berechnung: SQL-Funktion `get_group_age_range(group_id)` für effiziente Berechnung
- Gruppen-Übersicht: Pagination (gleich wie Members-Table)
- Mitglieder-Suche: Debounced Search (300ms)

### Security
- RLS-Policies für `groups`, `group_members`, `group_trainers`
- Vorstand: SELECT, INSERT, UPDATE, DELETE auf alle
- Trainer: SELECT auf eigene Gruppen, UPDATE auf eigene Gruppen (eingeschränkte Spalten), INSERT/DELETE auf group_members für eigene Gruppen
- Mitglied: SELECT auf eigene Gruppenzuordnungen

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

Folgende Bausteine existieren bereits und werden wiederverwendet:
- **`groups`-Tabelle** in Supabase (Basis-Felder: id, name, description, trainer_id, is_active)
- **Platzhalter-Seiten** für alle 3 Rollen (`/admin/groups`, `/trainer/groups`, `/member/groups`)
- **Platzhalter-Komponenten** (my-groups-list.tsx für Mitglieder, my-groups-grid.tsx für Trainer)
- **Server Actions** (getAllGroups, getMyGroups, getGroup) — müssen erweitert werden
- **Navigation** ist bereits integriert (Sidebar + Bottom-Nav für alle Rollen)
- **UI-Bausteine:** ResponsiveTable, ResponsiveDialog, ActionMenu, Form-System (Zod + React Hook Form), Badge, Card

### Component-Struktur

#### A) Admin-Ansicht (`/admin/groups`)
```
Gruppen-Verwaltung (Admin)
├── Toolbar
│   ├── Suchfeld (Gruppenname filtern)
│   └── Button "Neue Gruppe erstellen"
├── Gruppen-Tabelle (Desktop) / Gruppen-Karten (Mobile)
│   └── Pro Zeile/Karte:
│       ├── Gruppenname
│       ├── Trainer-Name
│       ├── Mitgliederanzahl (z.B. "12/15" wenn Max gesetzt)
│       ├── Altersbereich (z.B. "6 - 11 Jahre")
│       ├── Status-Badge (Aktiv/Inaktiv)
│       └── Aktions-Menü (Bearbeiten, Mitglieder, Deaktivieren)
├── Pagination (wie Members-Tabelle)
└── Gruppen-Dialog (Modal / Bottom-Sheet auf Mobile)
    ├── Tab: Stammdaten
    │   ├── Gruppenname (Pflicht)
    │   ├── Beschreibung (Optional)
    │   ├── Trainingstag (Wochentag-Dropdown)
    │   ├── Trainingszeit Start + Ende
    │   ├── Trainingsort (Freitext)
    │   ├── Max-Teilnehmer (Zahl)
    │   └── Chat aktivieren (Checkbox, nur bei Erstellung)
    ├── Tab: Trainer
    │   ├── Trainer-Dropdown (Pflicht, aus Trainern/Vorständen)
    │   └── Co-Trainer Multi-Select (Optional)
    └── Tab: Mitglieder
        ├── Suchbare Mitglieder-Liste (Searchable Multi-Select)
        │   └── Pro Eintrag: Name, Alter, Tags
        ├── Zugewiesene Mitglieder (mit Entfernen-Button)
        └── Warnung bei Max-Überschreitung
```

#### B) Trainer-Ansicht (`/trainer/groups`)
```
Meine Gruppen (Trainer)
├── Gruppen-Grid (Karten-Layout, 1-3 Spalten je nach Bildschirm)
│   └── Pro Karte:
│       ├── Gruppenname
│       ├── Trainingstag & -zeit
│       ├── Trainingsort
│       ├── Mitgliederanzahl + Altersbereich
│       ├── Chat-Button (wenn aktiviert → PROJ-14)
│       └── Bearbeiten-Button
└── Bearbeiten-Dialog (eingeschränkt)
    ├── Beschreibung bearbeiten
    ├── Trainingszeiten/-ort bearbeiten
    ├── Mitglieder hinzufügen/entfernen
    └── KEIN Zugriff auf: Trainer-Zuweisung, Chat-Option, Gruppe löschen
```

#### C) Mitglied-Ansicht (`/member/groups`)
```
Meine Gruppen (Mitglied)
└── Gruppen-Liste (Karten)
    └── Pro Karte:
        ├── Gruppenname
        ├── Trainingstag & -zeit
        ├── Trainingsort
        ├── Trainer-Name
        └── Chat-Button (wenn aktiviert → PROJ-14)
```

### Daten-Model

#### Bestehende Tabelle erweitern: `groups`
Neue Informationen pro Gruppe:
- Trainingstag (z.B. "Montag", "Dienstag")
- Trainingszeit Start (z.B. 17:00)
- Trainingszeit Ende (z.B. 18:30)
- Trainingsort (Freitext, z.B. "Turnhalle Musterstraße")
- Maximale Teilnehmerzahl (optional, z.B. 15)
- Chat aktiviert (Ja/Nein, einmalig bei Erstellung setzbar)

#### Neue Tabelle: `group_trainers` (Co-Trainer-Verwaltung)
Pro Eintrag:
- Welche Gruppe
- Welche Person
- Rolle: "Trainer" oder "Co-Trainer"
- Seit wann zugewiesen

Warum eine eigene Tabelle? → Der Haupt-Trainer steht weiterhin direkt in der Gruppen-Tabelle (`trainer_id`). Co-Trainer brauchen eine eigene Zuordnungstabelle, da es mehrere sein können.

#### Bestehende Tabelle nutzen: `group_members`
Diese Tabelle existiert konzeptionell schon (muss ggf. in Supabase angelegt werden):
- Welche Gruppe
- Welches Mitglied
- Beitrittszeitpunkt

#### Berechneter Wert: Altersbereich
- Wird NICHT gespeichert, sondern live berechnet
- Datenbank-Funktion berechnet: Jüngstes und ältestes Mitglied → "6 - 11 Jahre"
- Bei leerer Gruppe: "Keine Mitglieder"

### Datenfluss-Übersicht

```
Vorstand erstellt Gruppe
    → Stammdaten speichern (groups-Tabelle)
    → Trainer zuweisen (groups.trainer_id)
    → Co-Trainer zuweisen (group_trainers-Tabelle)
    → Mitglieder zuordnen (group_members-Tabelle)
    → Altersbereich wird automatisch berechnet (live)

Trainer bearbeitet eigene Gruppe
    → Beschreibung/Trainingszeiten/Ort ändern (groups-Tabelle)
    → Mitglieder hinzufügen/entfernen (group_members-Tabelle)
    → KEIN Zugriff auf Trainer-Zuweisung

Mitglied sieht eigene Gruppen
    → Liest nur über group_members zugeordnete Gruppen
    → Sieht Trainingsinfos + Trainer-Name (read-only)
```

### API-Endpunkte (neu)

```
/api/groups
├── GET    → Liste aller Gruppen (mit Suche, Filter, Pagination)
├── POST   → Neue Gruppe erstellen (nur Vorstand)
│
/api/groups/[id]
├── GET    → Einzelne Gruppe mit Trainer + Mitglieder
├── PATCH  → Gruppe bearbeiten (Vorstand: alles, Trainer: eingeschränkt)
├── DELETE → Gruppe deaktivieren (nur Vorstand)
│
/api/groups/[id]/members
├── GET    → Mitglieder der Gruppe
├── POST   → Mitglied hinzufügen (Vorstand + Trainer der Gruppe)
├── DELETE → Mitglied entfernen (Vorstand + Trainer der Gruppe)
│
/api/groups/[id]/trainers
├── GET    → Trainer + Co-Trainer der Gruppe
├── POST   → Co-Trainer hinzufügen (nur Vorstand)
├── DELETE → Co-Trainer entfernen (nur Vorstand)
```

### Sicherheits-Konzept (3 Ebenen)

```
Ebene 1: Datenbank (RLS-Policies)
→ Vorstand: Vollzugriff auf alle Gruppen-Tabellen
→ Trainer: Lesen/Bearbeiten nur eigener Gruppen + Mitglieder verwalten
→ Mitglied: Nur Lesen der eigenen Zuordnungen

Ebene 2: API (Server-seitige Prüfung)
→ Auth-Check: Eingeloggt?
→ Role-Check: Richtige Rolle?
→ Ownership-Check: Ist der Trainer dieser Gruppe zugewiesen?

Ebene 3: UI (Client-seitig)
→ Buttons/Aktionen nur sichtbar wenn berechtigt
→ Formular-Felder disabled für Trainer (z.B. Trainer-Auswahl)
```

### Tech-Entscheidungen

**Warum Tabs im Gruppen-Formular?**
→ Das Formular hat 3 logische Bereiche (Stammdaten, Trainer, Mitglieder). Tabs halten es übersichtlich und verhindern ein zu langes Formular.

**Warum `trainer_id` in der groups-Tabelle behalten?**
→ Der Haupt-Trainer ist ein Pflichtfeld und wird häufig abgefragt (z.B. für RLS). Ein direktes Feld ist effizienter als immer über die group_trainers-Tabelle zu joinen.

**Warum eine DB-Funktion für den Altersbereich?**
→ Die Berechnung über alle Mitglieder-Geburtsdaten ist in SQL deutlich schneller als im Frontend. Außerdem wird der Wert in der Übersichts-Tabelle für jede Gruppe benötigt.

**Warum Chat-Aktivierung nur bei Erstellung?**
→ Designentscheidung aus der Spec: Einmal aktiviert, kann der Chat nicht deaktiviert werden. Das verhindert, dass bestehende Chat-Verläufe "verschwinden".

**Warum Searchable Multi-Select für Mitglieder?**
→ Bei vielen Vereinsmitgliedern (50+) ist eine einfache Liste zu unübersichtlich. Die Suche mit Debounce (300ms Verzögerung) sorgt für gute Performance.

### Dependencies

Keine neuen Packages nötig. Alle benötigten Bausteine existieren bereits:
- shadcn/ui (Tabs, Dialog, Select, Multi-Select via Command/Popover)
- React Hook Form + Zod (Formulare + Validierung)
- lucide-react (Icons)
- Supabase Client (Datenbank + Auth)

---

## QA Test Results

**Tested:** 2026-01-30 (Re-Test #2 -- Bug-Fix Verification)
**Tester:** QA Engineer (Code Review + Red Team Security Audit + Live RLS Verification)
**Full Report:** `/test-reports/PROJ-12-qa-report.md`

### Acceptance Criteria Status

#### Gruppen-Ubersicht (Admin)
- [x] Liste aller Gruppen mit: Name, Trainer, Mitgliederanzahl, Altersbereich, Status
- [x] Suchfeld zum Filtern nach Gruppenname
- [x] Button "Neue Gruppe erstellen"
- [x] Gruppen koennen aktiviert/deaktiviert werden (BUG-7 VERIFIZIERT)
- [x] Responsive: Tabelle auf Desktop, Karten auf Mobile

#### Gruppe erstellen/bearbeiten (Formular)
- [x] Pflichtfelder: Name, mindestens ein Trainer
- [x] Optionale Felder: Beschreibung, Trainingstag, Trainingszeit, Trainingsort, Max-Teilnehmer
- [x] Chat aktivieren: Nur bei Erstellung (UI + API + Zod .strict() schuetzt)
- [x] Trainer-Auswahl: Dropdown mit Trainern/Vorstaenden
- [x] Co-Trainer-Auswahl: Multi-Select
- [x] Validierung: Gruppenname case-insensitive geprueft (BUG-1 VERIFIZIERT + DB Unique Index)
- [x] Validierung: Trainingszeit-Ende nach Start (Client + Server + DB CHECK)

#### Trainer-Verwaltung
- [x] Ein Trainer + beliebig viele Co-Trainer
- [x] Auto-Promotion bei Trainer-Entfernung (BUG-5 VERIFIZIERT)
- [x] Warnung ohne Co-Trainer (BUG-5 VERIFIZIERT)
- [x] Gruppe nicht ohne Trainer speicherbar
- [x] Vorstand kann Trainer/Co-Trainer aendern
- [x] Trainer koennen KEINE Trainer-Zuordnung aendern

#### Mitglieder-Zuordnung
- [x] Searchable Multi-Select
- [x] Name, Alter, Tags anzeigen
- [x] Mitglied in mehreren Gruppen
- [x] Max-Teilnehmer Warnung
- [x] Vorstand + Trainer koennen Mitglieder verwalten

#### Altersbereich-Berechnung
- [x] Automatisch basierend auf date_of_birth
- [x] Format "X - Y Jahre"
- [x] "Keine Mitglieder" bei leerer Gruppe
- [x] Live-Berechnung via RPC + Batch-Fetch

#### Mitglied-Ansicht
- [x] Nur eigene Gruppen
- [x] Name, Trainingszeiten, Ort, Trainer
- [x] Kein Bearbeiten
- [x] Chat-Button als Placeholder fuer PROJ-14 (BUG-6 VERIFIZIERT)

#### Trainer-Ansicht
- [x] Nur eigene Gruppen
- [x] Mitglieder hinzufuegen/entfernen
- [x] Beschreibung/Zeiten/Ort bearbeiten
- [x] KEIN: Gruppe erstellen/loeschen, Trainer aendern, Chat aendern

#### Berechtigungen (RBAC)
- [x] Vorstand: Voller Zugriff
- [x] Trainer: Lesen/Bearbeiten eigener Gruppen
- [x] Mitglied: Nur Lesen
- [x] RLS-Policies vollstaendig verifiziert (BUG-8 + BUG-13/SEC-9 GELOEST)

### Bugs Found -- Alle Verifiziert (Re-Test #2, 2026-01-30)

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | Case-Sensitive Gruppenname-Pruefung | Medium | VERIFIZIERT GEFIXT |
| 2 | IDOR auf GET /api/groups/[id] | Critical | VERIFIZIERT GEFIXT |
| 3 | Frontend liest falsche Eigenschaftsnamen | High | VERIFIZIERT GEFIXT |
| 4 | chat_enabled via PATCH aenderbar | Medium | VERIFIZIERT GEFIXT |
| 5 | Auto-Promotion von Co-Trainer fehlt | High | VERIFIZIERT GEFIXT |
| 6 | Chat-Button in Mitglieder-Ansicht fehlt | Low | VERIFIZIERT GEFIXT |
| 7 | Aktivieren/Deaktivieren broken | Medium | VERIFIZIERT GEFIXT |
| 8 | RLS-Policies nicht verifizierbar | Medium | VERIFIZIERT GELOEST |
| 9 | Trainer=Co-Trainer nur client-seitig | Medium | VERIFIZIERT GEFIXT |
| 10 | /api/groups/[id]/trainers Endpoints fehlen | Low | UNVERAENDERT (Design-Entscheidung) |
| 11 | N+1 Query Performance | Medium | VERIFIZIERT GEFIXT (Listen-Queries) |
| 12 | Admin sieht keine deaktivierten Gruppen | Low-Medium | VERIFIZIERT GEFIXT |
| 13 | Groups SELECT RLS zu breit | Medium | VERIFIZIERT GEFIXT |
| 14 | PATCH/DELETE ohne UUID-Check | Low | VERIFIZIERT GEFIXT |

### Security Findings -- Alle Verifiziert (Re-Test #2, 2026-01-30)

| # | Finding | Risk | Status |
|---|---------|------|--------|
| SEC-1 | IDOR auf GET /api/groups/[id] | HIGH | VERIFIZIERT GEFIXT |
| SEC-2 | Fehlende UUID-Validierung | LOW | VERIFIZIERT GEFIXT |
| SEC-3 | chat_enabled via API aenderbar | MEDIUM | VERIFIZIERT GEFIXT |
| SEC-4 | Trainer=Co-Trainer nur Client-seitig | MEDIUM | VERIFIZIERT GEFIXT |
| SEC-5 | Fehlende Zod-Validierung im PATCH | LOW | VERIFIZIERT GEFIXT |
| SEC-6 | Keine Rate-Limits | LOW | AKZEPTIERT (Infrastructure) |
| SEC-7 | RLS-Policies nicht verifizierbar | MEDIUM-HIGH | VERIFIZIERT GELOEST |
| SEC-9 | Groups SELECT RLS zu breit | MEDIUM | VERIFIZIERT GEFIXT |

### Summary (Re-Test #2)
- 30 Acceptance Criteria bestanden
- 0 Acceptance Criteria fehlgeschlagen
- 13 von 14 Bugs VERIFIZIERT GEFIXT (1 akzeptierte Design-Entscheidung)
- 0 Regressionen
- 2 neue Low-Severity Findings (nicht deployment-blockierend)
- Offene Bugs: 0 Critical, 0 High, 0 Medium

### Production-Ready Decision
**PRODUCTION-READY**

Alle Critical, High und Medium Bugs wurden gefixt und verifiziert:
- BUG-13/SEC-9: Zu breite SELECT RLS-Policy geloescht
- SEC-5: Zod-Validierung mit `.strict()` im PATCH-Handler implementiert
- BUG-14: UUID-Validierung auf allen Handlern

Verbleibende Low-Severity Items (nicht deployment-blockierend):
1. FINDING-1: UUID-Check auf Group-ID im Members-Endpoint
2. FINDING-2: Auth-Check in Server Action `getGroup()`
3. SEC-6: Rate-Limiting (Infrastructure-Ebene)
4. E-1: DB-Trigger fuer Auto-Promotion bei Profil-Deaktivierung
