# PROJ-15: Mobile Responsive Optimierung

## Status: Open

## Abhängigkeiten
- Benötigt: PROJ-11 (Mobile Bottom Navigation) - Bottom-Nav muss korrekt berücksichtigt werden
- Betrifft: Alle bestehenden Features (PROJ-1 bis PROJ-14)

## Übersicht
Alle Seiten der App sollen auf mobilen Geräten (ab 375px Viewport-Breite) ohne Zoomen vollständig nutzbar sein. Aktuell gibt es Overflow-Probleme bei Chat, Admin-Seitenheadern, Toolbars, Tabellen und Charts. Elemente ragen über den sichtbaren Bereich hinaus, Buttons sind nicht erreichbar und der Chat-Verlauf ist auf Mobile nicht korrekt sichtbar.

**Betroffene Bereiche:**
- Chat-Seiten (Member + Trainer)
- Admin-Seitenheader (5 Seiten)
- Filter-Toolbars (Beiträge + Vereinskasse)
- Tabellen (Einladungen)
- Dashboard-Profilkarte
- Vereinskasse-Charts
- Gruppen-Formular
- Mitglieder-Tabelle Bulk-Aktionen

---

## User Stories

### US-1: Chat auf Mobile nutzen
**Als** Mitglied einer Gruppe mit aktiviertem Chat
**möchte ich** den Chat-Verlauf und das Eingabefeld auf meinem Smartphone vollständig sehen und nutzen können
**um** Nachrichten lesen und senden zu können, ohne zoomen oder scrollen zu müssen.

### US-2: Admin-Seiten auf Mobile navigieren
**Als** Vorstand
**möchte ich** auf Admin-Seiten den Seitentitel und die Action-Buttons (z.B. "Mitglied anlegen") vollständig sehen
**um** alle Verwaltungsfunktionen auch unterwegs nutzen zu können.

### US-3: Filter und Toolbars auf Mobile bedienen
**Als** Vorstand
**möchte ich** Filter-Dropdowns (Status, Jahr, Zeitraum, Kategorie) auf meinem Smartphone vollständig bedienen können
**um** Beiträge und Kassenbuchungen auch mobil filtern zu können.

### US-4: Tabellen auf Mobile lesen
**Als** Vorstand
**möchte ich** Tabellen (z.B. Einladungen) auf Mobile lesbar sehen
**um** die wichtigsten Informationen ohne horizontales Scrollen erkennen zu können.

### US-5: Dashboard-Profilkarte auf Mobile sehen
**Als** Mitglied
**möchte ich** meine Profilkarte auf dem Dashboard ohne Overflow sehen
**um** meinen Namen, Rolle und Status auf einen Blick zu erkennen.

### US-6: Charts auf Mobile erkennen
**Als** Vorstand
**möchte ich** die Vereinskasse-Charts (Balken- und Tortendiagramm) auf Mobile sinnvoll dargestellt sehen
**um** Finanzdaten auch unterwegs visuell erfassen zu können.

### US-7: Formulare auf Mobile ausfüllen
**Als** Trainer oder Vorstand
**möchte ich** das Gruppenformular (Co-Trainer- und Mitglieder-Listen) auf Mobile bedienen können
**um** Gruppen auch vom Smartphone aus bearbeiten zu können.

### US-8: Bulk-Aktionen auf Mobile nutzen
**Als** Vorstand
**möchte ich** bei der Mitgliederverwaltung die Bulk-Aktionsleiste (Auswahl deaktivieren/aktivieren) auf Mobile nutzen können
**um** mehrere Mitglieder gleichzeitig bearbeiten zu können.

---

## Acceptance Criteria

### 1. Chat-Page (KRITISCH - Priorität 1)

**Betroffene Dateien:**
- `src/components/chat/chat-page.tsx` (Zeile 160)
- `src/components/chat/chat-input.tsx` (Zeile 80-83)
- `src/components/chat/chat-members-sheet.tsx` (Zeile 66)

**Aktuelles Problem:**
- Chat-Container nutzt `h-[calc(100dvh-3.5rem)]` ohne Berücksichtigung der Bottom-Navigation (64px) und des Parent-Paddings (`p-4 pb-20`)
- Eingabefeld wird von der Bottom-Navigation verdeckt
- Chat-Inhalt ragt über den sichtbaren Bereich hinaus

**Kriterien:**
- [ ] Chat-Container füllt genau den verfügbaren Bereich zwischen Header und Bottom-Navigation
- [ ] Eingabefeld ist vollständig sichtbar und über der Bottom-Navigation positioniert
- [ ] Nachrichten-Bereich scrollt korrekt innerhalb des sichtbaren Bereichs
- [ ] Members-Sheet (Mitgliederliste) darf nicht breiter als der Viewport sein (max 90vw)
- [ ] Funktioniert auf `/member/groups/[id]/chat` UND `/trainer/groups/[id]/chat`
- [ ] iOS Safe-Area wird am Eingabefeld korrekt berücksichtigt (bereits vorhanden, verifizieren)

---

### 2. Page Headers responsive (Priorität 2)

**Betroffene Dateien:**
- `src/app/(dashboard)/admin/members/page.tsx` (Zeile 440)
- `src/app/(dashboard)/admin/groups/page.tsx` (Zeile 295)
- `src/app/(dashboard)/admin/finances/fees/page.tsx` (Zeile 981)
- `src/app/(dashboard)/admin/finances/membership-types/page.tsx` (Zeile 144)
- `src/app/(dashboard)/admin/users/invitations/page.tsx` (Zeile 17)

**Nicht betroffen:** Treasury-Seite (nutzt bereits responsives Layout)

**Aktuelles Problem:**
- Alle 5 Seiten nutzen `flex items-center justify-between` ohne Mobile-Wrapping
- Lange Titel (z.B. "Mitgliederverwaltung") + Button überlaufen auf 375px

**Kriterien:**
- [ ] Titel und Action-Buttons stehen auf Mobile (< 640px) untereinander
- [ ] Auf Desktop (>= 640px) bleiben sie nebeneinander
- [ ] Titel-Schriftgröße ist auf Mobile etwas kleiner
- [ ] Fees-Seite: Beide Buttons ("Beiträge generieren" + "Beitrag hinzufügen") wrappen korrekt

---

### 3. Toolbar Select-Widths (Priorität 2)

**Betroffene Dateien:**
- `src/components/finances/fees-toolbar.tsx` (Zeilen 66-123)
- `src/components/finances/treasury-toolbar.tsx` (Zeilen 116-228)

**Aktuelles Problem:**
- Feste Breiten: `w-[140px]`, `w-[160px]`, `w-[200px]` overflow auf 375px Screens
- Filter-Container nutzt `flex-wrap`, aber einzelne Elemente sind zu schmal zum sinnvollen Wrappen

**Kriterien:**
- [ ] Alle Select-Dropdowns nutzen auf Mobile volle Breite (oder halbe Breite in 2-Spalten-Grid)
- [ ] Auf Desktop behalten sie ihre festen Breiten
- [ ] Switch-Toggles (z.B. "Nur offene", "Beiträge anzeigen") stehen auf Mobile in eigener Zeile
- [ ] Benutzerdefinierte Datumseingaben (Treasury) sind auf Mobile voll breit
- [ ] Kein horizontaler Overflow bei 375px Viewport-Breite

---

### 4. Invitations-Table responsive (Priorität 3)

**Betroffene Datei:**
- `src/components/admin/invitations-table.tsx` (Zeilen 113-170)

**Aktuelles Problem:**
- 7 Spalten (Name, Email, Rolle, Status, Erstellt, Gültig bis, Aktionen) ohne responsive Spaltenausblendung
- Tabelle ragt auf Mobile weit über den Viewport hinaus

**Kriterien:**
- [ ] Auf Mobile (< 768px): Email-Spalte ausgeblendet
- [ ] Auf Mobile (< 1024px): Erstellt- und Gültig-bis-Spalten ausgeblendet
- [ ] Sichtbar auf Mobile bleiben: Name, Rolle, Status, Aktionen
- [ ] Tabelle hat horizontalen Scroll-Container als Fallback

---

### 5. Members Bulk-Actions responsive (Priorität 3)

**Betroffene Datei:**
- `src/components/members/members-table.tsx` (Zeilen 197-224)

**Aktuelles Problem:**
- Bulk-Aktionsleiste hat langen Button-Text "Ausgewählte deaktivieren" der auf Mobile überläuft
- Alles in einer Zeile (`flex items-center`) ohne Wrapping

**Kriterien:**
- [ ] Auf Mobile: Info-Text und Buttons stehen untereinander
- [ ] Button-Text ist auf Mobile kürzer (z.B. nur "Deaktivieren")
- [ ] Buttons sind auf Mobile noch gut bedienbar (Touch-Target min 44px)

---

### 6. Profile-Card responsive (Priorität 3)

**Betroffene Datei:**
- `src/components/dashboard/member/profile-card.tsx` (Zeile 33-60)

**Aktuelles Problem:**
- Avatar (64px) + Name + Badges + Edit-Button in einer Zeile (`flex flex-row`) kann auf schmalen Screens überlaufen

**Kriterien:**
- [ ] Avatar ist auf Mobile kleiner (48px statt 64px)
- [ ] Name wird bei Bedarf abgeschnitten (truncate)
- [ ] Titel-Schrift auf Mobile etwas kleiner
- [ ] Edit-Button bleibt erreichbar

---

### 7. Treasury Charts responsive (Priorität 3)

**Betroffene Datei:**
- `src/components/finances/treasury-charts.tsx` (Zeilen 138, 175, 189)

**Aktuelles Problem:**
- Alle Charts haben feste Höhe `h-[300px]` - auf Mobile verschwendet das zu viel Platz
- Pie-Chart-Labels überlappen auf kleinen Screens

**Kriterien:**
- [ ] Chart-Höhe auf Mobile reduziert (ca. 220px statt 300px)
- [ ] Pie-Chart-Labels auf Mobile ausgeblendet (nur Tooltip bei Touch)
- [ ] Pie-Chart Radien auf Mobile kleiner
- [ ] Charts bleiben auf Desktop unverändert (300px)

---

### 8. Group Form ScrollAreas (Priorität 4)

**Betroffene Datei:**
- `src/components/groups/group-form.tsx` (Zeilen 486, 558)

**Aktuelles Problem:**
- Co-Trainer-Liste: `h-[200px]` und Mitglieder-Liste: `h-[300px]` - auf Mobile zu hoch für den Viewport

**Kriterien:**
- [ ] Co-Trainer-ScrollArea auf Mobile kleiner (150px statt 200px)
- [ ] Mitglieder-ScrollArea auf Mobile kleiner (200px statt 300px)
- [ ] Auf Desktop bleiben die Höhen unverändert

---

## Edge Cases

- **Sehr kleine Screens (320px):** Layout darf nicht brechen, ggf. einspaltig
- **iOS Safe-Area (Notch/Dynamic Island):** Chat-Input berücksichtigt bereits `env(safe-area-inset-bottom)`, bei anderen Elementen verifizieren
- **Landscape-Modus:** Nicht primär optimiert, aber Layout darf nicht brechen
- **Lange deutsche Wörter:** "Mitgliederverwaltung", "Ausgewählte deaktivieren" - Text muss wrappen oder gekürzt werden
- **Bottom-Navigation-Höhe:** 64px (h-16) + safe-area - muss bei allen Full-Screen-Layouts berücksichtigt werden

---

## Nicht im Scope

- Desktop-Layout-Änderungen (dürfen nicht negativ beeinflusst werden)
- Neue Features oder Funktionalität
- Performance-Optimierung
- PWA oder native Mobile-Features
- Tablet-spezifische Layouts (folgen den bestehenden Breakpoints)

---

## Tech-Design (Solution Architect)

### Architektur-Analyse: Was existiert bereits?

Die App hat bereits ein solides Mobile-Fundament:
- **Bottom-Navigation** ist implementiert (fixiert am unteren Rand, nur auf Mobile sichtbar)
- **Dashboard-Layout** hat bereits Mobile-Padding (`pb-20`) für die Bottom-Nav
- **ResponsiveDialog** wechselt automatisch zwischen Desktop-Dialog und Mobile-Bottom-Sheet
- **ResponsiveTable** zeigt auf Mobile Karten statt Tabellen (bei Groups + Members teilweise)
- **useIsMobile Hook** erkennt Mobile-Geräte (Breakpoint 768px)
- **Sidebar** wird auf Mobile als ausklappbare Schublade dargestellt

**Kern-Problem:** 15 Dateien nutzen diese bestehenden Patterns noch nicht konsequent. Es werden keine neuen Patterns oder Libraries eingeführt - alles wird mit den vorhandenen Tailwind-Breakpoints gelöst.

---

### Component-Struktur pro Bereich

#### Bereich 1: Chat (KRITISCH)

```
Chat-Seite (Vollbild-Layout)
├── Chat-Header (Gruppenname + Mitglieder-Button)
├── Nachrichten-Bereich (scrollbar, füllt den Platz ZWISCHEN Header und Eingabe)
├── Eingabefeld (fixiert ÜBER der Bottom-Navigation)
│   └── Textfeld + Senden-Button + Zeichenzähler
└── Mitglieder-Seitenleiste (Slide-In von rechts)
    └── Breite: max 90% des Bildschirms auf Mobile (statt fest 300px)
```

**Was sich ändert:**
- Chat-Container berücksichtigt die Bottom-Navigation (64px + Safe-Area) und das Parent-Padding
- Eingabefeld liegt auf Mobile immer ÜBER der Bottom-Nav, nicht darunter
- Mitglieder-Sheet wird auf kleinen Screens auf max 90% Viewport-Breite begrenzt

---

#### Bereich 2: Admin-Seitenheader (5 Seiten)

**Aktuell (bricht auf Mobile):**
```
[  Mitgliederverwaltung  --------  [+ Mitglied anlegen]  ]
← alles in einer Zeile, überläuft bei 375px →
```

**Neu auf Mobile (< 640px):**
```
Mitgliederverwaltung          ← Titel oben, kleinere Schrift
Untertitel...
[+ Mitglied anlegen]          ← Button darunter, volle Breite
```

**Auf Desktop (>= 640px):**
```
[  Mitgliederverwaltung  --------  [+ Mitglied anlegen]  ]
← bleibt wie bisher →
```

**Sonderfall Beiträge-Seite (2 Buttons):**
```
Mobile:                        Desktop:
Beiträge 2024                  [Beiträge 2024 --- [Generieren] [Hinzufügen]]
[Beiträge generieren]
[Beitrag hinzufügen]
```

**Betroffene Seiten (alle gleiches Pattern):**
- Mitgliederverwaltung
- Gruppenverwaltung
- Beiträge (mit 2 Buttons)
- Beitragsarten
- Einladungen

---

#### Bereich 3: Filter-Toolbars (Beiträge + Vereinskasse)

**Aktuell (feste Breiten, überläuft):**
```
[ Suche... ] [ Status ▼ 140px ] [ Jahr ▼ 100px ] [ Toggle ] [ Ansicht ]
← fest dimensionierte Dropdowns überlaufen →
```

**Neu auf Mobile (< 640px):**
```
[ Suche...                                    ]    ← volle Breite
[ Status ▼          ] [ Jahr ▼               ]    ← 2-Spalten-Grid
[ ○ Nur offene anzeigen                      ]    ← eigene Zeile
[ Ansicht: Alle | Familien                   ]    ← eigene Zeile
```

**Vereinskasse-Toolbar auf Mobile:**
```
[ Suche...                                    ]    ← volle Breite
[ Zeitraum ▼        ] [ Typ ▼               ]    ← 2-Spalten-Grid
[ Kategorien ▼                               ]    ← volle Breite
[ ○ Beiträge anzeigen                        ]    ← eigene Zeile
Benutzerdefinierte Datumsauswahl:
[ Von: Datum         ] [ Bis: Datum          ]    ← 2-Spalten-Grid
```

**Auf Desktop:** Alles bleibt wie bisher (feste Breiten in einer Zeile).

---

#### Bereich 4: Einladungen-Tabelle

**Spalten-Sichtbarkeit nach Breakpoint:**

| Spalte | Mobile (<768px) | Tablet (<1024px) | Desktop |
|--------|-----------------|-------------------|---------|
| Name | Sichtbar | Sichtbar | Sichtbar |
| Email | Ausgeblendet | Sichtbar | Sichtbar |
| Rolle | Sichtbar | Sichtbar | Sichtbar |
| Status | Sichtbar | Sichtbar | Sichtbar |
| Erstellt | Ausgeblendet | Ausgeblendet | Sichtbar |
| Gültig bis | Ausgeblendet | Ausgeblendet | Sichtbar |
| Aktionen | Sichtbar | Sichtbar | Sichtbar |

Zusätzlich: Horizontaler Scroll-Container als Fallback (wie bei MembersTable bereits umgesetzt).

---

#### Bereich 5: Bulk-Aktionsleiste (Mitglieder)

**Aktuell:**
```
[ 3 ausgewählt --- [Ausgewählte deaktivieren] [Abbrechen] ]
← lange Button-Texte überlaufen →
```

**Neu auf Mobile:**
```
3 ausgewählt
[Deaktivieren] [Abbrechen]     ← kürzere Texte, untereinander
```

Touch-Ziele bleiben min. 44px hoch für gute Bedienbarkeit.

---

#### Bereich 6: Dashboard-Profilkarte

**Aktuell:**
```
[ [Avatar 64px] Name + Badges ---- [✎] ]
← Avatar + langer Name + Badges überlaufen →
```

**Neu auf Mobile:**
```
[ [Avatar 48px] Name (gekürzt...) ---- [✎] ]
                Badges
```

- Avatar wird auf Mobile von 64px auf 48px verkleinert
- Name wird bei Bedarf abgeschnitten (mit "...")
- Schriftgröße auf Mobile etwas kleiner

---

#### Bereich 7: Vereinskasse-Charts

**Aktuell:**
```
[  Balkendiagramm  |  300px hoch  ]
[  Tortendiagramm  |  300px hoch  ]
← Charts zu hoch für Mobile, Labels überlappen →
```

**Neu auf Mobile:**
```
[  Balkendiagramm  |  220px hoch  ]    ← reduzierte Höhe
[  Tortendiagramm  |  220px hoch  ]    ← reduzierte Höhe
     (Labels ausgeblendet,              ← nur bei Touch als Tooltip
      kleinerer Radius)
```

Auf Desktop bleiben Charts bei 300px Höhe.

---

#### Bereich 8: Gruppen-Formular ScrollAreas

**Aktuell:**
```
Co-Trainer Liste:  200px ScrollArea
Mitglieder Liste:  300px ScrollArea
← auf Mobile nehmen die Listen zu viel Viewport-Höhe ein →
```

**Neu auf Mobile:**
```
Co-Trainer Liste:  150px ScrollArea    ← reduziert
Mitglieder Liste:  200px ScrollArea    ← reduziert
```

Auf Desktop bleiben die Höhen unverändert.

---

### Daten-Model

Kein neues Daten-Model nötig. Es werden keine neuen Datenbank-Tabellen, API-Endpoints oder Speicher-Mechanismen benötigt. Alle Änderungen betreffen ausschließlich die Darstellung (CSS/Tailwind-Klassen).

---

### Tech-Entscheidungen

**Warum nur Tailwind-Breakpoints (kein JavaScript-Resize)?**
→ Tailwind-responsive-Klassen (`sm:`, `md:`, `lg:`) sind performanter als JavaScript-basierte Lösungen. Sie werden direkt vom Browser per CSS Media Query gehandhabt - kein Re-Render nötig.

**Warum kein neuer "ResponsivePageHeader"-Component?**
→ Die 5 betroffenen Page-Headers sind einfache Flex-Container. Statt eine neue Abstraktion zu schaffen, werden die bestehenden Tailwind-Klassen um Mobile-Varianten ergänzt. Das ist weniger Aufwand und leichter zu verstehen.

**Warum das bestehende `hidden md:table-cell`-Pattern für die Einladungen-Tabelle?**
→ Die MembersTable nutzt genau dieses Pattern bereits erfolgreich. Konsistenz im Projekt ist wichtiger als eine alternative Lösung.

**Warum Chat-Höhe per CSS `calc()` statt JavaScript?**
→ `calc(100dvh - Header - BottomNav - Padding)` ist die performanteste Lösung. `dvh` (Dynamic Viewport Height) berücksichtigt automatisch die Browser-Adressleiste auf Mobile.

**Warum `useIsMobile` Hook für Charts?**
→ Recharts (die Chart-Library) benötigt JavaScript-Properties für Radius und Label-Konfiguration. Hier ist der bestehende Hook die passende Lösung, da reine CSS-Klassen nicht ausreichen.

---

### Dependencies

Keine neuen Packages nötig. Alle Änderungen nutzen ausschließlich:
- Tailwind CSS (bereits vorhanden) - responsive Breakpoint-Klassen
- Recharts (bereits vorhanden) - responsive Chart-Properties
- useIsMobile Hook (bereits vorhanden) - für Chart-Anpassungen

---

### Implementierungs-Reihenfolge

| Phase | Bereich | Dateien | Priorität |
|-------|---------|---------|-----------|
| 1 | Chat-Seite | 3 Dateien | KRITISCH |
| 2 | Page Headers + Toolbars | 7 Dateien | HOCH |
| 3 | Tabelle + Bulk-Actions + Profilkarte + Charts | 4 Dateien | MITTEL |
| 4 | Gruppen-Formular | 1 Datei | NIEDRIG |

**Gesamt:** 15 Dateien, 0 neue Components, 0 neue Packages

---

## Technische Referenz (für Solution Architect)

### Bestehendes Mobile-Setup (funktioniert bereits gut):
- **Bottom-Navigation:** `src/components/navigation/bottom-nav.tsx` - `fixed inset-x-0 bottom-0 z-50 md:hidden`
- **Sidebar:** Wird auf Mobile als Sheet/Drawer angezeigt (< md Breakpoint)
- **Dashboard Layout:** `src/app/(dashboard)/layout.tsx` - `<main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">`
- **ResponsiveDialog:** `src/components/ui/responsive-dialog.tsx` - Dialog auf Desktop, Bottom-Sheet auf Mobile
- **ResponsiveTable:** `src/components/ui/responsive-table.tsx` - Karten auf Mobile, Tabelle auf Desktop
- **useIsMobile Hook:** `src/hooks/use-mobile.tsx` - Breakpoint bei 768px
- **MembersTable:** Nutzt bereits `hidden md:table-cell` für Spalten-Hiding
- **GroupsTable:** Nutzt bereits ResponsiveTable-Component

### Tailwind Breakpoints (Standard, keine Custom):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Zusammenfassung betroffener Dateien:

| # | Datei | Priorität | Problem |
|---|-------|-----------|---------|
| 1 | `src/components/chat/chat-page.tsx` | KRITISCH | Höhe berücksichtigt Bottom-Nav nicht |
| 2 | `src/components/chat/chat-input.tsx` | KRITISCH | Eingabefeld unter Bottom-Nav |
| 3 | `src/components/chat/chat-members-sheet.tsx` | MITTEL | Max-Width fehlt |
| 4 | `src/app/(dashboard)/admin/members/page.tsx` | HOCH | Header overflow |
| 5 | `src/app/(dashboard)/admin/groups/page.tsx` | HOCH | Header overflow |
| 6 | `src/app/(dashboard)/admin/finances/fees/page.tsx` | HOCH | Header overflow + 2 Buttons |
| 7 | `src/app/(dashboard)/admin/finances/membership-types/page.tsx` | HOCH | Header overflow |
| 8 | `src/app/(dashboard)/admin/users/invitations/page.tsx` | HOCH | Header overflow |
| 9 | `src/components/finances/fees-toolbar.tsx` | HOCH | Select-Breiten fest |
| 10 | `src/components/finances/treasury-toolbar.tsx` | HOCH | Select-Breiten fest |
| 11 | `src/components/admin/invitations-table.tsx` | MITTEL | Keine Spalten-Ausblendung |
| 12 | `src/components/members/members-table.tsx` | MITTEL | Bulk-Actions overflow |
| 13 | `src/components/dashboard/member/profile-card.tsx` | MITTEL | Avatar + Name overflow |
| 14 | `src/components/finances/treasury-charts.tsx` | MITTEL | Charts zu groß |
| 15 | `src/components/groups/group-form.tsx` | NIEDRIG | ScrollAreas zu hoch |
