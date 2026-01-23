# Issues: PROJ-1 User Authentication

**Erstellt:** 2026-01-23
**Status:** In Bearbeitung
**Gefunden während:** Manueller QA-Test auf Production

---

## ISSUE-1: Kein Admin-User in Datenbank (Seeding fehlt)

### Details

| Feld | Wert |
|------|------|
| **ID** | ISSUE-1 |
| **Titel** | Kein Admin-User vorhanden - System nicht nutzbar |
| **Severity** | CRITICAL |
| **Priority** | P0 - Blocker |
| **Type** | Bug / Missing Feature |
| **Komponente** | Database / Setup |
| **Assignee** | Backend Developer / DevOps |
| **Status** | :white_check_mark: GELÖST (2026-01-23) |

### Beschreibung

Das Invite-Only System benötigt mindestens einen User mit Rolle "vorstand" (Admin) um funktionieren zu können. Aktuell existiert kein User in der Datenbank:

```
auth.users: 0 Rows
public.profiles: 0 Rows
```

### Auswirkung

- **Komplett-Blocker:** Niemand kann sich einloggen
- **Komplett-Blocker:** Keine Einladungen können versendet werden
- **Komplett-Blocker:** System ist nicht nutzbar

### Reproduktion

1. Prüfe Supabase Dashboard → Authentication → Users
2. Tabelle ist leer

### Vorgeschlagene Lösung

**Option A: Seed-Script (empfohlen)**

```typescript
// scripts/seed-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedAdmin() {
  // 1. User in auth.users erstellen
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@vereinsname.de',
    password: 'SICHERES_PASSWORT_HIER', // Ändern!
    email_confirm: true
  })

  if (authError) throw authError

  // 2. Profile in public.profiles erstellen
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: authUser.user.id,
      first_name: 'Admin',
      last_name: 'Vorstand',
      date_of_birth: '1990-01-01',
      role: 'vorstand',
      is_active: true
    })

  if (profileError) throw profileError

  console.log('Admin-User erstellt:', authUser.user.email)
}

seedAdmin()
```

**Option B: Manuell via Supabase Dashboard**

1. Supabase Dashboard öffnen
2. Authentication → Users → "Add user"
3. Email + Passwort setzen
4. In SQL Editor ausführen:
```sql
INSERT INTO public.profiles (user_id, first_name, last_name, date_of_birth, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'Admin',
  'Vorstand',
  '1990-01-01',
  'vorstand',
  true
);
```

### Acceptance Criteria für Fix

- [x] Mindestens 1 User mit Rolle "vorstand" existiert
- [ ] User kann sich erfolgreich einloggen (blockiert durch ISSUE-2)
- [ ] User kann Einladungen versenden
- [ ] Dokumentation für "Ersten Admin erstellen" vorhanden

### Lösung (2026-01-23)

Admin-User wurde direkt via SQL in Supabase erstellt:

```sql
-- User erstellt in auth.users + auth.identities + public.profiles
Email: dustin.wulf@web.de
User-ID: c6a780d6-7c6c-426f-8e63-a01717a5d85c
Rolle: vorstand
Status: Aktiv, Email bestätigt
```

---

## ISSUE-2: 500 Internal Server Error beim Login auf Vercel

### Details

| Feld | Wert |
|------|------|
| **ID** | ISSUE-2 |
| **Titel** | Login wirft 500 Error auf Production |
| **Severity** | CRITICAL |
| **Priority** | P0 - Blocker |
| **Type** | Bug / Configuration |
| **Komponente** | Deployment / Server Action |
| **Assignee** | DevOps Engineer |
| **Status** | OFFEN |

### Beschreibung

Beim Login-Versuch auf https://vereins-management.vercel.app/login tritt ein 500 Internal Server Error auf. Der Fehler kommt von der Server Action, bevor überhaupt ein Request an Supabase gesendet wird.

### Error Log (Browser Console)

```
POST https://vereins-management.vercel.app/login 500 (Internal Server Error)

Uncaught (in promise) Error: An error occurred in the Server Components render.
The specific message is omitted in production builds to avoid leaking sensitive details.
A digest property is included on this error instance which may provide additional details.
```

### Auswirkung

- **Komplett-Blocker:** Login funktioniert nicht auf Production
- **Komplett-Blocker:** App ist nicht nutzbar

### Reproduktion

1. Öffne https://vereins-management.vercel.app/login
2. Gib beliebige Email/Passwort ein
3. Klicke "Anmelden"
4. Browser Console zeigt 500 Error

### Vermutete Ursache

**Wahrscheinlichste Ursache: Fehlende Environment Variables auf Vercel**

Erforderliche Variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pktiznslnkgctbuaugqw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudflare Turnstile (CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

### Diagnose-Schritte

1. **Vercel Dashboard prüfen:**
   - Settings → Environment Variables
   - Alle 5 Variables vorhanden?

2. **Vercel Function Logs prüfen:**
   - Deployments → Neuestes Deployment → Functions Tab
   - Detaillierte Fehlermeldung sichtbar

3. **Supabase Project URL prüfen:**
   - Ist `pktiznslnkgctbuaugqw` die richtige Project ID?

### Vorgeschlagene Lösung

1. Gehe zu Vercel Dashboard → Settings → Environment Variables
2. Füge alle fehlenden Variables hinzu
3. Redeploy triggern (Vercel → Deployments → Redeploy)

### Acceptance Criteria für Fix

- [ ] Login-Request gibt keinen 500 Error mehr
- [ ] Server Action erreicht Supabase (sichtbar in Auth-Logs)
- [ ] Bei falschen Credentials: Generische Fehlermeldung (nicht 500)
- [ ] Bei korrekten Credentials: Login erfolgreich

---

## Zusammenfassung

| Issue | Severity | Status | Blocker für |
|-------|----------|--------|-------------|
| ISSUE-1 | CRITICAL | :white_check_mark: GELÖST | ~~Jegliche Nutzung~~ |
| ISSUE-2 | CRITICAL | OFFEN | Login auf Production |

**Nächster Schritt:**
1. ISSUE-2 fixen (Environment Variables auf Vercel prüfen)
2. Login testen mit `dustin.wulf@web.de`
3. Kompletten QA-Test durchführen

---

## ISSUE-3: Einladungs-Emails werden nicht zugestellt

### Details

| Feld | Wert |
|------|------|
| **ID** | ISSUE-3 |
| **Titel** | Einladungs-Emails kommen nicht beim User an |
| **Severity** | CRITICAL |
| **Priority** | P0 - Blocker |
| **Type** | Bug / Configuration |
| **Komponente** | Email / Supabase Auth |
| **Assignee** | DevOps Engineer |
| **Status** | OFFEN |

### Beschreibung

Beim Versenden von Einladungen an neue User wird die Einladung zwar generiert, aber die Email kommt nicht beim Empfänger an.

### Auswirkung

- **Komplett-Blocker:** Keine neuen User können eingeladen werden
- **Komplett-Blocker:** Invite-Only System funktioniert nicht
- **Funktionsverlust:** Admin-Hauptfunktion nicht nutzbar

### Reproduktion

1. Als Admin einloggen (dustin.wulf@web.de)
2. Navigiere zu Admin → User einladen
3. Neuen User mit Email-Adresse einladen
4. Einladung wird erstellt (Success-Meldung)
5. Empfänger erhält **KEINE** Email

### Vermutete Ursache

**Wahrscheinlichste Ursache: Supabase Email-Konfiguration**

1. **Supabase Built-in Mailer:**
   - Supabase hat einen eingebauten Email-Service mit starken Rate-Limits
   - Max. 2-4 Emails pro Stunde auf Free-Tier
   - Emails können geblockt/als Spam markiert werden

2. **Kein Custom SMTP konfiguriert:**
   - Für Production sollte ein eigener SMTP-Server verwendet werden
   - Empfohlen: Resend, SendGrid, AWS SES, oder Postmark

3. **Spam-Filter:**
   - Emails könnten im Spam-Ordner landen

### Diagnose-Schritte

1. **Supabase Dashboard prüfen:**
   - Project Settings → Authentication → SMTP Settings
   - Ist Custom SMTP aktiviert?

2. **Spam-Ordner prüfen:**
   - Empfänger soll Spam-Ordner checken

3. **Supabase Auth Logs prüfen:**
   - Gibt es Fehler beim Email-Versand?

### Vorgeschlagene Lösung

**Option A: Custom SMTP einrichten (empfohlen)**

1. Resend Account erstellen (kostenlos für Entwicklung)
2. Domain verifizieren
3. In Supabase Dashboard → Authentication → SMTP Settings:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 465
   SMTP User: resend
   SMTP Password: re_xxxxx (API Key)
   Sender Email: noreply@vereinsname.de
   ```

**Option B: Supabase Built-in Mailer prüfen**

1. Supabase Dashboard → Authentication → Email Templates
2. Prüfen ob Templates konfiguriert sind
3. Test-Email senden

### Acceptance Criteria für Fix

- [ ] Einladungs-Email wird erfolgreich versendet
- [ ] Email kommt beim Empfänger an (Inbox, nicht Spam)
- [ ] Email enthält korrekten Einladungslink
- [ ] Link führt zur Registrierungsseite

---

## ISSUE-4: Passwort-Reset-Emails werden nicht zugestellt

### Details

| Feld | Wert |
|------|------|
| **ID** | ISSUE-4 |
| **Titel** | Passwort-Reset-Emails kommen nicht an |
| **Severity** | HIGH |
| **Priority** | P1 |
| **Type** | Bug / Configuration |
| **Komponente** | Email / Supabase Auth |
| **Assignee** | DevOps Engineer |
| **Status** | OFFEN |

### Beschreibung

Beim Anfordern eines Passwort-Resets über "Passwort vergessen?" wird keine Email an den User gesendet.

### Auswirkung

- **Funktionsverlust:** User können Passwort nicht zurücksetzen
- **Support-Aufwand:** Manuelles Zurücksetzen durch Admin erforderlich
- **UX-Problem:** User sind frustriert

### Reproduktion

1. Gehe zu /login
2. Klicke "Passwort vergessen?"
3. Gib Email-Adresse ein (z.B. dustin.wulf@web.de)
4. Klicke "Reset-Link senden"
5. Success-Meldung erscheint
6. Email kommt **NICHT** an

### Vermutete Ursache

**Gleiche Ursache wie ISSUE-3:**
- Supabase Email-Service nicht korrekt konfiguriert
- Kein Custom SMTP eingerichtet
- Built-in Mailer hat Rate-Limits oder ist geblockt

### Diagnose-Schritte

1. Gleich wie ISSUE-3 - Email-Konfiguration prüfen
2. Supabase Auth Logs auf "recovery" Events prüfen

### Vorgeschlagene Lösung

**Fix für ISSUE-3 löst auch ISSUE-4:**
- Custom SMTP einrichten löst beide Probleme gleichzeitig

### Acceptance Criteria für Fix

- [ ] Reset-Email wird erfolgreich versendet
- [ ] Email kommt beim User an
- [ ] Reset-Link ist gültig und funktioniert
- [ ] Nach Reset kann User sich mit neuem Passwort einloggen

---

## Zusammenfassung

| Issue | Severity | Status | Blocker für |
|-------|----------|--------|-------------|
| ISSUE-1 | CRITICAL | :white_check_mark: GELÖST | ~~Jegliche Nutzung~~ |
| ISSUE-2 | CRITICAL | OFFEN | Login auf Production |
| ISSUE-3 | CRITICAL | OFFEN | Einladungs-System |
| ISSUE-4 | HIGH | OFFEN | Passwort-Reset |

**Nächste Schritte:**
1. ISSUE-2 fixen (Environment Variables auf Vercel prüfen)
2. ISSUE-3 + ISSUE-4 fixen (Custom SMTP einrichten)
3. Login testen mit `dustin.wulf@web.de`
4. Kompletten QA-Test durchführen

**Hinweis:** ISSUE-3 und ISSUE-4 haben die gleiche Root Cause (Email-Konfiguration) und können zusammen gefixt werden.

---

## ISSUE-5: Einladungslink enthält "undefined" statt Domain

### Details

| Feld | Wert |
|------|------|
| **ID** | ISSUE-5 |
| **Titel** | Einladungslink URL ist "undefined/invite/accept/..." |
| **Severity** | CRITICAL |
| **Priority** | P0 - Blocker |
| **Type** | Bug / Missing Configuration |
| **Komponente** | Environment Variables |
| **Assignee** | DevOps Engineer |
| **Status** | :white_check_mark: GELÖST (2026-01-23) |

### Beschreibung

Beim Erstellen einer Einladung wird ein Link generiert, der mit `undefined` beginnt statt mit der korrekten Domain:

```
Generierter Link: undefined/invite/accept/N8WRIVT9yHa60oCaiG_L2pOm1nI7mgBb
Erwartet:         https://vereins-management.vercel.app/invite/accept/N8WRIVT9yHa60oCaiG_L2pOm1nI7mgBb
```

### Auswirkung

- **Komplett-Blocker:** Einladungslinks sind nicht nutzbar
- **Komplett-Blocker:** Eingeladene User können sich nicht registrieren
- **Auch betroffen:** Passwort-Reset-Links (gleiche Variable)

### Root Cause

**Fehlende Environment Variable: `NEXT_PUBLIC_APP_URL`**

Code in `src/lib/actions/invitations.ts:97`:
```typescript
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/${token}`
```

Code in `src/lib/actions/password-reset.ts:35`:
```typescript
redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`
```

Die Variable `NEXT_PUBLIC_APP_URL` ist nicht in `.env.local` definiert.

### Reproduktion

1. Als Admin einloggen
2. Navigiere zu Admin → User einladen
3. Erstelle eine Einladung
4. Prüfe den generierten Link → beginnt mit `undefined`

### Lösung

**1. Lokale Entwicklung (.env.local):**

Füge hinzu:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**2. Production (Vercel):**

Füge in Vercel Dashboard → Settings → Environment Variables hinzu:
```bash
NEXT_PUBLIC_APP_URL=https://vereins-management.vercel.app
```

### Acceptance Criteria für Fix

- [x] `NEXT_PUBLIC_APP_URL` in `.env.local` gesetzt
- [ ] `NEXT_PUBLIC_APP_URL` in Vercel Environment Variables gesetzt
- [x] Einladungslink beginnt mit korrekter Domain (lokal)
- [ ] Passwort-Reset-Link beginnt mit korrekter Domain
- [ ] Links sind klickbar und führen zur richtigen Seite

### Lösung (2026-01-23)

`NEXT_PUBLIC_APP_URL` wurde zu `.env.local` hinzugefügt:

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Noch offen:** Variable muss auch in Vercel gesetzt werden für Production.

---

## ISSUE-6: Registrierung schlägt fehl - "Bitte versuchen Sie es erneut"

### Details

| Feld | Wert |
|------|------|
| **ID** | ISSUE-6 |
| **Titel** | Registrierung via Einladungslink schlägt fehl |
| **Severity** | CRITICAL |
| **Priority** | P0 - Blocker |
| **Type** | Bug / Missing Configuration |
| **Komponente** | Backend / Environment Variables |
| **Assignee** | Backend Developer |
| **Status** | OFFEN |

### Beschreibung

Beim Versuch, sich über einen Einladungslink zu registrieren, erscheint die Fehlermeldung:
```
"Konto konnte nicht erstellt werden. Bitte versuchen Sie es erneut."
```

Selbst mit korrektem Einladungslink (manuell kopiert) kann die Registrierung nicht abgeschlossen werden.

### Auswirkung

- **Komplett-Blocker:** Neue User können sich nicht registrieren
- **Komplett-Blocker:** Invite-Only System funktioniert nicht
- **Komplett-Blocker:** Admin kann keine neuen Mitglieder hinzufügen

### Root Cause

**Fehlende Environment Variable: `SUPABASE_SERVICE_ROLE_KEY`**

Der `createServiceClient()` in [server.ts:38](src/lib/supabase/server.ts#L38) benötigt den Service Role Key:

```typescript
// src/lib/supabase/server.ts:36-38
export async function createServiceClient() {
  // ...
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ← FEHLT in .env.local!
```

Die Registrierung nutzt Admin-API-Funktionen in [registration.ts:41](src/lib/actions/registration.ts#L41):

```typescript
// src/lib/actions/registration.ts:41-45
const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
  email: invitation.email,
  password: data.password,
  email_confirm: true,
})
```

Ohne den `SUPABASE_SERVICE_ROLE_KEY` kann `serviceClient.auth.admin.createUser()` nicht funktionieren und wirft einen Fehler.

### Reproduktion

1. Erstelle als Admin eine Einladung
2. Kopiere den Einladungslink manuell (z.B. `http://localhost:3000/invite/accept/TOKEN`)
3. Öffne den Link
4. Fülle das Registrierungsformular aus (Passwort, Geburtsdatum)
5. Klicke "Registrieren"
6. Fehlermeldung: "Konto konnte nicht erstellt werden. Bitte versuchen Sie es erneut."

### Supabase Auth Logs

Keine `createUser` oder `signup` Requests in den Logs sichtbar → Bestätigt, dass der Request Supabase nie erreicht.

### Lösung

**1. Supabase Service Role Key holen:**

1. Gehe zu Supabase Dashboard → Project Settings → API
2. Kopiere den `service_role` key (NICHT den `anon` key!)

**2. In .env.local hinzufügen:**

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ WARNUNG:** Der Service Role Key hat VOLLE Admin-Rechte!
- Niemals im Frontend/Client verwenden
- Niemals in Git committen
- Nur in Server Actions und API Routes verwenden

**3. Für Vercel Production:**

Füge in Vercel Dashboard → Settings → Environment Variables hinzu:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**4. Dev-Server neustarten:**

```bash
# Stoppe den Server (Ctrl+C)
npm run dev
```

### Acceptance Criteria für Fix

- [ ] `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` gesetzt
- [ ] `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables gesetzt
- [ ] Dev-Server neugestartet nach Änderung
- [ ] Registrierung via Einladungslink funktioniert
- [ ] Neuer User wird in Supabase Auth erstellt
- [ ] Profile wird in public.profiles erstellt
- [ ] Auto-Login nach Registrierung funktioniert

---

## ISSUE-7: Email-Versand nicht implementiert

### Details

| Feld | Wert |
|------|------|
| **ID** | ISSUE-7 |
| **Titel** | Einladungs- und Reset-Emails werden nicht versendet (nur console.log) |
| **Severity** | CRITICAL |
| **Priority** | P0 - Blocker |
| **Type** | Missing Feature |
| **Komponente** | Backend / Email Service |
| **Assignee** | Backend Developer |
| **Status** | OFFEN |

### Beschreibung

Der Email-Versand für Einladungen ist **nicht implementiert**. Der Code generiert nur den Link und loggt ihn in der Konsole:

```typescript
// src/lib/actions/invitations.ts:99-103
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/${token}`

// For now, we'll use Supabase's built-in invite (or log the URL for development)
console.log('Invitation URL:', inviteUrl)

// TODO: Send custom email via Supabase Edge Function or external service
// For MVP, the invitation is created and the link can be copied
```

**Es gibt keinen Code, der tatsächlich Emails versendet!**

### Auswirkung

- **Komplett-Blocker:** Eingeladene User erhalten keine Email
- **Komplett-Blocker:** Link muss manuell kopiert und zugesendet werden
- **Unpraktisch:** Admin muss Links per Hand versenden

### Betroffene Funktionen

1. **Einladungs-Emails** - [invitations.ts:99-103](src/lib/actions/invitations.ts#L99-L103)
2. **Passwort-Reset-Emails** - Nutzt Supabase Auth, aber SMTP muss konfiguriert sein

### User-Wunsch

Der User möchte **web.de Mail als SMTP Service** nutzen für das Testen.

### Vorgeschlagene Lösung

**Option A: Nodemailer mit web.de SMTP (für Testing)**

```typescript
// src/lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.web.de',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,     // z.B. dustin.wulf@web.de
    pass: process.env.SMTP_PASSWORD, // App-Passwort von web.de
  },
})

export async function sendInvitationEmail(data: {
  to: string
  firstName: string
  inviteUrl: string
}) {
  await transporter.sendMail({
    from: `"Vereins-Management" <${process.env.SMTP_USER}>`,
    to: data.to,
    subject: 'Einladung zum Vereins-Management',
    html: `
      <h1>Hallo ${data.firstName}!</h1>
      <p>Du wurdest zum Vereins-Management eingeladen.</p>
      <p>Klicke auf den folgenden Link, um dein Konto zu aktivieren:</p>
      <a href="${data.inviteUrl}">${data.inviteUrl}</a>
      <p>Der Link ist 7 Tage gültig.</p>
    `,
  })
}
```

**Option B: Supabase Custom SMTP**

Für Passwort-Reset-Emails (die Supabase Auth nutzen) muss SMTP im Supabase Dashboard konfiguriert werden:

1. Supabase Dashboard → Project Settings → Authentication → SMTP Settings
2. Custom SMTP aktivieren
3. web.de SMTP-Daten eingeben:
   ```
   SMTP Host: smtp.web.de
   SMTP Port: 587
   SMTP User: dustin.wulf@web.de
   SMTP Password: [App-Passwort]
   Sender Email: dustin.wulf@web.de
   Sender Name: Vereins-Management
   ```

### Environment Variables benötigt

```bash
# .env.local
SMTP_HOST=smtp.web.de
SMTP_PORT=587
SMTP_USER=dustin.wulf@web.de
SMTP_PASSWORD=dein_app_passwort
```

**web.de App-Passwort erstellen:**
1. Gehe zu web.de → Einstellungen → Sicherheit
2. Erstelle ein "App-Passwort" für SMTP
3. Nutze dieses Passwort (nicht das normale Login-Passwort!)

### Acceptance Criteria für Fix

- [ ] `nodemailer` installiert (`npm install nodemailer`)
- [ ] Email-Service in `src/lib/email.ts` implementiert
- [ ] `createInvitation()` versendet Email nach Einladungs-Erstellung
- [ ] SMTP Environment Variables konfiguriert
- [ ] Supabase Custom SMTP konfiguriert (für Reset-Emails)
- [ ] Einladungs-Email kommt beim Empfänger an
- [ ] Reset-Email kommt beim Empfänger an
- [ ] Emails enthalten korrekte Links

---

## Aktualisierte Zusammenfassung

| Issue | Severity | Status | Blocker für | Assignee |
|-------|----------|--------|-------------|----------|
| ISSUE-1 | CRITICAL | :white_check_mark: GELÖST | ~~Jegliche Nutzung~~ | - |
| ISSUE-2 | CRITICAL | OFFEN | Login auf Production | DevOps |
| ISSUE-3 | CRITICAL | OFFEN | Einladungs-System (Email) | DevOps |
| ISSUE-4 | HIGH | OFFEN | Passwort-Reset (Email) | DevOps |
| ISSUE-5 | CRITICAL | :white_check_mark: GELÖST | ~~Einladungs-/Reset-Links~~ | - |
| ISSUE-6 | CRITICAL | OFFEN | Registrierung | **Backend Developer** |
| ISSUE-7 | CRITICAL | OFFEN | Email-Versand | **Backend Developer** |

### Backend Developer Tasks

1. **ISSUE-6 fixen:** `SUPABASE_SERVICE_ROLE_KEY` zu `.env.local` hinzufügen
2. **ISSUE-7 fixen:** Email-Versand mit Nodemailer + web.de SMTP implementieren

### DevOps Tasks

1. **ISSUE-2 fixen:** Environment Variables auf Vercel prüfen/setzen
2. **ISSUE-3/4 fixen:** Custom SMTP in Supabase Dashboard konfigurieren

### Empfohlene Reihenfolge

1. ✅ ~~ISSUE-5~~ (bereits gefixt: NEXT_PUBLIC_APP_URL)
2. **ISSUE-6** (Service Role Key) ← **SCHNELL!**
3. **ISSUE-7** (Email-Versand implementieren)
4. ISSUE-2 (Vercel Env Vars)
5. ISSUE-3/4 (Supabase SMTP)

---

*Issues dokumentiert am 2026-01-23 während manuellem QA-Test*
