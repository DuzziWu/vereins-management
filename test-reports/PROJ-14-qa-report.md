# QA Report: PROJ-14 Gruppen-Kommunikation (Group Chat)

**Date:** 2026-01-31 (Re-Test)
**Tester:** QA Engineer (Code Review + DB Inspection + Security Audit)
**Method:** Statische Code-Analyse, Datenbank-Inspektion, RLS-Policy-Review, Security-Audit, Build-Verification
**Feature Spec:** `/features/PROJ-14-group-communication.md`

---

## Executive Summary

| Metric | Result |
|--------|--------|
| Acceptance Criteria Total | 38 |
| Passed | 36 |
| Failed | 2 |
| Previous Bugs (Round 1) | 5 |
| Previous Bugs Fixed | 4 of 5 |
| **New Bugs Found (Round 2)** | **3** |
| New Security Findings | 1 (Medium) |
| Build Status | Erfolgreich (keine Fehler) |
| **Production Ready** | **BEDINGT** (2 Fixes vor Deployment) |

---

## Round 1 Bug Status (Re-Verification)

### BUG-1: Unread-Badge in Bottom-Navigation fehlt
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Verification | `bottom-nav.tsx` importiert `useUnreadMessages`, zeigt Badge auf Gruppen-Items und "Mehr"-Button |
| Files | `bottom-nav.tsx:7,20,70-73,95`, `bottom-nav-item.tsx:13,28-32` |

### BUG-2: Kein CASCADE DELETE bei Gruppen-Loeschung
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Verification | FK-Constraints: `group_messages.group_id` → `ON DELETE CASCADE`, `group_chat_reads.group_id` → `ON DELETE CASCADE` |
| Method | `information_schema.referential_constraints` Query bestaetiget `delete_rule = CASCADE` |

### BUG-3: Neues Mitglied sieht alle historischen Nachrichten
| Field | Value |
|-------|-------|
| Status | **FIXED** (API-Level) |
| Verification | `route.ts:57-82` filtert mit `group_members.created_at` via `.gte("created_at", membership.created_at)` |
| Hinweis | Fix ist nur auf API-Ebene, nicht in RLS-Policy (siehe NEW-BUG-3) |

### BUG-4: last_read_at bei Gruppenbeitritt nicht initialisiert
| Field | Value |
|-------|-------|
| Status | **OFFEN** (Low) |
| Impact | Neues Mitglied sieht inflated Unread-Count bis zum ersten Chat-Oeffnen |
| Workaround | Korrigiert sich beim ersten Oeffnen des Chats (POST `/messages/read`) |

### BUG-5: Offline-Nachricht geht verloren
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Verification | `chat-page.tsx:166-168` wirft Error bei Fehler, `chat-input.tsx:47` catch-Block behaelt Textarea-Inhalt |

---

## Round 1 Security/Performance Status (Re-Verification)

### SEC-1: Rate Limiting prozesslokal
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Verification | DB-basiert via `check_chat_rate_limit()` (SECURITY DEFINER) + `chat_rate_limits` Tabelle |
| Details | Cron-Job um 04:00 raumt abgelaufene Eintraege auf |

### SEC-2: Cursor-Parameter nicht validiert
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Verification | ISO-8601 Regex-Validation in `route.ts:53` |

### SEC-3: DB-Fehler an Client geleakt
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Verification | Generische deutsche Fehlermeldungen in allen API-Responses |

### PERF-1: N+1 Query bei Unread-Count
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Verification | `get_unread_message_counts()` DB-Funktion mit einzelnem Aggregate Query (CTE + GROUP BY) |

### PERF-2: Mark-as-Read Intervall
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Verification | `chat-page.tsx:62-81` markiert nur bei Mount und Unmount, kein Intervall mehr |

---

## Neue Bugs (Round 2)

### NEW-BUG-1: sanitizeContent verursacht Doppel-Escaping (Medium)
| Field | Value |
|-------|-------|
| Severity | **Medium** |
| Type | Display Bug |
| Location | `src/lib/api/chat-helpers.ts:152-158` |
| Issue | `sanitizeContent()` ersetzt `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;` VOR dem Speichern in der DB. React rendert Text bereits sicher — die HTML-Entities erscheinen dadurch woertlich auf dem Bildschirm. |
| Reproduce | 1. Nachricht senden: "Tom & Jerry" 2. Angezeigt wird: "Tom &amp;amp; Jerry" |
| Expected | "Tom & Jerry" |
| Actual | "Tom &amp;amp; Jerry" |
| Impact | Alle Nachrichten mit `&`, `<`, `>` werden falsch dargestellt |
| Root Cause | Unnoetige HTML-Entity-Escaping. Das Tag-Stripping (Zeile 154) reicht fuer XSS-Schutz, React handled den Rest. |
| Fix | Zeilen 155-157 entfernen (`.replace(/&/g, "&amp;amp;")` etc.). Tag-Stripping beibehalten. |

### NEW-BUG-2: URLs mit Query-Parametern werden zerstoert (Medium)
| Field | Value |
|-------|-------|
| Severity | **Medium** |
| Type | Display Bug + Broken Links |
| Location | `src/lib/api/chat-helpers.ts:155` + `src/lib/linkify.tsx` |
| Issue | URLs mit `&` in Query-Parametern werden durch sanitizeContent zerstoert: `&` → `&amp;amp;` |
| Reproduce | 1. Nachricht senden: "https://example.com?a=1&b=2" 2. Link zeigt `https://example.com?a=1&amp;amp;b=2` |
| Expected | Klickbarer Link zu `https://example.com?a=1&b=2` |
| Actual | Kaputte URL mit `&amp;amp;` im Link-Text und href |
| Root Cause | Gleiche Ursache wie NEW-BUG-1 |
| Fix | Gleicher Fix wie NEW-BUG-1 |

### NEW-SEC-1: Members-Sheet leakt volle Nachnamen an Client (Medium)
| Field | Value |
|-------|-------|
| Severity | **Medium** |
| Type | DSGVO / Privacy |
| Location | `src/components/chat/chat-page.tsx:84-134` → ruft `/api/groups/${groupId}` auf |
| Issue | Die Groups-API liefert vollstaendige `last_name`-Felder. `chat-page.tsx` anonymisiert erst client-seitig (`.last_name.charAt(0) + "."`). Im Browser Network-Tab sind volle Nachnamen aller Gruppenmitglieder sichtbar. |
| AC | "Anonymisierung erfolgt serverseitig (Client bekommt nur den anonymisierten Namen)" |
| Reproduce | 1. Chat oeffnen 2. Browser DevTools > Network Tab 3. Response von `/api/groups/{id}` pruefen 4. Volle Nachnamen aller Mitglieder sichtbar |
| Expected | Client erhaelt nur "Max M.", "Anna S." etc. |
| Actual | Client erhaelt "Max Mueller", "Anna Schmidt" etc. |
| Impact | DSGVO-Verletzung: Volle Namen im Chat-Kontext abrufbar |
| Fix | Neuen API-Endpunkt `/api/groups/[id]/chat-members` erstellen, der nur anonymisierte Namen liefert. Frontend anpassen. |

---

## Remaining Open: BUG-4

### BUG-4: last_read_at bei Gruppenbeitritt nicht initialisiert (Low)
| Field | Value |
|-------|-------|
| Severity | Low |
| Status | OFFEN |
| Impact | Neues Mitglied sieht inflated Unread-Count (zeigt alle Nachrichten als ungelesen, auch wenn API sie korrekt filtert via BUG-3 Fix). Korrigiert sich automatisch beim ersten Chat-Oeffnen. |
| Fix | DB-Trigger auf `group_members` INSERT oder API-seitige Initialisierung |

---

## DB Verification (Updated)

| Check | Status | Details |
|-------|--------|---------|
| `group_messages` Schema | OK | 6 Spalten korrekt |
| `group_chat_reads` Schema | OK | 4 Spalten korrekt |
| Content Check 1-1000 Zeichen | OK | DB-Constraint aktiv |
| UNIQUE(group_id, profile_id) | OK | `group_chat_reads_unique` |
| FK CASCADE DELETE (messages) | OK | `group_id` + `sender_id` → CASCADE |
| FK CASCADE DELETE (reads) | OK | `group_id` + `profile_id` → CASCADE |
| RLS enabled (messages) | OK | `rowsecurity = true` |
| RLS enabled (chat_reads) | OK | `rowsecurity = true` |
| RLS SELECT messages | OK | `is_group_participant(group_id)` |
| RLS INSERT messages | OK | `sender_id = self AND participant AND chat_enabled` |
| RLS UPDATE/DELETE messages | OK | Keine Policies = nicht erlaubt |
| RLS chat_reads (SELECT/INSERT/UPDATE) | OK | Nur eigene Eintraege |
| Trigger: set_sender_display_name | OK | BEFORE INSERT, korrekte Anonymisierung |
| Cron: 30-Tage Delete (03:00) | OK | `DELETE FROM group_messages WHERE created_at < NOW() - 30 days` |
| Cron: Rate-Limit Cleanup (04:00) | OK | `DELETE FROM chat_rate_limits WHERE window_start < 1h` |
| Index: (group_id, created_at DESC) | OK | Pagination-Performance |
| Index: created_at | OK | Cron-Job Performance |
| Index: sender_id | OK | Zusaetzlicher Index |
| Realtime Publication | OK | `group_messages` in `supabase_realtime` |
| is_group_participant() | OK | SECURITY DEFINER, kein Vorstand-Override |
| check_chat_rate_limit() | OK | SECURITY DEFINER, DB-basiert |
| get_unread_message_counts() | OK | SECURITY DEFINER, Single Aggregate Query |
| chat_rate_limits RLS | OK | RLS enabled, keine Policies (korrekt: Zugriff nur via SECURITY DEFINER Funktion) |

---

## Supabase Security Advisors (PROJ-14 relevant)

| Advisory | Level | Status |
|----------|-------|--------|
| `chat_rate_limits` RLS enabled no policy | INFO | Korrekt: Tabelle nur via SECURITY DEFINER Funktion genutzt |
| `login_attempts` RLS disabled | ERROR | Pre-existing (PROJ-1), nicht PROJ-14 |
| `password_reset_attempts` RLS disabled | ERROR | Pre-existing (PROJ-1), nicht PROJ-14 |

---

## Build Verification

| Check | Status |
|-------|--------|
| `next build` | Erfolgreich |
| TypeScript Compilation | Keine Fehler |
| Route Generation | Alle Chat-Routes korrekt (`/member/groups/[groupId]/chat`, `/trainer/groups/[groupId]/chat`) |
| API Routes | Alle 4 Endpoints vorhanden (`messages`, `messages/read`, `messages/unread`) |

---

## Regression Check (Updated)

| Feature | Status | Hinweis |
|---------|--------|---------|
| PROJ-12 Gruppenverwaltung | OK | Erweitert mit Unread-Badge, Grundfunktion intakt |
| PROJ-13 Training & Anwesenheit | OK | Keine Aenderungen an Training-Code |
| PROJ-11 Mobile Bottom-Nav | OK | Unread-Badge integriert (BUG-1 FIXED) |
| PROJ-1 Authentication | OK | Unveraendert |
| PROJ-8 Vereinskasse | OK | Keine Aenderungen |

---

## Summary

### Alle vorherigen Bugs behoben (4 von 5):
- BUG-1: Bottom-Nav Badge → FIXED
- BUG-2: CASCADE DELETE → FIXED
- BUG-3: Historische Nachrichten → FIXED
- BUG-5: Offline-Nachricht → FIXED
- SEC-1: Rate Limiting → FIXED (DB-basiert)
- SEC-2: Cursor-Validation → FIXED
- SEC-3: Error Leaking → FIXED
- PERF-1: N+1 Query → FIXED
- PERF-2: Mark-as-Read Intervall → FIXED

### Offene Bugs:
- **BUG-4** (Low): last_read_at Initialisierung
- **NEW-BUG-1** (Medium): sanitizeContent Doppel-Escaping
- **NEW-BUG-2** (Medium): URL Query-Parameter zerstoert
- **NEW-SEC-1** (Medium): Members-Sheet leakt volle Nachnamen

---

## Round 2 Fix Verification

### NEW-BUG-1 + NEW-BUG-2: sanitizeContent Doppel-Escaping
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Fix | `chat-helpers.ts:152-156` — Entity-Escaping entfernt, Tag-Stripping beibehalten |
| Verification | Code-Review: Nur `.replace(/<[^>]*>/g, "").trim()` verbleibt. React handled Text-Escaping. |
| Build | Erfolgreich |

### NEW-SEC-1: Members-Sheet leakt volle Nachnamen
| Field | Value |
|-------|-------|
| Status | **FIXED** |
| Fix | Neuer Endpoint `GET /api/groups/[id]/chat-members` mit server-seitiger Anonymisierung. Frontend `chat-page.tsx` nutzt neuen Endpoint. |
| Verification | Endpoint liefert nur `display_name` ("Max M."), kein `last_name`. Auth + Membership-Check korrekt. |
| Build | Erfolgreich, Route `/api/groups/[id]/chat-members` im Build-Output |

---

## Deployment Decision

**PRODUCTION-READY** (mit einer Low-Priority Einschraenkung)

### Alle Medium/High Bugs gefixt:
- NEW-BUG-1 + NEW-BUG-2: sanitizeContent Doppel-Escaping → FIXED
- NEW-SEC-1: Members-Sheet Privacy-Leak → FIXED
- BUG-1 bis BUG-3, BUG-5: Alle FIXED (Round 1)
- SEC-1 bis SEC-3, PERF-1, PERF-2: Alle FIXED (Round 1)

### Spaeter fixen (Low Priority):
- **BUG-4** (Low): last_read_at bei Gruppenbeitritt initialisieren (auto-korrigiert beim ersten Chat-Oeffnen)
