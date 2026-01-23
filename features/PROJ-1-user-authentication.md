# PROJ-1: User Authentication

## Status: 🚀 Ready for Deployment (2026-01-23)

## Übersicht
Implementierung eines Invite-Only Authentifizierungssystems für das Vereins-Management. User können sich nur über eine Admin-Einladung registrieren. Das System unterstützt Login, Registrierung via Einladungslink und Passwort-Reset.

---

## User Stories

### Login
- **Als Mitglied** möchte ich mich mit Email und Passwort einloggen, um auf mein Dashboard zuzugreifen.
- **Als Mitglied** möchte ich nach dem Browser-Schließen eingeloggt bleiben, um nicht jedes Mal meine Daten eingeben zu müssen.

### Einladung (Admin)
- **Als Vorstand** möchte ich neue User anlegen und per Email einladen, um die Kontrolle über Vereinsmitgliedschaften zu behalten.
- **Als Vorstand** möchte ich beim Einladen eine Rolle zuweisen (Vorstand/Trainer/Mitglied), um dem User direkt die richtigen Berechtigungen zu geben.
- **Als Vorstand** möchte ich ausstehende Einladungen sehen und widerrufen können, um fehlerhafte Einladungen zu korrigieren.

### Registrierung
- **Als eingeladener User** möchte ich über den Einladungslink mein Konto aktivieren, um dem Verein beizutreten.
- **Als eingeladener User** möchte ich bei der Registrierung mein Passwort und Profil-Basics (Name, Geburtsdatum, Telefon) eingeben, um mein Profil zu vervollständigen.

### Passwort-Reset
- **Als Mitglied** möchte ich mein Passwort zurücksetzen können, falls ich es vergessen habe.

---

## Acceptance Criteria

### Login
- [ ] Login-Formular mit Email und Passwort
- [ ] Bei erfolgreichem Login: Weiterleitung zum Dashboard
- [ ] Bei fehlerhaftem Login: Generische Fehlermeldung "Email oder Passwort falsch" (keine Unterscheidung aus Sicherheitsgründen)
- [ ] Session bleibt nach Browser-Schließen erhalten (persistent session)
- [ ] Logout-Button im Dashboard verfügbar
- [ ] Nach 3 fehlgeschlagenen Login-Versuchen: CAPTCHA-Validierung erforderlich

### Admin: User einladen
- [ ] Formular zum Anlegen eines neuen Users:
  - Email (required)
  - Vorname (required)
  - Nachname (required)
  - Rolle auswählen: Vorstand / Trainer / Mitglied (required)
- [ ] "Einladung senden" Button versendet Email mit Registrierungslink
- [ ] Einladungslink ist 7 Tage gültig
- [ ] Liste aller ausstehenden Einladungen einsehbar
- [ ] Möglichkeit, Einladung zu widerrufen (vor Registrierung)
- [ ] Bei erneuter Einladung an gleiche Email: Alter Link wird ungültig, neuer Link wird versendet

### Registrierung (via Einladungslink)
- [ ] Einladungslink führt zu Registrierungsseite
- [ ] Vorausgefüllte Felder: Email, Vorname, Nachname (aus Einladung)
- [ ] Auszufüllende Felder:
  - Passwort (min. 8 Zeichen)
  - Passwort bestätigen
  - Geburtsdatum (required)
  - Telefonnummer (optional)
- [ ] Passwort-Validierung: Min. 8 Zeichen, mind. 1 Buchstabe und 1 Zahl
- [ ] Bei erfolgreichem Registrieren: Automatischer Login + Weiterleitung zum Dashboard
- [ ] Bei abgelaufenem Link: Fehlermeldung "Dieser Einladungslink ist abgelaufen. Bitte kontaktieren Sie den Vorstand."
- [ ] Bei bereits genutztem Link: Fehlermeldung "Dieses Konto wurde bereits aktiviert."

### Passwort-Reset
- [ ] "Passwort vergessen?" Link auf Login-Seite
- [ ] Eingabefeld für Email-Adresse
- [ ] Bei existierender Email: Reset-Link per Email senden
- [ ] Bei nicht-existierender Email: Gleiche Erfolgsmeldung (Sicherheit)
- [ ] Reset-Link ist 1 Stunde gültig
- [ ] Reset-Seite: Neues Passwort + Bestätigung eingeben
- [ ] Nach erfolgreichem Reset: Weiterleitung zum Login

---

## Edge Cases

### Login
- **Inaktiver Account:** User wurde vom Vorstand deaktiviert → "Ihr Konto ist deaktiviert. Bitte kontaktieren Sie den Vorstand."
- **Rate Limiting:** Nach 3 fehlgeschlagenen Login-Versuchen → CAPTCHA erforderlich für weitere Versuche

### Einladung
- **Duplicate Email:** Email existiert bereits als aktiver User → Fehlermeldung "Ein Konto mit dieser Email existiert bereits."
- **Re-Invite:** Email hat ausstehende Einladung → Alte Einladung wird ungültig, neue wird gesendet
- **Self-Invite:** Admin versucht sich selbst einzuladen → Verhindert wenn schon registriert

### Registrierung
- **Manipulierter Link:** Ungültiger Token → "Dieser Einladungslink ist ungültig."
- **Doppelte Registrierung:** User versucht Link erneut zu nutzen → "Dieses Konto wurde bereits aktiviert."
- **Leere Pflichtfelder:** Client-seitige UND Server-seitige Validierung

### Passwort-Reset
- **Zu viele Reset-Anfragen:** Max. 3 Reset-Emails pro Stunde → Temporäre Sperre
- **Alter Reset-Link:** Nach Anforderung eines neuen Links werden alte ungültig
- **Bereits verwendeter Link:** "Dieser Link wurde bereits verwendet."

---

## Technische Anforderungen

### Security
- Passwort-Hashing mit Supabase Auth (bcrypt)
- HTTPS für alle Auth-Endpunkte
- CSRF-Protection für Formulare
- CAPTCHA nach 3 fehlgeschlagenen Login-Versuchen (z.B. hCaptcha oder Turnstile)
- Rate Limiting für Passwort-Reset (max. 3 Anfragen pro Stunde)
- Secure, HttpOnly Cookies für Sessions

### Performance
- Login Response: < 500ms
- Email-Versand: Asynchron (nicht blockierend)

### Email-Templates
- **Einladungs-Email:** Begrüßung + Registrierungslink + Ablaufhinweis (7 Tage)
- **Passwort-Reset-Email:** Reset-Link + Ablaufhinweis (1 Stunde)

---

## UI/UX Anforderungen

### Seiten
1. `/login` - Login-Formular
2. `/invite/accept/[token]` - Registrierung nach Einladung
3. `/reset-password` - Passwort-Reset anfordern
4. `/reset-password/[token]` - Neues Passwort setzen
5. `/admin/users/invite` - Admin: User einladen
6. `/admin/users/invitations` - Admin: Ausstehende Einladungen

### Komponenten (shadcn/ui)
- Card für alle Auth-Formulare
- Input für Email/Passwort/etc.
- Button für Submit-Actions
- Alert für Fehlermeldungen
- Toast (Sonner) für Erfolgsmeldungen

---

## Abhängigkeiten
- Keine (Basis-Feature)

## Nachfolgende Features
- Profil-Verwaltung (nach Login)
- Dashboard-Implementierung (nutzt Auth-State)

---

## Open Questions
- *Keine offenen Fragen*

## Changelog
- 2026-01-23: CAPTCHA nach 3 Login-Versuchen statt temporärer Sperre
- 2026-01-23: Initial Spec erstellt
