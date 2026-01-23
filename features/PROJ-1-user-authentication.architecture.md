# PROJ-1: User Authentication - Architektur-Design

## Status: Ready for Review

---

## 1. Architektur-Uebersicht

### System-Kontext

```
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|  Browser/App     |<--->|  Next.js Server   |<--->|    Supabase      |
|  (React UI)      |     |  (API Routes)     |     |  (Auth + DB)     |
|                  |     |                   |     |                  |
+------------------+     +-------------------+     +------------------+
                                                          |
                                                          v
                                                   +------------------+
                                                   |                  |
                                                   |  Email Service   |
                                                   |  (Supabase SMTP) |
                                                   |                  |
                                                   +------------------+
```

### Kernprinzip: Invite-Only

Das System erlaubt **keine oeffentliche Registrierung**. Nur Admins (Vorstand) koennen neue User einladen:

```
Admin legt User an --> Einladungs-Email --> User klickt Link --> Registrierung
```

---

## 2. Datenbank-Schema

### Uebersicht der Tabellen

```
+-------------------+       +-------------------+       +-------------------+
|   auth.users      |       |     profiles      |       |   invitations     |
|   (Supabase)      |       |   (Custom)        |       |   (Custom)        |
+-------------------+       +-------------------+       +-------------------+
| id (UUID)         |<----->| id (UUID)         |       | id (UUID)         |
| email             |       | user_id (FK)      |       | email             |
| encrypted_pass    |       | first_name        |       | first_name        |
| created_at        |       | last_name         |       | last_name         |
| ...               |       | date_of_birth     |       | role              |
+-------------------+       | phone             |       | token (unique)    |
                            | role              |       | expires_at        |
                            | is_active         |       | invited_by (FK)   |
                            | created_at        |       | used_at           |
                            +-------------------+       | created_at        |
                                                        +-------------------+

+-------------------+
|  login_attempts   |
|   (Custom)        |
+-------------------+
| id (UUID)         |
| email             |
| ip_address        |
| attempted_at      |
| success           |
+-------------------+
```

### Tabellen-Beschreibungen

#### `profiles` (Erweiterte User-Daten)
Speichert zusaetzliche Informationen, die Supabase Auth nicht abdeckt:

| Feld | Beschreibung |
|------|--------------|
| user_id | Verknuepfung zu Supabase Auth User |
| first_name | Vorname des Mitglieds |
| last_name | Nachname des Mitglieds |
| date_of_birth | Geburtsdatum (Pflichtfeld bei Registrierung) |
| phone | Telefonnummer (optional) |
| role | Berechtigung: "vorstand", "trainer", "mitglied" |
| is_active | Kann vom Admin deaktiviert werden |
| created_at | Zeitstempel der Registrierung |

#### `invitations` (Einladungs-Management)
Verwaltet ausstehende und verwendete Einladungen:

| Feld | Beschreibung |
|------|--------------|
| email | Email-Adresse des eingeladenen Users |
| first_name | Vom Admin vorausgefuellter Vorname |
| last_name | Vom Admin vorausgefuellter Nachname |
| role | Zugewiesene Rolle bei Registrierung |
| token | Eindeutiger Einladungs-Code (URL-safe) |
| expires_at | Ablaufzeitpunkt (7 Tage nach Erstellung) |
| invited_by | Welcher Admin hat eingeladen |
| used_at | Wann wurde die Einladung eingeloest (null = noch offen) |

#### `login_attempts` (Sicherheits-Tracking)
Protokolliert Login-Versuche fuer CAPTCHA-Logik:

| Feld | Beschreibung |
|------|--------------|
| email | Versuchte Email-Adresse |
| ip_address | IP des anfragenden Clients |
| attempted_at | Zeitstempel des Versuchs |
| success | War der Login erfolgreich? |

---

## 3. Supabase Auth Integration

### Wie Einladungen mit Supabase Auth zusammenarbeiten

```
Schritt 1: Admin erstellt Einladung
+------------------------------------------+
| Admin-Formular                           |
| - Email eingeben                         |
| - Name eingeben                          |
| - Rolle auswaehlen                       |
| --> Einladung wird in DB gespeichert     |
| --> Email mit Link wird versendet        |
+------------------------------------------+
            |
            v
Schritt 2: User klickt Einladungslink
+------------------------------------------+
| /invite/accept/[token]                   |
| - Token wird validiert                   |
| - Vorausgefuellte Daten werden geladen   |
+------------------------------------------+
            |
            v
Schritt 3: User fuellt Registrierung aus
+------------------------------------------+
| Registrierungs-Formular                  |
| - Email (vorausgefuellt, readonly)       |
| - Name (vorausgefuellt, readonly)        |
| - Passwort setzen                        |
| - Geburtsdatum eingeben                  |
| - Telefon (optional)                     |
+------------------------------------------+
            |
            v
Schritt 4: Account wird erstellt
+------------------------------------------+
| Server-Aktion:                           |
| 1. Supabase Auth User erstellen          |
| 2. Profile in profiles-Tabelle anlegen   |
| 3. Einladung als "verwendet" markieren   |
| 4. Automatischer Login                   |
| --> Weiterleitung zum Dashboard          |
+------------------------------------------+
```

### Wichtig: Kein Email-Verification bei Einladungen

Da User nur ueber Admin-Einladungen registriert werden, ist die Email bereits durch den Admin verifiziert. Wir nutzen **nicht** den Standard-Supabase-Signup-Flow, sondern erstellen User direkt ueber die Admin-API.

---

## 4. API-Routen und Server Actions

### Uebersicht der benoetigten Endpunkte

```
API-Struktur
|
+-- /api/auth/
|   +-- login              POST   Login mit Email + Passwort
|   +-- logout             POST   Session beenden
|   +-- check-captcha      GET    Prueft ob CAPTCHA noetig ist
|
+-- /api/invitations/
|   +-- create             POST   Neue Einladung erstellen (Admin)
|   +-- list               GET    Alle Einladungen abrufen (Admin)
|   +-- revoke/[id]        DELETE Einladung widerrufen (Admin)
|   +-- validate/[token]   GET    Token validieren (Public)
|   +-- accept/[token]     POST   Registrierung abschliessen (Public)
|
+-- /api/password-reset/
    +-- request            POST   Reset-Email anfordern
    +-- validate/[token]   GET    Token pruefen
    +-- confirm            POST   Neues Passwort setzen
```

### Server Actions (Next.js 16 App Router)

| Action | Zweck | Berechtigung |
|--------|-------|--------------|
| `loginUser` | Validiert Credentials, erstellt Session | Public |
| `logoutUser` | Beendet aktuelle Session | Authenticated |
| `createInvitation` | Erstellt Einladung + sendet Email | Vorstand only |
| `revokeInvitation` | Setzt Einladung auf ungueltig | Vorstand only |
| `acceptInvitation` | Erstellt User-Account via Einladung | Public (mit Token) |
| `requestPasswordReset` | Sendet Reset-Email | Public |
| `confirmPasswordReset` | Setzt neues Passwort | Public (mit Token) |

---

## 5. Security-Massnahmen

### Row Level Security (RLS) Policies

```
Tabelle: profiles
+--------------------------------------------------+
| SELECT: User kann nur eigenes Profil lesen       |
|         ODER User hat Rolle "vorstand"           |
+--------------------------------------------------+
| UPDATE: User kann nur eigenes Profil bearbeiten  |
+--------------------------------------------------+
| INSERT: Nur via Server (Service Role)            |
+--------------------------------------------------+
| DELETE: Nicht erlaubt (Deaktivierung statt       |
|         Loeschung)                               |
+--------------------------------------------------+

Tabelle: invitations
+--------------------------------------------------+
| SELECT: Nur Vorstand kann alle sehen             |
+--------------------------------------------------+
| INSERT: Nur Vorstand                             |
+--------------------------------------------------+
| UPDATE: Nur Vorstand (fuer Widerruf)             |
+--------------------------------------------------+
| DELETE: Nicht erlaubt                            |
+--------------------------------------------------+

Tabelle: login_attempts
+--------------------------------------------------+
| Alle Operationen: Nur via Server (Service Role)  |
| Kein direkter Client-Zugriff                     |
+--------------------------------------------------+
```

### Rate Limiting Strategie

```
Endpunkt                    | Limit              | Fenster
----------------------------|--------------------|---------
Login                       | 10 Versuche        | 15 Min
Password Reset Request      | 3 Anfragen         | 1 Stunde
Invitation Create           | 20 Einladungen     | 1 Stunde
Token Validation            | 30 Anfragen        | 15 Min
```

**Implementierung:** Rate Limiting wird auf API-Route-Ebene mit IP-basiertem Tracking umgesetzt. Hierfuer wird ein einfacher In-Memory-Store oder Supabase-basiertes Tracking verwendet.

### CAPTCHA Integration

**Empfehlung:** Cloudflare Turnstile (kostenlos, DSGVO-konform)

```
CAPTCHA-Flow nach 3 fehlgeschlagenen Logins:

1. User versucht Login (Fehlschlag #1, #2, #3)
                    |
                    v
2. Server prueft login_attempts fuer Email/IP
   - Mehr als 3 Fehlversuche in letzten 15 Min?
                    |
          +--------+--------+
          |                 |
         Ja                Nein
          |                 |
          v                 v
3. CAPTCHA Token      Normaler Login
   erforderlich       erlaubt
          |
          v
4. Frontend zeigt Turnstile Widget
          |
          v
5. User loest CAPTCHA
          |
          v
6. Token wird mit Login-Request gesendet
          |
          v
7. Server validiert Token bei Cloudflare
```

### Passwort-Anforderungen

- Mindestens 8 Zeichen
- Mindestens 1 Buchstabe
- Mindestens 1 Zahl
- Validierung erfolgt Client-seitig UND Server-seitig

---

## 6. Email-Versand Strategie

### Email-Typen

| Email-Typ | Absender | Template |
|-----------|----------|----------|
| Einladung | Supabase SMTP | Custom HTML |
| Passwort-Reset | Supabase Auth | Custom HTML |
| Passwort geaendert | Supabase Auth | Standard |

### Einladungs-Email Inhalt

```
Betreff: Einladung zum Vereins-Management System

Inhalt:
- Begruessung mit Vorname
- Erklaerung: "Sie wurden eingeladen, dem Verein beizutreten"
- Link zur Registrierung
- Hinweis: Link ist 7 Tage gueltig
- Kontakt bei Fragen
```

### Passwort-Reset-Email Inhalt

```
Betreff: Passwort zuruecksetzen

Inhalt:
- Kurze Erklaerung
- Link zum Zuruecksetzen
- Hinweis: Link ist 1 Stunde gueltig
- Sicherheitshinweis: "Falls Sie das nicht angefordert haben..."
```

### Email-Versand-Architektur

```
Option A: Supabase Built-in (Empfohlen fuer MVP)
+------------------------------------------+
| - Nutzt Supabase Email Templates         |
| - Kostenlos bis 30 Emails/Stunde         |
| - Einfache Konfiguration im Dashboard    |
+------------------------------------------+

Option B: Custom SMTP (Fuer Produktion)
+------------------------------------------+
| - Eigener SMTP Server (z.B. Sendgrid)    |
| - Hoehere Limits                         |
| - Bessere Zustellbarkeit                 |
| - Mehr Kontrolle ueber Templates         |
+------------------------------------------+
```

**Empfehlung fuer MVP:** Supabase Built-in nutzen, spaeter auf Custom SMTP upgraden.

---

## 7. Komponenten-Architektur

### Seiten-Struktur

```
src/app/
|
+-- (auth)/                        # Auth-Layout (ohne Sidebar)
|   +-- login/
|   |   +-- page.tsx               # Login-Seite
|   |
|   +-- invite/
|   |   +-- accept/
|   |       +-- [token]/
|   |           +-- page.tsx       # Registrierung via Einladung
|   |
|   +-- reset-password/
|       +-- page.tsx               # Reset anfordern
|       +-- [token]/
|           +-- page.tsx           # Neues Passwort setzen
|
+-- (dashboard)/                   # Dashboard-Layout (mit Sidebar)
    +-- admin/
        +-- users/
            +-- invite/
            |   +-- page.tsx       # User einladen (Admin)
            |
            +-- invitations/
                +-- page.tsx       # Einladungs-Liste (Admin)
```

### Component Tree

```
Login-Seite
+-- Card
    +-- CardHeader
    |   +-- Logo
    |   +-- Titel "Anmelden"
    |
    +-- CardContent
    |   +-- LoginForm
    |       +-- Input (Email)
    |       +-- Input (Passwort)
    |       +-- TurnstileWidget (conditional)
    |       +-- Button "Anmelden"
    |       +-- Link "Passwort vergessen?"
    |
    +-- Alert (Fehlermeldungen)

Registrierung via Einladung
+-- Card
    +-- CardHeader
    |   +-- Titel "Willkommen"
    |   +-- Erklaerungstext
    |
    +-- CardContent
    |   +-- RegistrationForm
    |       +-- Input (Email, readonly)
    |       +-- Input (Vorname, readonly)
    |       +-- Input (Nachname, readonly)
    |       +-- Input (Passwort)
    |       +-- Input (Passwort bestaetigen)
    |       +-- Input (Geburtsdatum, DatePicker)
    |       +-- Input (Telefon, optional)
    |       +-- Button "Registrieren"
    |
    +-- Alert (Fehlermeldungen)

Admin: User einladen
+-- Card
    +-- CardHeader
    |   +-- Titel "Neues Mitglied einladen"
    |
    +-- CardContent
    |   +-- InviteForm
    |       +-- Input (Email)
    |       +-- Input (Vorname)
    |       +-- Input (Nachname)
    |       +-- Select (Rolle: Vorstand/Trainer/Mitglied)
    |       +-- Button "Einladung senden"
    |
    +-- Toast (Erfolgsmeldung)

Admin: Einladungs-Liste
+-- Card
    +-- CardHeader
    |   +-- Titel "Ausstehende Einladungen"
    |   +-- Badge (Anzahl)
    |
    +-- CardContent
        +-- Table
            +-- TableHeader
            |   +-- Name | Email | Rolle | Erstellt | Status | Aktionen
            |
            +-- TableBody
                +-- TableRow (pro Einladung)
                    +-- Zellen mit Daten
                    +-- DropdownMenu
                        +-- "Erneut senden"
                        +-- "Widerrufen"
```

### Wiederverwendbare Komponenten

| Komponente | Zweck | shadcn/ui Basis |
|------------|-------|-----------------|
| AuthCard | Container fuer Auth-Formulare | Card |
| PasswordInput | Passwort mit Show/Hide Toggle | Input |
| FormField | Label + Input + Error Message | Form, Input, Label |
| RoleSelect | Rollen-Auswahl Dropdown | Select |
| InvitationTable | Tabelle mit Einladungen | Table |
| CaptchaWidget | Turnstile Integration | Custom |

---

## 8. Tech-Entscheidungen

### Warum Supabase Auth statt Custom Auth?

| Aspekt | Supabase Auth | Custom Auth |
|--------|---------------|-------------|
| Sicherheit | Bewaehrt, regelmaessige Updates | Eigene Verantwortung |
| Session-Management | Eingebaut (JWT + Refresh) | Selbst implementieren |
| Passwort-Hashing | bcrypt, automatisch | Selbst implementieren |
| CSRF-Schutz | Eingebaut | Selbst implementieren |
| Entwicklungszeit | Gering | Hoch |

**Entscheidung:** Supabase Auth nutzen, nur Einladungs-Flow custom bauen.

### Warum Cloudflare Turnstile statt reCAPTCHA?

| Aspekt | Turnstile | reCAPTCHA |
|--------|-----------|-----------|
| DSGVO | Konform | Problematisch |
| Kosten | Kostenlos | Kostenlos (mit Limits) |
| UX | Meist unsichtbar | Oft "Klick alle Bilder" |
| Abhaengigkeit | Cloudflare | Google |

**Entscheidung:** Turnstile fuer bessere UX und DSGVO-Konformitaet.

### Warum eigene Invitations-Tabelle statt Supabase Invite?

Supabase bietet `inviteUserByEmail()`, aber:
- Keine Kontrolle ueber Ablaufzeit (fest 7 Tage)
- Keine Moeglichkeit, Einladungen zu listen/widerrufen
- Kein Pre-Filling von User-Daten (Name, Rolle)

**Entscheidung:** Custom Invitation System fuer volle Kontrolle.

---

## 9. Dependencies

### Neue Packages (zu installieren)

| Package | Zweck |
|---------|-------|
| @turnstile/react | CAPTCHA-Widget fuer React |
| date-fns | Datums-Formatierung und Validierung |
| zod | Schema-Validierung fuer Formulare |
| nanoid | Sichere Token-Generierung |

### Bereits vorhanden

| Package | Zweck |
|---------|-------|
| @supabase/supabase-js | Supabase Client |
| react-hook-form | Formular-Handling (via shadcn/ui Form) |
| sonner | Toast-Benachrichtigungen |

---

## 10. Migration Plan

### Phase 1: Datenbank (Backend Developer)
1. `profiles` Tabelle erstellen mit RLS
2. `invitations` Tabelle erstellen mit RLS
3. `login_attempts` Tabelle erstellen
4. Supabase Auth Konfiguration pruefen

### Phase 2: API Routes (Backend Developer)
1. Login/Logout Server Actions
2. Invitation CRUD Server Actions
3. Password Reset Server Actions
4. Rate Limiting Middleware

### Phase 3: UI (Frontend Developer)
1. Login-Seite
2. Registrierungs-Seite (Invitation Accept)
3. Passwort-Reset Seiten
4. Admin: Einladung erstellen
5. Admin: Einladungs-Liste

### Phase 4: Integration
1. CAPTCHA Integration
2. Email Templates konfigurieren
3. End-to-End Testing

---

## 11. Offene Punkte / Klaerungsbedarf

Keine offenen Punkte - alle Requirements aus der Feature Spec sind abgedeckt.

---

## 12. Naechste Schritte

Nach Approval dieses Designs:

1. **Backend Developer** startet mit Datenbank-Migrations
2. **Frontend Developer** startet mit UI-Komponenten

```
Aufruf fuer Frontend Developer:
"Lies .claude/agents/frontend-dev.md und implementiere /features/PROJ-1-user-authentication.md"

Aufruf fuer Backend Developer:
"Lies .claude/agents/backend-dev.md und implementiere /features/PROJ-1-user-authentication.md"
```

---

*Erstellt am: 2026-01-23*
*Solution Architect: Claude (AI)*
