# PROJ-14: Gruppen-Kommunikation (Group Communication / Realtime Chat)

## Status: Deployed (2026-02-01)

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-12 (Group Administration) - Gruppen mit `chat_enabled = true` müssen existieren
- Benötigt: Supabase Realtime aktiviert im Projekt

## Übersicht
Echtzeit-Chat innerhalb von Trainingsgruppen mit erhöhtem Datenschutz. Benutzernamen werden anonymisiert (Vorname + Anfangsbuchstabe des Nachnamens). Chat-Nachrichten werden nach 30 Tagen automatisch gelöscht. Die Chat-Funktion muss pro Gruppe explizit bei der Erstellung aktiviert worden sein (PROJ-12).

**Routen:**
- `/member/groups/[groupId]/chat` (Mitglied: Chat der eigenen Gruppen)
- `/trainer/groups/[groupId]/chat` (Trainer: Chat der eigenen Gruppen)

---

## User Stories

### US-1: Nachricht senden
**Als** Mitglied einer Gruppe
**möchte ich** eine Textnachricht im Gruppen-Chat senden
**um** mit meiner Trainingsgruppe zu kommunizieren.

### US-2: Nachrichten in Echtzeit empfangen
**Als** Mitglied einer Gruppe
**möchte ich** neue Nachrichten sofort sehen (ohne Seite neu zu laden)
**um** eine flüssige Chat-Erfahrung zu haben.

### US-3: Anonymisierte Anzeige
**Als** Mitglied
**möchte ich** dass Nachrichten nur mit "Vorname + Anfangsbuchstabe" angezeigt werden (z.B. "Max M.")
**um** meine Privatsphäre innerhalb der Gruppe zu wahren.

### US-4: Ungelesene Nachrichten erkennen
**Als** Mitglied
**möchte ich** sehen, ob es neue ungelesene Nachrichten in meinen Gruppen gibt
**um** keine wichtigen Informationen zu verpassen.

### US-5: Chat-Verlauf lesen
**Als** Mitglied
**möchte ich** ältere Nachrichten nach oben scrollen können
**um** verpasste Konversationen nachzulesen (bis zur 30-Tage-Grenze).

### US-6: Chat-Info sehen
**Als** Mitglied
**möchte ich** sehen wer aktuell in der Gruppe ist
**um** zu wissen, an wen ich mich wende.

---

## Acceptance Criteria

### Chat-Oberfläche

- [ ] Nachrichten werden chronologisch angezeigt (neueste unten)
- [ ] Eigene Nachrichten rechts (dunklerer Hintergrund), fremde links (hellerer Hintergrund)
- [ ] Pro Nachricht: Anzeigename (anonymisiert), Nachrichtentext, Zeitstempel
- [ ] Zeitstempel-Format: "HH:MM" für heute, "DD.MM. HH:MM" für ältere Nachrichten
- [ ] Eingabefeld am unteren Rand mit Send-Button
- [ ] Enter-Taste sendet Nachricht (Shift+Enter für Zeilenumbruch)
- [ ] Max. Nachrichtenlänge: 1000 Zeichen
- [ ] Leere Nachrichten können nicht gesendet werden
- [ ] Auto-Scroll zu neuesten Nachrichten beim Öffnen und bei neuen Nachrichten

### Anonymisierte Anzeige

- [ ] Sender-Name: "Vorname + erster Buchstabe des Nachnamens + Punkt" (z.B. "Max M.", "Anna S.")
- [ ] Anonymisierung erfolgt serverseitig (Client bekommt nur den anonymisierten Namen)
- [ ] Eigene Nachrichten zeigen "Du" statt anonymisierten Namen
- [ ] Trainer-Nachrichten haben ein kleines Badge/Icon zur Kennzeichnung

### Supabase Realtime

- [ ] Neue Nachrichten erscheinen sofort bei allen Online-Mitgliedern (< 1 Sekunde)
- [ ] Realtime-Subscription wird beim Betreten des Chats gestartet
- [ ] Realtime-Subscription wird beim Verlassen sauber beendet (Cleanup)
- [ ] Reconnect bei Verbindungsabbruch (automatisch durch Supabase Client)
- [ ] Offline-Handling: Hinweis "Verbindung unterbrochen, reconnecting..." wenn offline

### Ungelesene Nachrichten

- [ ] Badge mit Anzahl ungelesener Nachrichten pro Gruppe in der Gruppenübersicht
- [ ] Badge in der Bottom-Navigation (Mobile) wenn es ungelesene Nachrichten gibt
- [ ] "Gelesen" wird gesetzt, sobald der User den Chat öffnet (nicht pro Nachricht)
- [ ] Timestamp `last_read_at` pro User pro Gruppe wird gespeichert
- [ ] Neue Nachrichten nach `last_read_at` = ungelesen

### Chat-Verlauf & Scrolling

- [ ] Beim Öffnen: Letzte 50 Nachrichten laden
- [ ] Beim Hoch-Scrollen: Weitere 50 Nachrichten nachladen (infinite scroll)
- [ ] Visueller "Laden..."-Indikator beim Nachladen
- [ ] Nachrichten älter als 30 Tage existieren nicht (automatisch gelöscht)
- [ ] Wenn keine Nachrichten: "Noch keine Nachrichten in dieser Gruppe. Starte die Konversation!"

### Gruppenmitglieder-Info

- [ ] Button/Icon zum Öffnen der Mitgliederliste
- [ ] Zeigt alle Gruppenmitglieder mit anonymisiertem Namen
- [ ] Trainer/Co-Trainer sind als solche gekennzeichnet
- [ ] Keine Klick-Aktion auf Mitglieder (kein Direktnachricht-Feature)

### Chat nur wenn aktiviert

- [ ] Chat-UI ist nur sichtbar für Gruppen mit `chat_enabled = true`
- [ ] Gruppen ohne Chat zeigen keinen Chat-Button in der Gruppenübersicht
- [ ] Chat kann nachträglich NICHT deaktiviert werden (Designentscheidung)
- [ ] Wenn Gruppe gelöscht/archiviert wird → alle Chat-Nachrichten werden gelöscht

### DSGVO: Kein Vorstand-Leserecht

- [ ] Vorstand hat **keinen** Zugriff auf Gruppen-Chats (es sei denn, er ist selbst Mitglied/Trainer der Gruppe)
- [ ] Keine Admin-Übersicht für Chat-Inhalte
- [ ] Begründung: DSGVO-Konformität – anlassloses Mitlesen privater Gruppenkommunikation ist nicht zulässig

### Berechtigungen (RBAC)

- [ ] **Vorstand:** Kein Sonderzugriff auf Chats. Nur Zugriff als reguläres Gruppenmitglied oder Trainer
- [ ] **Trainer:** Lesen + Senden in Chats der eigenen Gruppen
- [ ] **Mitglied:** Lesen + Senden nur in Chats der eigenen Gruppen
- [ ] Nicht-Mitglieder einer Gruppe können den Chat nicht sehen (auch kein Vorstand)
- [ ] RLS-Policies auf DB-Ebene enforced

---

## Edge Cases

### E-1: Mitglied wird aus Gruppe entfernt
- Mitglied kann keine neuen Nachrichten mehr senden/lesen
- Bestehende Nachrichten des Mitglieds bleiben im Chat (bis 30-Tage-Löschung)
- Realtime-Subscription wird beim nächsten Seitenaufruf nicht mehr aufgebaut

### E-2: Mitglied tritt der Gruppe bei
- Sieht Nachrichten ab dem Zeitpunkt des Beitritts (nicht ältere)
- `last_read_at` wird auf den Beitrittszeitpunkt gesetzt
- Realtime-Subscription wird sofort aktiv

### E-3: Sehr aktiver Chat (viele Nachrichten)
- Pagination verhindert Performance-Probleme (50 Nachrichten pro Batch)
- Ältere Nachrichten werden durch 30-Tage-Cron-Job gelöscht
- Supabase Realtime Channel pro Gruppe (nicht global)

### E-4: Gleichzeitige Nachrichten
- Supabase Realtime garantiert Reihenfolge (created_at Timestamp)
- Bei gleichem Timestamp: Sortierung nach ID
- Keine "Nachricht wird getippt..." Anzeige (Phase 1)

### E-5: Nachricht mit Sonderzeichen / XSS
- Input wird sanitized (HTML-Tags escaped)
- Emojis sind erlaubt
- URLs werden als klickbare Links dargestellt (Linkify)
- Kein Markdown-Support (Phase 1, einfacher Text)

### E-6: User wechselt zwischen Mobile und Desktop
- `last_read_at` wird zentral gespeichert → Ungelesen-Zähler ist geräteübergreifend konsistent
- Realtime-Subscription funktioniert auf beiden Plattformen identisch

### E-7: Chat-Nachricht während Offline
- Nachricht wird nicht gesendet, Fehlermeldung wird angezeigt
- User muss nach Reconnect erneut senden
- Keine lokale Queue / Offline-Speicherung (Phase 1)

---

## Technische Anforderungen

### Neue DB-Tabellen

#### `group_messages`
- `id` (uuid, PK)
- `group_id` (uuid, FK → groups)
- `sender_id` (uuid, FK → profiles)
- `sender_display_name` (text) - anonymisierter Name, beim Senden berechnet
- `content` (text, max 1000 Zeichen)
- `created_at` (timestamptz, default now())

#### `group_chat_reads`
- `id` (uuid, PK)
- `group_id` (uuid, FK → groups)
- `profile_id` (uuid, FK → profiles)
- `last_read_at` (timestamptz)
- UNIQUE(group_id, profile_id)

### Supabase Realtime Konfiguration
- Realtime aktivieren für `group_messages` Tabelle
- Channel-Name: `group-chat:{group_id}`
- Event: INSERT (nur neue Nachrichten, kein Update/Delete)
- Filter: `group_id=eq.{group_id}` für effizientes Filtering

### 30-Tage Auto-Löschung (Cron-Job)
- `DELETE FROM group_messages WHERE created_at < NOW() - INTERVAL '30 days'`
- Läuft täglich um 03:00 Uhr (nach dem Attendance-Cron um 02:00)
- Index auf `created_at` für effiziente Löschung

### Anonymisierung
- SQL-Funktion: `get_display_name(profile_id)` → "Vorname + Nachname[0] + '.'"
- Wird beim INSERT in `group_messages` automatisch berechnet (DB-Trigger)
- Sicherheit: `sender_display_name` wird in der Nachricht gespeichert, nicht der echte Name
- RLS-Policy: `sender_id` ist sichtbar, aber Join auf `profiles.last_name` ist blockiert (kein Vollnamen-Zugriff im Chat-Kontext)

### Performance
- Index auf `group_messages(group_id, created_at DESC)` für schnelle Abfragen
- Pagination: LIMIT 50 OFFSET mit Cursor-basiertem Paging (created_at < last_loaded)
- Unread-Count: Effizienter Query mit `COUNT(*) WHERE group_id = X AND created_at > last_read_at`
- Kein Polling – nur Supabase Realtime Subscriptions

### Security
- RLS-Policies:
  - INSERT: Nur wenn `sender_id = auth.uid()` UND User ist Mitglied/Trainer der Gruppe
  - SELECT: Nur wenn User Mitglied/Trainer der Gruppe ist (kein Vorstand-Override)
  - UPDATE/DELETE: Nicht erlaubt (Nachrichten können nicht bearbeitet/gelöscht werden)
- Content-Sanitization: Server-seitige Validierung gegen XSS
- Rate Limiting: Max. 10 Nachrichten pro Minute pro User (Anti-Spam)

### Mobile UI (PROJ-11 Kompatibilität)
- Chat-UI ist mobile-first designed
- Eingabefeld berücksichtigt virtuelle Tastatur (safe-area-inset-bottom)
- Scroll-Verhalten: Sticky Bottom bei neuen Nachrichten
- "Neue Nachrichten" Button wenn User hoch gescrollt hat und neue Nachrichten ankommen

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

Dieses Feature baut auf PROJ-12 (Gruppenverwaltung) auf und nutzt:
- **`groups`-Tabelle** mit `chat_enabled`-Feld (wird in PROJ-12 hinzugefügt)
- **`group_members`-Tabelle** (aus PROJ-12) zur Berechtigungsprüfung
- **`group_trainers`-Tabelle** (aus PROJ-12) für Trainer-Badge im Chat
- **Supabase Realtime** (bereits im Projekt-Setup enthalten via `@supabase/supabase-js`)
- **UI-Bausteine:** Card, Badge, Sheet, ScrollArea, Skeleton, Tooltip
- **Mobile Bottom-Nav** (PROJ-11) für Unread-Badge-Integration
- **Notification-Badge** Komponente (existiert bereits im Dashboard)

### Component-Struktur

#### A) Chat-Seite (`/member/groups/[groupId]/chat` und `/trainer/groups/[groupId]/chat`)
```
Gruppen-Chat
├── Chat-Header
│   ├── Zurück-Button (← zur Gruppenübersicht)
│   ├── Gruppenname
│   ├── Mitglieder-Anzahl (z.B. "12 Mitglieder")
│   ├── Mitglieder-Info Button (öffnet Seitenleiste)
│   └── Verbindungs-Status (Online / Reconnecting...)
│
├── Nachrichten-Bereich (scrollbar)
│   ├── "Laden..."-Indikator (oben, beim Nachladen älterer Nachrichten)
│   ├── Nachrichten-Liste (chronologisch, neueste unten)
│   │   └── Pro Nachricht:
│   │       ├── Eigene Nachrichten (rechts ausgerichtet)
│   │       │   ├── "Du" als Absender
│   │       │   ├── Nachrichtentext (dunklerer Hintergrund)
│   │       │   └── Zeitstempel (HH:MM oder DD.MM. HH:MM)
│   │       └── Fremde Nachrichten (links ausgerichtet)
│   │           ├── Anzeigename (anonymisiert: "Max M.")
│   │           ├── Trainer-Badge (kleines Icon, wenn Trainer/Co-Trainer)
│   │           ├── Nachrichtentext (hellerer Hintergrund)
│   │           └── Zeitstempel
│   ├── Leerer Zustand: "Noch keine Nachrichten. Starte die Konversation!"
│   └── "Neue Nachrichten ↓" Button (wenn hochgescrollt + neue Nachrichten)
│
├── Eingabe-Bereich (sticky am unteren Rand)
│   ├── Textfeld (mehrzeilig, max. 1000 Zeichen)
│   │   ├── Enter = Senden
│   │   └── Shift+Enter = Zeilenumbruch
│   ├── Zeichenzähler (z.B. "742/1000")
│   └── Senden-Button (deaktiviert wenn leer)
│
└── Mitglieder-Seitenleiste (Sheet/Drawer)
    ├── Überschrift: "Gruppenmitglieder"
    └── Mitglieder-Liste
        └── Pro Mitglied:
            ├── Anonymisierter Name ("Max M.")
            └── Rolle-Badge (Trainer / Co-Trainer / Mitglied)
```

#### B) Unread-Badge Integration (in bestehende Komponenten)
```
Bestehende Komponenten erweitern:

Gruppen-Übersicht (PROJ-12)
└── Pro Gruppen-Karte:
    └── Chat-Button mit Unread-Badge (rote Zahl)

Bottom-Navigation (PROJ-11)
└── Gruppen-Icon mit Unread-Badge (rote Zahl, Summe aller Gruppen)

Dashboard Widgets (Trainer + Mitglied)
└── Meine-Gruppen-Widget mit Unread-Hinweis
```

### Daten-Model

#### Neue Tabelle: `group_messages` (Chat-Nachrichten)
Pro Nachricht:
- Welche Gruppe
- Wer hat gesendet (User-ID)
- Anzeigename des Senders (anonymisiert: "Max M." — wird beim Senden berechnet und gespeichert)
- Nachrichtentext (max. 1000 Zeichen)
- Zeitstempel

Warum wird der Anzeigename gespeichert?
→ Datenschutz: Der Client soll keinen Zugriff auf den vollen Namen haben. Der anonymisierte Name wird einmalig beim Senden von der Datenbank berechnet und in der Nachricht gespeichert.

#### Neue Tabelle: `group_chat_reads` (Lese-Zeitstempel)
Pro Eintrag (ein Datensatz pro User pro Gruppe):
- Welche Gruppe
- Welcher User
- Wann zuletzt gelesen (Zeitstempel)

Alle Nachrichten nach diesem Zeitstempel gelten als "ungelesen".

### Datenfluss-Übersicht

```
Mitglied öffnet Chat
    → Letzte 50 Nachrichten laden (aus group_messages)
    → Realtime-Subscription starten (auf group_messages für diese Gruppe)
    → last_read_at aktualisieren (group_chat_reads)
    → Unread-Badge auf 0 setzen

Mitglied scrollt hoch
    → Nächste 50 ältere Nachrichten nachladen (Cursor-basiert)
    → "Laden..."-Indikator anzeigen

Mitglied sendet Nachricht
    → Text an Datenbank senden
    → Datenbank-Trigger berechnet automatisch den anonymisierten Anzeigenamen
    → Nachricht wird in group_messages gespeichert
    → Supabase Realtime sendet die Nachricht an alle verbundenen Clients
    → Alle Chat-Fenster zeigen die Nachricht sofort an

Mitglied verlässt Chat
    → Realtime-Subscription wird sauber beendet (Cleanup)
    → last_read_at wird final aktualisiert

Unread-Badge Berechnung
    → Für jede Gruppe mit Chat: Zähle Nachrichten mit created_at > last_read_at
    → Zeige Summe im Badge (Bottom-Nav: Gesamtsumme, Gruppen-Karte: pro Gruppe)
```

### Echtzeit-Kommunikation: Wie funktioniert Realtime?

```
So funktioniert Supabase Realtime in diesem Feature:

1. User öffnet Chat → Client verbindet sich mit Supabase Realtime Channel
2. Channel ist spezifisch für die Gruppe (z.B. "group-chat:abc-123")
3. Sobald irgendwer eine Nachricht sendet → Datenbank INSERT
4. Supabase Realtime erkennt den INSERT → sendet an alle verbundenen Clients
5. Client empfängt die Nachricht → zeigt sie sofort im Chat an
6. User verlässt Chat → Client trennt die Verbindung

Vorteil: Kein Polling (regelmäßiges Abfragen) nötig → effizient und schnell
Verbindungsabbruch: Supabase Client reconnectet automatisch
```

### DSGVO & Datenschutz-Konzept

```
Maßnahme 1: Anonymisierte Namen
→ Im Chat erscheint nur "Vorname + Anfangsbuchstabe" (z.B. "Max M.")
→ Der vollständige Nachname ist im Chat-Kontext NICHT abrufbar
→ Berechnung erfolgt serverseitig (Datenbank-Trigger)

Maßnahme 2: 30-Tage Auto-Löschung
→ Alle Nachrichten werden nach 30 Tagen automatisch gelöscht
→ Täglicher Datenbank-Job (pg_cron, 03:00 Uhr)
→ Keine manuelle Löschung durch User möglich (Phase 1)
→ Keine Archivierung — Nachricht ist unwiderruflich weg

Maßnahme 3: Kein Vorstand-Leserecht
→ Vorstand kann Chats NICHT mitlesen (auch nicht als Admin)
→ Zugriff nur als reguläres Gruppenmitglied oder Trainer
→ Begründung: DSGVO verbietet anlassloses Mitlesen privater Kommunikation
→ Durchgesetzt via Datenbank-Sicherheitsregeln (RLS)

Maßnahme 4: Kein Bearbeiten/Löschen einzelner Nachrichten
→ Gesendete Nachrichten können nicht verändert werden
→ Verhindert Manipulation von Gesprächsverläufen
→ Automatische 30-Tage-Löschung ersetzt manuelles Löschen
```

### API-Endpunkte (neu)

```
/api/groups/[id]/messages
├── GET    → Nachrichten laden (Pagination: 50 Stück, Cursor-basiert)
├── POST   → Nachricht senden (Content wird sanitized, Anzeigename wird berechnet)

/api/groups/[id]/messages/read
├── POST   → last_read_at aktualisieren (beim Öffnen des Chats)

/api/groups/[id]/messages/unread
├── GET    → Anzahl ungelesener Nachrichten für diese Gruppe
```

Alternativ (effizienter für Unread-Badges):
```
/api/messages/unread
├── GET    → Ungelesene Nachrichten für ALLE Gruppen des Users (ein API-Call statt viele)
```

### Sicherheits-Konzept (3 Ebenen)

```
Ebene 1: Datenbank (RLS-Policies) — BESONDERS STRENG
→ group_messages INSERT: Nur wenn sender_id = eigene ID UND User ist Mitglied/Trainer der Gruppe
→ group_messages SELECT: Nur wenn User Mitglied/Trainer der Gruppe ist
→ group_messages UPDATE/DELETE: NICHT ERLAUBT (für niemanden)
→ KEIN Vorstand-Override! (bewusste DSGVO-Entscheidung)
→ group_chat_reads: Nur eigene Einträge lesen/schreiben

Ebene 2: API (Server-seitige Prüfung)
→ Gruppenmitgliedschaft prüfen vor jeder Aktion
→ Content-Sanitization: HTML-Tags escapen (XSS-Schutz)
→ Nachrichten-Länge: Max. 1000 Zeichen
→ Rate Limiting: Max. 10 Nachrichten pro Minute pro User

Ebene 3: UI (Client-seitig)
→ Chat-Button nur sichtbar wenn chat_enabled = true
→ Chat-Seite nur erreichbar wenn User Gruppenmitglied ist
→ Eingabefeld deaktiviert wenn nicht verbunden
→ Offline-Hinweis bei Verbindungsabbruch
```

### Tech-Entscheidungen

**Warum Supabase Realtime statt WebSockets selbst bauen?**
→ Supabase Realtime ist im Projekt-Setup bereits enthalten, erfordert keine zusätzliche Server-Infrastruktur, und bietet automatisches Reconnect, Channel-Management und RLS-Integration.

**Warum Anzeigename in der Nachricht speichern statt live berechnen?**
→ Datenschutz: Der Client soll keinen JOIN auf die profiles-Tabelle machen, um den vollen Nachnamen abzufragen. Durch das Speichern des anonymisierten Namens in der Nachricht selbst wird das verhindert. Zusätzlich: Wenn ein User seinen Namen ändert, bleiben alte Nachrichten konsistent.

**Warum Cursor-basiertes Paging statt OFFSET?**
→ Bei einem Chat mit vielen Nachrichten wird OFFSET-basiertes Paging langsamer, je weiter man zurückblättert. Cursor-basiert (created_at < letzter_geladener_zeitstempel) ist konstant schnell.

**Warum kein Bearbeiten/Löschen von Nachrichten?**
→ Phase-1-Entscheidung für Einfachheit. Verhindert Komplexität bei Realtime-Updates (Bearbeiten/Löschen müssten ebenfalls in Echtzeit an alle Clients propagiert werden). Die 30-Tage-Löschung macht manuelles Löschen weniger dringend.

**Warum 30-Tage-Löschung statt dauerhafter Speicherung?**
→ DSGVO-Konformität und Speicherplatz-Management. Chat-Nachrichten sind keine Vereinsdokumente und benötigen keine dauerhafte Archivierung.

**Warum Rate Limiting (10 Nachrichten/Minute)?**
→ Verhindert Spam und Missbrauch. 10 Nachrichten pro Minute ist für einen Gruppen-Chat ausreichend großzügig.

**Warum kein "Nachricht wird getippt..." Feature?**
→ Phase-1-Entscheidung. Erfordert zusätzliche Realtime-Kanäle (Presence) und erhöht die Komplexität signifikant. Kann in Phase 2 nachgerüstet werden.

### Dependencies

Keine neuen Packages nötig. Alle benötigten Bausteine existieren bereits:
- Supabase Client mit Realtime-Support (`@supabase/supabase-js`)
- shadcn/ui (ScrollArea, Sheet, Badge, Card, Tooltip)
- lucide-react (Icons: Send, Users, MessageCircle, ChevronDown)
- Supabase pg_cron (für 30-Tage Auto-Löschung, serverseitig)

### Übergreifende Architektur: Alle 3 Features zusammen

```
PROJ-12 (Grundlage)          PROJ-13 (aufbauend)         PROJ-14 (aufbauend)
Gruppenverwaltung        →   Training & Anwesenheit  →   Gruppen-Chat

groups-Tabelle           →   training_sessions        →   group_messages
group_members            →   attendance               →   group_chat_reads
group_trainers           →   training_series

/admin/groups            →   /trainer/schedule         →   /*/groups/[id]/chat
/trainer/groups          →   /trainer/attendance
/member/groups           →   /member/schedule

Reihenfolge der Implementierung:
1. PROJ-12 zuerst (Grundlage für beide anderen)
2. PROJ-13 und PROJ-14 können parallel implementiert werden
   (beide hängen nur von PROJ-12 ab, nicht voneinander)
```

### Cron-Jobs Übersicht (PROJ-13 + PROJ-14)

```
02:00 Uhr — DSGVO: Abwesenheitsgründe löschen (PROJ-13)
→ Attendance-Gründe älter als 4 Wochen → Text auf NULL setzen

03:00 Uhr — DSGVO: Chat-Nachrichten löschen (PROJ-14)
→ Nachrichten älter als 30 Tage → komplett löschen

Beide Jobs laufen via Supabase pg_cron (einmalige Einrichtung)
```

---

## QA Test Results

**Tested:** 2026-01-31
**Tested by:** QA Engineer (Code Review + DB Inspection)
**Method:** Statische Code-Analyse, Datenbank-Inspektion, RLS-Policy-Review, Security-Audit
**App URL:** http://localhost:3000

---

## Acceptance Criteria Status

### AC: Chat-Oberfläche

- [x] Nachrichten werden chronologisch angezeigt (neueste unten) — `chat-messages.tsx` sortiert korrekt, API reversed DESC zu chronologisch
- [x] Eigene Nachrichten rechts (dunklerer Hintergrund), fremde links (hellerer Hintergrund) — `chat-message-bubble.tsx:33-44` implementiert korrekt
- [x] Pro Nachricht: Anzeigename (anonymisiert), Nachrichtentext, Zeitstempel — `chat-message-bubble.tsx:47-84` alle drei Elemente vorhanden
- [x] Zeitstempel-Format: "HH:MM" für heute, "DD.MM. HH:MM" für ältere — `chat-utils.ts:10-30` implementiert korrekt
- [x] Eingabefeld am unteren Rand mit Send-Button — `chat-input.tsx` sticky am unteren Rand
- [x] Enter-Taste sendet Nachricht (Shift+Enter für Zeilenumbruch) — `chat-input.tsx:54-62` Keyboard-Handling korrekt
- [x] Max. Nachrichtenlänge: 1000 Zeichen — Validierung in `chat.ts:13` (Zod), `chat-input.tsx:22` (UI), API `route.ts:149-154` (Server)
- [x] Leere Nachrichten können nicht gesendet werden — Trim + Length-Check in `chat-input.tsx:30-31` und API `route.ts:142-146`
- [x] Auto-Scroll zu neuesten Nachrichten beim Öffnen und bei neuen Nachrichten — `chat-messages.tsx:82-104` implementiert

### AC: Anonymisierte Anzeige

- [x] Sender-Name: "Vorname + erster Buchstabe des Nachnamens + Punkt" — DB-Trigger `set_sender_display_name()` korrekt implementiert
- [x] Anonymisierung erfolgt serverseitig (Client bekommt nur den anonymisierten Namen) — BEFORE INSERT Trigger auf DB-Ebene
- [x] Eigene Nachrichten zeigen "Du" statt anonymisierten Namen — `chat-message-bubble.tsx:49-50` zeigt "Du" für `isOwn`
- [x] Trainer-Nachrichten haben ein kleines Badge/Icon zur Kennzeichnung — `chat-message-bubble.tsx:52-60` GraduationCap Badge

### AC: Supabase Realtime

- [x] Neue Nachrichten erscheinen sofort bei allen Online-Mitgliedern — `use-chat-realtime.ts` subscribt auf `postgres_changes` INSERT
- [x] Realtime-Subscription wird beim Betreten des Chats gestartet — `use-chat-realtime.ts:90-93` useEffect startet Subscription
- [x] Realtime-Subscription wird beim Verlassen sauber beendet (Cleanup) — `use-chat-realtime.ts:84-87` removeChannel im Cleanup
- [x] Reconnect bei Verbindungsabbruch (automatisch durch Supabase Client) — Supabase SDK handhabt Reconnect
- [x] Offline-Handling: Hinweis "Verbindung unterbrochen, reconnecting..." — `chat-connection-status.tsx` zeigt Status korrekt an

### AC: Ungelesene Nachrichten

- [x] Badge mit Anzahl ungelesener Nachrichten pro Gruppe in der Gruppenübersicht — Member + Trainer groups page integriert mit `useUnreadMessages` Hook
- [ ] ❌ **BUG-1:** Badge in der Bottom-Navigation (Mobile) wenn es ungelesene Nachrichten gibt — **NICHT IMPLEMENTIERT** (Bottom-Nav nicht integriert)
- [x] "Gelesen" wird gesetzt, sobald der User den Chat öffnet — `chat-page.tsx:63-72` POST auf `/messages/read` beim Öffnen
- [x] Timestamp `last_read_at` pro User pro Gruppe wird gespeichert — `group_chat_reads` Tabelle mit UNIQUE(group_id, profile_id)
- [x] Neue Nachrichten nach `last_read_at` = ungelesen — Unread-Count basiert auf `created_at > last_read_at`

### AC: Chat-Verlauf & Scrolling

- [x] Beim Öffnen: Letzte 50 Nachrichten laden — API LIMIT 50, `use-chat-messages.ts:44-70`
- [x] Beim Hoch-Scrollen: Weitere 50 Nachrichten nachladen (infinite scroll) — `chat-messages.tsx:135-142` Scroll-Detection + `loadMoreMessages`
- [x] Visueller "Laden..."-Indikator beim Nachladen — `chat-messages.tsx:156-164` Spinner beim Laden
- [x] Nachrichten älter als 30 Tage existieren nicht (automatisch gelöscht) — pg_cron Job aktiv: `0 3 * * *` DELETE WHERE created_at < NOW() - 30 days
- [x] Wenn keine Nachrichten: "Noch keine Nachrichten in dieser Gruppe. Starte die Konversation!" — `chat-messages.tsx:178-186` Empty State

### AC: Gruppenmitglieder-Info

- [x] Button/Icon zum Öffnen der Mitgliederliste — `chat-header.tsx:60-66` Users-Icon Button
- [x] Zeigt alle Gruppenmitglieder mit anonymisiertem Namen — `chat-members-sheet.tsx` mit anonymisierten Display-Names
- [x] Trainer/Co-Trainer sind als solche gekennzeichnet — `chat-members-sheet.tsx:103-110` Role-Badge
- [x] Keine Klick-Aktion auf Mitglieder (kein Direktnachricht-Feature) — Keine onClick-Handler auf Members

### AC: Chat nur wenn aktiviert

- [x] Chat-UI ist nur sichtbar für Gruppen mit `chat_enabled = true` — Server-seitige Prüfung in Page-Komponente + API
- [x] Gruppen ohne Chat zeigen keinen Chat-Button in der Gruppenübersicht — Groups-Page prüft `chat_enabled`
- [x] Chat kann nachträglich NICHT deaktiviert werden (Designentscheidung) — Kein API-Endpunkt zum Deaktivieren
- [ ] ⚠️ **BUG-2:** Wenn Gruppe gelöscht/archiviert wird → Chat-Nachrichten werden gelöscht — **KEIN CASCADE DELETE** konfiguriert auf group_messages FK

### AC: DSGVO: Kein Vorstand-Leserecht

- [x] Vorstand hat **keinen** Zugriff auf Gruppen-Chats (es sei denn, er ist selbst Mitglied/Trainer) — RLS `is_group_participant()` hat keinen Vorstand-Override
- [x] Keine Admin-Übersicht für Chat-Inhalte — Kein Admin-Endpoint für Chat-Inhalte existiert

### AC: Berechtigungen (RBAC)

- [x] Vorstand: Kein Sonderzugriff auf Chats — RLS-Funktion `is_group_participant` prüft nur Mitgliedschaft, nicht Rolle
- [x] Trainer: Lesen + Senden in Chats der eigenen Gruppen — RLS SELECT + INSERT Policies korrekt
- [x] Mitglied: Lesen + Senden nur in Chats der eigenen Gruppen — RLS SELECT + INSERT Policies korrekt
- [x] Nicht-Mitglieder können den Chat nicht sehen — `is_group_participant()` blockiert Non-Members
- [x] RLS-Policies auf DB-Ebene enforced — Beide Tabellen: `rowsecurity = true`, Policies aktiv
- [x] UPDATE/DELETE auf Nachrichten nicht erlaubt — Keine UPDATE/DELETE Policies existieren auf `group_messages`

---

## Edge Cases Status

### E-1: Mitglied wird aus Gruppe entfernt
- [x] Mitglied kann keine neuen Nachrichten mehr senden/lesen — RLS blockiert nach Entfernung aus `group_members`
- [x] Bestehende Nachrichten des Mitglieds bleiben im Chat — Kein CASCADE DELETE auf sender_id FK
- [x] Realtime-Subscription wird beim nächsten Seitenaufruf nicht mehr aufgebaut — Page-Auth blockt Zugriff

### E-2: Mitglied tritt der Gruppe bei
- [ ] ❌ **BUG-3:** Sieht Nachrichten ab dem Zeitpunkt des Beitritts (nicht ältere) — **NICHT IMPLEMENTIERT** — Neues Mitglied sieht ALLE Nachrichten der letzten 30 Tage
- [ ] ⚠️ **BUG-4:** `last_read_at` wird auf den Beitrittszeitpunkt gesetzt — **NICHT IMPLEMENTIERT** — Kein Trigger auf `group_members` INSERT, der `last_read_at` setzt

### E-3: Sehr aktiver Chat (viele Nachrichten)
- [x] Pagination verhindert Performance-Probleme (50 Nachrichten pro Batch) — Implementiert
- [x] Ältere Nachrichten werden durch 30-Tage-Cron-Job gelöscht — pg_cron aktiv
- [x] Supabase Realtime Channel pro Gruppe (nicht global) — Channel: `group-chat:{groupId}`

### E-4: Gleichzeitige Nachrichten
- [x] Supabase Realtime garantiert Reihenfolge (created_at Timestamp) — ORDER BY created_at in API
- [x] Bei gleichem Timestamp: Sortierung nach ID — Implizit durch DB
- [x] Keine "Nachricht wird getippt..." Anzeige (Phase 1) — Nicht implementiert (by design)

### E-5: Nachricht mit Sonderzeichen / XSS
- [x] Input wird sanitized (HTML-Tags escaped) — `sanitizeContent()` entfernt HTML-Tags + escaped &, <, >
- [x] Emojis sind erlaubt — Kein Emoji-Filter vorhanden
- [x] URLs werden als klickbare Links dargestellt (Linkify) — `linkify.tsx` erkennt http(s) und www
- [x] Kein Markdown-Support (Phase 1, einfacher Text) — Kein Markdown-Parser

### E-6: User wechselt zwischen Mobile und Desktop
- [x] `last_read_at` wird zentral gespeichert → Ungelesen-Zähler geräteübergreifend konsistent — DB-basiert
- [x] Realtime-Subscription funktioniert auf beiden Plattformen identisch — Supabase Client SDK

### E-7: Chat-Nachricht während Offline
- [ ] ⚠️ **BUG-5:** Nachricht wird nicht gesendet, Fehlermeldung wird angezeigt — **TEILWEISE** — Fehler wird nur als Toast angezeigt, Nachricht geht verloren ohne Hinweis
- [x] User muss nach Reconnect erneut senden — Kein Retry-Mechanismus (by design)
- [x] Keine lokale Queue / Offline-Speicherung (Phase 1) — Nicht implementiert (by design)

---

## Bugs Found

### BUG-1: Unread-Badge in Bottom-Navigation fehlt
- **Severity:** Medium
- **Location:** Bottom-Navigation Komponente (PROJ-11)
- **Steps to Reproduce:**
  1. Öffne die App auf Mobile
  2. Es gibt ungelesene Nachrichten in einer Gruppe
  3. Expected: Bottom-Nav "Gruppen"-Icon zeigt roten Unread-Badge
  4. Actual: Kein Badge in Bottom-Navigation
- **AC:** "Badge in der Bottom-Navigation (Mobile) wenn es ungelesene Nachrichten gibt"
- **Priority:** Medium (UX Issue)

### BUG-2: Kein CASCADE DELETE bei Gruppen-Löschung
- **Severity:** High
- **Location:** DB-Schema `group_messages` Foreign Key auf `groups`
- **Steps to Reproduce:**
  1. Erstelle eine Gruppe mit Chat
  2. Sende Nachrichten
  3. Lösche/archiviere die Gruppe
  4. Expected: Alle Chat-Nachrichten werden mitgelöscht
  5. Actual: Nachrichten bleiben als Waisen in der DB (FK-Error möglich)
- **AC:** "Wenn Gruppe gelöscht/archiviert wird → alle Chat-Nachrichten werden gelöscht"
- **Priority:** High (Data Integrity + DSGVO)
- **Fix:** `ALTER TABLE group_messages ADD CONSTRAINT ... ON DELETE CASCADE` oder Soft-Delete-Handling

### BUG-3: Neues Mitglied sieht alle historischen Nachrichten
- **Severity:** Medium
- **Location:** API GET `/api/groups/[id]/messages` + RLS Policy
- **Steps to Reproduce:**
  1. Gruppe hat Chat-Nachrichten der letzten 30 Tage
  2. Neues Mitglied wird der Gruppe hinzugefügt
  3. Neues Mitglied öffnet Chat
  4. Expected: Sieht nur Nachrichten ab Beitritts-Zeitpunkt
  5. Actual: Sieht ALLE Nachrichten der letzten 30 Tage
- **AC (Edge Case E-2):** "Sieht Nachrichten ab dem Zeitpunkt des Beitritts (nicht ältere)"
- **Priority:** Medium (Privacy/DSGVO)
- **Fix:** API-Filter: `WHERE created_at >= group_members.created_at` oder RLS-Policy anpassen

### BUG-4: last_read_at wird bei Gruppenbeitritt nicht gesetzt
- **Severity:** Low
- **Location:** DB-Schema — kein Trigger auf `group_members` INSERT
- **Steps to Reproduce:**
  1. Neues Mitglied wird Gruppe hinzugefügt
  2. Expected: `group_chat_reads.last_read_at` = Beitrittszeitpunkt
  3. Actual: Kein Eintrag in `group_chat_reads` → alle Nachrichten gelten als ungelesen
- **AC (Edge Case E-2):** "`last_read_at` wird auf den Beitrittszeitpunkt gesetzt"
- **Priority:** Low (UX Issue — wird beim ersten Chat-Öffnen korrigiert)
- **Fix:** Trigger auf `group_members` INSERT oder API-seitige Initialisierung

### BUG-5: Offline-Fehlerhandling unvollständig
- **Severity:** Low
- **Location:** `chat-page.tsx` handleSend
- **Steps to Reproduce:**
  1. Schreibe eine Nachricht
  2. Schalte Internet aus
  3. Sende Nachricht
  4. Expected: Klare Fehlermeldung "Nachricht konnte nicht gesendet werden"
  5. Actual: Toast-Meldung erscheint, aber eingetippte Nachricht geht verloren (Textarea wird geleert)
- **Priority:** Low (UX Issue)

---

## Security Findings (Red Team)

### SEC-1: Rate Limiting nur prozesslokal (Medium)
- **Severity:** Medium
- **Location:** `chat-helpers.ts:170-213`
- **Issue:** Rate Limit (10 msg/min) wird in-memory pro Server-Prozess gespeichert
- **Impact:** Bei Multi-Instance-Deployment (Vercel Serverless) kann Rate Limit umgangen werden
- **Recommendation:** Redis-basiertes Rate Limiting oder DB-basierter Check

### SEC-2: Cursor-Parameter nicht validiert (Low)
- **Severity:** Low
- **Location:** `groups/[id]/messages/route.ts:50-51`
- **Issue:** `before` Query-Parameter wird als ISO-Timestamp direkt an Supabase übergeben
- **Impact:** Minimal — Supabase parameterisiert Queries, aber ungültiger Wert = leere Response
- **Recommendation:** ISO-8601 Formatvalidierung hinzufügen

### SEC-3: DB-Fehlermeldungen an Client weitergegeben (Low)
- **Severity:** Low
- **Location:** `route.ts:70, 170`
- **Issue:** `error.message` aus Supabase wird direkt im JSON-Response zurückgegeben
- **Impact:** Könnte Schema-Informationen leaken
- **Recommendation:** Generische Fehlermeldung an Client, Details nur server-seitig loggen

### SEC-4: Keine UPDATE/DELETE Policies — korrekt ✅
- **Status:** PASS
- **Verification:** Keine UPDATE/DELETE RLS-Policies auf `group_messages` — Nachrichten können nicht bearbeitet/gelöscht werden

### SEC-5: DSGVO-Konformität — korrekt ✅
- **Status:** PASS
- **Verification:** `is_group_participant()` Funktion hat keinen `role = 'vorstand'` Check — Vorstand hat definitiv keinen Sonderzugriff

### SEC-6: XSS-Schutz — korrekt ✅
- **Status:** PASS
- **Verification:** `sanitizeContent()` entfernt HTML-Tags und escaped Sonderzeichen. React rendert Text sicher. `linkify.tsx` nutzt `rel="noopener noreferrer"`.

### SEC-7: SQL Injection — korrekt ✅
- **Status:** PASS
- **Verification:** Alle Queries nutzen Supabase SDK mit parameterisierten Werten

---

## Performance Findings

### PERF-1: N+1 Query-Problem bei Unread-Count (High)
- **Location:** `api/messages/unread/route.ts:99-122`
- **Issue:** Eine COUNT-Query pro Gruppe in einer Schleife
- **Impact:** User in 50 Gruppen = 50 sequentielle DB-Queries pro Unread-Refresh (alle 30s)
- **Recommendation:** Aggregate Query mit `GROUP BY group_id` in einem einzigen Statement

### PERF-2: Mark-as-Read Intervall alle 10 Sekunden (Low)
- **Location:** `chat-page.tsx:78`
- **Issue:** `setInterval(markAsRead, 10000)` sendet alle 10s einen API-Call während Chat offen ist
- **Impact:** Unnötige Last, da `last_read_at` sich nur beim ersten Öffnen ändert
- **Recommendation:** Nur beim Öffnen und Verlassen des Chats markieren, nicht im Intervall

---

## Datenbank-Verifizierung

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| `group_messages` Tabelle existiert | ✅ | Korrekte Spalten (id, group_id, sender_id, sender_display_name, content, created_at) |
| `group_chat_reads` Tabelle existiert | ✅ | Korrekte Spalten (id, group_id, profile_id, last_read_at) |
| Content Check-Constraint | ✅ | `char_length(content) >= 1 AND char_length(content) <= 1000` |
| UNIQUE Constraint auf reads | ✅ | `group_chat_reads_unique (group_id, profile_id)` |
| RLS aktiviert | ✅ | Beide Tabellen: `rowsecurity = true` |
| RLS SELECT Policy (messages) | ✅ | `is_group_participant(group_id)` — kein Vorstand-Override |
| RLS INSERT Policy (messages) | ✅ | `sender_id = auth.uid() AND is_group_participant AND chat_enabled = true` |
| RLS UPDATE/DELETE (messages) | ✅ | Keine Policies = nicht erlaubt |
| RLS Policies (chat_reads) | ✅ | Nur eigene Einträge (SELECT, INSERT, UPDATE) |
| DB-Trigger Anonymisierung | ✅ | `trg_set_sender_display_name` BEFORE INSERT, korrekte Logik |
| Cron-Job 30-Tage-Löschung | ✅ | `0 3 * * *` — DELETE WHERE created_at < 30 days, aktiv |
| Performance-Index (Pagination) | ✅ | `idx_group_messages_group_created (group_id, created_at DESC)` |
| Performance-Index (Cron) | ✅ | `idx_group_messages_created_at` |
| Realtime aktiviert | ✅ | `group_messages` in `supabase_realtime` Publication |
| `is_group_participant()` Funktion | ✅ | Prüft member + trainer + co-trainer, kein Vorstand-Override |

---

## Regression-Check (bestehende Features)

| Feature | Status | Hinweis |
|---------|--------|---------|
| PROJ-12 Gruppenverwaltung | ✅ | groups/page.tsx erweitert (Unread-Badge), Grundfunktionalität intakt |
| PROJ-13 Training & Anwesenheit | ✅ | Keine Änderungen an Training-Code |
| PROJ-11 Mobile Bottom-Nav | ⚠️ | Bottom-Nav nicht um Unread-Badge erweitert (BUG-1) |
| PROJ-1 Authentication | ✅ | Auth-Flow unverändert |

---

## Summary

- ✅ **33 Acceptance Criteria passed**
- ❌ **5 Bugs found** (0 Critical, 1 High, 2 Medium, 2 Low)
- ⚠️ **3 Security Findings** (0 Critical, 1 Medium, 2 Low)
- ⚠️ **2 Performance Findings** (1 High, 1 Low)
- ⚠️ Feature ist **BEDINGT production-ready** — BUG-2 (CASCADE DELETE) muss gefixt werden

## Recommendation

**Vor Deployment fixen:**
1. **BUG-2** (High): CASCADE DELETE für `group_messages` bei Gruppen-Löschung — Data Integrity + DSGVO
2. **PERF-1** (High): N+1 Query bei Unread-Count — Performance-Problem bei vielen Gruppen

**Sollte zeitnah gefixt werden:**
3. **BUG-1** (Medium): Bottom-Nav Unread-Badge integrieren
4. **BUG-3** (Medium): Neues Mitglied sieht historische Nachrichten — DSGVO-relevant
5. **SEC-1** (Medium): Rate Limiting für Production-Deployment härten

**Nice-to-have (später):**
6. BUG-4: last_read_at bei Gruppenbeitritt setzen
7. BUG-5: Offline-Fehlerhandling verbessern
8. SEC-2/SEC-3: Cursor-Validierung, generische Fehlermeldungen
9. PERF-2: Mark-as-Read Intervall optimieren
