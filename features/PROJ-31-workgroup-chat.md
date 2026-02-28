# PROJ-31: Workgroup-Chat

## Status: Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-25 (Workgroup-Verwaltung) - für Workgroup-Struktur und Mitglieder
- Benötigt: PROJ-29 (Workgroup Kanban) - Integration in Workgroup-Detail-Seite
- Unabhängig von: Document-Features (PROJ-26ff), Inventory-Features (PROJ-27ff)

---

## Übersicht

Ein Echtzeit-Chat für Workgroups mit Privacy-First-Ansatz. Mitglieder werden anonymisiert als "Vorname + Initial" angezeigt (z.B. "Max M."). Der gesamte Chat-Verlauf wird automatisch gelöscht, sobald die Workgroup archiviert wird. Nutzt Supabase Realtime für sofortige Nachrichtenübertragung.

**Wichtig:** Baut auf PROJ-25 (Workgroup-Verwaltung) auf. Jede Workgroup bekommt einen eigenen Chat-Kanal.

---

## User Stories

### US-1: Chat öffnen
**Als** Workgroup-Mitglied
**möchte ich** den Chat meiner Workgroup öffnen
**um** mit anderen Mitgliedern zu kommunizieren.

### US-2: Nachricht senden
**Als** Workgroup-Mitglied
**möchte ich** Nachrichten in Echtzeit senden
**um** sofort mit dem Team zu kommunizieren.

### US-3: Nachrichten empfangen
**Als** Workgroup-Mitglied
**möchte ich** neue Nachrichten sofort sehen (ohne Seite neu zu laden)
**um** eine flüssige Chat-Erfahrung zu haben.

### US-4: Anonymisierte Namen sehen
**Als** Workgroup-Mitglied
**möchte ich** andere Mitglieder nur als "Vorname + Initial" sehen (z.B. "Max M.")
**um** die Privatsphäre aller Beteiligten zu schützen.

### US-5: Ungelesene Nachrichten erkennen
**Als** Workgroup-Mitglied
**möchte ich** sehen, wie viele ungelesene Nachrichten es gibt
**um** zu wissen, ob ich etwas verpasst habe.

### US-6: Chat-Löschung verstehen
**Als** Workgroup-Mitglied
**möchte ich** wissen, dass der Chat bei Workgroup-Archivierung gelöscht wird
**um** keine sensiblen Daten dauerhaft zu speichern.

### US-7: Vorstand überwacht Chat (Readonly)
**Als** Vorstand
**möchte ich** die Chats aller Workgroups einsehen können
**um** bei Konflikten oder Sicherheitsproblemen eingreifen zu können.

---

## Acceptance Criteria

### Chat-Grundstruktur

- [ ] Chat-Tab in der Workgroup-Detail-Seite (neben Kanban-Board)
- [ ] Tabs: "Board" | "Chat" in der Workgroup-Navigation
- [ ] Chat-Bereich nimmt volle Höhe ein (minus Header/Footer)
- [ ] Mobile: Chat öffnet sich als Sheet von unten (wie Gruppen-Chat)
- [ ] Desktop: Chat als rechte Sidebar oder separater Tab

### Echtzeit-Funktionalität

- [ ] Supabase Realtime Subscription für `workgroup_messages` Tabelle
- [ ] Neue Nachrichten erscheinen sofort ohne Reload
- [ ] Typing-Indicator (optional, nice-to-have)
- [ ] Connection-Status-Anzeige (verbunden/getrennt)
- [ ] Auto-Reconnect bei Verbindungsverlust

### Nachrichten

- [ ] Textnachrichten (max. 2000 Zeichen)
- [ ] Eingabefeld mit "Senden" Button
- [ ] Enter zum Senden (Shift+Enter für neue Zeile)
- [ ] Nachrichten zeigen:
  - Absender als "Vorname Initial." (z.B. "Max M.")
  - Zeitstempel (HH:MM, bei älteren Nachrichten: DD.MM.)
  - Nachrichtentext
- [ ] Eigene Nachrichten rechts, andere links (WhatsApp-Stil)
- [ ] Automatisches Scrollen zu neuen Nachrichten
- [ ] "Scroll to bottom" Button wenn nicht am Ende

### Privacy-First (Anonymisierung)

- [ ] Namen werden NICHT aus der Datenbank als Vollname geladen
- [ ] Backend liefert nur `first_name` + ersten Buchstaben von `last_name`
- [ ] RLS Policy verhindert Zugriff auf volle Nachnamen im Chat-Kontext
- [ ] Kein Profilbild oder Avatar (nur farbiger Kreis mit Initialen)
- [ ] Keine @mentions mit vollem Namen

### Ungelesene Nachrichten

- [ ] Badge mit Anzahl ungelesener Nachrichten am Chat-Tab
- [ ] `workgroup_message_reads` Tabelle trackt letzten Lesezeitpunkt
- [ ] Bei Öffnen des Chats: Read-Status auf aktuelle Zeit setzen
- [ ] Ungelesene Zählung in Workgroup-Liste anzeigen
- [ ] Benachrichtigungs-Badge in der Navigation (optional)

### Chat-Löschung bei Archivierung

- [ ] Wenn Workgroup archiviert wird → alle Nachrichten löschen
- [ ] Warndialog vor Archivierung: "Chat-Verlauf wird permanent gelöscht"
- [ ] Keine Möglichkeit, gelöschte Nachrichten wiederherzustellen
- [ ] Dokumentation für User: "Chats werden bei Archivierung gelöscht"

### Vorstand-Zugriff

- [ ] Vorstand kann alle Workgroup-Chats lesen (readonly)
- [ ] Vorstand kann NICHT in Chats schreiben, in denen er kein Mitglied ist
- [ ] Audit-Log: Wann hat welcher Vorstand welchen Chat eingesehen (optional)

### Mobile UX

- [ ] Touch-optimierte Eingabe
- [ ] Keyboard-Push (Chat scrollt hoch wenn Tastatur öffnet)
- [ ] Pull-to-refresh für ältere Nachrichten (Pagination)
- [ ] Smooth Scrolling

---

## Edge Cases

### E-1: Leerer Chat
**Szenario:** Workgroup hat noch keine Nachrichten.
**Verhalten:** Placeholder-Text anzeigen: "Noch keine Nachrichten. Starte die Konversation!"

### E-2: Viele Nachrichten (Performance)
**Szenario:** Chat hat 1000+ Nachrichten.
**Verhalten:**
- Initial nur letzte 50 Nachrichten laden
- "Ältere laden" Button oder automatisches Laden beim Hochscrollen
- Virtualisierung für Performance (optional)

### E-3: Verbindungsverlust
**Szenario:** Internet-Verbindung geht verloren.
**Verhalten:**
- Connection-Status auf "Getrennt" setzen
- Nachrichten in Queue speichern
- Bei Reconnect: Nachrichten senden + verpasste Nachrichten laden
- Toast: "Verbindung wiederhergestellt"

### E-4: Gleichzeitige Archivierung
**Szenario:** User schreibt während Vorstand archiviert.
**Verhalten:**
- Archivierung bricht Chat-Subscription ab
- User erhält Error-Toast: "Workgroup wurde archiviert"
- Redirect zu Workgroup-Liste

### E-5: Mitglied wird entfernt
**Szenario:** User wird aus Workgroup entfernt während er im Chat ist.
**Verhalten:**
- Realtime-Subscription wird automatisch ungültig
- Error-Handling: "Du bist kein Mitglied mehr"
- Redirect zu Workgroup-Liste

### E-6: Lange Nachrichten
**Szenario:** User versucht, 5000 Zeichen zu senden.
**Verhalten:**
- Frontend-Validierung: Max 2000 Zeichen
- Zeichenzähler ab 1500 Zeichen anzeigen
- Senden-Button deaktivieren wenn Limit überschritten

---

## Technische Anforderungen

### Datenbank-Tabellen

```sql
-- Workgroup Messages
CREATE TABLE workgroup_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workgroup_id UUID REFERENCES workgroups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_workgroup_messages_workgroup ON workgroup_messages(workgroup_id, created_at DESC);

-- Read-Status
CREATE TABLE workgroup_message_reads (
  workgroup_id UUID REFERENCES workgroups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workgroup_id, profile_id)
);
```

### RLS Policies

```sql
-- Nur Mitglieder können Nachrichten sehen
CREATE POLICY "Workgroup members can view messages" ON workgroup_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workgroup_members
      WHERE workgroup_id = workgroup_messages.workgroup_id
      AND profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND system_role = 'board'
    )
  );

-- Nur Mitglieder können Nachrichten senden
CREATE POLICY "Workgroup members can send messages" ON workgroup_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workgroup_members
      WHERE workgroup_id = workgroup_messages.workgroup_id
      AND profile_id = auth.uid()
    )
  );
```

### Supabase Realtime

- Channel: `workgroup-chat-{workgroup_id}`
- Event: `INSERT` auf `workgroup_messages`
- Payload: Message-Daten mit anonymisiertem Absender

### API-Endpunkte

- `GET /api/workgroups/{id}/messages` - Nachrichten laden (paginiert)
- `POST /api/workgroups/{id}/messages` - Nachricht senden
- `PUT /api/workgroups/{id}/messages/read` - Read-Status aktualisieren
- `GET /api/workgroups/unread-counts` - Ungelesene pro Workgroup

### Performance

- Response Time < 100ms für Senden
- Max 50 Nachrichten pro Request
- Lazy Loading für ältere Nachrichten
- Debounce für Read-Status Updates (500ms)

---

## UI/UX Details

### Desktop Layout
```
+------------------------------------------+
| Workgroup: Wagenbau 2026                 |
+------------------------------------------+
| [Board] [Chat (3)]                       |
+------------------------------------------+
|                                          |
| Max M.                          10:32    |
| +--------------------------------+       |
| | Wer kann morgen helfen?        |       |
| +--------------------------------+       |
|                                          |
|                          10:33  Du       |
|       +--------------------------------+ |
|       | Ich bin dabei! Ab 14 Uhr.      | |
|       +--------------------------------+ |
|                                          |
| Lisa S.                         10:35    |
| +--------------------------------+       |
| | Ich auch, bringe Werkzeug mit  |       |
| +--------------------------------+       |
|                                          |
+------------------------------------------+
| [Nachricht eingeben...          ] [Send] |
+------------------------------------------+
```

### Mobile Layout
```
+----------------------+
| < Wagenbau 2026      |
+----------------------+
| [Board] [Chat (3)]   |
+----------------------+
|                      |
| Max M.        10:32  |
| +----------------+   |
| | Wer kann      |   |
| | morgen        |   |
| | helfen?       |   |
| +----------------+   |
|                      |
|        10:33  Du     |
|   +----------------+ |
|   | Ich bin dabei! | |
|   | Ab 14 Uhr.     | |
|   +----------------+ |
|                      |
+----------------------+
| [Nachricht...]  [>]  |
+----------------------+
```

---

## Abhängige Änderungen

### Workgroup-Archivierung (PROJ-25 Update)
- Archivierungs-Dialog um Chat-Löschungs-Warnung erweitern
- Trigger für CASCADE DELETE der Messages hinzufügen

### Navigation
- Ungelesene-Count in Workgroup-Menüpunkt anzeigen
- Optional: Badge in Bottom-Navigation (Mobile)

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur nutzen

**Gute Nachricht:** Das Gruppen-Chat-System (PROJ-14) existiert bereits vollständig! Wir können die bewährte Architektur wiederverwenden:

- ✅ Realtime-Hook vorhanden (`use-chat-realtime.ts`)
- ✅ Chat-UI-Komponenten vorhanden (`chat-page.tsx`, `chat-messages.tsx`, etc.)
- ✅ Pagination-Logik vorhanden (Cursor-basiert, 50 Nachrichten pro Batch)
- ✅ Connection-Status-Anzeige vorhanden

### Component-Struktur

```
Workgroup-Detail-Seite (erweitert)
├── Tab-Navigation
│   ├── "Board" Tab (Kanban - existiert)
│   ├── "Mitglieder" Tab (existiert)
│   └── "Chat" Tab (NEU - mit Ungelesen-Badge)
│
└── Chat-Bereich (wenn Tab aktiv)
    ├── Chat-Header
    │   ├── Workgroup-Name
    │   └── Verbindungs-Status (grün/orange/rot)
    │
    ├── Nachrichten-Liste
    │   ├── "Ältere laden" Button (oben)
    │   ├── Nachrichten-Blasen
    │   │   ├── Andere: Links (grau) mit "Vorname I."
    │   │   └── Eigene: Rechts (blau)
    │   └── "Scroll nach unten" Button (wenn nicht am Ende)
    │
    └── Eingabe-Bereich (unten fixiert)
        ├── Textarea (max 2000 Zeichen)
        ├── Zeichenzähler (ab 1500)
        └── Senden-Button
```

### Mobile-Ansicht

```
Workgroup-Detail (Mobile)
├── Tab-Leiste: [Board] [Chat (3)]
│
└── Chat (wenn aktiv)
    ├── Nachrichten (volle Höhe, scrollbar)
    └── Eingabe-Leiste (fixiert unten)
        └── Keyboard schiebt Chat hoch
```

### Daten-Model

**Nachrichten speichern:**
- Workgroup-Zugehörigkeit (welche Workgroup?)
- Absender (welches Mitglied?)
- Anzeigename (automatisch: "Vorname I." - für Privacy)
- Nachrichtentext (max 2000 Zeichen)
- Zeitstempel

**Lese-Status tracken:**
- Wann hat wer zuletzt den Chat gelesen?
- Ermöglicht Badge: "3 ungelesene Nachrichten"

**Bei Archivierung:**
- Alle Nachrichten werden automatisch gelöscht (CASCADE)
- Kein manueller Eingriff nötig

### Tech-Entscheidungen

| Entscheidung | Gewählt | Warum? |
|--------------|---------|--------|
| **Echtzeit-Updates** | Supabase Realtime | Bereits im Projekt, bewährt bei Gruppen-Chat |
| **Chat-Channel** | `workgroup-chat:{id}` | Konsistent mit bestehendem `group-chat:{id}` Pattern |
| **Anonymisierung** | Datenbank-Trigger | Verhindert Manipulation - Name wird serverseitig gesetzt |
| **UI-Komponenten** | Bestehende Chat-Komponenten anpassen | 80% Code-Wiederverwendung, schnellere Entwicklung |
| **Pagination** | Cursor-basiert (Timestamp) | Bewährt bei vielen Nachrichten, effizient |
| **Offline-Handling** | Connection-Status + Queue | Bereits implementiert, nutzen wir wieder |

### Wiederverwendbare Komponenten

Folgende bestehende Komponenten können direkt genutzt werden:

- `ChatConnectionStatus` - Zeigt Verbindungsstatus an
- `ChatInput` - Eingabefeld mit Enter/Shift+Enter Handling
- `ChatMessages` - Nachrichten-Liste mit Scroll-Logik
- `use-chat-realtime` - Realtime-Subscription Hook

Nur anzupassen:
- Channel-Name von `group-chat` auf `workgroup-chat`
- Tabellen-Referenz von `group_messages` auf `workgroup_messages`

### Dependencies

Keine neuen Packages nötig - alles bereits im Projekt:
- Supabase Client (Realtime)
- Radix UI Tabs (Tab-Navigation)
- Bestehende Chat-Komponenten

### Vorstand-Zugriff

- Vorstand kann alle Chats **lesen** (RLS Policy)
- Vorstand kann nur **schreiben**, wenn er Mitglied ist
- Keine spezielle "Audit-Log" Funktion im Scope

---

## Nicht im Scope

- Bilder/Dateien im Chat (nutzt Task-Attachments stattdessen)
- Emojis/Reaktionen
- Nachrichten bearbeiten/löschen
- @mentions
- Threads/Antworten auf Nachrichten
- Push-Notifications (separates Feature)

---

## QA Test Results

**Tested:** 2026-02-28
**Tester:** QA Engineer Agent
**Method:** Static Code Analysis (alle neuen/geaenderten Dateien gelesen)
**Dateien geprueft:**
- `supabase/migrations/PROJ-31-workgroup-chat.sql`
- `src/app/api/workgroups/[id]/messages/route.ts`
- `src/app/api/workgroups/[id]/messages/read/route.ts`
- `src/app/api/workgroups/unread-counts/route.ts`
- `src/components/workgroups/workgroup-chat-tab.tsx`
- `src/hooks/use-workgroup-chat-messages.ts`
- `src/hooks/use-workgroup-chat-realtime.ts`
- `src/lib/chat-types.ts`
- `src/lib/validations/chat.ts`
- `src/components/workgroups/workgroup-detail-content.tsx`
- `src/components/chat/chat-input.tsx` (wiederverwendet)
- `src/components/chat/chat-messages.tsx` (wiederverwendet)
- `src/lib/api/chat-helpers.ts` (wiederverwendet)

---

## Acceptance Criteria Status

### Chat-Grundstruktur

- [x] Chat-Tab in der Workgroup-Detail-Seite (neben Kanban-Board) -- implementiert in `workgroup-detail-content.tsx`, Tabs "Board" | "Chat"
- [x] Tabs: "Board" | "Chat" in der Workgroup-Navigation -- Radix Tabs mit Icon + Badge
- [x] Chat-Bereich nimmt volle Hoehe ein -- `h-[calc(100dvh-22rem)] min-h-[420px]` in `workgroup-chat-tab.tsx`
- [ ] NICHT GEPRUEFT: Mobile: Chat oeffnet sich als Sheet von unten -- Spec sagt Sheet, Implementierung hat normalen Tab (kein Sheet). Visuell nicht als Sheet implementiert.
- [x] Desktop: Chat als separater Tab -- korrekt implementiert

### Echtzeit-Funktionalitaet

- [x] Supabase Realtime Subscription fuer `workgroup_messages` -- `use-workgroup-chat-realtime.ts`, Channel `workgroup-chat:{workgroupId}`, Filter `workgroup_id=eq.{id}`
- [x] Neue Nachrichten erscheinen sofort ohne Reload -- `addRealtimeMessage` + Fallback-Polling alle 3 Sekunden
- [ ] Typing-Indicator (nice-to-have) -- NICHT implementiert (laut Spec optional)
- [x] Connection-Status-Anzeige -- `ChatConnectionStatus` Komponente, zeigt "reconnecting..." / "Verbindung unterbrochen"
- [x] Auto-Reconnect bei Verbindungsverlust -- Supabase Realtime handelt reconnect automatisch, Status-Tracking vorhanden

### Nachrichten

- [ ] ❌ BUG-1: Textnachrichten max 2000 Zeichen -- Backend-Validierung korrekt (2000), aber `ChatInput`-Komponente hat `MAX_CHARS = 1000` hartcodiert. Frontend erlaubt nur 1000 Zeichen, Backend akzeptiert bis 2000.
- [x] Eingabefeld mit "Senden" Button -- `ChatInput` Komponente wiederverwendet
- [x] Enter zum Senden, Shift+Enter fuer neue Zeile -- implementiert in `chat-input.tsx`
- [x] Nachrichten zeigen Absender als "Vorname Initial." -- `sender_display_name` via DB-Trigger gesetzt
- [x] Zeitstempel -- `ChatMessageBubble` zeigt Zeitstempel (Format von bestehender Komponente)
- [x] Eigene Nachrichten rechts, andere links -- `isOwn = message.sender_id === currentUserId` in `chat-messages.tsx`
- [x] Automatisches Scrollen zu neuen Nachrichten -- `scrollToBottom` in `chat-messages.tsx`
- [x] "Scroll to bottom" Button -- "Neue Nachrichten" Button wenn nicht am Ende

### Privacy-First (Anonymisierung)

- [x] Backend liefert nur `first_name` + ersten Buchstaben von `last_name` -- DB-Trigger `set_workgroup_message_display_name()` setzt `sender_display_name` zu "Vorname I."
- [x] `sender_display_name` wird serverseitig via Trigger gesetzt -- Manipulation durch Client verhindert
- [x] Kein Profilbild oder Avatar -- `trainerIds={[]}` uebergeben, kein Avatar-Fetch
- [x] Keine @mentions -- nicht implementiert (korrekt, laut Spec nicht im Scope)
- [ ] ❌ BUG-2 (CRITICAL): RLS Policy verwendet `profiles.id = auth.uid()` -- FALSCH. In diesem Projekt referenziert `profiles.id` eine eigene UUID, waehrend `auth.uid()` der `profiles.user_id` entspricht. Die RLS Policies `WHERE id = auth.uid()` fuer die Vorstand-Pruefung in `workgroup_messages_select` und `workgroup_message_reads_select` sind daher fehlerhaft. Vorstand-Zugriff via RLS funktioniert NICHT korrekt (gibt immer FALSE zurueck).

### Ungelesene Nachrichten

- [x] Badge mit Anzahl ungelesener Nachrichten am Chat-Tab -- `unreadCount` State in `workgroup-detail-content.tsx`, Badge mit "99+" Kappung
- [x] `workgroup_message_reads` Tabelle trackt letzten Lesezeitpunkt -- in Migration definiert
- [x] Bei Oeffnen des Chats: Read-Status auf aktuelle Zeit setzen -- `markAsRead` in `workgroup-chat-tab.tsx` beim Tab-Aktivieren
- [x] Ungelesene Zaehlung per Workgroup -- `GET /api/workgroups/unread-counts`
- [ ] NICHT IMPLEMENTIERT: Benachrichtigungs-Badge in der Navigation (optional laut Spec)
- [ ] ❌ BUG-3 (Medium): Read-Status wird DOPPELT geschrieben -- `markAsRead` wird beim Tab-Aktivieren SOFORT aufgerufen UND beim Verlassen des Tabs (cleanup-Funktion). Das fuehrt zu einem unnoetigem POST-Request beim Verlassen. Kein Debounce implementiert (Spec: 500ms Debounce). Nach jedem Senden wird zusaetzlich ein separater POST auf `/messages/read` gemacht.

### Chat-Loeschung bei Archivierung

- [x] Wenn Workgroup archiviert wird -> alle Nachrichten loeschen -- `ON DELETE CASCADE` auf `workgroup_messages.workgroup_id`
- [ ] ❌ BUG-4 (High): Warndialog bei Archivierung fehlt Chat-Hinweis -- `workgroups-table.tsx` Archivierungs-Dialog sagt nur "Mitglieder koennen nicht mehr darauf zugreifen", aber KEIN Hinweis "Chat-Verlauf wird permanent geloescht". Spec fordert explizit diesen Warnhinweis.
- [x] Keine Wiederherstellung moeglich -- kein API-Endpunkt fuer Message-Restore
- [ ] NICHT IMPLEMENTIERT: Dokumentation fuer User ueber Chat-Loeschung

### Vorstand-Zugriff

- [x] Vorstand kann alle Workgroup-Chats lesen -- API-Ebene korrekt (`isWorkgroupMemberOrVorstand`)
- [ ] ❌ BUG-2 (CRITICAL, Wiederholung): RLS Policy fuer Vorstand-Lesezugriff fehlerhaft -- `WHERE id = auth.uid()` in der RLS Policy prueft `profiles.id`, aber `auth.uid()` gibt die `user_id` zurueck. Supabase Realtime-Subscription laeuft direkt ueber RLS -- Vorstand wuerden also ueber Realtime KEINE Nachrichten erhalten.
- [x] Vorstand kann NICHT in Chats schreiben (wenn kein Mitglied) -- `isWorkgroupMember` prueft explizit nur Mitgliedschaft im POST-Handler
- [ ] Audit-Log -- nicht im Scope

### Mobile UX

- [x] Touch-optimierte Eingabe -- `safe-area-inset-bottom` in `ChatInput`
- [ ] NICHT GEPRUEFT: Keyboard-Push (erfordert Geraetetest)
- [ ] NICHT GEPRUEFT: Pull-to-refresh fuer aeltere Nachrichten (Scroll-to-top Trigger vorhanden)
- [x] Smooth Scrolling -- `ScrollBehavior = "smooth"` implementiert

---

## Edge Cases Status

### E-1: Leerer Chat
- [x] Placeholder-Text vorhanden -- `chat-messages.tsx` zeigt "Noch keine Nachrichten in dieser Gruppe. Starte die Konversation!"
- HINWEIS: Text weicht leicht von Spec ab ("...in dieser Gruppe" statt schlicht leer), aber Intention erfuellt.

### E-2: Viele Nachrichten (Performance)
- [x] Initial nur letzte 50 Nachrichten laden -- `query.limit(50)` in GET Route
- [x] "Aeltere laden" per Scroll-Trigger -- Scroll-to-top loest `onLoadMore` aus
- [x] Cursor-basierte Pagination -- `before` Timestamp-Parameter
- [ ] NICHT IMPLEMENTIERT: Virtualisierung (Spec sagt optional)

### E-3: Verbindungsverlust
- [x] Connection-Status auf "Getrennt" setzen -- `CLOSED` Status -> `disconnected`
- [x] Senden-Button deaktiviert bei "disconnected" -- `disabled={connectionStatus === "disconnected"}`
- [ ] ❌ BUG-5 (Medium): Keine Message-Queue bei Verbindungsverlust -- Spec fordert "Nachrichten in Queue speichern" bei Offline. Aktuell: Senden schlaegt fehl ohne Queuing. Der Button ist nur deaktiviert, aber Nachrichten werden nicht gepuffert.
- [x] Polling als Fallback alle 3 Sekunden -- `setInterval(pollNewMessages, 3000)` in `workgroup-chat-tab.tsx`
- [ ] Kein Toast "Verbindung wiederhergestellt" -- kein Reconnect-Toast implementiert

### E-4: Gleichzeitige Archivierung
- [ ] ❌ BUG-6 (Medium): Keine Behandlung wenn Workgroup waehrend Chat-Nutzung archiviert wird -- Keine Subscription oder Pruefung ob Workgroup archiviert wurde. Realtime-Channel bleibt offen, neue Nachrichten koennen nicht mehr gesendet werden (403 vom API), aber User erhaelt keinen erklaerenden Error-Toast oder Redirect.

### E-5: Mitglied wird entfernt
- [ ] ❌ BUG-7 (Medium): Kein Handling wenn User aus Workgroup entfernt wird -- Realtime-Subscription laeuft weiter (RLS wuerde Payload blockieren, aber Connection bleibt). Kein Fehler-Toast "Du bist kein Mitglied mehr", kein Redirect.

### E-6: Lange Nachrichten
- [ ] ❌ BUG-1 (High, Wiederholung): `ChatInput` MAX_CHARS = 1000, aber Spec fordert 2000 -- Frontend-Limit falsch. Zeichenzaehler erscheint ab 800 (Spec: ab 1500). `maxLength` im textarea ist `1000 + 50 = 1050` statt `2000 + 50`.
- [ ] ❌ BUG-1 (High): Senden-Button deaktiviert ab 1001 Zeichen statt ab 2001 Zeichen -- `canSend` prueft `<= MAX_CHARS` (1000), Backend akzeptiert bis 2000.

---

## API-Endpunkte Vollstaendigkeitspruefung

| Endpunkt | Spec | Implementiert | Status |
|----------|------|---------------|--------|
| `GET /api/workgroups/{id}/messages` | Ja | Ja | OK |
| `POST /api/workgroups/{id}/messages` | Ja | Ja | OK |
| `PUT /api/workgroups/{id}/messages/read` | Ja (PUT) | Ja (POST statt PUT) | ABWEICHUNG |
| `GET /api/workgroups/unread-counts` | Ja | Ja | OK |

HINWEIS: Spec definiert `PUT /api/workgroups/{id}/messages/read`, implementiert ist `POST /api/workgroups/{id}/messages/read`. Funktional identisch (UPSERT), aber HTTP-Methode weicht von Spec ab. Frontend ruft ebenfalls POST auf, also kein Bug -- aber Spec-Abweichung.

---

## Bugs Found

### BUG-1: Frontend-Zeichenlimit falsch (1000 statt 2000)
- **Severity:** High
- **Datei:** `src/components/chat/chat-input.tsx`, Zeilen 17-18
- **Problem:** `MAX_CHARS = 1000` und `SHOW_COUNTER_AT = 800` sind die Werte fuer den Gruppen-Chat (PROJ-14). Fuer den Workgroup-Chat (PROJ-31) fordert die Spec max. 2000 Zeichen und Anzeige ab 1500.
- **Auswirkung:** User kann maximal 1000 Zeichen eingeben, obwohl Backend und DB bis 2000 unterstuetzen. Feature ist funktional eingeschraenkt.
- **Steps to Reproduce:**
  1. Workgroup-Chat oeffnen
  2. 1001+ Zeichen eingeben
  3. Senden-Button ist deaktiviert
  4. Expected: Limit bei 2000, Zaehler ab 1500
  5. Actual: Limit bei 1000, Zaehler ab 800
- **Root Cause:** `ChatInput`-Komponente wurde aus PROJ-14 wiederverwendet ohne die Konstantenwerte anzupassen. Da `MAX_CHARS` eine Modul-Konstante ist (nicht als Prop uebergeben), kann das nur durch Anpassung der Komponente oder Erstellung einer separaten Variante geloest werden.
- **Priority:** High

### BUG-2: RLS Policy prueft falsches Feld fuer Vorstand (CRITICAL Security)
- **Severity:** Critical
- **Datei:** `supabase/migrations/PROJ-31-workgroup-chat.sql`, Zeilen 60-63 und 88-92
- **Problem:** Die RLS Policies fuer den Vorstand-Lesezugriff verwenden `WHERE id = auth.uid()` auf der `profiles` Tabelle. In diesem Projekt ist `profiles.id` eine eigene UUID (nicht identisch mit `auth.uid()`). `auth.uid()` entspricht `profiles.user_id`. Daher wird die Vorstand-Pruefung in RLS IMMER fehlschlagen (kein Vorstand kann Nachrichten ueber Realtime lesen, da RLS Row-Level greift).
- **Code (fehlerhaft):**
  ```sql
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()  -- FALSCH: profiles.id != auth.uid()
      AND role = 'vorstand'
  )
  ```
- **Korrekt waere:**
  ```sql
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()  -- KORREKT
      AND role = 'vorstand'
  )
  ```
- **Auswirkung:** Vorstand hat KEINEN funktionierenden RLS-seitigen Lesezugriff auf Nachrichten/Reads via Realtime. API-Zugriff funktioniert (Supabase-Service-Key umgeht RLS), aber direkter Realtime-Kanal wird durch fehlerhafte RLS geblockt. Sicherheitsauswirkung: Vorstand kann ueber Realtime-Subscription keine Nachrichten sehen.
- **Steps to Reproduce:**
  1. Als Vorstand-User Workgroup-Chat oeffnen
  2. Als Mitglied Nachricht senden
  3. Expected: Vorstand sieht Nachricht in Echtzeit
  4. Actual: Realtime-Event wird durch RLS blockiert (Vorstand erhaelt keine Live-Updates)
- **Priority:** Critical

### BUG-3: Read-Status ohne Debounce, doppelte Requests
- **Severity:** Medium
- **Datei:** `src/components/workgroups/workgroup-chat-tab.tsx`, Zeilen 83-101
- **Problem:** `markAsRead` wird (a) beim Aktivieren des Tabs und (b) beim Verlassen des Tabs (useEffect-Cleanup) aufgerufen. Zusaetzlich wird nach jedem gesendeten Message ein weiterer POST gemacht (Zeile 109). Kein Debounce implementiert (Spec fordert 500ms). Bei haeufigem Tab-Wechsel entstehen viele unnoetige API-Requests.
- **Auswirkung:** Unnoetige Server-Last, kein kritischer Bug aber verschwendete Requests.
- **Priority:** Low

### BUG-4: Archivierungs-Dialog warnt nicht ueber Chat-Loeschung
- **Severity:** High
- **Datei:** `src/components/workgroups/workgroups-table.tsx`, Zeilen 337-340
- **Problem:** Der Bestaetigungs-Dialog bei Archivierung zeigt nur: "Die Workgroup X wird archiviert. Mitglieder koennen nicht mehr darauf zugreifen." Es fehlt der Hinweis: "Der Chat-Verlauf wird permanent geloescht."
- **Auswirkung:** User verliert unbemerkt alle Chat-Nachrichten beim Archivieren. Spec fordert explizit diesen Warnhinweis (Acceptance Criteria "Chat-Loeschung bei Archivierung").
- **Steps to Reproduce:**
  1. Als Vorstand Workgroup mit Chat-Verlauf archivieren
  2. Bestaetungs-Dialog lesen
  3. Expected: Warnung "Chat-Verlauf wird permanent geloescht"
  4. Actual: Kein Hinweis auf Chat-Loeschung
- **Priority:** High

### BUG-5: Keine Message-Queue bei Verbindungsverlust
- **Severity:** Medium
- **Datei:** `src/components/workgroups/workgroup-chat-tab.tsx`
- **Problem:** Spec fordert bei Verbindungsverlust "Nachrichten in Queue speichern" und bei Reconnect senden. Implementiert ist nur: Senden-Button wird deaktiviert (`disabled={connectionStatus === "disconnected"}`). Kein Queuing.
- **Auswirkung:** User verliert getippte Nachricht wenn Verbindung abbricht waehrend Eingabe. Kein Reconnect-Toast.
- **Priority:** Medium

### BUG-6: Keine Behandlung bei Workgroup-Archivierung waehrend Chat-Nutzung
- **Severity:** Medium
- **Problem:** Wenn Vorstand die Workgroup archiviert waehrend ein Mitglied im Chat ist, erhaelt das Mitglied keine Benachrichtigung. Senden schlaegt mit 404/403 fehl (Workgroup nicht mehr aktiv oder kein Zugang), aber kein erklaerende Toast und kein Redirect zur Workgroup-Liste.
- **Auswirkung:** User ist verwirrt, Chat-Eingabe schlaegt kommentarlos fehl.
- **Priority:** Medium

### BUG-7: Kein Handling bei Mitglied-Entfernung
- **Severity:** Medium
- **Problem:** Wenn User waehrend Chat-Nutzung aus der Workgroup entfernt wird, laeuft die Realtime-Subscription weiter (RLS verhindert zwar neue Payload-Zustellung, aber keine UI-Reaktion). POST auf `/messages` gibt 403, aber kein Toast "Du bist kein Mitglied mehr", kein Redirect.
- **Auswirkung:** Stille Fehler, verwirrende UX.
- **Priority:** Medium

---

## Sicherheitsanalyse (Red-Team-Perspektive)

### SEC-1: RLS Policy Vorstand-Check (CRITICAL -- identisch mit BUG-2)
`profiles.id = auth.uid()` ist falsch. Korrekt: `profiles.user_id = auth.uid()`.
Auswirkung: Vorstand-RLS-Schutz ist unwirksam fuer Realtime.

### SEC-2: API-Ebene vs RLS-Ebene -- Sicherheitslage
Die API-Routes (`/api/workgroups/[id]/messages/route.ts`) verwenden den Supabase Service-Client (Server-Side), der RLS umgeht. Die Zugriffslogik wird dort korrekt auf API-Ebene geprueft:
- GET: `isWorkgroupMemberOrVorstand` -- korrekt
- POST: `isWorkgroupMember` -- korrekt (Vorstand kann nicht schreiben ohne Mitgliedschaft)
Die fehlerhafte RLS Policy betrifft daher hauptsaechlich direkte Datenbankzugriffe und Realtime-Subscriptions, nicht die API-Endpunkte selbst.

### SEC-3: Rate Limiting -- korrekt implementiert
`check_workgroup_chat_rate_limit` RPC-Funktion mit 10 Messages/60 Sekunden. Fehler beim Rate-Limit-Check -> Request wird BLOCKIERT (`allowed === false`). Das ist sicherer als "fail open" (bei Fehler erlauben), aber korrekt fuer Missbrauchspraevention. Gegensatz: `checkRateLimit` in `chat-helpers.ts` (PROJ-14) macht "fail open" -- hier ist die Workgroup-Implementierung strenger.

### SEC-4: XSS-Sanitierung
`sanitizeContent` entfernt HTML-Tags mit Regex `/<[^>]*>/g`. Einfach aber funktional fuer einfache Text-Inputs. Keine serverseitige HTML-Ausgabe-Escaping (Next.js React rendert Text automatisch sicher).

### SEC-5: sender_display_name "placeholder" im INSERT
Im POST-Handler wird `sender_display_name: "placeholder"` eingefuegt, was der Trigger ueberschreibt. Das ist korrekt, aber ein Angreifer koennte theoretisch versuchen, den DB-Trigger zu umgehen (z.B. via direkten DB-Zugriff ohne Trigger). Der Trigger laeuft `BEFORE INSERT` als `SECURITY DEFINER` -- das ist korrekt und sicher.

### SEC-6: UUID-Validierung
`isValidUUID` Regex-Pruefung bei allen API-Endpunkten vorhanden. Verhindert SQL-Injection via ID-Parameter.

### SEC-7: Polling ohne Auth-Check
`pollNewMessages` in `use-workgroup-chat-messages.ts` ruft `/api/workgroups/{id}/messages?after=...` alle 3 Sekunden auf. Die API-Route prueft Authentication, also kein Problem.

---

## Regressionstest (bestehende Features)

Geprueft ob neue Dateien bestehende Features brechen:

- `src/lib/chat-types.ts` -- Neue Typen `WorkgroupChatMessage` und `WorkgroupMessagesResponse` hinzugefuegt, bestehende Typen unveraendert. KEIN Regressionsrisiko.
- `src/lib/validations/chat.ts` -- Neues `workgroupSendMessageSchema` hinzugefuegt, bestehende Schemas unveraendert. KEIN Regressionsrisiko.
- `src/components/workgroups/workgroup-detail-content.tsx` -- Chat-Tab hinzugefuegt, bestehender Board-Tab unveraendert (`forceMount` sichert Kanban-State). MINIMALES Regressionsrisiko (Tab-Rendering).
- Neue Hooks und Komponenten sind isoliert, keine Auswirkung auf PROJ-14 Gruppen-Chat.

---

## Summary

| Kategorie | Bestanden | Fehlgeschlagen | Nicht getestet |
|-----------|-----------|----------------|----------------|
| Chat-Grundstruktur | 4 | 0 | 1 (Mobile Sheet) |
| Echtzeit | 4 | 0 | 1 (Typing optional) |
| Nachrichten | 7 | 1 | 0 |
| Privacy/Anonymisierung | 4 | 1 | 0 |
| Ungelesene Nachrichten | 4 | 1 | 1 (Nav-Badge optional) |
| Chat-Loeschung | 2 | 1 | 1 (Doku) |
| Vorstand-Zugriff | 2 | 1 | 1 (Audit optional) |
| Mobile UX | 2 | 0 | 2 (Geraetetest) |

**Bugs gesamt: 7**
- 1 Critical (BUG-2: RLS Vorstand-Feld falsch)
- 2 High (BUG-1: Zeichenlimit 1000 statt 2000; BUG-4: Archivierungs-Warnung fehlt)
- 3 Medium (BUG-5, BUG-6, BUG-7: Offline-Queue, Archivierungs-/Entfernungs-Handling)
- 1 Low (BUG-3: Doppelte Read-Requests ohne Debounce)

## Recommendation

Feature ist **NICHT production-ready**.

Folgende Bugs muessen vor Deployment gefixt werden:

**Muss-Fix (Blocker):**
1. **BUG-2** -- RLS Policy `profiles.id` auf `profiles.user_id` korrigieren (1 SQL-Zeile, 2 Stellen in der Migration)
2. **BUG-1** -- `ChatInput` Zeichenlimit auf 2000 anpassen (oder separates Prop einfuehren)
3. **BUG-4** -- Archivierungs-Dialog um Chat-Loeschungs-Hinweis erweitern

**Kann nach erstem Release gefixt werden:**
4. BUG-5 -- Message-Queue bei Verbindungsverlust
5. BUG-6 -- Handling bei Workgroup-Archivierung waehrend Chat-Nutzung
6. BUG-7 -- Handling bei Mitglied-Entfernung
7. BUG-3 -- Debounce fuer Read-Status Updates
