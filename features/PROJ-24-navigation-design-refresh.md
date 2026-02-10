# PROJ-24: Navigation & Design Refresh

## Status: Planned

## Abhangigkeiten
- Baut auf: PROJ-11 (Mobile Bottom Navigation) - bestehende Navigationsstruktur
- Baut auf: PROJ-2 (Dark Theme Design System) - bestehendes Farbschema
- Unabhangig von: Anderen Features

---

## Ubersicht

Das aktuelle Navigations-Design ist funktional, aber generisch und hat keinen Wiedererkennungswert. Ziel ist ein visuelles Redesign der Navigation mit:
- Einzigartiger visueller Identitat fuer den Verein
- Prominentere Platzierung von "Veranstaltungen"
- Verbessertes Gesamterscheinungsbild

**Wichtig:** Das Navigations-Routing und die Menustruktur bleiben unverandert - nur das visuelle Design wird verbessert.

---

## Analyse: Aktueller Stand

### Bestehende Struktur

**Desktop (>= 768px):**
- Sidebar links (256px breit)
- Standard-shadcn/ui Sidebar-Komponenten
- Logo + Vereinsname im Header
- Gruppierte Navigation (Main, Admin, Finanzen)
- Footer mit Einstellungen + Logout

**Mobile (< 768px):**
- Bottom Navigation mit 3 Items + "Mehr"-Button
- Sheet-Overlay fuer zusatzliche Items
- Standard-Icons ohne Individualisierung

**Veranstaltungen-Status:**
Die Route `/admin/events`, `/trainer/events` und `/member/events` existieren bereits in der nav-config.ts und werden in der Navigation angezeigt. Sie sind jedoch NICHT in der Bottom-Nav (nur uber "Mehr"-Menu erreichbar).

### Identifizierte Probleme

1. **Generisches Design:** Standard shadcn/ui ohne Anpassungen
2. **Fehlender Wiedererkennungswert:** Keine visuellen Akzente oder Branding
3. **Veranstaltungen versteckt:** Auf Mobile nur uber "Mehr"-Menu erreichbar
4. **Monotone Farbgebung:** Keine Farbdifferenzierung zwischen Bereichen
5. **Sidebar zu schmal fuer visuelle Akzente**

---

## Design-Optionen

### Option A: Enhanced Sidebar (Sidebar-First Ansatz)

**Beschreibung:**
Beibehaltung der Sidebar-Navigation mit visuellem Upgrade: Branded Header, farbkodierte Sektionen, animierte Hover-Effekte.

```
+----------------------------------------------------------+
|  DESKTOP                                                  |
+----------------------------------------------------------+
|  +----------------+  +----------------------------------+ |
|  | [LOGO]         |  |                                  | |
|  | Vereinsname    |  |        HAUPTINHALT               | |
|  +----------------+  |                                  | |
|  |                |  |                                  | |
|  | === HAUPTMENU ====                                   | |
|  | [x] Dashboard  |  |                                  | |
|  | [ ] Profil     |  |                                  | |
|  +----------------+  |                                  | |
|  |                |  |                                  | |
|  | === EVENTS ======= (Hervorgehoben mit Accent-Farbe)  | |
|  | [*] Veranstalt.|  |                                  | |
|  +----------------+  |                                  | |
|  |                |  |                                  | |
|  | === ADMIN ======== (Gruppiert)                       | |
|  | [ ] Mitglieder |  |                                  | |
|  | [ ] Gruppen    |  |                                  | |
|  | [ ] Dokumente  |  |                                  | |
|  +----------------+  |                                  | |
|  |                |  |                                  | |
|  | === FINANZEN ===== (Collapsible)                     | |
|  | [ ] > Beitrage |  |                                  | |
|  +----------------+  |                                  | |
|  |                |  |                                  | |
|  | [Einstellungen]|  |                                  | |
|  | [Abmelden]     |  |                                  | |
|  +----------------+  +----------------------------------+ |
+----------------------------------------------------------+

+----------------------------------------------------------+
|  MOBILE                                                   |
+----------------------------------------------------------+
|  +------------------------------------------------------+ |
|  |                                                      | |
|  |                   HAUPTINHALT                        | |
|  |                                                      | |
|  +------------------------------------------------------+ |
|  +------------------------------------------------------+ |
|  |  [Home]  [Events*]  [Mitgl.]  [Mehr]                 | |
|  |   (o)      (*)        ( )      (...)                 | |
|  +------------------------------------------------------+ |
+----------------------------------------------------------+

* = Hervorgehoben mit Accent-Farbe/Animation
```

**Vorteile:**
- Minimale Anderungen an bestehendem Layout
- Bewahrte Nutzer-Gewohnheiten
- Einfacher zu implementieren

**Nachteile:**
- Sidebar auf kleinen Desktops evtl. Platzprobleme
- Weniger Differenzierung zu Standard-Dashboards

---

### Option B: Floating Navigation Bar (Top-Nav Hybrid)

**Beschreibung:**
Horizontale Navigation am oberen Rand mit schwebendem, abgerundetem Design. Die Sidebar wird zu einem Hamburger-Menu.

```
+----------------------------------------------------------+
|  DESKTOP                                                  |
+----------------------------------------------------------+
| +------------------------------------------------------+ |
| | [LOGO] Vereinsname    | Home | Events | Admin v | [...] |
| +------------------------------------------------------+ |
|                          ^        ^         ^              |
|                          |        |         +-- Dropdown   |
|                          |        +-- Accent-Farbe         |
|                          +-- Floating/Pill-Style           |
|                                                            |
| +------------------------------------------------------+  |
| |                                                      |  |
| |                                                      |  |
| |                   HAUPTINHALT                        |  |
| |              (Volle Breite verfuegbar)               |  |
| |                                                      |  |
| |                                                      |  |
| +------------------------------------------------------+  |
+----------------------------------------------------------+

+----------------------------------------------------------+
|  MOBILE                                                   |
+----------------------------------------------------------+
|  +------------------------------------------------------+ |
|  | [LOGO] Vereinsname                          [Menu]   | |
|  +------------------------------------------------------+ |
|  +------------------------------------------------------+ |
|  |                                                      | |
|  |                   HAUPTINHALT                        | |
|  |                                                      | |
|  +------------------------------------------------------+ |
|  +------------------------------------------------------+ |
|  |  [Home]  [Events*]  [Gruppen]  [Mehr]               | |
|  +------------------------------------------------------+ |
+----------------------------------------------------------+

Floating-Style:
  +------------------------------------------+
  |   o  Dashboard  |  *  Events  |  Admin v |
  +------------------------------------------+
           ^                ^
           |                +-- Pill mit Gradient-Hintergrund
           +-- Glassmorphism-Effekt
```

**Vorteile:**
- Mehr horizontaler Platz fuer Inhalt
- Modernes, einzigartiges Design
- Events prominenter sichtbar

**Nachteile:**
- Groessere Layout-Anderung
- Komplexere Dropdown-Logik fuer Admin-Bereiche
- Mehr Entwicklungsaufwand

---

### Option C: Branded Sidebar mit Icon-Rail (Hybrid)

**Beschreibung:**
Zweistufige Navigation: Schmale Icon-Rail (immer sichtbar) + ausklappbares Panel. Vereinsfarben als Akzent-Streifen.

```
+----------------------------------------------------------+
|  DESKTOP (Collapsed)                                      |
+----------------------------------------------------------+
|  +---+  +----------------------------------------------+ |
|  |[L]|  |                                              | |
|  +---+  |                                              | |
|  |   |  |                                              | |
|  |[D]|  |              HAUPTINHALT                     | |
|  |   |  |         (Maximale Breite)                    | |
|  |[E]|  |                                              | |
|  | * |  |                                              | |
|  |[M]|  |                                              | |
|  |   |  |                                              | |
|  |[G]|  |                                              | |
|  |   |  +----------------------------------------------+ |
|  |   |                                                   |
|  |[S]|  <- Icon-Rail: 48px breit, immer sichtbar         |
|  |[X]|                                                   |
|  +---+                                                   |
+----------------------------------------------------------+

+----------------------------------------------------------+
|  DESKTOP (Expanded - bei Hover oder Klick)                |
+----------------------------------------------------------+
|  +------------------+  +-------------------------------+ |
|  | [LOGO]           |  |                               | |
|  | Vereinsname      |  |                               | |
|  +------------------+  |                               | |
|  |                  |  |                               | |
|  | [D] Dashboard    |  |         HAUPTINHALT           | |
|  |                  |  |                               | |
|  | [E] Veranstalt.  |  |                               | |
|  |     ^^^^^^^^^^^  |  |                               | |
|  |     Akzent-Farbe |  |                               | |
|  |                  |  |                               | |
|  | [M] Mitglieder   |  |                               | |
|  | [G] Gruppen      |  |                               | |
|  |                  |  |                               | |
|  +------------------+  +-------------------------------+ |
|  |                  |                                    |
|  | [S] Einstellungen|  <- Expandiert auf 200px           |
|  | [X] Abmelden     |                                    |
|  +------------------+                                    |
+----------------------------------------------------------+

Icon-Rail Legende:
  [L] = Logo (klein)
  [D] = Dashboard
  [E] = Events (mit Punkt als Highlight)
  [M] = Mitglieder
  [G] = Gruppen
  [S] = Settings
  [X] = Logout
```

**Vorteile:**
- Maximaler Platz fuer Inhalt
- Icon-Rail als visueller Anker
- Hover-Expand fuer Details
- Modernes Pattern (VS Code, Figma)

**Nachteile:**
- Komplexere Interaktion
- Lernkurve fuer User
- Touch-Gerate: Hover funktioniert nicht

---

## Empfehlung: Option A (Enhanced Sidebar)

**Begruendung:**

1. **Bewahrte Struktur:** Nutzer kennen das Layout bereits
2. **Fokus auf Design, nicht Layout:** Visuelle Verbesserungen ohne UX-Umbau
3. **Mobile-Konsistenz:** Bottom-Nav bleibt, nur Events wird hinzugefuegt
4. **Schneller umsetzbar:** Weniger strukturelle Anderungen
5. **Vereins-Branding:** Sidebar bietet Platz fuer Logo und Farbakzente

**Empfohlene Design-Elemente:**

### Sidebar Header (Branded)
```
+------------------------+
|  +------+              |
|  | LOGO |  Vereinsname |
|  +------+              |
|  ===================== | <- Gradient-Linie in Vereinsfarbe
+------------------------+
```

### Sektions-Trenner mit Farbe
```
+------------------------+
|  --- VERANSTALTUNGEN ---| <- Accent-Farbe-Hintergrund
|  [*] Events        NEW | <- Badge fuer anstehende Events
+------------------------+
```

### Aktiver Zustand
```
  Inaktiv:      [ ] Dashboard
  Aktiv:        [===] Dashboard  <- Linker Accent-Balken
                  ^
                  |
                  Gradient-Linie in Primaerfarbe
```

### Mobile Bottom-Nav Anderung
```
Aktuell:  [Home] [Mitgl.] [Finanzen] [Mehr]

Neu:      [Home] [Events] [Mitgl./Gruppen] [Mehr]
                   ^^^
                   NEU: Events ersetzt Finanzen/Gruppen
                        (Finanzen wandert in "Mehr")
```

---

## User Stories

### US-1: Wiedererkennbare Sidebar
**Als** Vereinsmitglied
**moechte ich** eine visuell ansprechende Sidebar mit Vereinslogo und -farben
**um** sofort zu wissen, dass ich in meiner Vereins-App bin.

### US-2: Events im Fokus
**Als** Vereinsmitglied
**moechte ich** Veranstaltungen prominent in der Navigation sehen
**um** anstehende Events schnell zu finden.

### US-3: Aktive Seite erkennbar
**Als** User
**moechte ich** klar sehen welche Seite gerade aktiv ist
**um** mich besser orientieren zu koennen.

### US-4: Mobile Events-Zugang
**Als** Smartphone-User
**moechte ich** Events direkt in der Bottom-Nav haben
**um** nicht erst "Mehr" oeffnen zu muessen.

### US-5: Konsistentes Design
**Als** User
**moechte ich** ein durchgaengiges visuelles Design ueber alle Bereiche
**um** eine professionelle App-Erfahrung zu haben.

---

## Acceptance Criteria

### Sidebar Design

#### Header-Bereich
- [ ] Vereinslogo wird gross und zentriert angezeigt (min. 48x48px)
- [ ] Vereinsname wird unter dem Logo angezeigt (font-semibold)
- [ ] Gradient-Linie unter Header trennt visuell vom Menubereich
- [ ] Bei kollabierter Sidebar: Nur Logo (kein Name)

#### Navigation-Items
- [ ] Aktives Item hat farbigen Akzent-Balken links (4px, primary-color)
- [ ] Aktives Item hat leicht helleren Hintergrund
- [ ] Hover-Effekt: Sanfter Hintergrund-Uebergang (150ms)
- [ ] Icons haben einheitliche Groesse (20x20px statt 16x16px)
- [ ] Transition auf allen Hover-States (smooth)

#### Sektions-Header
- [ ] "Veranstaltungen" als eigene Sektion mit Accent-Hintergrund
- [ ] Sektions-Labels in UPPERCASE und kleinerer Schrift
- [ ] Optional: Badge mit Anzahl anstehender Events

#### Footer
- [ ] Visuell vom Hauptbereich getrennt (Border + Padding)
- [ ] User-Avatar oder Initialen-Badge (optional)
- [ ] Logout-Button mit rotem Hover-State

### Mobile Bottom-Nav

#### Item-Umstrukturierung
- [ ] **Vorstand:** [Dashboard] [Events] [Mitglieder] [Mehr]
- [ ] **Trainer:** [Dashboard] [Events] [Gruppen] [Mehr]
- [ ] **Mitglied:** [Dashboard] [Events] [Termine] [Mehr]

#### Design-Updates
- [ ] Events-Icon erhaelt Accent-Farbe (auch wenn inaktiv)
- [ ] Aktives Item: Filled Icon + Label + Scale-Animation
- [ ] Inaktive Items: Outline Icon + kein Label
- [ ] Events-Icon: CalendarDays (unterscheidet sich von Termine/Calendar)

### Farbschema-Erweiterung

#### Neue CSS-Variablen (globals.css)
- [ ] `--nav-accent`: Farbe fuer Navigations-Akzente (z.B. Vereinsfarbe)
- [ ] `--nav-active-bg`: Hintergrund fuer aktives Item
- [ ] `--nav-hover-bg`: Hintergrund fuer Hover-State
- [ ] `--nav-section-bg`: Hintergrund fuer Sektions-Header

### Konsistenz

- [ ] Desktop und Mobile nutzen gleiche Farbwerte
- [ ] Alle Transitionen haben gleiche Dauer (150ms)
- [ ] Icons sind konsistent (Lucide, gleiche Strichstaerke)
- [ ] Abstande folgen 4px-Grid (4, 8, 12, 16, 20, 24px)

---

## Edge Cases

### E-1: Kein Vereinslogo hochgeladen
- **Szenario:** Verein hat noch kein Logo in Einstellungen hochgeladen
- **Loesung:** Fallback auf Users-Icon (wie aktuell) mit Accent-Hintergrund

### E-2: Sehr langer Vereinsname
- **Szenario:** Vereinsname ist laenger als Sidebar-Breite
- **Loesung:** Text-Overflow mit Ellipsis (...), voller Name im Tooltip

### E-3: Events-Badge-Zahl zu gross
- **Szenario:** 100+ anstehende Events
- **Loesung:** Badge zeigt "99+" an

### E-4: Theme-Wechsel (zukuenftig)
- **Szenario:** Light-Mode wird spaeter eingefuehrt
- **Loesung:** CSS-Variablen-basiert, sodass --nav-accent etc. pro Theme gesetzt werden kann

### E-5: Rolle wechselt waehrend Session
- **Szenario:** User wechselt von Mitglied-Ansicht zu Trainer-Ansicht
- **Loesung:** Bottom-Nav-Items werden dynamisch ausgetauscht (bereits implementiert via activeView)

---

## Technische Anforderungen

### Bestehende Komponenten anpassen

```
src/components/dashboard/app-sidebar.tsx
  - Header-Bereich redesignen
  - Sektions-Trenner hinzufuegen
  - Aktiver-Zustand-Styling erweitern

src/components/navigation/nav-config.ts
  - BOTTOM_NAV_ITEMS anpassen (Events statt Finanzen/Gruppen)

src/components/navigation/bottom-nav-item.tsx
  - Design-Updates fuer Accent-Icon
  - Filled vs Outline Icon-Logik

src/app/globals.css
  - Neue CSS-Variablen hinzufuegen
```

### Keine neuen Komponenten noetig

Das Redesign erfolgt innerhalb bestehender Komponenten. Keine neuen Dateien erforderlich.

### Performance-Vorgaben

- Keine zusaetzlichen Bundle-Groesse durch neue Libraries
- Transitionen per CSS (keine JS-Animationen)
- Logo-Bild: Lazy-Load beibehalten

---

## Menustruktur nach Redesign

### Vorstand

**Sidebar (Desktop):**
```
[LOGO]
Vereinsname
-------------------

Navigation
  Dashboard
  Mein Profil

*** Veranstaltungen *** <- Hervorgehoben
  Events

Administration
  Mitglieder
  User einladen
  Einladungen
  Gruppen
  Dokumente

Finanzverwaltung
  > Finanzen
    - Beitraege
    - Beitragsarten
    - Vereinskasse
    - Kategorien

-------------------
Einstellungen
Abmelden
```

**Bottom-Nav (Mobile):**
```
[Dashboard] [Events] [Mitglieder] [Mehr]
```

**"Mehr"-Menu:**
- Mein Profil
- User einladen
- Einladungen
- Gruppen
- Dokumente
- Finanzen (alle Unter-Items)
- Einstellungen
- Abmelden

---

### Trainer

**Sidebar (Desktop):**
```
[LOGO]
Vereinsname
-------------------

Navigation
  Dashboard
  Mein Profil

*** Veranstaltungen *** <- Hervorgehoben
  Events

Training
  Meine Gruppen
  Trainingsplan
  Anwesenheit

-------------------
Abmelden
```

**Bottom-Nav (Mobile):**
```
[Dashboard] [Events] [Gruppen] [Mehr]
```

---

### Mitglied

**Sidebar (Desktop):**
```
[LOGO]
Vereinsname
-------------------

Navigation
  Dashboard
  Mein Profil

*** Veranstaltungen *** <- Hervorgehoben
  Events

Meine Bereiche
  Meine Gruppen
  Termine
  Dokumente
  Benachrichtigungen

-------------------
Abmelden
```

**Bottom-Nav (Mobile):**
```
[Dashboard] [Events] [Termine] [Mehr]
```

---

## UI/UX Spezifikationen

### Farbwerte (Vorschlag)

```css
/* Neue Navigations-Variablen */
--nav-accent: 217 91% 60%;           /* Blau - wie Primary */
--nav-active-bg: 217 91% 60% / 0.1;  /* Primary mit 10% Opacity */
--nav-hover-bg: 240 14% 14%;         /* Leicht heller als Sidebar-BG */
--nav-section-bg: 217 91% 60% / 0.05;/* Sehr subtiler Accent */

/* Aktiver Balken */
--nav-active-bar: 217 91% 60%;       /* Solid Primary */
```

### Abstande

```
Sidebar-Breite:      256px (unveraendert)
Header-Padding:      16px
Logo-Groesse:        48x48px (statt 32x32px)
Item-Hoehe:          40px (statt 32px)
Item-Padding:        12px horizontal
Icon-Groesse:        20x20px (statt 16x16px)
Aktiv-Balken:        4px breit
Sektions-Spacing:    24px oben, 8px unten
```

### Transitionen

```css
/* Alle Hover-Effekte */
transition: background-color 150ms ease,
            transform 150ms ease,
            color 150ms ease;

/* Aktiv-Balken erscheinen */
transition: width 200ms ease;
```

---

## Nicht im Scope

- Komplett neues Layout (Top-Nav oder Icon-Rail)
- Light-Mode Support (bleibt Dark-Mode only)
- Animation der Sidebar (Expand/Collapse)
- Drag & Drop fuer Menuepunkte
- Custom Theme-Picker fuer Vereinsfarben
- Neue Seiten oder Features (nur visuelles Redesign)

---

## Abhaengigkeiten und Risiken

### Abhaengigkeiten
- PROJ-11 muss deployed sein (Bottom-Nav)
- Logo-Upload in Einstellungen (PROJ-18) sollte funktionieren

### Risiken
- **Gering:** CSS-Variablen koennen mit bestehendem Design kollidieren
  - Mitigation: Neue Variablen mit `--nav-` Prefix
- **Gering:** Bottom-Nav-Umstrukturierung koennte User verwirren
  - Mitigation: Events ist bekannt, nur Position aendert sich

---

## Checkliste vor Abschluss

- [x] Bestehende Navigation analysiert
- [x] Menustruktur geprueft (Events ist bereits vorhanden)
- [x] 3 Design-Optionen mit Vor-/Nachteilen erstellt
- [x] ASCII-Wireframes fuer jede Option
- [x] Empfehlung ausgesprochen (Option A)
- [x] User Stories definiert (5 Stories)
- [x] Acceptance Criteria konkret formuliert
- [x] Edge Cases dokumentiert
- [x] Technische Anforderungen spezifiziert
- [x] Menustruktur pro Rolle dokumentiert
- [x] Feature-ID: PROJ-24
- [x] Status: Planned
- [ ] User Review: Ausstehend

---

## Offene Fragen fuer User-Review

1. **Vereinsfarbe:** Soll die Accent-Farbe (aktuell Blau) durch eine individuelle Vereinsfarbe ersetzbar sein? (Wuerde PROJ-18 Einstellungen erweitern)

2. **Events-Badge:** Soll ein Badge mit der Anzahl anstehender Events in der Sidebar angezeigt werden?

3. **Bottom-Nav Prioritaet:** Ist die vorgeschlagene Umstrukturierung (Events statt Finanzen/Gruppen) akzeptabel?

4. **Logo-Groesse:** Ist 48x48px fuer das Logo gross genug oder soll es noch groesser sein?

5. **Sektions-Design:** Soll "Veranstaltungen" als eigene Sektion oder als hervorgehobenes Item in der Hauptnavigation erscheinen?
