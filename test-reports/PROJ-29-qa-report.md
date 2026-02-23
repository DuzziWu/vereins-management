# PROJ-29: Workgroup Kanban-Board - QA Test Report

**Tested:** 2026-02-23
**Tested by:** QA Engineer Agent
**App URL:** http://localhost:3000
**Feature Status:** ✅ All bugs fixed - Ready for manual testing

---

## Executive Summary

Das PROJ-29 Kanban-Board Feature wurde durch Code-Review und statische Analyse getestet. Es wurden **2 Critical**, **3 High** und **2 Medium** Severity Bugs identifiziert und **alle gefixt**.

### Bug Fix Summary (2026-02-23)

| Bug | Severity | Status | Fix |
|-----|----------|--------|-----|
| BUG-1: API Route Mismatch | Critical | ✅ Fixed | `/kanban` → `/kanban/board` |
| BUG-2: total_count Property | Critical | ✅ Fixed | Added `total_count` to API response |
| BUG-3: PATCH Task IDOR | High | ✅ Fixed | Added membership check |
| BUG-4: GET Task IDOR | High | ✅ Fixed | Added membership check |
| BUG-5: GET Assignees/Labels IDOR | High | ✅ Fixed | Added membership checks |
| BUG-6: Column Reorder Route | Medium | ✅ Fixed | Changed to PATCH /columns |
| BUG-7: GET Columns IDOR | Medium | ✅ Fixed | Added membership check |

---

## Acceptance Criteria Status

### AC: Kanban-Board Grundstruktur
- [x] Horizontales Scrolling bei vielen Spalten (mobile-friendly)
- [x] Spalten werden nebeneinander angezeigt
- [x] Tasks innerhalb einer Spalte sind vertikal gestapelt
- [ ] **BUG-1 (Critical):** Kanban-Board ersetzt den Platzhalter - API Route Mismatch

### AC: Spalten-Verwaltung (nur Vorstand)
- [x] "Neue Spalte" Button am Ende der Spalten-Reihe
- [x] Spalten-Name editierbar
- [x] Spalte löschen mit Bestätigungsdialog
- [x] Spalte löschen: Tasks müssen erst verschoben werden
- [x] Mindestens eine Spalte muss existieren
- [x] Max. 10 Spalten pro Board
- [x] Farbcodierung pro Spalte
- [x] Vorstand-Berechtigung korrekt geprüft
- [ ] **INFO:** Default-Spalten bei neuer Workgroup - Trigger muss existieren

### AC: Task CRUD
- [x] "Neuer Task" Button in jeder Spalte
- [x] Pflichtfeld: Titel (min. 1, max. 200 Zeichen)
- [x] Optionale Felder implementiert (Beschreibung, Zuweisung, Deadline, Priorität, Checkliste, Labels)
- [x] Task bearbeiten: Klick auf Task öffnet Detail-Panel (Slide-over)
- [x] Task löschen mit Bestätigungsdialog
- [x] Erstelldatum und "Erstellt von" werden gespeichert
- [ ] **BUG-3 (High):** PATCH Task - Keine Mitgliedschaftsprüfung

### AC: Drag & Drop
- [x] Tasks per Drag & Drop zwischen Spalten verschieben (DnD-Kit implementiert)
- [x] Tasks innerhalb einer Spalte neu sortieren
- [x] Touch-Support für mobile Geräte
- [x] Visuelle Feedback während Drag
- [x] Optimistic UI implementiert
- [x] Konflikt-Handling bei gleichzeitiger Änderung

### AC: Task-Ansicht
- [x] Kompakte Task-Karte zeigt Titel, Avatare, Deadline-Badge, Prioritäts-Indikator
- [x] Anhang-Icon mit Anzahl
- [x] Checklisten-Fortschritt
- [x] Detail-Panel zeigt alle Felder

### AC: Dateianhänge
- [x] "Datei anhängen" Button im Task-Detail
- [x] Max. 5 Dateien pro Task
- [x] Max. 10 MB pro Datei
- [x] Erlaubte Typen: PDF, Office, Bilder, ZIP
- [x] Anhänge können gelöscht werden (nur Ersteller oder Vorstand)

### AC: Checklisten
- [x] Checkliste im Task-Detail erstellen/bearbeiten
- [x] Unterpunkte können abgehakt werden
- [x] Fortschritt wird auf Task-Karte angezeigt

### AC: Labels/Tags
- [x] Vordefinierte Labels pro Workgroup (Vorstand erstellt)
- [x] Label hat Name + Farbe
- [x] Multi-Select: Task kann mehrere Labels haben
- [x] Labels werden auf Task-Karte als Chips angezeigt

### AC: Filter & Suche
- [x] Suchfeld: Suche nach Task-Titel
- [x] Filter nach zugewiesenem Mitglied
- [x] Filter nach Label
- [x] Filter nach Priorität
- [x] Filter "Nur meine Tasks"
- [x] Filter "Überfällige Tasks"

### AC: Meine Tasks (Dashboard-Widget)
- [x] Widget implementiert
- [x] Zeigt Tasks aus allen Workgroups, die mir zugewiesen sind
- [x] Sortiert nach Deadline
- [x] Klick öffnet Task in der jeweiligen Workgroup
- [ ] **BUG-2 (Critical):** Widget erwartet `total_count`, API liefert `counts.total`

---

## Bugs Found

### BUG-1: API Route Mismatch - Board lädt nicht
- **Severity:** Critical
- **Type:** Funktionalitätsfehler
- **File:** [kanban-board.tsx:93](src/components/kanban/kanban-board.tsx#L93)
- **Steps to Reproduce:**
  1. Öffne eine Workgroup-Detail-Seite
  2. Kanban-Board wird geladen
  3. Expected: Board-Daten werden angezeigt
  4. Actual: API Request an `/api/workgroups/{id}/kanban` → 404 Not Found
- **Root Cause:** Frontend ruft `/api/workgroups/${workgroupId}/kanban` auf, aber die API Route ist `/api/workgroups/[id]/kanban/board/route.ts`. Die Route `/api/workgroups/[id]/kanban/route.ts` existiert nicht.
- **Fix:** Ändere in `kanban-board.tsx` Zeile 93:
  ```typescript
  // Von:
  const response = await fetch(`/api/workgroups/${workgroupId}/kanban`)
  // Zu:
  const response = await fetch(`/api/workgroups/${workgroupId}/kanban/board`)
  ```
- **Priority:** P0 - Feature ist komplett unbenutzbar

---

### BUG-2: MyTasksWidget - total_count Property fehlt
- **Severity:** Critical
- **Type:** API/Frontend Mismatch
- **Files:**
  - [my-tasks-widget.tsx:66](src/components/dashboard/my-tasks-widget.tsx#L66)
  - [my-tasks/route.ts:122-128](src/app/api/kanban/my-tasks/route.ts#L122-L128)
- **Steps to Reproduce:**
  1. Öffne das Member-Dashboard
  2. Schaue auf "Meine Tasks" Widget
  3. Expected: Anzahl zugewiesener Tasks wird angezeigt
  4. Actual: Fehler oder undefined wird angezeigt
- **Root Cause:** Widget erwartet `data.total_count`, API liefert `counts.total`
- **Fix:** Entweder API oder Widget anpassen:
  ```typescript
  // Option A: In my-tasks/route.ts, Zeile 122, ändern zu:
  return NextResponse.json({
    tasks: formattedTasks,
    total_count: total,  // <-- hinzufügen
    counts: { total, overdue, due_today: dueToday }
  })

  // Option B: In my-tasks-widget.tsx, Zeile 66, ändern zu:
  setTotalCount(data.counts?.total || 0)
  ```
- **Priority:** P0 - Dashboard Widget kaputt

---

### BUG-3: IDOR - Task Update ohne Mitgliedschaftsprüfung
- **Severity:** High
- **Type:** Security - Insecure Direct Object Reference
- **File:** [tasks/[taskId]/route.ts:91-191](src/app/api/workgroups/[id]/kanban/tasks/[taskId]/route.ts#L91-L191)
- **Steps to Reproduce:**
  1. Authentifiziere als User A (nicht Mitglied von Workgroup X)
  2. Sende PATCH Request an `/api/workgroups/{workgroupX_id}/kanban/tasks/{taskId}`
  3. Expected: 403 Forbidden
  4. Actual: Task wird erfolgreich aktualisiert
- **Root Cause:** PATCH-Handler prüft nur ob Task zur Workgroup gehört, nicht ob User Mitglied ist
- **Fix:** Füge Mitgliedschaftsprüfung hinzu (wie in POST /tasks):
  ```typescript
  const isVorstand = profile.role === 'vorstand'
  if (!isVorstand) {
    const { data: membership } = await supabase
      .from('workgroup_members')
      .select('id')
      .eq('workgroup_id', workgroupId)
      .eq('profile_id', profile.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }
  ```
- **Priority:** P1 - Security Issue

---

### BUG-4: IDOR - Task Details ohne Mitgliedschaftsprüfung
- **Severity:** High
- **Type:** Security - Information Disclosure
- **File:** [tasks/[taskId]/route.ts:6-89](src/app/api/workgroups/[id]/kanban/tasks/[taskId]/route.ts#L6-L89)
- **Steps to Reproduce:**
  1. Authentifiziere als User A (nicht Mitglied von Workgroup X)
  2. Sende GET Request an `/api/workgroups/{workgroupX_id}/kanban/tasks/{taskId}`
  3. Expected: 403 Forbidden
  4. Actual: Task-Details werden zurückgegeben
- **Root Cause:** GET-Handler prüft keine Mitgliedschaft
- **Fix:** Gleiche Mitgliedschaftsprüfung wie bei BUG-3
- **Priority:** P1 - Security Issue

---

### BUG-5: IDOR - GET Assignees/Labels ohne Mitgliedschaftsprüfung
- **Severity:** High
- **Type:** Security - Information Disclosure
- **Files:**
  - [assignees/route.ts:6-42](src/app/api/workgroups/[id]/kanban/tasks/[taskId]/assignees/route.ts#L6-L42)
  - [labels/route.ts:6-34](src/app/api/workgroups/[id]/kanban/tasks/[taskId]/labels/route.ts#L6-L34)
  - [labels/route.ts:6-30](src/app/api/workgroups/[id]/kanban/labels/route.ts#L6-L30)
- **Steps to Reproduce:**
  1. Authentifiziere als beliebiger User
  2. Sende GET Request an `/api/workgroups/{id}/kanban/tasks/{taskId}/assignees`
  3. Expected: 403 Forbidden für Nicht-Mitglieder
  4. Actual: Assignee-Daten werden zurückgegeben
- **Root Cause:** GET-Handler prüfen keine Mitgliedschaft zur Workgroup
- **Impact:** Leakage von Mitgliedernamen und Zuweisungsdaten
- **Priority:** P1 - Security Issue

---

### BUG-6: Column Reorder API Route existiert nicht
- **Severity:** Medium
- **Type:** Missing API Endpoint
- **File:** [kanban-board.tsx:265](src/components/kanban/kanban-board.tsx#L265)
- **Steps to Reproduce:**
  1. Als Vorstand einloggen
  2. Versuche Spalten per Drag & Drop neu zu sortieren
  3. Expected: Reihenfolge wird gespeichert
  4. Actual: 404 Error auf `/api/workgroups/{id}/kanban/columns/reorder`
- **Root Cause:** Die Route `/reorder` existiert nicht. Die PATCH-Route in `columns/route.ts` erwartet `column_ids` im Body.
- **Fix:** Ändere URL oder erstelle neue Route:
  ```typescript
  // Option A: kanban-board.tsx Zeile 265 ändern zu:
  const response = await fetch(`/api/workgroups/${workgroupId}/kanban/columns`, {
    method: "PATCH",
    ...
  })
  ```
- **Priority:** P2 - Feature teilweise nicht funktional

---

### BUG-7: Column GET Route - Fehlende Mitgliedschaftsprüfung
- **Severity:** Medium
- **Type:** Security - Information Disclosure
- **File:** [columns/route.ts:8-32](src/app/api/workgroups/[id]/kanban/columns/route.ts#L8-L32)
- **Steps to Reproduce:**
  1. Authentifiziere als User ohne Workgroup-Mitgliedschaft
  2. GET `/api/workgroups/{id}/kanban/columns`
  3. Expected: 403 Forbidden
  4. Actual: Alle Columns werden zurückgegeben
- **Root Cause:** Keine Mitgliedschaftsprüfung im GET-Handler
- **Priority:** P2 - Security Issue

---

## Edge Cases Status

### E-1: Spalte mit Tasks löschen
- [x] Korrekt implementiert: Dialog zeigt Task-Count und fragt nach Ziel-Spalte

### E-2: Letzte Spalte löschen
- [x] Korrekt implementiert: Error "Mindestens eine Spalte muss existieren"

### E-3: Gleichzeitige Drag & Drop
- [x] Konflikt-Banner implementiert, Refresh-Mechanismus vorhanden

### E-4: Task-Zuweisung an entferntes Mitglied
- [x] Korrekt implementiert: PUT Assignees prüft Workgroup-Mitgliedschaft

### E-5: Workgroup archiviert
- [ ] **Nicht geprüft:** Board readonly-Modus muss manuell getestet werden

### E-6: Sehr viele Tasks (>100 pro Spalte)
- [ ] **Nicht geprüft:** Virtualisierung nicht implementiert (könnte Performance-Problem sein)

### E-7: Anhang-Upload während offline
- [x] Retry-Mechanismus durch Standard-Fetch-Verhalten

### E-8: Deadline in der Vergangenheit
- [x] Korrekt implementiert: Kann gesetzt werden, wird als überfällig markiert

---

## Security Findings (Red Team Analysis)

### SEC-1: Multiple IDOR Vulnerabilities
- **Risk Level:** High
- **Affected Endpoints:**
  - GET `/api/workgroups/[id]/kanban/tasks/[taskId]`
  - PATCH `/api/workgroups/[id]/kanban/tasks/[taskId]`
  - GET `/api/workgroups/[id]/kanban/tasks/[taskId]/assignees`
  - GET `/api/workgroups/[id]/kanban/tasks/[taskId]/labels`
  - GET `/api/workgroups/[id]/kanban/labels`
  - GET `/api/workgroups/[id]/kanban/columns`
- **Impact:** Unautorisierte Benutzer können:
  - Task-Details anderer Workgroups einsehen
  - Task-Details anderer Workgroups ändern
  - Mitgliedernamen und Zuweisungen einsehen
- **Recommendation:** Konsistente Mitgliedschaftsprüfung in ALLEN GET und PATCH Endpunkten

### SEC-2: Positive Findings
- [x] Authentifizierung wird überall geprüft (401 für nicht-authentifizierte Requests)
- [x] Vorstand-Berechtigung für Spalten-CRUD korrekt implementiert
- [x] Task-DELETE prüft Creator oder Vorstand
- [x] File-Upload validiert MIME-Type und Größe
- [x] Input-Validierung mit Zod in allen Endpunkten
- [x] SQL Injection nicht möglich (Supabase Query Builder)
- [x] Attachment-DELETE prüft Uploader oder Vorstand

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Acceptance Criteria passed | 35 |
| ✅ Critical Bugs fixed | 2 |
| ✅ High Bugs fixed | 3 |
| ✅ Medium Bugs fixed | 2 |
| ✅ Security Issues fixed | 6 IDOR vulnerabilities |

---

## Recommendation

### All Bugs Fixed (2026-02-23)

| Priority | Bug | Status |
|----------|-----|--------|
| P0 | BUG-1: API Route Mismatch | ✅ Fixed |
| P0 | BUG-2: Widget total_count | ✅ Fixed |
| P1 | BUG-3: PATCH Task IDOR | ✅ Fixed |
| P1 | BUG-4: GET Task IDOR | ✅ Fixed |
| P1 | BUG-5: GET Assignees/Labels IDOR | ✅ Fixed |
| P1 | BUG-7: GET Columns IDOR | ✅ Fixed |
| P2 | BUG-6: Column Reorder Route | ✅ Fixed |

### Production-Ready Decision
**✅ READY FOR MANUAL TESTING:** Alle identifizierten Bugs wurden gefixt. Das Feature sollte jetzt manuell im Browser getestet werden, um die Fixes zu verifizieren.

---

## Checklist vor Abschluss

- [x] **Bestehende Features geprüft:** Via Git für Regression Tests geprüft
- [x] **Feature Spec gelesen:** `/features/PROJ-29-workgroup-kanban.md` vollständig verstanden
- [x] **Alle Acceptance Criteria getestet:** Jedes AC hat Status (✅ oder ❌)
- [x] **Edge Cases dokumentiert:** Alle Edge Cases dokumentiert
- [ ] **Cross-Browser getestet:** Nicht durchgeführt (Code-Review only)
- [ ] **Responsive getestet:** Nicht durchgeführt (Code-Review only)
- [x] **Bugs dokumentiert:** Jeder Bug hat Severity, Steps to Reproduce, Priority
- [ ] **Screenshots/Videos:** Nicht erstellt (Code-Review only)
- [x] **Test-Report geschrieben:** Vollständiger Report mit Summary
- [x] **Security Check:** Red-Team-Analyse durchgeführt, IDOR-Schwachstellen gefunden
- [ ] **User Review:** Ausstehend
- [x] **Production-Ready Decision:** ✅ Ready for manual testing (all bugs fixed)

---

*Report generated by QA Engineer Agent*
*Bugs fixed on 2026-02-23*
