# PROJ-2: Dark Theme & Design System

## Status: ✅ QA Passed - Ready for Production

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - bereits implementiert

## Übersicht
Umstellung des gesamten Vereins-Management-Systems auf ein modernes, minimalistisches Dark Theme mit blauen Akzenten. Das Design wird als Basis für alle zukünftigen Features dienen.

---

## User Stories

### US-1: Konsistentes Dark Theme
**Als** Benutzer
**möchte ich** ein durchgängig dunkles Design sehen
**um** auch bei schlechten Lichtverhältnissen komfortabel arbeiten zu können und meine Augen zu schonen.

### US-2: Moderne visuelle Ästhetik
**Als** Vereinsvorstand
**möchte ich** ein professionelles, modernes Design
**um** einen seriösen Eindruck bei der Vereinsverwaltung zu haben.

### US-3: Klare Status-Indikatoren
**Als** Benutzer
**möchte ich** dezente aber erkennbare Farbcodes für Status-Anzeigen
**um** schnell den Zustand von Elementen erfassen zu können (Erfolg, Fehler, Warnung).

### US-4: Einheitliche UI-Komponenten
**Als** Entwickler
**möchte ich** ein konsistentes Design-System
**um** neue Features schnell und einheitlich umsetzen zu können.

---

## Acceptance Criteria

### Theme-Grundlagen
- [ ] Hintergrundfarben: Dunkle Grautöne (z.B. #0a0a0f, #121218, #1a1a24)
- [ ] Textfarben: Helle Grautöne für Lesbarkeit (z.B. #e4e4e7, #a1a1aa)
- [ ] Primäre Akzentfarbe: Blau (z.B. #3b82f6, #60a5fa)
- [ ] Sekundäre Akzentfarbe: Gedämpftes Blau für Hover-States
- [ ] Keine Light-Mode Option (nur Dark Mode)

### Status-Farben (Dezent/Pastell)
- [ ] Erfolg: Gedämpftes Grün (z.B. #22c55e mit 20% Opacity als Background)
- [ ] Fehler: Gedämpftes Rot (z.B. #ef4444 mit 20% Opacity als Background)
- [ ] Warnung: Gedämpftes Gelb/Orange (z.B. #f59e0b mit 20% Opacity als Background)
- [ ] Info: Blau passend zum Akzent

### Komponenten-Anpassungen
- [ ] Cards: Dunkler Hintergrund mit subtilen Borders
- [ ] Buttons: Primär=Blau, Sekundär=Transparent mit Border
- [ ] Inputs: Dunkler Hintergrund, heller Text, blaue Focus-States
- [ ] Sidebar: Dunkel mit klarer Trennung zum Content-Bereich
- [ ] Dialoge/Modals: Dunkler Hintergrund mit Backdrop-Blur
- [ ] Tables: Alternierende Zeilen mit subtilen Farbunterschieden
- [ ] Badges: Dezente Farben mit niedriger Opacity

### Migration bestehender Seiten
- [ ] Login-Seite: Dark Theme angewendet
- [ ] Reset-Password-Seite: Dark Theme angewendet
- [ ] Dashboard-Layout: Dark Theme angewendet
- [ ] Dashboard-Startseite: Dark Theme angewendet
- [ ] Admin User-Invite-Seite: Dark Theme angewendet
- [ ] Admin Invitations-Liste: Dark Theme angewendet
- [ ] Invite-Accept-Seite: Dark Theme angewendet

### Typografie
- [ ] Font: System-Font-Stack (bereits vorhanden) oder Inter
- [ ] Überschriften: Bold, helle Farbe
- [ ] Body-Text: Regular, leicht gedämpfte helle Farbe
- [ ] Muted-Text: Grau für sekundäre Informationen

---

## Edge Cases

### Lesbarkeit
- **Was passiert bei sehr langen Texten?** → Kontrast muss WCAG AA Standard erfüllen (4.5:1 für normalen Text)
- **Was passiert bei Formularen mit Fehlern?** → Rote Border + dezent roter Hintergrund, nicht nur Farbe (Accessibility)

### Konsistenz
- **Was passiert wenn neue shadcn/ui Komponenten hinzugefügt werden?** → CSS-Variablen müssen so definiert sein, dass neue Komponenten automatisch das Theme übernehmen
- **Was passiert bei externen Embeds/iFrames?** → Diese behalten ihr eigenes Styling (nicht beeinflussbar)

### Browser/Device
- **Wie verhält sich das Design auf verschiedenen Monitoren?** → Farben müssen auch auf günstigen Displays gut aussehen (keine zu subtilen Unterschiede)
- **Print-Ansicht?** → Für Print wird auf hellen Hintergrund gewechselt (optional, niedrige Priorität)

---

## Technische Anforderungen

### CSS-Variablen Struktur
```css
:root {
  /* Nur Dark Mode - keine Light-Mode Variablen nötig */
  --background: /* dunkler Hintergrund */;
  --foreground: /* heller Text */;
  --primary: /* Blau Akzent */;
  --primary-foreground: /* Text auf Blau */;
  --muted: /* Gedämpfter Hintergrund */;
  --muted-foreground: /* Gedämpfter Text */;
  --card: /* Card Hintergrund */;
  --border: /* Border Farbe */;
  /* Status-Farben */
  --success: /* Gedämpftes Grün */;
  --warning: /* Gedämpftes Gelb */;
  --destructive: /* Gedämpftes Rot */;
}
```

### Dateien die angepasst werden müssen
- `src/app/globals.css` - CSS-Variablen definieren
- `tailwind.config.ts` - Farben registrieren
- Alle bestehenden Page-Komponenten - auf neue Variablen umstellen

### Performance
- Keine JavaScript-Berechnungen für Theme
- Alles über CSS-Variablen
- Keine Flash of Unstyled Content (FOUC)

---

## Design-Referenzen

**Inspirationen:**
- GitHub Dark Mode (klare Struktur)
- Linear App (moderne Ästhetik)
- Vercel Dashboard (minimalistisch)

**Farbschema (Blue Accent Dark):**
| Element | Farbe | Verwendung |
|---------|-------|------------|
| Background | #0a0a0f | Seiten-Hintergrund |
| Card | #121218 | Karten, Panels |
| Border | #27272a | Trennlinien |
| Text Primary | #fafafa | Haupttext |
| Text Muted | #a1a1aa | Sekundärtext |
| Primary | #3b82f6 | Buttons, Links, Akzente |
| Success | #22c55e / 20% | Erfolg-Status |
| Warning | #f59e0b / 20% | Warnung-Status |
| Destructive | #ef4444 / 20% | Fehler-Status |

---

## Nicht im Scope

- Light Mode Toggle (explizit nicht gewünscht)
- Individuelle Theme-Anpassungen pro User
- Custom Color Picker
- Animierte Theme-Übergänge

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (wiederverwendbar)
- ✅ CSS-Variablen-System in `globals.css` bereits vorhanden
- ✅ Tailwind-Konfiguration verweist auf CSS-Variablen
- ✅ shadcn/ui Komponenten nutzen automatisch die Variablen
- ✅ Dark Mode via `.dark` Klasse vorbereitet

### Component-Struktur
```
Keine neuen UI-Komponenten nötig!
├── Anpassung: globals.css (Farbwerte ändern)
├── Anpassung: Layout (dark Klasse permanent setzen)
└── Anpassung: Bestehende Seiten (Login, Dashboard, Admin-Bereich)
    └── Nur Klassenänderungen, keine neuen Komponenten
```

### Daten-Model
Kein Daten-Speichern nötig – reines CSS-Styling.

### Tech-Entscheidungen
| Entscheidung | Begründung |
|--------------|------------|
| Nur Dark Mode (kein Toggle) | Einfacher, wie vom User gewünscht |
| CSS-Variablen statt Tailwind-Farben direkt | Alle shadcn/ui Komponenten übernehmen automatisch das Theme |
| Kein JavaScript fürs Theme | Schneller, kein Flash beim Laden |
| HSL-Farbformat | Standard bei shadcn/ui, erlaubt Opacity-Varianten |

### Dependencies
Keine neuen Packages nötig.

### Betroffene Dateien
1. `globals.css` – Neue Farbwerte für Dark Theme (Blau-Akzent)
2. `layout.tsx` – `dark` Klasse auf `<html>` setzen
3. Alle bestehenden Seiten – Prüfen ob Farben korrekt übernommen werden

### Implementierungs-Aufwand
- Gering: Nur CSS-Anpassungen, keine neuen Komponenten
- Risiko: Niedrig – bestehende Infrastruktur wird genutzt

---

## Checkliste vor Abschluss

- [x] User Stories definiert
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases identifiziert
- [x] Technische Anforderungen dokumentiert
- [x] Feature-ID vergeben: PROJ-2
- [x] Status gesetzt: QA Passed
- [x] User Review: Implementierung geprüft
- [x] QA Test: Bestanden (2026-01-25)
- [x] Bug-Fixes verifiziert: Alle 4 Bugs behoben

---

## QA Test Results

**Tested:** 2026-01-25
**Re-Test:** 2026-01-25
**Tester:** QA Engineer Agent
**App URL:** http://localhost:3000

---

## Acceptance Criteria Status

### Theme-Grundlagen
- [x] Hintergrundfarben: Dunkle Grautöne (#0a0a0f, #121218, #1a1a24) ✅
- [x] Textfarben: Helle Grautöne (#fafafa, #a1a1aa) ✅
- [x] Primäre Akzentfarbe: Blau (#3b82f6) ✅
- [x] Sekundäre Akzentfarbe: Gedämpftes Blau für Hover-States (primary/90) ✅
- [x] Keine Light-Mode Option (nur Dark Mode) ✅

### Status-Farben (Dezent/Pastell)
- [x] Erfolg: --success definiert (#22c55e) ✅
- [x] Fehler: --destructive definiert (#ef4444) ✅
- [x] Warnung: --warning definiert (#f59e0b) ✅
- [x] Info: --info definiert (#3b82f6) ✅
- [x] ~~BUG-1~~ **FIXED:** Badge-Komponente hat jetzt `success` und `warning` Varianten ✅

### Komponenten-Anpassungen
- [x] Cards: Dunkler Hintergrund (#121218) mit subtilen Borders ✅
- [x] Buttons: Primär=Blau, Sekundär=Transparent mit Border ✅
- [x] Inputs: Dunkler Hintergrund, heller Text, blaue Focus-States (ring-ring) ✅
- [x] ~~BUG-2~~ **FIXED:** Sidebar: Visueller Unterschied vorhanden (--sidebar-background: #121218 vs --background: #0a0a0f) ✅
- [x] ~~BUG-3~~ **FIXED:** Dialoge/Modals: Hat jetzt `backdrop-blur-sm` ✅
- [x] ~~BUG-4~~ **FIXED:** Tables: Alternierende Zeilen mit `odd:bg-muted/20` ✅
- [x] Badges: Nutzen CSS-Variablen korrekt ✅

### Migration bestehender Seiten
- [x] Login-Seite: Dark Theme angewendet ✅
- [x] Reset-Password-Seite: Dark Theme angewendet ✅
- [x] Dashboard-Layout: Dark Theme angewendet ✅
- [x] Dashboard-Startseite: Dark Theme angewendet ✅
- [x] Admin User-Invite-Seite: Dark Theme angewendet ✅
- [x] Admin Invitations-Liste: Dark Theme angewendet ✅
- [x] Invite-Accept-Seite: Dark Theme angewendet ✅

### Typografie
- [x] Font: System-Font-Stack via Tailwind (`antialiased`) ✅
- [x] Überschriften: Bold, helle Farbe (`text-3xl font-bold`) ✅
- [x] Body-Text: Regular, helle Farbe (foreground) ✅
- [x] Muted-Text: Grau für sekundäre Informationen (`text-muted-foreground`) ✅

---

## Edge Cases Status

### EC-1: WCAG Kontrast
- [x] Foreground (#fafafa) vs Background (#0a0a0f): **18.6:1** ✅ (WCAG AAA)
- [x] Muted-foreground (#a1a1aa) vs Background (#0a0a0f): **7.6:1** ✅ (WCAG AA)

### EC-2: Formular-Fehler Accessibility
- [x] Alert destructive hat `border-destructive/50` und `text-destructive` ✅
- [x] ~~MINOR~~ **FIXED:** Alert destructive hat jetzt `bg-destructive/10` Hintergrund ✅

### EC-3: shadcn/ui Konsistenz
- [x] CSS-Variablen vollständig definiert (:root + .dark) ✅
- [x] Tailwind-Config nutzt `hsl(var(--...))` Pattern ✅
- [x] Neue shadcn/ui Komponenten erben Theme automatisch ✅

### EC-4: Performance
- [x] Kein JavaScript für Theme (nur CSS-Variablen) ✅
- [x] `dark` Klasse statisch auf `<html>` gesetzt ✅
- [x] Kein FOUC möglich ✅

---

## Bugs Found (Re-Test 2026-01-25)

| Bug | Severity | Assignee | Status |
|-----|----------|----------|--------|
| BUG-1 | Medium | Frontend Developer | ✅ **FIXED & VERIFIED** |
| BUG-2 | Low | Frontend Developer | ✅ **FIXED & VERIFIED** |
| BUG-3 | Low | Frontend Developer | ✅ **FIXED & VERIFIED** |
| BUG-4 | Low | Frontend Developer | ✅ **FIXED & VERIFIED** |

---

### BUG-1: Badge-Komponente fehlt Status-Varianten ✅ FIXED
- **Status:** ✅ VERIFIED (2026-01-25)
- **Location:** [badge.tsx:17-20](src/components/ui/badge.tsx#L17-L20)
- **Verification:** `success` und `warning` Varianten sind jetzt implementiert:
  - `success: "border-transparent bg-success/20 text-success hover:bg-success/30"`
  - `warning: "border-transparent bg-warning/20 text-warning-foreground hover:bg-warning/30"`

### BUG-2: Sidebar ohne visuelle Trennung ✅ FIXED
- **Status:** ✅ VERIFIED (2026-01-25)
- **Location:** [globals.css:60](src/app/globals.css#L60)
- **Verification:** Sidebar-Background ist jetzt `240 14% 8%` (#121218), während Main-Background `240 20% 4%` (#0a0a0f) ist → klare visuelle Trennung

### BUG-3: Dialoge ohne Backdrop-Blur ✅ FIXED
- **Status:** ✅ VERIFIED (2026-01-25)
- **Location:** [dialog.tsx:24](src/components/ui/dialog.tsx#L24)
- **Verification:** `backdrop-blur-sm` ist jetzt in DialogOverlay vorhanden

### BUG-4: Tables ohne alternierende Zeilen ✅ FIXED
- **Status:** ✅ VERIFIED (2026-01-25)
- **Location:** [table.tsx:61](src/components/ui/table.tsx#L61)
- **Verification:** `odd:bg-muted/20` ist jetzt in TableRow vorhanden

---

## Regression Test (PROJ-1: User Authentication)

- [x] Login-Seite ist erreichbar ✅
- [x] Login-Form validiert Email/Passwort ✅
- [x] Error-Handling funktioniert (Alert destructive) ✅
- [x] CAPTCHA wird nach Fehlversuchen angezeigt ✅
- [x] Dashboard-Sidebar mit Logout funktioniert ✅
- [x] Einladungen-System nutzt Theme korrekt ✅

**Ergebnis:** Keine Regression durch Dark Theme gefunden ✅

---

## Security Check (Basic)

- [x] Keine hardcodierten Credentials in CSS/Theme-Dateien ✅
- [x] Keine sensiblen Daten in Client-seitigem Code ✅
- [x] Theme-Implementierung hat keine Security-Relevanz ✅

---

## Browser-Kompatibilität (Code-Review-basiert)

- [x] CSS-Variablen: Unterstützt in allen modernen Browsern ✅
- [x] HSL-Farben: Unterstützt in allen modernen Browsern ✅
- [x] Tailwind-Klassen: Generieren Standard-CSS ✅

---

## Summary

| Kategorie | Status |
|-----------|--------|
| Theme-Grundlagen | ✅ 5/5 bestanden |
| Status-Farben | ✅ 5/5 bestanden |
| Komponenten | ✅ 7/7 bestanden |
| Migration Seiten | ✅ 7/7 bestanden |
| Typografie | ✅ 4/4 bestanden |
| WCAG Kontrast | ✅ Bestanden |
| Regression PROJ-1 | ✅ Keine Issues |

**Gesamt (Re-Test 2026-01-25):**
- ✅ **28** Acceptance Criteria bestanden
- ✅ **4** Bugs gefunden → **ALLE BEHOBEN & VERIFIZIERT**
- ✅ **1** Minor Issue → **BEHOBEN** (Alert Background)

---

## Recommendation

### Production-Ready: ✅ JA

Das Dark Theme Design System ist **vollständig implementiert und getestet**. Alle im ersten QA-Durchlauf gefundenen Bugs wurden behoben und im Re-Test verifiziert:

| Bug | Status |
|-----|--------|
| BUG-1: Badge Varianten | ✅ Fixed & Verified |
| BUG-2: Sidebar Trennung | ✅ Fixed & Verified |
| BUG-3: Dialog Blur | ✅ Fixed & Verified |
| BUG-4: Table Zeilen | ✅ Fixed & Verified |
| MINOR: Alert Background | ✅ Fixed & Verified |

---

### Nächste Schritte

1. ✅ ~~User-Entscheidung: Welche Bugs sollen vor Deployment gefixt werden?~~
2. ✅ ~~Frontend Developer: Bugs fixen~~
3. ✅ ~~QA Engineer: Re-Test der gefixten Bugs~~ (AKTUELLER SCHRITT - ABGESCHLOSSEN)
4. **Deployment:** Feature kann deployed werden
