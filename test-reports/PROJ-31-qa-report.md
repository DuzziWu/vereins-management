# QA Report: PROJ-31 Workgroup-Chat

**Tested:** 2026-02-28
**Tester:** QA Engineer Agent
**Feature:** Workgroup-Chat (Echtzeit-Chat fuer Workgroups)
**Method:** Static Code Analysis
**Status:** NOT PRODUCTION-READY

---

## Files Reviewed

| Datei | Typ | Status |
|-------|-----|--------|
| `supabase/migrations/PROJ-31-workgroup-chat.sql` | Migration | Reviewed |
| `src/app/api/workgroups/[id]/messages/route.ts` | API Route (GET/POST) | Reviewed |
| `src/app/api/workgroups/[id]/messages/read/route.ts` | API Route (POST) | Reviewed |
| `src/app/api/workgroups/unread-counts/route.ts` | API Route (GET) | Reviewed |
| `src/components/workgroups/workgroup-chat-tab.tsx` | Component | Reviewed |
| `src/hooks/use-workgroup-chat-messages.ts` | Hook | Reviewed |
| `src/hooks/use-workgroup-chat-realtime.ts` | Hook | Reviewed |
| `src/lib/chat-types.ts` | Types | Reviewed |
| `src/lib/validations/chat.ts` | Validation | Reviewed |
| `src/components/workgroups/workgroup-detail-content.tsx` | Component | Reviewed |
| `src/components/chat/chat-input.tsx` | Shared Component | Reviewed |
| `src/components/chat/chat-messages.tsx` | Shared Component | Reviewed |
| `src/lib/api/chat-helpers.ts` | Helpers | Reviewed |

---

## Acceptance Criteria Checklist

### Chat-Grundstruktur
- [x] Chat-Tab in Workgroup-Detail-Seite (Board | Chat)
- [x] Tab-Navigation mit Icon und Ungelesen-Badge
- [x] Chat nimmt volle Hoehe ein (calc(100dvh - 22rem))
- [ ] Mobile: Chat als Sheet von unten -- NICHT als Sheet implementiert, normaler Tab
- [x] Desktop: separater Tab

### Echtzeit
- [x] Supabase Realtime Subscription (`workgroup-chat:{id}`, Filter `workgroup_id=eq.{id}`)
- [x] Nachrichten erscheinen sofort (Realtime + 3s Polling-Fallback)
- [ ] Typing-Indicator -- NICHT implementiert (optional laut Spec)
- [x] Connection-Status-Anzeige (connected/reconnecting/disconnected)
- [x] Supabase handelt Auto-Reconnect

### Nachrichten
- [ ] ❌ BUG-1: Max 2000 Zeichen -- ChatInput hat MAX_CHARS = 1000 (PROJ-14-Wert)
- [x] Eingabefeld mit Senden-Button
- [x] Enter = Senden, Shift+Enter = neue Zeile
- [x] Absender als "Vorname I." via DB-Trigger
- [x] Zeitstempel (bestehende ChatMessageBubble Komponente)
- [x] Eigene Nachrichten rechts, andere links
- [x] Auto-Scroll zu neuen Nachrichten
- [x] "Neue Nachrichten" Button wenn nicht am Ende

### Privacy/Anonymisierung
- [x] `sender_display_name` via BEFORE INSERT Trigger gesetzt (SECURITY DEFINER)
- [x] Keine Vollnamen im Chat-Kontext gespeichert
- [x] Kein Avatar/Profilbild
- [x] Keine @mentions
- [ ] ❌ BUG-2 (CRITICAL): RLS-Policy `WHERE id = auth.uid()` falsch -- muss `user_id = auth.uid()` sein

### Ungelesene Nachrichten
- [x] Badge mit Anzahl (kappung bei 99+)
- [x] `workgroup_message_reads` Tabelle trackt Lesezeitpunkt
- [x] Tab-Oeffnen setzt Read-Status
- [x] `GET /api/workgroups/unread-counts` implementiert
- [ ] ❌ BUG-3: Kein Debounce (Spec: 500ms), doppelte Read-Requests

### Chat-Loeschung bei Archivierung
- [x] `ON DELETE CASCADE` auf `workgroup_messages.workgroup_id`
- [ ] ❌ BUG-4 (High): Archivierungs-Dialog hat keinen Chat-Loeschungs-Hinweis
- [x] Keine Wiederherstellungs-API

### Vorstand-Zugriff
- [x] API-Ebene: Vorstand kann lesen (GET-Route prueft korrekt)
- [ ] ❌ BUG-2 (CRITICAL): RLS-Ebene: Vorstand-Lesezugriff via Realtime fehlerhaft
- [x] Vorstand kann nicht schreiben ohne Mitgliedschaft (POST-Route prueft nur `isWorkgroupMember`)

---

## Bug Summary

| Bug-ID | Severity | Kurzbeschreibung | Datei | Blocker? |
|--------|----------|------------------|-------|----------|
| BUG-1 | High | ChatInput MAX_CHARS = 1000 statt 2000 | `chat-input.tsx` | Ja |
| BUG-2 | Critical | RLS `profiles.id = auth.uid()` falsch (muss `user_id`) | Migration SQL | Ja |
| BUG-3 | Low | Doppelte Read-Requests, kein Debounce | `workgroup-chat-tab.tsx` | Nein |
| BUG-4 | High | Archivierungs-Dialog: kein Chat-Loeschungs-Hinweis | `workgroups-table.tsx` | Ja |
| BUG-5 | Medium | Keine Message-Queue bei Verbindungsverlust | `workgroup-chat-tab.tsx` | Nein |
| BUG-6 | Medium | Kein Handling bei Workgroup-Archivierung waehrend Nutzung | Fehlend | Nein |
| BUG-7 | Medium | Kein Handling bei Mitglied-Entfernung waehrend Nutzung | Fehlend | Nein |

---

## Detailed Bug Reports

### BUG-1: Frontend-Zeichenlimit 1000 statt 2000 (High)

**Datei:** `src/components/chat/chat-input.tsx`, Zeile 17-18

**Problem:** Die `ChatInput`-Komponente wurde aus PROJ-14 (Gruppen-Chat) uebernommen ohne Anpassung der Zeichenlimit-Konstanten. Fuer den Workgroup-Chat fordert die Spec 2000 Zeichen und Zaehler ab 1500.

```typescript
// Aktuell (FALSCH fuer PROJ-31):
const MAX_CHARS = 1000
const SHOW_COUNTER_AT = 800

// Korrekt fuer PROJ-31:
const MAX_CHARS = 2000
const SHOW_COUNTER_AT = 1500
```

Backend-Validierung (`workgroupSendMessageSchema`) und DB-Constraint (`char_length(content) <= 2000`) sind korrekt auf 2000 gesetzt. Nur das Frontend ist falsch.

**Steps to Reproduce:**
1. Workgroup-Chat oeffnen
2. Text mit 1001+ Zeichen einfuegen
3. Senden-Button ist deaktiviert
4. Expected: Erlaubt bis 2000 Zeichen, Zaehler ab 1500
5. Actual: Gesperrt ab 1001, Zaehler ab 801

**Fix:** `MAX_CHARS` als Prop oder separate Konstante je Kontext. Alternativ: `chat-input.tsx` Konstanten anpassen (bricht dann PROJ-14).

---

### BUG-2: RLS Policy Vorstand-Pruefung fehlerhaft (Critical)

**Datei:** `supabase/migrations/PROJ-31-workgroup-chat.sql`, Zeilen 60-63, 88-92

**Problem:** `profiles.id` ist in diesem Projekt eine eigene UUID (nicht identisch mit `auth.uid()`). `auth.uid()` gibt die Supabase Auth UUID zurueck, die `profiles.user_id` entspricht. Die RLS-Policy prueft `WHERE id = auth.uid()` -- das gibt nie TRUE zurueck fuer Vorstand.

```sql
-- FEHLERHAFT (aktuell):
OR EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()      -- FALSCH: profiles.id != auth.uid()
    AND role = 'vorstand'
)

-- KORREKT:
OR EXISTS (
  SELECT 1 FROM profiles
  WHERE user_id = auth.uid() -- RICHTIG: profiles.user_id = auth.uid()
    AND role = 'vorstand'
)
```

Betroffen: `workgroup_messages_select` und `workgroup_message_reads_select` Policies.

**Auswirkung:**
- Vorstand sieht keine Nachrichten via Supabase Realtime (RLS blockiert)
- API-Zugriff (Server-Side mit Service Key) ist nicht betroffen -- dort funktioniert Vorstand-Zugriff
- Bei direktem Datenbankzugriff oder Realtime: Vorstand hat keinen Zugriff

**Beleg:** In `src/lib/api/chat-helpers.ts` Zeile 36:
```typescript
.eq("user_id", user.id)  // <-- profiles wird via user_id gesucht, nicht id
```

Das beweist: `auth.uid()` = `user.id` = `profiles.user_id`, nicht `profiles.id`.

---

### BUG-3: Doppelte Read-Requests ohne Debounce (Low)

**Datei:** `src/components/workgroups/workgroup-chat-tab.tsx`, Zeilen 83-101, 109

```typescript
// Effect feuert markAsRead beim Aktivieren UND beim Verlassen (cleanup):
useEffect(() => {
  if (!isActive) return
  const markAsRead = async () => { ... }
  markAsRead()           // beim Aktivieren
  return () => {
    markAsRead()         // beim Verlassen (DOPPELT)
  }
}, [workgroupId, isActive])

// Zusaetzlich nach jedem Senden:
await fetch(`/api/workgroups/${workgroupId}/messages/read`, { method: "POST" })
```

Spec fordert 500ms Debounce. Kein Debounce implementiert.

---

### BUG-4: Archivierungs-Dialog ohne Chat-Loeschungs-Warnung (High)

**Datei:** `src/components/workgroups/workgroups-table.tsx`, Zeilen 337-340

**Aktueller Text:**
> "Die Workgroup X wird archiviert. Mitglieder koennen nicht mehr darauf zugreifen."

**Fehlender Text (laut Spec):**
> "Der Chat-Verlauf wird permanent geloescht."

User verliert unwissentlich alle Chat-Nachrichten bei Archivierung.

---

### BUG-5: Keine Message-Queue bei Verbindungsverlust (Medium)

**Datei:** `src/components/workgroups/workgroup-chat-tab.tsx`, Zeile 157

```typescript
<ChatInput
  onSend={handleSend}
  disabled={connectionStatus === "disconnected"}  // Nur deaktiviert, kein Queuing
/>
```

Spec fordert: "Nachrichten in Queue speichern. Bei Reconnect: Nachrichten senden."
Implementiert: Button deaktiviert, Nachricht geht verloren.

---

### BUG-6: Keine UI-Reaktion bei Workgroup-Archivierung waehrend Nutzung (Medium)

Wenn Vorstand die Workgroup archiviert waehrend ein User im Chat ist:
- Realtime-Channel laeuft weiter
- POST auf `/messages` gibt 404/403
- Kein Toast, kein Redirect

Spec: "User erhaelt Error-Toast: 'Workgroup wurde archiviert'. Redirect zu Workgroup-Liste."

---

### BUG-7: Kein Handling bei Mitglied-Entfernung waehrend Chat-Nutzung (Medium)

Wenn User aus Workgroup entfernt wird waehrend er chattet:
- Realtime laeuft weiter (RLS blockiert neue Payloads, aber kein UI-Feedback)
- Senden gibt 403
- Kein Toast "Du bist kein Mitglied mehr", kein Redirect

---

## Security Assessment

| Check | Status | Details |
|-------|--------|---------|
| RLS auf `workgroup_messages` | TEILWEISE | `profile_id = auth.uid()` fuer Mitglieder korrekt, `id = auth.uid()` fuer Vorstand FALSCH |
| RLS auf `workgroup_message_reads` | TEILWEISE | Gleiches Problem wie oben fuer Vorstand |
| INSERT-Berechtigung | OK | `sender_id = auth.uid()` + Mitgliedschaftspruefung |
| API-Authentifizierung | OK | `getAuthenticatedProfile` in allen Routes |
| Rate Limiting | OK | 10 Messages/60s via DB-Funktion, fail-closed |
| XSS-Sanitierung | OK | HTML-Tag-Stripping + React auto-escaping |
| UUID-Validierung | OK | `isValidUUID` Regex-Check in allen Routes |
| Vorstand-Schreibschutz | OK | POST-Route prueft nur `isWorkgroupMember` |
| Trigger SECURITY DEFINER | OK | Verhindert Display-Name-Manipulation |
| Cursor-Validierung | OK | ISO_REGEX-Pruefung fuer `before`/`after` Parameter |

---

## Regression Test

Keine Regressions-Risiken identifiziert:
- `chat-types.ts` -- additive Aenderungen, bestehende Typen unveraendert
- `validations/chat.ts` -- additive Aenderungen, bestehende Schemas unveraendert
- `workgroup-detail-content.tsx` -- Chat-Tab additiv hinzugefuegt, `forceMount` sichert Kanban-State
- Neue Hooks/Komponenten sind vollstaendig isoliert von PROJ-14

---

## Production-Ready Decision

**NOT READY** -- 3 Blocker-Bugs muessen gefixt werden:

| Prioritaet | Bug | Fix-Aufwand |
|------------|-----|-------------|
| 1 (sofort) | BUG-2: RLS `user_id = auth.uid()` | 2 SQL-Zeilen |
| 2 (sofort) | BUG-1: MAX_CHARS 1000 -> 2000 | 2 TypeScript-Zeilen |
| 3 (sofort) | BUG-4: Archivierungs-Warnung ergaenzen | 1 JSX-Zeile |
