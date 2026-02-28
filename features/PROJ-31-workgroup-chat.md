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
