# PROJ-4: Mitgliederverwaltung (Member & Family Management)

## Status: ✅ Deployed (2026-01-25)

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - bereits implementiert
- Benötigt: PROJ-2 (Dark Theme) - für konsistentes Design
- Benötigt: PROJ-3 (Role-Based Dashboards) - für Sidebar-Navigation und Berechtigungen

## Übersicht
Zentrale Verwaltung aller Vereinsmitglieder inkl. Familien-Gruppierung. Dieses Feature ist Teil von **CORE-01** aus der Projekt-Roadmap und bildet das Fundament für alle weiteren Features (Finanzen, Gruppen, Events).

**Route:** `/admin/members` (nur für Board-Rolle)

---

## User Stories

### Mitglieder-Verwaltung

#### US-1: Mitglieder-Übersicht
**Als** Vorstandsmitglied
**möchte ich** alle Vereinsmitglieder in einer übersichtlichen Tabelle sehen
**um** schnell einen Überblick über den Mitgliederstand zu bekommen.

#### US-2: Mitglieder suchen und filtern
**Als** Vorstandsmitglied
**möchte ich** Mitglieder nach Namen, E-Mail, Rolle oder Status suchen und filtern
**um** bestimmte Personen schnell zu finden.

#### US-3: Neues Mitglied anlegen
**Als** Vorstandsmitglied
**möchte ich** neue Mitglieder manuell anlegen können (ohne Einladung)
**um** auch Personen ohne E-Mail-Zugang im System zu erfassen (z.B. Kinder).

#### US-4: Mitglied bearbeiten
**Als** Vorstandsmitglied
**möchte ich** die Daten eines Mitglieds bearbeiten können
**um** Änderungen wie Adresse, Telefonnummer oder Rolle zu aktualisieren.

#### US-5: Mitglied deaktivieren
**Als** Vorstandsmitglied
**möchte ich** ein Mitglied deaktivieren (statt löschen) können
**um** die Daten für Buchhaltung/Historie zu erhalten, aber den Zugang zu sperren.

### Familien-Verwaltung

#### US-6: Familie erstellen
**Als** Vorstandsmitglied
**möchte ich** mehrere Mitglieder zu einer Familie gruppieren
**um** zusammengehörige Personen gemeinsam abrechnen zu können.

#### US-7: Primärkontakt festlegen
**Als** Vorstandsmitglied
**möchte ich** ein Familienmitglied als Primärkontakt (Familienoberhaupt) markieren
**um** zu wissen, an wen Rechnungen und wichtige Kommunikation geht.

#### US-8: Familien-Übersicht
**Als** Vorstandsmitglied
**möchte ich** alle Familien und deren Mitglieder sehen
**um** Familien-Zusammenstellungen zu überprüfen und zu verwalten.

---

## Acceptance Criteria

### Mitglieder-Tabelle (Hauptansicht)
- [ ] **Spalten:** Checkbox, Name (Vor- + Nachname), E-Mail, Rollen (Tags), Familie, Status, Aktionen
- [ ] **Sortierung:** Klickbare Spaltenköpfe für Name, E-Mail, Status, Beitrittsdatum
- [ ] **Suche:** Suchfeld durchsucht Name und E-Mail (Echtzeit, min. 2 Zeichen)
- [ ] **Filter-Optionen:**
  - Rolle: Board, Trainer, Member (Multi-Select)
  - Status: Aktiv, Inaktiv, Ausstehend (Einladung offen)
  - Familie: Mit Familie, Ohne Familie
- [ ] **Pagination:** 20 Einträge pro Seite, Seitenwechsel unten
- [ ] **Bulk-Aktionen:** Checkbox-Selektion für Mehrfachauswahl (z.B. mehrere deaktivieren)
- [ ] **Responsive:** Auf Mobile werden weniger Spalten angezeigt, Rest über Swipe oder Detail-View

### Mitglied anlegen (Modal oder Slide-Over)
- [ ] **Pflichtfelder:**
  - Vorname
  - Nachname
  - Geburtsdatum
  - Systemrolle (Dropdown: Board, Trainer, Member)
- [ ] **Optionale Felder:**
  - E-Mail (optional für Kinder ohne eigene E-Mail)
  - Telefonnummer
  - Adresse (Straße, PLZ, Ort)
  - Funktionale Tags (Multi-Select: Tänzer, Trainer, Helfer, etc.)
  - Familie zuweisen (Dropdown bestehender Familien)
  - Notizen (Freitext)
- [ ] **Validierung:**
  - E-Mail-Format prüfen (wenn angegeben)
  - Geburtsdatum nicht in der Zukunft
  - Vorname und Nachname mindestens 2 Zeichen
- [ ] **Speichern:** Button "Mitglied anlegen" → Erfolgs-Toast → Tabelle aktualisieren

### Mitglied bearbeiten (Modal oder Slide-Over)
- [ ] Öffnet sich durch Klick auf "Bearbeiten" in der Aktions-Spalte
- [ ] Alle Felder vorausgefüllt mit aktuellen Daten
- [ ] Änderungen werden erst bei "Speichern" übernommen
- [ ] Abbrechen-Button schließt ohne Änderungen

### Mitglied deaktivieren/aktivieren
- [ ] Button "Deaktivieren" in Aktions-Spalte (für aktive Mitglieder)
- [ ] Button "Aktivieren" für inaktive Mitglieder
- [ ] Bestätigungs-Dialog vor Deaktivierung: "Mitglied [Name] wirklich deaktivieren?"
- [ ] Deaktivierte Mitglieder:
  - Können sich nicht mehr einloggen
  - Erscheinen ausgegraut in der Tabelle
  - Bleiben in der Datenbank erhalten
- [ ] **Kein hartes Löschen** - nur Deaktivierung (Soft Delete)

### Familien-Bereich (Tab oder Abschnitt auf gleicher Seite)
- [ ] **Toggle/Tab:** Umschalten zwischen "Mitglieder" und "Familien"-Ansicht
- [ ] **Familien-Liste:** Collapsible Cards pro Familie
  - Familie-Name (bearbeitbar)
  - Anzahl Mitglieder
  - Primärkontakt markiert (Stern-Icon)
  - Expandieren zeigt alle Familienmitglieder
- [ ] **Familie erstellen (Modal):**
  - Familienname eingeben
  - Mitglieder auswählen (Multi-Select aus bestehenden Mitgliedern)
  - Primärkontakt auswählen (aus ausgewählten Mitgliedern)
- [ ] **Familie bearbeiten:**
  - Mitglieder hinzufügen/entfernen
  - Primärkontakt ändern
  - Familienname ändern
- [ ] **Familie auflösen:**
  - Bestätigungs-Dialog
  - Mitglieder bleiben erhalten, nur Familien-Verknüpfung wird gelöst

### Mitglied einer Familie zuweisen
- [ ] Im Mitglied-Bearbeiten-Dialog: Dropdown "Familie" mit Option "Neue Familie erstellen"
- [ ] Schnellaktion in Tabelle: "Zur Familie hinzufügen" (öffnet Familien-Auswahl)
- [ ] Drag & Drop in Familien-Ansicht (optional, nice-to-have)

---

## Edge Cases

### Mitglieder
- **Doppelte E-Mail?** → Fehler: "Diese E-Mail ist bereits vergeben"
- **Mitglied ohne E-Mail bearbeiten?** → Funktioniert normal, E-Mail bleibt leer
- **Deaktiviertes Mitglied einladen?** → Erst aktivieren, dann einladen (Hinweis anzeigen)
- **Mitglied ist in Gruppe und wird deaktiviert?** → Bleibt in Gruppen-Historie, wird aber als "inaktiv" markiert
- **Mitglied hat offene Einladung und wird manuell angelegt?** → Warnung: "Offene Einladung für diese E-Mail existiert"

### Familien
- **Familie mit nur 1 Mitglied?** → Erlaubt (z.B. Alleinstehende)
- **Mitglied aus Familie entfernen und ist Primärkontakt?** → Neuen Primärkontakt zuweisen (Pflicht vor Entfernen)
- **Familie löschen mit zugeordneten Rechnungen?** → Verhindert (oder Warning mit Bestätigung)
- **Zwei Familien zusammenführen?** → Nicht im MVP, manuell über Mitglieder-Bearbeitung

### Performance
- **Verein mit 500+ Mitgliedern?** → Server-Side Pagination, nicht alle auf einmal laden
- **Viele Filter aktiv?** → Kombinierte Filter funktionieren (UND-Verknüpfung)

---

## Technische Anforderungen

### Datenbank-Schema

```sql
-- Erweiterung der profiles Tabelle (aus PROJ-1)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  address_street TEXT,
  address_zip TEXT,
  address_city TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'pending'
  functional_tags TEXT[], -- ['dancer', 'trainer', 'helper']
  family_id UUID REFERENCES families(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW();

-- Familien Tabelle
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  primary_member_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
-- Nur Board kann alle Mitglieder sehen
-- Trainer können nur Mitglieder ihrer Gruppen sehen
-- Member können nur sich selbst sehen
```

### API-Endpunkte

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/members` | Liste aller Mitglieder (paginiert, filterbar) |
| GET | `/api/members/:id` | Einzelnes Mitglied |
| POST | `/api/members` | Neues Mitglied anlegen |
| PATCH | `/api/members/:id` | Mitglied bearbeiten |
| PATCH | `/api/members/:id/status` | Status ändern (activate/deactivate) |
| GET | `/api/families` | Liste aller Familien |
| POST | `/api/families` | Familie erstellen |
| PATCH | `/api/families/:id` | Familie bearbeiten |
| DELETE | `/api/families/:id` | Familie auflösen |

### Komponenten-Struktur

```
src/
├── app/
│   └── (dashboard)/
│       └── admin/
│           └── members/
│               └── page.tsx           # Hauptseite Mitgliederverwaltung
├── components/
│   └── members/
│       ├── members-table.tsx          # DataTable mit Suche/Filter
│       ├── member-form.tsx            # Anlegen/Bearbeiten Formular
│       ├── member-status-toggle.tsx   # Aktivieren/Deaktivieren
│       ├── families-list.tsx          # Familien-Übersicht
│       ├── family-form.tsx            # Familie anlegen/bearbeiten
│       └── family-member-select.tsx   # Multi-Select für Familienmitglieder
```

### Validierung (Zod Schema)

```typescript
const memberSchema = z.object({
  first_name: z.string().min(2, "Mindestens 2 Zeichen"),
  last_name: z.string().min(2, "Mindestens 2 Zeichen"),
  date_of_birth: z.date().max(new Date(), "Datum kann nicht in der Zukunft liegen"),
  email: z.string().email().optional().or(z.literal("")),
  system_role: z.enum(["board", "trainer", "member"]),
  functional_tags: z.array(z.string()).optional(),
  family_id: z.string().uuid().optional(),
  // ...weitere Felder
});
```

---

## UI/UX Spezifikationen

### Layout der Seite
```
┌─────────────────────────────────────────────────────────┐
│ Header: "Mitgliederverwaltung"          [+ Mitglied]    │
├─────────────────────────────────────────────────────────┤
│ [Mitglieder] [Familien]    ← Tabs                       │
├─────────────────────────────────────────────────────────┤
│ [🔍 Suche...]  [Filter ▼]  [Sortierung ▼]              │
├─────────────────────────────────────────────────────────┤
│ ☐ │ Name          │ E-Mail        │ Rolle │ Status │ ⋮ │
│ ☐ │ Max Mustermann│ max@email.de  │ Member│ Aktiv  │ ⋮ │
│ ☐ │ Lisa Schmidt  │ lisa@email.de │ Board │ Aktiv  │ ⋮ │
│ ...                                                     │
├─────────────────────────────────────────────────────────┤
│ Seite 1 von 5                           [◀] [▶]        │
└─────────────────────────────────────────────────────────┘
```

### Status-Badges
- **Aktiv:** Grüner Badge (dezent)
- **Inaktiv:** Grauer Badge
- **Ausstehend:** Gelber Badge

### Rollen-Tags
- **Board:** Blauer Tag mit Shield-Icon
- **Trainer:** Oranger Tag mit Whistle-Icon
- **Member:** Grauer Tag mit User-Icon

---

## Nicht im Scope

- Import/Export von Mitgliedern (CSV)
- Profil-Foto Upload
- E-Mail direkt aus der Tabelle senden
- Aktivitäts-Historie pro Mitglied
- Automatische Geburtstags-Benachrichtigungen

---

## Tech-Design (Solution Architect)

> **Letzte Aktualisierung:** 25.01.2026
> **Basiert auf:** Analyse der bestehenden Codebase (PROJ-1, PROJ-2, PROJ-3)

---

### Bestehende Infrastruktur (wiederverwendbar)

| Komponente | Status | Beschreibung |
|------------|--------|--------------|
| `profiles`-Tabelle | ✅ Vorhanden | Muss um 6 Felder erweitert werden |
| shadcn/ui Komponenten | ✅ 35 Stück | Table, Dialog, Form, Tabs, Badge, etc. |
| `invitations-table.tsx` | ✅ Referenz | Pattern für Tabellen mit Actions |
| `recent-members-table.tsx` | ✅ Referenz | Zeigt bereits Mitglieder-Daten |
| RLS mit `is_vorstand()` | ✅ Vorhanden | Berechtigungsprüfung existiert |
| Dark Theme | ✅ PROJ-2 | Alle neuen Komponenten automatisch themed |

---

### Component-Struktur

```
Mitgliederverwaltung (/admin/members)
│
├── 📄 Seiten-Header
│   ├── Titel "Mitgliederverwaltung"
│   └── [+ Mitglied anlegen] Button (öffnet Modal)
│
├── 🔀 Tab-Navigation
│   ├── [👥 Mitglieder] ← Hauptansicht (Default)
│   └── [👨‍👩‍👧‍👦 Familien] ← Familien-Gruppierung
│
├── 👥 MITGLIEDER-TAB
│   │
│   ├── 🔍 Toolbar (Such- und Filterleiste)
│   │   ├── Suchfeld (durchsucht Name + E-Mail)
│   │   ├── Filter: Rolle (Vorstand / Trainer / Mitglied)
│   │   ├── Filter: Status (Aktiv / Inaktiv / Ausstehend)
│   │   └── Filter: Familie (Mit Familie / Ohne Familie)
│   │
│   ├── 📊 Mitglieder-Tabelle
│   │   ├── Spalten:
│   │   │   ├── ☐ Checkbox (für Bulk-Aktionen)
│   │   │   ├── Name (Vor- + Nachname, sortierbar)
│   │   │   ├── E-Mail
│   │   │   ├── Rolle (farbige Badges)
│   │   │   ├── Familie (Link zur Familie oder "–")
│   │   │   ├── Status (Aktiv/Inaktiv/Ausstehend Badge)
│   │   │   └── ⋮ Aktionen (Bearbeiten, Deaktivieren)
│   │   │
│   │   └── Pagination (20 pro Seite, Server-Side)
│   │
│   └── 📝 Mitglied-Formular (Modal/Sheet)
│       ├── Pflichtfelder:
│       │   ├── Vorname
│       │   ├── Nachname
│       │   ├── Geburtsdatum (Datepicker)
│       │   └── Systemrolle (Dropdown)
│       │
│       └── Optionale Felder:
│           ├── E-Mail (für Kinder optional)
│           ├── Telefon
│           ├── Adresse (Straße, PLZ, Ort)
│           ├── Funktionale Tags (Multi-Select: Tänzer, Helfer...)
│           ├── Familie zuweisen (Dropdown)
│           └── Notizen (Freitext)
│
└── 👨‍👩‍👧‍👦 FAMILIEN-TAB
    │
    ├── 🔍 Suchfeld (durchsucht Familiennamen)
    │
    ├── 📋 Familien-Liste (aufklappbare Karten)
    │   │
    │   └── Pro Familie:
    │       ├── Familienname (editierbar)
    │       ├── Anzahl Mitglieder (Badge)
    │       ├── ⭐ Primärkontakt markiert
    │       ├── [▼] Aufklappen zeigt alle Mitglieder
    │       └── ⋮ Aktionen (Bearbeiten, Auflösen)
    │
    └── 📝 Familie-Formular (Modal)
        ├── Familienname eingeben
        ├── Mitglieder auswählen (Multi-Select Combobox)
        └── Primärkontakt festlegen (aus gewählten Mitgliedern)
```

---

### Daten-Model

#### Mitglieder (Erweiterung der bestehenden `profiles`-Tabelle)

| Feld | Aktueller Status | Aktion |
|------|------------------|--------|
| first_name | ✅ Vorhanden | Behalten |
| last_name | ✅ Vorhanden | Behalten |
| date_of_birth | ✅ Vorhanden | Behalten |
| phone | ✅ Vorhanden | Behalten |
| role | ✅ Vorhanden | Behalten (vorstand/trainer/mitglied) |
| is_active | ✅ Vorhanden | → Wird zu `status` migriert |
| **address_street** | 🆕 NEU | Straße + Hausnummer |
| **address_zip** | 🆕 NEU | Postleitzahl |
| **address_city** | 🆕 NEU | Stadt/Ort |
| **functional_tags** | 🆕 NEU | Liste: "Tänzer", "Trainer", "Helfer", etc. |
| **family_id** | 🆕 NEU | Verknüpfung zur Familie |
| **notes** | 🆕 NEU | Freitext für interne Notizen |
| **status** | 🆕 NEU | "active", "inactive", "pending" |

#### Familien (NEUE Tabelle)

| Information | Beschreibung |
|-------------|--------------|
| Familienname | z.B. "Familie Müller" |
| Primärkontakt | Das Mitglied, das Rechnungen/Kommunikation erhält |
| Mitglieder | Über `family_id` in profiles verknüpft (1:n Beziehung) |

---

### Tech-Entscheidungen

| Entscheidung | Begründung (für Produktmanager) |
|--------------|--------------------------------|
| **Tabs statt separate Seiten** | Mitglieder und Familien gehören logisch zusammen. User kann schnell zwischen den Ansichten wechseln ohne die Seite neu zu laden. |
| **Server-Side Pagination** | Ein Verein kann 500+ Mitglieder haben. Alle auf einmal laden würde die Seite langsam machen. Wir laden immer nur 20 Stück. |
| **Soft-Delete (Deaktivieren statt Löschen)** | Buchhaltung und Historie brauchen die alten Daten. Deaktivierte Mitglieder können später wieder aktiviert werden. |
| **Modal/Sheet für Formulare** | Der User sieht die Tabelle im Hintergrund und verliert nicht den Kontext. Schnelleres Arbeiten als separate Seite. |
| **E-Mail optional** | Kinder haben oft keine eigene E-Mail. Das System muss auch ohne funktionieren. |
| **Funktionale Tags statt Rollen** | Die Systemrolle (Vorstand/Trainer/Mitglied) bestimmt Berechtigungen. Tags wie "Tänzer" oder "Helfer" sind nur zur Organisation. |
| **Familie als eigene Tabelle** | Familien können einen Namen haben und einen Primärkontakt. Das geht nicht mit einer einfachen Gruppierung. |

---

### Dependencies (Packages)

**Keine neuen Packages nötig!**

Alle benötigten Komponenten sind bereits vorhanden:
- shadcn/ui: Table, Dialog, Sheet, Form, Tabs, Badge, Checkbox, Combobox
- React Hook Form + Zod (bereits für Auth-Formulare im Einsatz)
- Supabase Client (bereits konfiguriert)

---

### Datenbank-Änderungen (Übersicht)

1. **Migration 1:** `profiles`-Tabelle um 7 Felder erweitern
2. **Migration 2:** Neue `families`-Tabelle erstellen
3. **Migration 3:** RLS-Policies für Familien (nur Vorstand darf alles sehen)
4. **Migration 4:** `is_active` zu `status` migrieren (Daten-Migration)

---

### Implementierungs-Reihenfolge

| Phase | Was wird gebaut | Abhängigkeit |
|-------|-----------------|--------------|
| **Phase 1** | Datenbank-Migrationen | – |
| **Phase 2** | Mitglieder-Tabelle mit Suche + Filter | Phase 1 |
| **Phase 3** | Mitglied anlegen/bearbeiten Formulare | Phase 2 |
| **Phase 4** | Mitglied aktivieren/deaktivieren | Phase 3 |
| **Phase 5** | Familien-Tab mit Familien-Liste | Phase 1 |
| **Phase 6** | Familie anlegen/bearbeiten/auflösen | Phase 5 |

---

### Datei-Struktur (für Entwickler)

```
src/
├── app/(dashboard)/admin/members/
│   └── page.tsx                    # Hauptseite
│
├── components/members/
│   ├── members-table.tsx           # DataTable mit Toolbar
│   ├── members-toolbar.tsx         # Suche + Filter
│   ├── member-form.tsx             # Anlegen/Bearbeiten Modal
│   ├── member-status-badge.tsx     # Status-Anzeige
│   ├── member-actions.tsx          # Dropdown-Menü pro Zeile
│   ├── families-list.tsx           # Aufklappbare Familien-Karten
│   ├── family-card.tsx             # Einzelne Familie
│   ├── family-form.tsx             # Familie anlegen/bearbeiten
│   └── family-member-select.tsx    # Multi-Select für Mitglieder
│
└── lib/
    └── validations/
        └── member.ts               # Zod Schemas
```

---

## Checkliste vor Abschluss

- [x] User Stories definiert (8 Stories)
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases identifiziert
- [x] Technische Anforderungen dokumentiert
- [x] Feature-ID vergeben: PROJ-4
- [x] Status gesetzt: Planned
- [ ] User Review: Ausstehend

---

## QA Test Results

**Tested:** 2026-01-25
**Tester:** QA Engineer Agent
**App URL:** http://localhost:3000
**Supabase Project:** pktiznslnkgctbuaugqw (vereins-management)

---

### Implementation Status

**Status: IMPLEMENTED**

Die Implementierung ist vorhanden mit folgenden Dateien:

| Komponente | Datei | Status |
|------------|-------|--------|
| Hauptseite | `src/app/(dashboard)/admin/members/page.tsx` | Vorhanden |
| Mitglieder-Tabelle | `src/components/members/members-table.tsx` | Vorhanden |
| Mitglieder-Toolbar | `src/components/members/members-toolbar.tsx` | Vorhanden |
| Mitglieder-Formular | `src/components/members/member-form.tsx` | Vorhanden |
| Status-Badge | `src/components/members/member-status-badge.tsx` | Vorhanden |
| Pagination | `src/components/members/members-pagination.tsx` | Vorhanden |
| Familien-Liste | `src/components/members/families-list.tsx` | Vorhanden |
| Familien-Formular | `src/components/members/family-form.tsx` | Vorhanden |
| API: Members | `src/app/api/members/route.ts` | Vorhanden |
| API: Member by ID | `src/app/api/members/[id]/route.ts` | Vorhanden |
| API: Member Status | `src/app/api/members/[id]/status/route.ts` | Vorhanden |
| API: Families | `src/app/api/families/route.ts` | Vorhanden |
| API: Family by ID | `src/app/api/families/[id]/route.ts` | Vorhanden |
| Validierung | `src/lib/validations/member.ts` | Vorhanden |
| DB: profiles | Supabase | Erweitert mit allen Feldern |
| DB: families | Supabase | Vorhanden |

---

### Acceptance Criteria Status

#### Mitglieder-Tabelle (Hauptansicht)

- [x] **Spalten:** Checkbox, Name, E-Mail, Rollen (Tags), Familie, Status, Aktionen
- [ ] **Sortierung:** Spaltenkoepfe sind NICHT klickbar (nur Backend-Sortierung via API Parameter)
- [x] **Suche:** Suchfeld durchsucht Name (Echtzeit, min. 2 Zeichen) - E-Mail wird NICHT durchsucht (nur im profiles table, nicht auth.users)
- [x] **Filter-Optionen:** Rolle, Status, Familie - alle vorhanden
- [x] **Pagination:** 20 Eintraege pro Seite, Server-Side Pagination
- [x] **Bulk-Aktionen:** Checkbox-Selektion vorhanden - aber keine Bulk-Action-Buttons implementiert
- [x] **Responsive:** E-Mail auf Mobile versteckt (md:table-cell), Familie auf Desktop (lg:table-cell)

#### Mitglied anlegen (Modal)

- [x] **Pflichtfelder:** Vorname, Nachname, Geburtsdatum, Systemrolle - alle vorhanden
- [x] **Optionale Felder:** Telefon, Adresse, Funktionale Tags, Familie, Notizen - alle vorhanden
- [ ] **E-Mail Feld fehlt im Formular** - Obwohl im Schema definiert, wird E-Mail nicht in DB gespeichert
- [x] **Validierung:** Mindestens 2 Zeichen fuer Namen, Datum nicht in Zukunft
- [x] **Speichern:** Erfolgs-Toast, Tabelle wird aktualisiert

#### Mitglied bearbeiten (Modal)

- [x] Oeffnet sich durch Klick auf "Bearbeiten"
- [x] Alle Felder vorausgefuellt
- [x] Aenderungen bei "Speichern" uebernommen
- [x] Abbrechen-Button funktioniert

#### Mitglied deaktivieren/aktivieren

- [x] Button "Deaktivieren" in Aktions-Dropdown
- [x] Button "Aktivieren" fuer inaktive Mitglieder
- [x] Bestaetigungs-Dialog vorhanden
- [x] Deaktivierte Mitglieder erscheinen ausgegraut (opacity-60)
- [x] Soft Delete - kein hartes Loeschen

#### Familien-Bereich

- [x] **Toggle/Tab:** Tabs "Mitglieder" und "Familien" vorhanden
- [x] **Familien-Liste:** Collapsible Cards mit Name, Anzahl, Primaerkontakt
- [x] **Familie erstellen:** Modal mit Name, Mitglieder-Auswahl, Primaerkontakt
- [x] **Familie bearbeiten:** Mitglieder hinzufuegen/entfernen, Primaerkontakt aendern
- [x] **Familie aufloesen:** Bestaetigungs-Dialog, Mitglieder bleiben erhalten

#### Mitglied einer Familie zuweisen

- [x] Im Mitglied-Bearbeiten-Dialog: Familie-Dropdown vorhanden
- [ ] Schnellaktion "Zur Familie hinzufuegen" fehlt in Tabelle
- [ ] Drag & Drop nicht implementiert (war als nice-to-have markiert)

---

### Edge Cases Status

#### Mitglieder

- [ ] **Doppelte E-Mail** - NICHT GETESTET: E-Mail wird nicht in profiles gespeichert
- [x] **Mitglied ohne E-Mail bearbeiten** - Funktioniert, E-Mail-Feld ist optional
- [ ] **Deaktiviertes Mitglied einladen** - Kein Hinweis implementiert
- [ ] **Mitglied mit offener Einladung** - Keine Pruefung/Warnung implementiert

#### Familien

- [x] **Familie mit nur 1 Mitglied** - Erlaubt (min: 1 in Zod Schema)
- [x] **Primaerkontakt entfernen** - Wird automatisch auf erstes Mitglied gesetzt
- [ ] **Familie loeschen mit Rechnungen** - Nicht geprueft (Rechnungen existieren noch nicht)

#### Performance

- [x] **Server-Side Pagination** - Implementiert mit limit/offset
- [x] **Kombinierte Filter** - UND-Verknuepfung funktioniert

---

### Security Findings (Red Team Analysis)

#### CRITICAL: Fehlende RLS INSERT Policy fuer profiles

**Severity:** CRITICAL
**Location:** Supabase Database
**Description:** Es gibt keine RLS INSERT Policy fuer die `profiles` Tabelle. Das bedeutet:
- Die API `POST /api/members` funktioniert nur, weil sie mit Server-Side Supabase Client arbeitet
- Vorstand kann KEINE neuen Mitglieder direkt ueber die API anlegen

**Evidence:**
```sql
-- Nur SELECT und UPDATE Policies existieren:
-- "Users can view own profile" (SELECT)
-- "Users can update own profile" (UPDATE)
-- KEINE INSERT Policy!
```

**Impact:** Mitglieder koennen nicht ueber die normale RLS-Logik angelegt werden.
**Recommendation:** INSERT Policy fuer Vorstand hinzufuegen:
```sql
CREATE POLICY "vorstand_insert_profiles" ON profiles
FOR INSERT TO authenticated
WITH CHECK (is_vorstand());
```

---

#### HIGH: Fehlende RLS UPDATE Policy fuer Vorstand

**Severity:** HIGH
**Location:** Supabase Database
**Description:** Vorstand kann nur eigene Profile updaten, nicht die anderer Mitglieder.

**Evidence:**
```sql
-- Aktuelle Policy:
-- "Users can update own profile" - qual: (user_id = auth.uid())
```

**Impact:** Vorstand kann Mitgliederdaten nur ueber Server-Side API aendern, nicht direkt.
**Recommendation:** UPDATE Policy fuer Vorstand hinzufuegen:
```sql
CREATE POLICY "vorstand_update_profiles" ON profiles
FOR UPDATE TO authenticated
USING (is_vorstand());
```

---

#### MEDIUM: Potential SQL Injection in Search

**Severity:** MEDIUM
**Location:** `src/app/api/members/route.ts:49`
**Description:** Suchbegriff wird direkt in Supabase Query interpoliert.

**Evidence:**
```typescript
// Zeile 49:
query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
```

**Impact:** Obwohl Supabase Client escaped, ist die Pattern-Interpolation riskant.
**Recommendation:** Parameterisierte Queries verwenden oder Suchbegriff sanitizen:
```typescript
const sanitizedSearch = search.replace(/[%_]/g, '\\$&')
```

---

#### MEDIUM: Function Search Path Mutable

**Severity:** MEDIUM
**Location:** Supabase Functions
**Description:** Mehrere Funktionen haben keinen festen search_path, was zu Search Path Hijacking fuehren kann.

**Affected Functions:**
- `is_vorstand()`
- `user_has_role()`
- `get_my_profile()`
- `validate_invitation_token()`
- `get_failed_login_count()`
- `check_reset_rate_limit()`
- `cleanup_old_reset_attempts()`
- `update_updated_at_column()`

**Recommendation:** Alle Funktionen mit `SET search_path = public` neu definieren.
**Reference:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

---

#### LOW: RLS Enabled but No Policy on Security Tables

**Severity:** LOW
**Location:** `login_attempts`, `password_reset_attempts` Tabellen
**Description:** RLS ist aktiviert, aber keine Policies definiert.

**Impact:** Tabellen sind komplett gesperrt (kein SELECT/INSERT). Dies ist gewollt fuer Security-Tabellen, aber sollte dokumentiert werden.

---

#### INFO: Leaked Password Protection Disabled

**Severity:** INFO
**Location:** Supabase Auth Configuration
**Description:** HaveIBeenPwned Integration ist deaktiviert.

**Recommendation:** Aktivieren fuer bessere Passwortsicherheit.
**Reference:** https://supabase.com/docs/guides/auth/password-security

---

### Bugs Found

#### BUG-1: E-Mail nicht in profiles gespeichert

**Severity:** Medium
**Category:** Data Model
**Description:** Das Member-Formular hat ein E-Mail-Feld, aber die profiles-Tabelle hat keine email-Spalte. E-Mails werden nur in auth.users gespeichert.
**Expected:** E-Mail wird bei Mitglied gespeichert
**Actual:** E-Mail-Feld im Formular hat keinen Effekt fuer manuell angelegte Mitglieder
**Impact:** Manuelle Mitglieder (ohne Auth Account) koennen keine E-Mail haben
**Priority:** Medium

---

#### BUG-2: Suche findet keine E-Mails

**Severity:** Low
**Category:** Feature
**Description:** Laut AC soll die Suche auch E-Mails durchsuchen, aber das ist nicht moeglich da E-Mails in auth.users liegen.
**Expected:** Suche nach E-Mail findet Mitglieder
**Actual:** Suche durchsucht nur first_name und last_name
**Impact:** UX-Einschraenkung
**Priority:** Low

---

#### BUG-3: Sortierung nicht per Spaltenklick

**Severity:** Low
**Category:** UX
**Description:** Spaltenkoepfe sind nicht klickbar fuer Sortierung.
**Expected:** Klick auf Spaltenkopf sortiert nach dieser Spalte
**Actual:** Keine Sortier-UI, nur Backend-Unterstuetzung via Query-Parameter
**Impact:** UX-Einschraenkung
**Priority:** Low

---

#### BUG-4: Bulk-Aktionen nicht implementiert

**Severity:** Low
**Category:** Feature
**Description:** Checkboxen sind vorhanden, aber es gibt keine Bulk-Action-Buttons.
**Expected:** "Alle ausgewaehlten deaktivieren" Button erscheint
**Actual:** Checkboxen haben keine Funktion
**Impact:** Feature unvollstaendig
**Priority:** Low

---

#### BUG-5: is_vorstand() prueft is_active statt status

**Severity:** Medium
**Category:** Security
**Description:** Die `is_vorstand()` Funktion prueft noch `is_active = true` statt das neue `status` Feld.
**Code:**
```sql
WHERE user_id = auth.uid()
AND role = 'vorstand'
AND is_active = true  -- Sollte: AND status = 'active'
```
**Impact:** Inkonsistenz zwischen altem und neuem Statusfeld
**Priority:** Medium

---

### Regression Test Results

| Feature | Status | Notes |
|---------|--------|-------|
| PROJ-1: User Authentication | OK | Login/Logout funktioniert |
| PROJ-2: Dark Theme | OK | Neue Komponenten nutzen Theme korrekt |
| PROJ-3: Role-Based Dashboards | OK | Admin-Route /admin/members erreichbar fuer Vorstand |
| Sidebar Navigation | OK | Members-Link im Admin-Bereich sichtbar |
| RLS Policies | OK | Bestehende Policies unveraendert |

---

### Summary

| Category | Passed | Failed | Blocked |
|----------|--------|--------|---------|
| Acceptance Criteria | 28 | 5 | 0 |
| Edge Cases | 4 | 4 | 1 |
| Security Checks | 0 | 4 | 0 |
| Regression Tests | 5 | 0 | 0 |

**Security Issues:**
- 1 CRITICAL (Missing INSERT RLS Policy)
- 1 HIGH (Missing UPDATE RLS Policy for Vorstand)
- 2 MEDIUM (SQL Injection Risk, Function Search Path)
- 1 LOW (RLS No Policy on security tables)
- 1 INFO (Leaked Password Protection)

**Bugs Found:**
- 0 Critical
- 2 Medium (E-Mail not stored, is_vorstand check)
- 3 Low (Search, Sorting, Bulk Actions)

---

### Production-Ready Decision

**Status: NOT READY FOR PRODUCTION**

**Blocker:**
1. **CRITICAL:** Fehlende RLS INSERT Policy fuer profiles - Vorstand kann keine Mitglieder anlegen
2. **HIGH:** Fehlende RLS UPDATE Policy - Vorstand kann Mitglieder nicht bearbeiten

**Must Fix Before Deploy:**
1. RLS INSERT Policy fuer profiles hinzufuegen
2. RLS UPDATE Policy fuer Vorstand hinzufuegen
3. `is_vorstand()` Funktion auf `status` Feld aktualisieren
4. Function search_path fuer alle betroffenen Funktionen setzen

**Should Fix:**
1. E-Mail-Feld Logik klaeren (entweder in profiles speichern oder aus Formular entfernen)
2. SQL Injection Schutz verbessern

**Nice to Have (Post-MVP):**
1. Spalten-Sortierung per Klick
2. Bulk-Aktionen implementieren
3. Suche auf E-Mail erweitern

---

### Recommended Next Steps

---

## QA Re-Test Results (nach Security Fixes)

**Re-Tested:** 2026-01-25
**Tester:** QA Engineer Agent
**Vorheriger Test:** 2026-01-25 (Initial QA)

---

### Security Fixes - Verifiziert ✅

| Issue | Severity | Status | Verifizierung |
|-------|----------|--------|---------------|
| RLS INSERT Policy für profiles | CRITICAL | ✅ **GEFIXT** | `vorstand_insert_profiles` Policy existiert mit `WITH CHECK (is_vorstand())` |
| RLS UPDATE Policy für Vorstand | HIGH | ✅ **GEFIXT** | `vorstand_update_profiles` Policy existiert mit `USING (is_vorstand())` |
| `is_vorstand()` prüft falsches Feld | MEDIUM | ✅ **GEFIXT** | Funktion prüft jetzt `status = 'active'` statt `is_active = true` |
| Function search_path mutable | MEDIUM | ✅ **GEFIXT** | Alle 8 Funktionen haben `SET search_path TO 'public'` |
| SQL Injection in Search | MEDIUM | ✅ **GEFIXT** | Search sanitized mit `search.replace(/[%_\\]/g, '\\$&')` in `route.ts:49-51` |

---

### Aktuelle RLS Policies Status

#### profiles Tabelle
```
✅ Users can view own profile     (SELECT) - user_id = auth.uid() OR is_vorstand()
✅ Users can update own profile   (UPDATE) - user_id = auth.uid()
✅ vorstand_insert_profiles       (INSERT) - is_vorstand()
✅ vorstand_update_profiles       (UPDATE) - is_vorstand()
```

#### families Tabelle
```
✅ vorstand_select_families       (SELECT) - is_vorstand()
✅ vorstand_insert_families       (INSERT) - is_vorstand()
✅ vorstand_update_families       (UPDATE) - is_vorstand()
✅ vorstand_delete_families       (DELETE) - is_vorstand()
```

---

### is_vorstand() Funktion - Verifiziert

```sql
CREATE OR REPLACE FUNCTION public.is_vorstand()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'    -- ✅ search_path gesetzt
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'vorstand'
    AND status = 'active'       -- ✅ Korrektes Feld
  );
END;
$function$
```

---

### Verbleibende Issues (Non-Blocking)

#### Performance Warnings (WARN)

| Issue | Tabelle | Beschreibung |
|-------|---------|--------------|
| Multiple Permissive Policies | profiles | 2 UPDATE Policies für authenticated (Users + Vorstand) |
| auth_rls_initplan | profiles, groups, trainer_notes, notifications | `auth.uid()` sollte zu `(select auth.uid())` geändert werden für bessere Performance |

**Impact:** Nur bei sehr großen Datenmengen relevant. Für MVP akzeptabel.

#### Info-Level Issues

| Issue | Beschreibung |
|-------|--------------|
| Unused Indexes | 14 Indexes wurden noch nicht benutzt (normal bei neuem System) |
| RLS No Policy | login_attempts, password_reset_attempts (beabsichtigt - Security Tables) |
| Leaked Password Protection | HaveIBeenPwned Integration deaktiviert |

---

### Build Status

```
✅ npm run build - ERFOLGREICH
✅ TypeScript Compilation - ERFOLGREICH
✅ Alle Routes generiert:
   - /admin/members
   - /api/members
   - /api/members/[id]
   - /api/members/[id]/status
   - /api/families
   - /api/families/[id]
```

---

### Regression Test Results

| Feature | Status | Notes |
|---------|--------|-------|
| PROJ-1: User Authentication | ✅ OK | Login/Logout funktioniert |
| PROJ-2: Dark Theme | ✅ OK | Neue Komponenten nutzen Theme korrekt |
| PROJ-3: Role-Based Dashboards | ✅ OK | Admin-Route /admin/members erreichbar |
| Build & Deployment | ✅ OK | Build erfolgreich ohne Fehler |

---

### Updated Summary

| Category | Vorher | Nachher |
|----------|--------|---------|
| CRITICAL Security Issues | 1 | **0** ✅ |
| HIGH Security Issues | 1 | **0** ✅ |
| MEDIUM Security Issues | 4 | **0** ✅ |
| LOW Bugs (UX) | 3 | 3 (unverändert) |
| Build Status | OK | OK |

---

### Production-Ready Decision

**Status: ✅ READY FOR PRODUCTION**

Alle **CRITICAL**, **HIGH** und **MEDIUM** Security-Issues wurden behoben:

1. ✅ RLS INSERT Policy für profiles - Vorstand kann Mitglieder anlegen
2. ✅ RLS UPDATE Policy für Vorstand - Vorstand kann Mitglieder bearbeiten
3. ✅ `is_vorstand()` prüft korrektes `status` Feld
4. ✅ Alle Funktionen haben sicheren `search_path`
5. ✅ SQL Injection Schutz implementiert

**Verbleibende LOW-Priority Items (Post-MVP):**
- Spalten-Sortierung per Klick
- Bulk-Aktionen implementieren
- Suche auf E-Mail erweitern (erfordert Architektur-Entscheidung)

---

### ❓ PM-Entscheidung erforderlich (offen)

- **E-Mail in profiles speichern?**
  - JA → Backend muss Spalte + API anpassen
  - NEIN → Frontend soll E-Mail-Feld aus Formular entfernen
