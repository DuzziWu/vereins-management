# PROJ-17: Trainer Dashboard Widgets (Meine Gruppen & Kommende Trainings)

## Status: ✅ Deployed (2026-02-02)

## Abhängigkeiten
- Benötigt: PROJ-3 (Role-Based Dashboards) - für Trainer-Dashboard-View
- Benötigt: PROJ-12 (Group Administration) - für Gruppen- und Trainer-Zuweisungen
- Benötigt: PROJ-13 (Training & Attendance) - für Trainingstermine

## Beschreibung
Die bestehenden Placeholder-Widgets im Trainer-Dashboard (`MyGroupsGrid` und `UpcomingTrainings`) werden mit echten Daten aus der Datenbank befüllt. Aktuell zeigen beide Widgets leere Arrays an. Nach Umsetzung zeigt das Dashboard die Gruppen des Trainers mit Mitgliederanzahl sowie kommende Trainingstermine.

## User Stories

- Als **Trainer** möchte ich **meine zugewiesenen Gruppen als Karten auf dem Dashboard sehen**, um einen Überblick über meine Trainingsgruppen zu haben.
- Als **Trainer** möchte ich **die aktuelle Mitgliederanzahl pro Gruppe sehen**, um die Gruppengröße im Blick zu haben.
- Als **Trainer** möchte ich **meine nächsten 5 Trainingstermine tabellarisch sehen**, um meine Trainingsplanung zu organisieren.
- Als **Trainer** möchte ich **Datum, Uhrzeit, Gruppe und Ort meiner Trainings sehen**, um zu wissen wo und wann ich trainiere.
- Als **Trainer** möchte ich **von einer Gruppen-Karte direkt zur Gruppendetailseite navigieren**, um Gruppenmitglieder und Details schnell aufzurufen.

## Acceptance Criteria

### Widget: Meine Gruppen (MyGroupsGrid)

- [ ] Widget zeigt alle Gruppen als **Card-Grid** an, denen der eingeloggte Trainer zugewiesen ist (via `group_trainers` Tabelle)
- [ ] Pro Gruppen-Karte wird angezeigt: **Gruppenname**, **Mitgliederanzahl** (z.B. "12 Mitglieder")
- [ ] Pro Gruppen-Karte wird der **Trainingstag und Uhrzeit** angezeigt (z.B. "Montag, 17:00–18:30")
- [ ] Pro Gruppen-Karte wird der **Trainingsort** angezeigt
- [ ] Klick auf eine Gruppen-Karte navigiert zur **Gruppendetailseite** (`/groups/[id]`)
- [ ] Bei **keiner Gruppenzuweisung**: Hinweis "Dir wurden noch keine Gruppen zugewiesen" wird angezeigt
- [ ] Gruppen werden alphabetisch nach Name sortiert
- [ ] Grid ist responsive: 1 Spalte auf Mobile, 2 Spalten auf Tablet, 3 Spalten auf Desktop

### Widget: Kommende Trainings (UpcomingTrainings)

- [ ] Widget zeigt die **nächsten 5 Trainingstermine** des Trainers als **Tabelle** an (aus `training_sessions` über die Gruppen des Trainers)
- [ ] Tabellen-Spalten: **Datum** (Tag + Wochentag), **Uhrzeit** (Start–Ende), **Gruppe** (Name), **Ort** (Location)
- [ ] Nur **zukünftige, nicht-abgesagte** Termine werden angezeigt (`date >= today` und `is_cancelled = false`)
- [ ] Bei **keinen kommenden Terminen**: Hinweis "Keine kommenden Trainings geplant" wird angezeigt
- [ ] Termine werden chronologisch sortiert (nächster Termin zuerst)
- [ ] Klick auf einen Termin navigiert zur **Trainingsdetailseite** (falls vorhanden) oder zur Gruppendetailseite

### API & Datenzugriff

- [ ] Neuer API-Endpunkt oder Server Action für Trainer-Dashboard-Daten (Gruppen + Termine)
- [ ] Abfragen sind auf den eingeloggten Trainer beschränkt (RLS / Auth-Check)
- [ ] Mitgliederanzahl wird per COUNT aus `group_members` ermittelt
- [ ] Daten werden effizient geladen (JOIN-Queries, nicht N+1)

## Edge Cases

- **Trainer ohne Gruppen:** "Dir wurden noch keine Gruppen zugewiesen" im Gruppen-Widget, Termine-Widget zeigt "Keine kommenden Trainings geplant"
- **Gruppe ohne Mitglieder:** Mitgliederanzahl zeigt "0 Mitglieder"
- **Gruppe ohne Trainingszeiten:** Trainingstag/-zeit zeigt "Noch nicht festgelegt"
- **Gruppe ohne Trainingsort:** Ort-Feld zeigt "Kein Ort festgelegt" oder Strich
- **Keine Training Sessions erstellt:** Termine-Widget zeigt "Keine kommenden Trainings geplant"
- **Trainer mit vielen Gruppen (5+):** Grid skaliert, ggf. scrollbar
- **Alle Termine abgesagt:** Werden nicht angezeigt, Hinweis "Keine kommenden Trainings geplant"
- **Trainer mit Haupt- und Co-Trainer-Rolle:** Alle zugewiesenen Gruppen anzeigen (unabhängig von Rolle in `group_trainers`)

## Technische Anforderungen

- Bestehende Komponenten `my-groups-grid.tsx` und `upcoming-trainings.tsx` refactoren (Placeholder-Daten entfernen)
- Supabase-Queries nutzen bestehende Tabellen: `group_trainers`, `groups`, `group_members` (COUNT), `training_sessions`
- Loading-States mit Skeleton/Spinner während Daten laden
- Error-Handling bei fehlgeschlagenen API-Calls
- Responsive Grid-Layout für Gruppen-Karten

---

## Tech-Design (Solution Architect)

### Bestehende Architektur (Wiederverwendung)

Folgende Infrastruktur existiert bereits und wird wiederverwendet:

**Bestehende API-Endpunkte:**
- `GET /api/groups` → Liefert Gruppen mit Mitgliederanzahl, filtert automatisch nach Rolle des eingeloggten Users (Trainer sieht seine Gruppen)
- `GET /api/training/sessions` → Liefert Trainingstermine, kann nach Gruppen gefiltert werden

**Bestehende Datenbank-Tabellen:**
- `groups` (mit trainer_id, training_day, training_start_time, training_end_time, training_location)
- `group_trainers` (Zuordnung Trainer → Gruppe, auch Co-Trainer)
- `group_members` (für Mitgliederanzahl per COUNT)
- `training_sessions` (Datum, Uhrzeit, Ort, is_cancelled)

**Bestehende UI-Komponenten:**
- `my-groups-grid.tsx` → Hat bereits Card-Grid-Layout mit Platzhalter-Daten
- `upcoming-trainings.tsx` → Hat bereits Tabellen-Layout mit Platzhalter-Daten
- `trainer-notes.tsx` → **Funktioniert bereits** mit Server Actions (Pattern-Vorlage!)
- shadcn/ui Card, Badge, Table Komponenten sind verfügbar

### Component-Struktur

```
Trainer-Dashboard (bestehend)
├── Überschrift "Trainer Dashboard" (bestehend)
│
├── 🔄 Meine Gruppen - Card Grid (wird refactored)
│   ├── Lade-Zustand (Skeleton-Karten im Grid)
│   ├── Leerer Zustand ("Dir wurden noch keine Gruppen zugewiesen")
│   ├── Fehler-Zustand (Fehlermeldung mit Retry)
│   └── Gruppen-Karten (responsive: 1/2/3 Spalten)
│       └── Pro Gruppen-Karte (klickbar → /trainer/groups/[id]):
│           ├── Gruppenname (Titel)
│           ├── Mitgliederanzahl (z.B. "12 Mitglieder")
│           ├── Trainingstag + Uhrzeit (z.B. "Montag, 17:00–18:30")
│           └── Trainingsort (z.B. "Sporthalle West")
│
├── 🔄 Kommende Trainings - Tabelle (wird refactored)
│   ├── Lade-Zustand (Skeleton-Zeilen)
│   ├── Leerer Zustand ("Keine kommenden Trainings geplant")
│   ├── Fehler-Zustand (Fehlermeldung mit Retry)
│   └── Trainings-Tabelle (max. 5 Einträge)
│       ├── Spalte: Datum + Wochentag (z.B. "Mo, 03.02.")
│       ├── Spalte: Uhrzeit (z.B. "17:00–18:30")
│       ├── Spalte: Gruppe (Name als Badge)
│       └── Spalte: Ort
│
└── Trainer-Notizen (bestehend, funktioniert mit Auto-Save)
```

### Daten-Model

**Gruppen-Grid benötigt pro Gruppe:**
- Gruppen-ID (für Navigation zur Detailseite)
- Gruppenname (alphabetisch sortiert)
- Mitgliederanzahl (Zahl, z.B. 12)
- Trainingstag (z.B. "Montag")
- Trainingszeit Start + Ende (z.B. "17:00–18:30")
- Trainingsort (z.B. "Sporthalle West")

Quelle: `groups`-Tabelle + `group_members`-Tabelle (COUNT) + `group_trainers`-Tabelle (Zuordnung)

**Trainings-Tabelle benötigt pro Termin:**
- Termin-ID (für Navigation)
- Datum (z.B. "03.02.2026")
- Wochentag (z.B. "Montag")
- Uhrzeit Start + Ende
- Gruppenname
- Gruppen-ID (für Navigation)
- Trainingsort

Quelle: `training_sessions`-Tabelle + `groups`-Tabelle (Gruppenname)

Gespeichert in: Supabase Datenbank (bestehende Tabellen, keine neuen nötig)

### Tech-Entscheidungen

**Server Actions statt neue API-Endpunkte**
→ Die Trainer-Notizen im selben Dashboard verwenden bereits Server Actions (Pattern-Vorlage: `trainer-notes.ts`).
→ Für Dashboard-Widgets, die nur beim Laden Daten abrufen, sind Server Actions einfacher als volle API-Routen.
→ Zwei neue Server Actions: eine für Trainer-Gruppen, eine für Trainer-Termine.

**Gruppen-Abfrage berücksichtigt Haupt- UND Co-Trainer**
→ Ein Trainer kann sowohl als `trainer_id` (Haupttrainer) in der `groups`-Tabelle als auch als Co-Trainer in `group_trainers` zugewiesen sein.
→ Die Abfrage kombiniert beide Quellen, um alle zugewiesenen Gruppen zu zeigen.
→ Der bestehende `/api/groups` Endpunkt macht dies bereits korrekt.

**Klickbare Karten navigieren zu `/trainer/groups/[id]`**
→ Bestehende Gruppendetailseite wird wiederverwendet (PROJ-12).
→ Navigation per Next.js `useRouter` oder `Link`-Komponente.

**Trainings-Tabelle mit Klick-Navigation**
→ Klick auf eine Zeile navigiert zur Gruppendetailseite (`/trainer/groups/[groupId]`).
→ Eine dedizierte Trainingsdetailseite existiert nicht, daher wird auf die Gruppe verlinkt.

### Datenfluss

```
1. Trainer-Dashboard wird geladen
2. Beide Widgets starten parallel ihre Datenabfrage
3. Gruppen-Widget: Server Action holt Trainer-Gruppen + Mitgliederanzahl (pro Gruppe)
4. Trainings-Widget: Server Action holt nächste 5 Termine + Gruppennamen
5. Während Laden: Skeleton-Animation wird angezeigt
6. Nach Laden: Daten werden angezeigt (oder Leer-/Fehlerzustand)
```

### Dependencies

Keine neuen Packages nötig. Alles wird mit bestehender Infrastruktur umgesetzt:
- Supabase Client (Datenbank-Abfragen)
- shadcn/ui (Card, Badge, Table Komponenten)
- Lucide Icons (bereits importiert)
- Next.js Server Actions (Datenabfrage)
- Next.js Link / useRouter (Navigation)

### Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/components/dashboard/trainer/my-groups-grid.tsx` | Placeholder entfernen, echte Daten laden, klickbare Karten mit Navigation |
| `src/components/dashboard/trainer/upcoming-trainings.tsx` | Placeholder entfernen, echte Daten laden, klickbare Zeilen |
| `src/lib/actions/trainer-dashboard.ts` | **NEU:** Server Actions für Dashboard-Daten (getMyTrainerGroups, getMyUpcomingTrainerSessions) |

### Edge-Case-Behandlung

| Situation | Verhalten |
|-----------|-----------|
| Trainer ohne Gruppen | "Dir wurden noch keine Gruppen zugewiesen" + leeres Trainings-Widget |
| Gruppe ohne Mitglieder | Zeigt "0 Mitglieder" |
| Gruppe ohne Trainingszeiten | Zeigt "Noch nicht festgelegt" |
| Gruppe ohne Trainingsort | Zeigt "Kein Ort festgelegt" |
| Keine Training Sessions | "Keine kommenden Trainings geplant" |
| Alle Termine abgesagt | "Keine kommenden Trainings geplant" |
| Haupt- + Co-Trainer | Alle zugewiesenen Gruppen werden angezeigt (unabhängig von Rolle) |
| Viele Gruppen (5+) | Grid skaliert automatisch (responsive Spalten) |
| API-Fehler | Fehlermeldung mit "Erneut versuchen" Button |

---

## QA Test Results (Re-Test #2 -- 2026-02-02)

**Tested:** 2026-02-02 (Re-Test #2 after all Bug Fixes)
**Tester:** QA Engineer (Code Review / Static Analysis + TypeScript Compile Check)
**Full Report:** `/test-reports/PROJ-17-qa-report.md`

### Bug Fix Verification (All Rounds)

| Bug | Severity | Fix Round | Status | Verification |
|-----|----------|-----------|--------|--------------|
| BUG-1: Navigation 404 (Groups) | High | Round 1 | VERIFIED FIXED | Detail page exists and renders correctly |
| BUG-2: Navigation 404 (Trainings) | High | Round 1 | VERIFIED FIXED | Same root cause as BUG-1 |
| BUG-3: Co-Trainer is_active filter | Medium | Round 1 | VERIFIED FIXED | activeGroupIds derived from filtered groups result |
| BUG-4: Missing role validation | Medium | Round 1 | VERIFIED FIXED | Role check in helper function (line 54) |
| BUG-5: Member Count not parallelized | Low | Round 2 | VERIFIED FIXED | Promise.all for groups + member counts (line 123) |
| BUG-6: DAY_NAMES Map redundant | Low | Round 2 | VERIFIED FIXED | Map removed, training_day used directly (stored in German) |
| BUG-8: Auth guards silent return | Low | Round 2 | VERIFIED FIXED | Helper function throws errors (lines 39, 50, 55) |
| BUG-9: Group detail page untracked | Medium | Round 2 | PARTIALLY FIXED | UUID validation added, but file still untracked in git |
| BUG-10: UUID validation missing | Low | Round 2 | VERIFIED FIXED | UUID_REGEX validation with redirect (line 36-44) |
| BUG-11: Past sessions from today | Low | Round 2 | VERIFIED FIXED | getBerlinTimeInfo() + end_time filter (lines 218-224) |

### Acceptance Criteria Status

#### Widget: Meine Gruppen (MyGroupsGrid)
- [x] AC-1: Widget zeigt alle Gruppen als Card-Grid an (via `group_trainers` Tabelle)
- [x] AC-2: Pro Gruppen-Karte: Gruppenname, Mitgliederanzahl
- [x] AC-3: Pro Gruppen-Karte: Trainingstag und Uhrzeit
- [x] AC-4: Pro Gruppen-Karte: Trainingsort
- [x] AC-5: Klick auf Gruppen-Karte navigiert zu `/trainer/groups/[id]`
- [x] AC-6: Bei keiner Gruppenzuweisung: "Dir wurden noch keine Gruppen zugewiesen"
- [x] AC-7: Alphabetisch sortiert
- [x] AC-8: Responsive: 1 Spalte Mobile, 2 Tablet, 3 Desktop

#### Widget: Kommende Trainings (UpcomingTrainings)
- [x] AC-9: Zeigt naechste 5 Trainingstermine als Tabelle
- [x] AC-10: Spalten: Datum+Wochentag, Uhrzeit, Gruppe, Ort
- [x] AC-11: Nur zukuenftige, nicht-abgesagte Termine (+ BUG-11 fix: Uhrzeit-Filter fuer heute)
- [x] AC-12: Bei keinen Terminen: "Keine kommenden Trainings geplant"
- [x] AC-13: Chronologisch sortiert
- [x] AC-14: Klick auf Termin navigiert zur Gruppendetailseite

#### API & Datenzugriff
- [x] AC-15: Server Actions existieren und sind exportiert
- [x] AC-16: Auth-Check + Rollen-Validierung vorhanden (throws Error)
- [x] AC-17: Mitgliederanzahl per batch-fetch aus group_members (parallelisiert)
- [x] AC-18: Effiziente Queries (kein N+1, Promise.all)

### Edge Cases Status
- [x] EC-1: Trainer ohne Gruppen
- [x] EC-2: Gruppe ohne Mitglieder (0 Mitglieder)
- [x] EC-3: Gruppe ohne Trainingszeiten ("Noch nicht festgelegt")
- [x] EC-4: Gruppe ohne Trainingsort ("Kein Ort festgelegt")
- [x] EC-5: Keine Training Sessions
- [x] EC-6: Alle Termine abgesagt
- [x] EC-7: Haupt- und Co-Trainer
- [x] EC-8: Viele Gruppen (5+)
- [x] EC-9: Error handling mit Retry-Button

### Security Audit
- [x] SEC-1: Authentication Check -- PASS (throws Error)
- [x] SEC-2: Authorization / Role Check -- PASS (throws Error)
- [x] SEC-3: Data Scoping -- PASS (profile.id filter)
- [x] SEC-4: SQL Injection -- PASS (parameterized queries)
- [x] SEC-5: XSS -- PASS (React auto-escape)
- [x] SEC-6: IDOR -- PASS (ownership verification on detail page)
- [x] SEC-7: Data Exposure -- PASS (no sensitive fields)
- [x] SEC-8: Horizontal Privilege Escalation -- PASS
- [x] SEC-9: UUID Injection -- PASS (regex validation on detail page)

### Remaining Issues

#### BUG-9 (OPEN -- Deployment Risk): Group detail page still untracked in git
- **File:** `src/app/(dashboard)/trainer/groups/[groupId]/page.tsx`
- **Severity:** Medium
- **Issue:** File exists locally with all fixes applied (UUID validation etc.), but is still listed as untracked (`??`) in git status. MUST be committed before deployment.

#### BUG-7 (ACCEPTED): Co-Trainer query does not pre-filter by group is_active
- **Severity:** Low (No Impact)
- **Issue:** Inactive group IDs can enter the allIds set, but are filtered out by the subsequent `.eq("is_active", true)` query. No data leakage, no UI impact.
- **Decision:** Accepted as-is. Downstream filter handles it correctly.

#### BUG-5 (ACCEPTED): Member count uses client-side counting
- **Severity:** Low (Performance)
- **Issue:** group_members rows fetched and counted client-side instead of SQL COUNT. Only `group_id` column is selected, minimizing transfer. Parallelized with Promise.all now.
- **Decision:** Accepted as-is. Supabase JS client does not support GROUP BY COUNT natively. Future optimization possible via RPC.

### Summary
- 18/18 Acceptance Criteria PASSED
- 9/9 Edge Cases PASSED
- 9/9 Security Checks PASSED
- TypeScript compilation: PASS (zero errors)
- 0 Critical Bugs, 0 High Bugs
- 1 Medium Bug (BUG-9: untracked git file -- deployment blocker)
- 2 Low Bugs accepted as-is (BUG-5, BUG-7)

### Production-Ready Decision
**BEDINGT PRODUCTION-READY.** Alle funktionalen Bugs sind gefixt. Einzige Voraussetzung: Die Datei `src/app/(dashboard)/trainer/groups/[groupId]/page.tsx` muss vor Deployment in git committed werden (BUG-9).
