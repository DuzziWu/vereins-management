# Changelog

## 2025-12-26 - Corporate Design & Kalender Integration

### Features

#### Corporate Design / Primärfarbe
- Admin kann in den Einstellungen eine Primärfarbe (HEX) festlegen
- Die Farbe wird dynamisch als CSS-Variable (`--primary`, `--accent`, `--ring`) gesetzt
- Alle UI-Elemente (Buttons, Progress Bars, Hover-Effekte, etc.) passen sich automatisch an
- Neue Utility-Funktion `hexToHsl()` für die Farbkonvertierung

#### Club-Logo im Header
- Das vom Admin hochgeladene Vereinslogo wird im Header angezeigt
- Logo-Größe: 56x56px mit Rahmen in Primärfarbe
- Fallback: Activity-Icon wenn kein Logo vorhanden
- Next.js Image-Konfiguration für Supabase Storage

#### Wochenkalender & Nächstes Event
- Neue Komponente `WeekCalendar`: Zeigt Events der aktuellen Woche (Mo-So)
  - Farbcodierung: Grün (Training), Rot (Spiel), Blau (Meeting)
  - Heutiger Tag hervorgehoben
  - Vergangene Tage ausgegraut
  - Klickbare Events mit Link zur Detail-Seite
  - Legende für Event-Typen

- Neue Komponente `NextEvent`: Großes Widget für das nächste Event
  - Countdown in Tagen/Stunden/Minuten
  - Event-Details (Typ, Datum, Uhrzeit, Ort)
  - Bei Spielen: Gegner und Heim/Auswärts-Badge
  - Anzahl der Zusagen
  - Farbcodierte Rahmen je nach Event-Typ

- Integration auf allen Dashboards:
  - `/admin` - Admin Dashboard
  - `/coach` - Trainer Dashboard
  - `/player` - Spieler Dashboard

### Geänderte Dateien

```
src/lib/utils.js                              # hexToHsl() Funktion
src/app/(dashboard)/layout.jsx                # Dynamische CSS-Variablen
src/actions/settings.js                       # Revalidierung aller Pfade
src/components/dashboard-header.jsx           # Club-Logo Anzeige
next.config.js                                # Supabase Storage Config
src/components/dashboard/week-calendar.jsx    # NEU: Wochenkalender
src/components/dashboard/next-event.jsx       # NEU: Nächstes Event Widget
src/app/(dashboard)/admin/page.jsx            # Kalender Integration
src/app/(dashboard)/coach/page.jsx            # Kalender Integration
src/app/(dashboard)/player/page.jsx           # Kalender Integration
src/app/(dashboard)/admin/members/page.jsx    # clubLogoUrl Prop
src/app/(dashboard)/admin/teams/page.jsx      # clubLogoUrl Prop
src/app/(dashboard)/admin/settings/page.jsx   # clubLogoUrl Prop
```

### Commit Message

```
feat: Corporate Design & Kalender Integration

- Dynamische Primärfarbe aus Club-Einstellungen (HEX -> HSL)
- Club-Logo im Header anstelle des Platzhalter-Icons
- Neuer Wochenkalender mit Event-Übersicht (Mo-So)
- Neues "Nächstes Event" Widget mit Countdown
- Kalender auf allen Dashboards (Admin, Coach, Player)
```
