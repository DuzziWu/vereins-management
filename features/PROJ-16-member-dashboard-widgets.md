# PROJ-16: Member Dashboard Widgets (Meine Gruppen & Nächste Termine)

## Status: ✅ Deployed (2026-02-02)

## Abhängigkeiten
- Benötigt: PROJ-3 (Role-Based Dashboards) - für Mitglieder-Dashboard-View
- Benötigt: PROJ-12 (Group Administration) - für Gruppen- und Mitgliedschaftsdaten
- Benötigt: PROJ-13 (Training & Attendance) - für Trainingstermine und RSVP-Daten
- Benötigt: PROJ-14 (Group Communication) - für Chat-Link-Integration

## Beschreibung
Die bestehenden Placeholder-Widgets im Mitglieder-Dashboard (`MyGroupsList` und `UpcomingEvents`) werden mit echten Daten aus der Datenbank befüllt. Aktuell zeigen beide Widgets leere Arrays und Hinweistexte an. Nach Umsetzung zeigen sie die tatsächlichen Gruppen des Mitglieds und kommende Trainingstermine.

## User Stories

- Als **Mitglied** möchte ich **meine zugewiesenen Gruppen auf dem Dashboard sehen**, um einen schnellen Überblick über meine Vereinszugehörigkeiten zu haben.
- Als **Mitglied** möchte ich **den Trainer und Trainingstag jeder Gruppe sehen**, um zu wissen wann und mit wem ich trainiere.
- Als **Mitglied** möchte ich **direkt vom Gruppen-Widget in den Gruppen-Chat springen**, um schnell mit meiner Gruppe kommunizieren zu können.
- Als **Mitglied** möchte ich **meine nächsten 5 Trainingstermine sehen**, um meine Woche planen zu können.
- Als **Mitglied** möchte ich **meinen RSVP-Status pro Termin sehen**, um zu wissen für welche Termine ich zu- oder abgesagt habe.

## Acceptance Criteria

### Widget: Meine Gruppen (MyGroupsList)

- [ ] Widget zeigt alle Gruppen an, denen das eingeloggte Mitglied zugewiesen ist (via `group_members` Tabelle)
- [ ] Pro Gruppe wird angezeigt: **Gruppenname**, **Trainer-Name** (Vorname + erster Buchstabe Nachname), **Trainingstag** (z.B. "Montag, 17:00–18:30")
- [ ] Wenn Chat für die Gruppe aktiviert ist (`chat_enabled = true`): Chat-Icon/Link wird angezeigt, der zur Gruppen-Chat-Seite navigiert
- [ ] Wenn Chat deaktiviert ist: Kein Chat-Link wird angezeigt
- [ ] Bei **keiner Gruppenzugehörigkeit**: Freundlicher Hinweis "Du wurdest noch keiner Gruppe zugewiesen" wird angezeigt
- [ ] Gruppen werden alphabetisch nach Name sortiert
- [ ] Daten werden beim Laden des Dashboards abgerufen (kein manueller Refresh nötig)

### Widget: Nächste Termine (UpcomingEvents)

- [ ] Widget zeigt die **nächsten 5 kommenden Trainingstermine** des Mitglieds an (aus `training_sessions` über die Gruppen des Mitglieds)
- [ ] Pro Termin wird angezeigt: **Datum** (Tag + Wochentag), **Uhrzeit** (Start–Ende), **Gruppenname**, **Ort** (training location)
- [ ] Pro Termin wird der **RSVP-Status** des Mitglieds angezeigt (aus `attendance` Tabelle): Zugesagt / Abgesagt / Keine Antwort
- [ ] RSVP-Status wird farblich kodiert: Grün (zugesagt), Rot (abgesagt), Grau (keine Antwort)
- [ ] Nur **zukünftige, nicht-abgesagte** Termine werden angezeigt (`date >= today` und `is_cancelled = false`)
- [ ] Bei **keinen kommenden Terminen**: Hinweis "Keine kommenden Termine" wird angezeigt
- [ ] Termine werden chronologisch sortiert (nächster Termin zuerst)

### API & Datenzugriff

- [ ] Neuer API-Endpunkt oder Server Action für Mitglieder-Dashboard-Daten (Gruppen + Termine)
- [ ] Abfragen sind auf den eingeloggten User beschränkt (RLS / Auth-Check)
- [ ] Daten werden effizient geladen (JOIN-Queries, nicht N+1)

## Edge Cases

- **Mitglied ohne Gruppen:** "Du wurdest noch keiner Gruppe zugewiesen" Hinweis im Gruppen-Widget, Termine-Widget zeigt "Keine kommenden Termine"
- **Gruppe ohne Trainer:** Trainer-Feld zeigt "Kein Trainer zugewiesen" oder wird leer gelassen
- **Gruppe ohne Trainingszeiten:** Trainingstag/-zeit wird als "Noch nicht festgelegt" angezeigt
- **Keine Training Sessions erstellt:** Termine-Widget zeigt "Keine kommenden Termine"
- **Alle Termine abgesagt:** Werden nicht angezeigt, ggf. Hinweis "Keine kommenden Termine"
- **Mitglied in vielen Gruppen (5+):** Widget scrollbar oder alle anzeigen (kompaktes Layout)
- **RSVP noch nicht abgegeben:** Status "Keine Antwort" in Grau anzeigen
- **Chat deaktiviert für Gruppe:** Chat-Link wird nicht angezeigt (kein ausgegrauter Button)

## Technische Anforderungen

- Bestehende Komponenten `my-groups-list.tsx` und `upcoming-events.tsx` refactoren (Placeholder-Daten entfernen)
- Supabase-Queries nutzen bestehende Tabellen: `group_members`, `groups`, `profiles` (Trainer), `training_sessions`, `attendance`
- Loading-States mit Skeleton/Spinner während Daten laden
- Error-Handling bei fehlgeschlagenen API-Calls

---

## Tech-Design (Solution Architect)

### Bestehende Architektur (Wiederverwendung)

Folgende Infrastruktur existiert bereits und wird wiederverwendet:

**Bestehende API-Endpunkte:**
- `GET /api/groups` → Liefert Gruppen mit Mitgliederanzahl, filtert automatisch nach Rolle des eingeloggten Users
- `GET /api/training/sessions?view=member` → Liefert Trainingstermine mit RSVP-Status des Mitglieds

**Bestehende Datenbank-Tabellen:**
- `groups` (mit trainer_id, training_day, training_start_time, training_end_time, training_location, chat_enabled)
- `group_members` (Zuordnung Mitglied → Gruppe)
- `profiles` (Trainer-Name: first_name, last_name)
- `training_sessions` (Datum, Uhrzeit, Ort, is_cancelled)
- `attendance` (RSVP-Status: confirmed / declined / pending)

**Bestehende UI-Komponenten:**
- `my-groups-list.tsx` → Hat bereits das Card-Layout mit Platzhalter-Daten
- `upcoming-events.tsx` → Hat bereits das Listen-Layout mit Platzhalter-Daten
- shadcn/ui Card, Badge Komponenten sind verfügbar

### Component-Struktur

```
Mitglieder-Dashboard (bestehend)
├── Profil-Karte (bestehend, funktioniert)
├── Grid (2 Spalten auf Desktop, 1 auf Mobile)
│   ├── 🔄 Meine Gruppen (Widget - wird refactored)
│   │   ├── Lade-Zustand (Skeleton-Karten)
│   │   ├── Leerer Zustand ("Du wurdest noch keiner Gruppe zugewiesen")
│   │   ├── Fehler-Zustand (Fehlermeldung mit Retry)
│   │   └── Gruppen-Liste
│   │       └── Pro Gruppe:
│   │           ├── Gruppenname
│   │           ├── Trainer-Name (z.B. "Max M.")
│   │           ├── Trainingstag + Uhrzeit (z.B. "Montag, 17:00–18:30")
│   │           └── Chat-Link (nur wenn Chat aktiviert → navigiert zu /member/groups/[id]/chat)
│   │
│   └── 🔄 Nächste Termine (Widget - wird refactored)
│       ├── Lade-Zustand (Skeleton-Zeilen)
│       ├── Leerer Zustand ("Keine kommenden Termine")
│       ├── Fehler-Zustand (Fehlermeldung mit Retry)
│       └── Termin-Liste (max. 5 Einträge)
│           └── Pro Termin:
│               ├── Datum + Wochentag (z.B. "Mo, 03.02.")
│               ├── Uhrzeit (z.B. "17:00–18:30")
│               ├── Gruppenname
│               ├── Ort
│               └── RSVP-Badge (Grün=Zugesagt / Rot=Abgesagt / Grau=Offen)
│
└── Benachrichtigungen (bestehend, Platzhalter)
```

### Daten-Model

**Gruppen-Widget benötigt pro Gruppe:**
- Gruppen-ID (für Chat-Verlinkung)
- Gruppenname (alphabetisch sortiert)
- Trainer-Vorname + erster Buchstabe Nachname (z.B. "Max M.")
- Trainingstag (z.B. "Montag")
- Trainingszeit Start + Ende (z.B. "17:00–18:30")
- Chat aktiviert? (ja/nein → steuert ob Chat-Link angezeigt wird)

Quelle: `groups`-Tabelle + `profiles`-Tabelle (Trainer)

**Termine-Widget benötigt pro Termin:**
- Datum (z.B. "03.02.2026")
- Wochentag (z.B. "Montag")
- Uhrzeit Start + Ende
- Gruppenname
- Ort / Trainingsort
- RSVP-Status des Mitglieds (Zugesagt / Abgesagt / Offen)

Quelle: `training_sessions`-Tabelle + `attendance`-Tabelle (nur eigener Status)

Gespeichert in: Supabase Datenbank (bestehende Tabellen, keine neuen nötig)

### Tech-Entscheidungen

**Server Actions statt neue API-Endpunkte**
→ Die Trainer-Notizen im Dashboard verwenden bereits Server Actions als Pattern.
→ Für Dashboard-Widgets, die nur beim Laden Daten abrufen, sind Server Actions einfacher und performanter als volle API-Routen.
→ Zwei neue Server Actions: eine für Gruppen-Daten, eine für Termine-Daten.

**Bestehende API-Endpunkte als Alternative**
→ Die vorhandenen `/api/groups` und `/api/training/sessions` Endpunkte könnten theoretisch auch genutzt werden (liefern bereits die richtigen Daten).
→ Server Actions werden bevorzugt, weil sie optimiertere Queries ermöglichen (nur die Felder, die das Widget braucht) und konsistent mit dem Dashboard-Pattern sind.

**RSVP-Farbkodierung mit bestehenden shadcn/ui Badges**
→ Bestehende Badge-Komponente mit Varianten: `default` (Grün/Zugesagt), `destructive` (Rot/Abgesagt), `secondary` (Grau/Offen)
→ Keine zusätzliche UI-Library nötig.

**Chat-Navigation zum bestehenden Chat-Feature (PROJ-14)**
→ Chat-Route existiert bereits: `/member/groups/[groupId]/chat`
→ Chat-Icon wird nur angezeigt wenn `chat_enabled = true` in der Gruppe

### Datenfluss

```
1. Mitglieder-Dashboard wird geladen
2. Beide Widgets starten parallel ihre Datenabfrage
3. Gruppen-Widget: Server Action holt Gruppen des Mitglieds + Trainer-Namen
4. Termine-Widget: Server Action holt nächste 5 Termine + RSVP-Status
5. Während Laden: Skeleton-Animation wird angezeigt
6. Nach Laden: Daten werden angezeigt (oder Leer-/Fehlerzustand)
```

### Dependencies

Keine neuen Packages nötig. Alles wird mit bestehender Infrastruktur umgesetzt:
- Supabase Client (Datenbank-Abfragen)
- shadcn/ui (Card, Badge Komponenten)
- Lucide Icons (MessageCircle für Chat-Link)
- Next.js Server Actions (Datenabfrage)

### Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/components/dashboard/member/my-groups-list.tsx` | Placeholder entfernen, echte Daten laden, Chat-Link hinzufügen |
| `src/components/dashboard/member/upcoming-events.tsx` | Placeholder entfernen, echte Daten laden, RSVP-Badges hinzufügen |
| `src/lib/actions/member-dashboard.ts` | **NEU:** Server Actions für Dashboard-Daten (getMyMemberGroups, getMyUpcomingTrainings) |

### Edge-Case-Behandlung

| Situation | Verhalten |
|-----------|-----------|
| Mitglied ohne Gruppen | "Du wurdest noch keiner Gruppe zugewiesen" + leeres Termine-Widget |
| Gruppe ohne Trainer | Zeigt "Kein Trainer zugewiesen" |
| Gruppe ohne Trainingszeiten | Zeigt "Noch nicht festgelegt" |
| Chat deaktiviert | Chat-Link wird komplett ausgeblendet (kein disabled Button) |
| Alle Termine abgesagt | "Keine kommenden Termine" |
| RSVP nicht abgegeben | Grauer Badge "Offen" |
| Viele Gruppen (5+) | Liste wird scrollbar (max-height mit overflow) |
| API-Fehler | Fehlermeldung mit "Erneut versuchen" Button |

---

## QA Test Results

**Initial Test:** 2026-02-02 (Deep Audit mit Live-DB RLS-Verifizierung)
**Re-Test:** 2026-02-02 (nach Bug-Fixes)
**Tester:** QA Engineer (Code Review + Security Audit + Live DB RLS Verification)
**Full Report:** `/test-reports/PROJ-16-qa-report.md`

### Acceptance Criteria Status (Re-Test)

#### Widget: Meine Gruppen (MyGroupsList)

- [x] AC-1: Widget zeigt alle Gruppen des eingeloggten Mitglieds (via `group_members` nested select)
- [x] AC-2: Gruppenname, Trainer-Name (via RLS-erweitertem FK-Join), Trainingstag (direkt aus DB, DAY_NAMES entfernt)
- [x] AC-3: Chat-Icon/Link wenn `chat_enabled = true`, navigiert zu `/member/groups/[id]/chat`
- [x] AC-4: Kein Chat-Link wenn Chat deaktiviert
- [x] AC-5: Bei keiner Gruppenzugehoerigkeit: "Du wurdest noch keiner Gruppe zugewiesen"
- [x] AC-6: Alphabetisch sortiert nach Name (`.sort((a, b) => a.name.localeCompare(b.name))`)
- [x] AC-7: Daten werden beim Laden abgerufen (`useEffect` mit leerem Dependency-Array)

#### Widget: Naechste Termine (UpcomingEvents)

- [x] AC-8: Zeigt naechste 5 Trainingstermine (`.limit(10)` + Filter + `.slice(0, 5)`)
- [x] AC-9: Pro Termin: Datum, Uhrzeit, Gruppenname, Ort
- [x] AC-10: RSVP-Status angezeigt (Zugesagt/Abgesagt/Offen) mit validiertem Fallback
- [x] AC-11: RSVP farblich kodiert: Gruen (confirmed), Rot (declined), Grau (default/pending)
- [x] AC-12: Nur zukuenftige, nicht-abgesagte Termine + heutige vergangene Sessions gefiltert (BUG-11)
- [x] AC-13: Bei keinen Terminen: "Keine kommenden Termine"
- [x] AC-14: Chronologisch sortiert (`.order("date").order("start_time")`)

#### API & Datenzugriff

- [x] AC-15: Server Actions existieren (`getMyMemberGroups`, `getMyUpcomingTrainings`)
- [x] AC-16: Auth-Check + Role-Check vorhanden (4 Sicherheitsschichten: Middleware, getUser, Profile, Role)
- [x] AC-17: Effiziente Queries via nested selects und JOINs (BUG-4 gefixt)

### Edge Cases Status (Re-Test)

- [x] EC-1: Mitglied ohne Gruppen - korrekt behandelt
- [x] EC-2: Gruppe ohne Trainer - "Kein Trainer zugewiesen" (jetzt nur bei echtem Fehlen)
- [x] EC-3: Gruppe ohne Trainingszeiten - "Noch nicht festgelegt"
- [x] EC-4: Keine Training Sessions - "Keine kommenden Termine"
- [x] EC-5: Alle Termine abgesagt - korrekt gefiltert
- [x] EC-6: RSVP nicht abgegeben - Grauer Badge "Offen" mit sicherer Validierung
- [x] EC-7: Chat deaktiviert - Link komplett ausgeblendet
- [x] EC-8: Viele Gruppen (5+) - `max-h-[400px] overflow-y-auto`
- [x] EC-9: Location null bei Termin - Ort-Feld ausgeblendet

### Bug Fix Status (Re-Test)

| Bug | Severity | Status | Fix |
|-----|----------|--------|-----|
| BUG-5 | **CRITICAL** | **FIXED** | `profiles` RLS SELECT-Policy erweitert: Mitglieder koennen Trainer-Profile ihrer Gruppen lesen (inkl. Co-Trainer via `group_trainers`). Live-DB verifiziert. |
| BUG-7 | High | **VERIFIED CORRECT** | Attendance RLS war bereits korrekt. Edge Case (Member ohne Profil) jetzt durch Error-Throwing abgesichert. |
| BUG-4 | Medium | **FIXED** | Queries von 7 sequentiell auf optimierte nested selects/JOINs reduziert. |
| SECURITY-2 | Low | **FIXED** | Role-Check (`mitglied`/`vorstand`) in `getAuthenticatedMemberProfile()` hinzugefuegt. |
| BUG-1 | Low | **FIXED** | Server Actions werfen jetzt Errors statt `[]` bei Auth/DB-Failures. |
| BUG-2 | Low | **FIXED** | `rsvp_status` wird sicher gegen `validStatuses` geprueft mit Fallback auf `"pending"`. |
| BUG-3 | Low | **FIXED** | Leere/Whitespace Trainer-Namen geben `null` zurueck via `.trim()` Check. |
| BUG-6 | Low | **FIXED** | Tote `DAY_NAMES` Map entfernt. DB-Werte (deutsche Tagesnamen) direkt verwendet. |

### Security Status (Re-Test)

| Finding | Severity | Status |
|---------|----------|--------|
| SECURITY-1 | Critical | **RESOLVED** - RLS-Policy korrekt erweitert, minimal-privilegiert, Live-DB verifiziert |
| SECURITY-2 | Low | **RESOLVED** - Role-Check hinzugefuegt (Defense-in-Depth) |
| SECURITY-3 | Medium | **UNCHANGED** - Pre-existing (Anon-Key im Frontend, Standard-Supabase-Architektur) |

### Summary (Re-Test)

- **17/17 Acceptance Criteria bestanden**
- **9/9 Edge Cases korrekt behandelt**
- **8/8 Bugs verifiziert gefixt** (0 neue Bugs)
- **2/3 Security Findings resolved** (1 pre-existing verbleibt)
- **0 Regression Issues**
- **PRODUCTION-READY**

### Verbleibende Empfehlungen (nicht blockierend)

1. RLS auf `login_attempts` und `password_reset_attempts` aktivieren (Supabase Advisor ERROR-Level, pre-existing)
2. Auth-Helper Session-Context-Caching (Performance-Optimierung, optional)
3. Nach Deployment: Supabase Performance-Logs pruefen
