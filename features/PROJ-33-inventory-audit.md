# PROJ-33: Inventar Audit / Inventur-Funktion

## Status: Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-27 (Inventory Items & Categories) - für Item-Grundstruktur
- Benötigt: PROJ-30 (Inventory Location & QR-Code) - für Scanner-Integration
- Unabhängig von: Document-Features (PROJ-26ff), Workgroup-Features (PROJ-25ff)

---

## Übersicht

Jährliche Inventur-Funktion zum systematischen Überprüfen aller Inventar-Items. Ermöglicht das Scannen von QR-Codes oder manuelles Abhaken, um Items als "verifiziert" für das aktuelle Jahr zu markieren. Generiert Inventur-Reports und zeigt nicht-verifizierte Items an.

**Wichtig:** Baut auf PROJ-27 (Inventory Items) und PROJ-30 (QR-Codes) auf. Nutzt den bestehenden Scanner für effizientes Erfassen.

---

## User Stories

### US-1: Inventur starten
**Als** Vorstand
**möchte ich** eine jährliche Inventur starten
**um** den Bestand systematisch zu überprüfen.

### US-2: Item per QR-Code verifizieren
**Als** Vorstand
**möchte ich** Items durch Scannen des QR-Codes als "gesichtet" markieren
**um** schnell und effizient zu arbeiten.

### US-3: Item manuell verifizieren
**Als** Vorstand
**möchte ich** Items auch ohne QR-Code als verifiziert markieren
**um** alle Items erfassen zu können.

### US-4: Inventur-Fortschritt sehen
**Als** Vorstand
**möchte ich** sehen, wie viele Items bereits verifiziert wurden
**um** den Fortschritt der Inventur zu verfolgen.

### US-5: Nicht-verifizierte Items anzeigen
**Als** Vorstand
**möchte ich** eine Liste aller noch nicht verifizierten Items sehen
**um** zu wissen, was noch fehlt.

### US-6: Item als defekt markieren
**Als** Vorstand
**möchte ich** während der Inventur Items als defekt oder verloren markieren
**um** den tatsächlichen Zustand zu dokumentieren.

### US-7: Inventur-Report erstellen
**Als** Vorstand
**möchte ich** einen Inventur-Report generieren
**um** das Ergebnis zu dokumentieren.

### US-8: Vergangene Inventuren einsehen
**Als** Vorstand
**möchte ich** frühere Inventur-Ergebnisse sehen
**um** Veränderungen im Bestand nachzuvollziehen.

---

## Acceptance Criteria

### Inventur starten/verwalten

- [ ] Neuer Tab "Inventur" in der Inventar-Navigation
- [ ] "Inventur starten" Button für neues Jahr
- [ ] Bestätigungsdialog: "Inventur für 2026 starten?"
- [ ] Pro Jahr nur EINE Inventur möglich
- [ ] Inventur hat Status: `in_progress` | `completed`
- [ ] Aktive Inventur wird prominent angezeigt
- [ ] "Inventur abschließen" Button (setzt Status auf completed)

### QR-Code Scanner (Inventur-Modus)

- [ ] "Scanner öffnen" Button im Inventur-Tab
- [ ] Kamera-Overlay mit Inventur-spezifischem UI
- [ ] Nach Scan: Item-Infos anzeigen + Aktionen:
  - "Verifiziert" - Item als gesichtet markieren
  - "Defekt" - Item als defekt markieren
  - "Verloren" - Item als nicht auffindbar markieren
- [ ] Visuelles Feedback nach Aktion (grün/rot)
- [ ] Automatisch bereit für nächsten Scan
- [ ] Counter: "12/45 Items verifiziert"

### Manuelle Verifizierung

- [ ] Item-Liste mit Checkbox für Verifizierung
- [ ] Filter: "Nur nicht-verifizierte anzeigen"
- [ ] Bulk-Aktion: Mehrere Items gleichzeitig verifizieren
- [ ] Status-Buttons: Verifiziert | Defekt | Verloren

### Fortschritts-Anzeige

- [ ] Progress-Bar: "67% abgeschlossen (45/67 Items)"
- [ ] Aufschlüsselung nach Kategorie
- [ ] Aufschlüsselung nach Lagerort
- [ ] "Fehlende Items" Zähler prominent anzeigen

### Inventur-Ergebnisse

- [ ] Zusammenfassung:
  - Gesamt: X Items
  - Verifiziert: X Items
  - Defekt: X Items
  - Verloren: X Items
  - Nicht geprüft: X Items
- [ ] Liste der Defekt/Verloren Items mit Details
- [ ] Export als PDF oder CSV (optional)

### Historische Inventuren

- [ ] Liste vergangener Inventuren (Jahr + Status + Ergebnis)
- [ ] Klick öffnet Detail-Ansicht der abgeschlossenen Inventur
- [ ] Vergleich: "5 Items weniger als 2025"
- [ ] Read-only für abgeschlossene Inventuren

### Item-Ansicht Integration

- [ ] In Item-Detail: "Inventur 2026: Verifiziert am DD.MM."
- [ ] Badge in Item-Liste: "Inventur fehlt" für nicht-verifizierte Items
- [ ] Filter: "Inventur 2026 ausstehend"

---

## Edge Cases

### E-1: Inventur bereits vorhanden
**Szenario:** Vorstand versucht, zweite Inventur für 2026 zu starten.
**Verhalten:** Fehlermeldung: "Für 2026 existiert bereits eine Inventur."

### E-2: Inventur ohne Items
**Szenario:** Verein hat noch keine Inventar-Items.
**Verhalten:** Hinweis: "Noch keine Items vorhanden. Lege zuerst Items an."

### E-3: Item bereits verifiziert
**Szenario:** Item wird erneut gescannt.
**Verhalten:** Info: "Bereits verifiziert am DD.MM." mit Option zum Status-Ändern.

### E-4: Item während Inventur gelöscht
**Szenario:** Item wird gelöscht während Inventur läuft.
**Verhalten:**
- Inventur-Eintrag bleibt erhalten (historisch)
- Bei Abschluss: "1 Item wurde während der Inventur entfernt"

### E-5: Neues Item während Inventur
**Szenario:** Neues Item wird erstellt während Inventur läuft.
**Verhalten:**
- Item erscheint in "Nicht verifiziert" Liste
- Muss separat verifiziert werden
- Counter passt sich an

### E-6: Inventur abbrechen
**Szenario:** Vorstand möchte Inventur abbrechen und neu starten.
**Verhalten:**
- "Inventur löschen" Button (mit Bestätigung)
- Alle Verifizierungs-Daten werden gelöscht
- Neue Inventur kann gestartet werden

### E-7: QR-Code eines anderen Vereins
**Szenario:** Gescannter QR-Code gehört nicht zum eigenen Inventar.
**Verhalten:** Error: "Item nicht gefunden. Gehört dieser QR-Code zu eurem Inventar?"

---

## Technische Anforderungen

### Datenbank-Tabellen

```sql
-- Inventur-Durchgänge
CREATE TABLE inventory_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Inventur-Einträge pro Item
CREATE TABLE inventory_audit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES inventory_audits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  -- Snapshot des Items falls gelöscht
  item_name_snapshot VARCHAR(255),
  item_category_snapshot VARCHAR(100),

  status VARCHAR(20) NOT NULL CHECK (status IN ('verified', 'defective', 'lost', 'pending')),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,

  UNIQUE(audit_id, item_id)
);

-- Indexes
CREATE INDEX idx_audit_entries_audit ON inventory_audit_entries(audit_id);
CREATE INDEX idx_audit_entries_item ON inventory_audit_entries(item_id);
CREATE INDEX idx_audit_entries_status ON inventory_audit_entries(audit_id, status);
```

### RLS Policies

```sql
-- Nur Vorstand kann Inventuren verwalten
CREATE POLICY "Board can manage audits" ON inventory_audits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND system_role = 'board'
    )
  );

CREATE POLICY "Board can manage audit entries" ON inventory_audit_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND system_role = 'board'
    )
  );

-- Mitglieder können Inventur-Status ihrer Items sehen
CREATE POLICY "Members can view their item audit status" ON inventory_audit_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inventory_items i
      WHERE i.id = inventory_audit_entries.item_id
      AND i.current_holder_id = auth.uid()
    )
  );
```

### API-Endpunkte

- `GET /api/inventory/audits` - Alle Inventuren auflisten
- `POST /api/inventory/audits` - Neue Inventur starten
- `GET /api/inventory/audits/{id}` - Inventur-Details mit Einträgen
- `PUT /api/inventory/audits/{id}` - Inventur abschließen
- `DELETE /api/inventory/audits/{id}` - Inventur löschen

- `POST /api/inventory/audits/{id}/entries` - Item verifizieren (einzel oder bulk)
- `PUT /api/inventory/audits/{auditId}/entries/{entryId}` - Status ändern
- `GET /api/inventory/audits/{id}/stats` - Fortschritts-Statistiken
- `GET /api/inventory/audits/{id}/missing` - Nicht-verifizierte Items

### Performance

- Response Time < 200ms
- Bulk-Verifizierung: Max 100 Items pro Request
- Statistiken werden gecached (invalidiert bei Änderung)

---

## UI/UX Details

### Inventur-Dashboard (Desktop)
```
+------------------------------------------+
| Inventar | [Items] [Lagerorte] [Inventur]  |
+------------------------------------------+
|                                          |
| Inventur 2026                   [Scanner] |
| Status: In Bearbeitung                   |
|                                          |
| [================        ] 67%           |
| 45 von 67 Items verifiziert              |
|                                          |
| +----------+ +----------+ +----------+   |
| | Geprüft  | | Defekt   | | Verloren |   |
| |    45    | |    2     | |    1     |   |
| +----------+ +----------+ +----------+   |
|                                          |
| Fehlende Items (19)            [Anzeigen] |
|                                          |
| +--------------------------------------+ |
| | Nach Kategorie:                      | |
| | Kostüme: 12/25 (48%)                 | |
| | Technik: 20/20 (100%)                | |
| | Requisiten: 13/22 (59%)              | |
| +--------------------------------------+ |
|                                          |
| [Inventur abschließen]                   |
+------------------------------------------+
```

### Scanner-Modus (Mobile)
```
+----------------------+
|    < Inventur 2026   |
+----------------------+
|                      |
|   +---------------+  |
|   |               |  |
|   |   [QR-CODE]   |  |
|   |   SCANNING    |  |
|   |               |  |
|   +---------------+  |
|                      |
| 45/67 verifiziert    |
|                      |
+----------------------+
```

### Nach Scan (Mobile)
```
+----------------------+
|    < Inventur 2026   |
+----------------------+
|                      |
| Garde-Jacke #12      |
| Kategorie: Kostüme   |
| Lagerort: Schrank 3  |
|                      |
| Status wählen:       |
|                      |
| [  Verifiziert   ]   |
| [    Defekt      ]   |
| [   Verloren     ]   |
|                      |
| Notiz (optional):    |
| [...................] |
|                      |
| [   Speichern    ]   |
+----------------------+
```

### Nicht-verifizierte Items Liste
```
+------------------------------------------+
| Fehlende Items (19)                < Zurück|
+------------------------------------------+
| Filter: [Alle Kategorien v] [Alle Orte v] |
+------------------------------------------+
| [ ] Garde-Rock #05        Schrank 3       |
| [ ] Garde-Hut #12         unbekannt       |
| [ ] Lautsprecher groß     Technik-Raum    |
| [ ] Mikrofon #3           bei Max M.      |
| ...                                        |
+------------------------------------------+
| [Ausgewählte verifizieren (3)]            |
+------------------------------------------+
```

---

## Inventur-Workflow

### 1. Vorbereitung
- Vorstand klickt "Inventur 2026 starten"
- System erstellt Audit-Record
- Alle Items werden als "pending" initialisiert

### 2. Durchführung
- Team geht durch Lager
- Scannt QR-Codes oder hakt manuell ab
- Defekte Items werden notiert
- Fehlende Items werden als "lost" markiert

### 3. Abschluss
- Vorstand prüft "Fehlende Items" Liste
- Letzte Items werden abgearbeitet
- Klick auf "Inventur abschließen"
- Report wird generiert

### 4. Nachbereitung
- Defekte Items zur Reparatur
- Verlorene Items ggf. aus System entfernen
- Report für Vereinsunterlagen archivieren

---

## Abhängige Änderungen

### Item-Detail (PROJ-27/30 Update)
- Badge: "Inventur 2026: Ausstehend" / "Verifiziert am DD.MM."
- Schnell-Button zum Verifizieren (wenn Inventur läuft)

### QR-Scanner (PROJ-30 Update)
- Inventur-Modus integrieren
- Nach Scan: Inventur-Dialog statt Item-Detail

### Dashboard (Board)
- Widget: "Inventur läuft" mit Fortschritt
- Alert: "Inventur noch nicht gestartet" (optional, ab November)

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur nutzen

**Gute Nachricht:** Scanner und Inventory-System existieren bereits!

- ✅ Barcode-Scanner-Komponente vorhanden (`barcode-scanner.tsx`)
- ✅ Inventory-Item-System komplett (PROJ-27)
- ✅ Lagerort-System komplett (PROJ-30)
- ✅ Status-System vorhanden (available, loaned, maintenance, defective, lost)
- ✅ Tab-Navigation im Inventory existiert

### Component-Struktur

```
Inventar-Seite (erweitert)
├── Tab-Navigation
│   ├── "Items" Tab (existiert)
│   ├── "Kategorien" Tab (existiert)
│   ├── "Sets" Tab (existiert)
│   ├── "Lagerorte" Tab (existiert)
│   └── "Inventur" Tab (NEU)
│
└── Inventur-Bereich (wenn Tab aktiv)
    │
    ├── Keine aktive Inventur
    │   ├── "Inventur 2026 starten" Button
    │   └── Vergangene Inventuren (Liste)
    │
    └── Aktive Inventur (wenn gestartet)
        ├── Header
        │   ├── "Inventur 2026 - In Bearbeitung"
        │   └── [Scanner öffnen] Button
        │
        ├── Fortschritts-Bereich
        │   ├── Progress-Bar (67% - 45/67 Items)
        │   └── Status-Kacheln
        │       ├── Geprüft (45)
        │       ├── Defekt (2)
        │       └── Verloren (1)
        │
        ├── Aufschlüsselung
        │   ├── Nach Kategorie (Accordion)
        │   │   ├── Kostüme: 12/25 (48%)
        │   │   ├── Technik: 20/20 (100%) ✓
        │   │   └── Requisiten: 13/22 (59%)
        │   └── Nach Lagerort (optional)
        │
        ├── Fehlende Items
        │   └── [19 Items anzeigen] Button
        │
        └── Aktionen
            ├── [Inventur abschließen] Button
            └── [Inventur löschen] Button (mit Warnung)
```

### Scanner-Modus (Inventur)

```
Scanner-Overlay (Vollbild, Mobile)
├── Header
│   ├── "< Inventur 2026"
│   └── "45/67 verifiziert"
│
├── Kamera-Bereich
│   └── QR-Code Rahmen
│
└── Nach Scan → Item-Dialog
    ├── Item-Info
    │   ├── Name: "Garde-Jacke #12"
    │   ├── Kategorie: Kostüme
    │   └── Lagerort: Schrank 3
    │
    ├── Status-Buttons
    │   ├── [Verifiziert] (grün)
    │   ├── [Defekt] (orange)
    │   └── [Verloren] (rot)
    │
    ├── Notiz-Feld (optional)
    │
    └── [Speichern & Weiter]
```

### Fehlende Items Liste

```
Nicht verifizierte Items
├── Filter-Leiste
│   ├── Kategorie-Dropdown
│   └── Lagerort-Dropdown
│
├── Item-Liste (mit Checkboxen)
│   ├── [ ] Garde-Rock #05 | Schrank 3
│   ├── [ ] Garde-Hut #12 | unbekannt
│   └── [ ] Lautsprecher | Technik-Raum
│
└── Bulk-Aktionen
    └── [Ausgewählte verifizieren (3)]
```

### Daten-Model

**Inventur-Durchgang:**
- Jahr (2026, 2027, ...) - nur einer pro Jahr
- Status (In Bearbeitung / Abgeschlossen)
- Gestartet von (welcher Vorstand?)
- Start-Datum
- Abschluss-Datum
- Notizen

**Inventur-Eintrag (pro Item):**
- Inventur-Zugehörigkeit
- Item-Referenz
- Item-Snapshot (Name + Kategorie - falls Item gelöscht wird)
- Status (Ausstehend / Verifiziert / Defekt / Verloren)
- Geprüft von (wer?)
- Geprüft am
- Notizen

### Tech-Entscheidungen

| Entscheidung | Gewählt | Warum? |
|--------------|---------|--------|
| **Scanner** | Bestehender Barcode-Scanner | Bereits optimiert für Mobile |
| **Item-Snapshot** | Name+Kategorie speichern | Historische Korrektheit wenn Items gelöscht |
| **Ein Audit pro Jahr** | UNIQUE Constraint auf Jahr | Verhindert doppelte Inventuren |
| **Bulk-Verifikation** | Max 100 Items pro Request | Performance + UX Balance |
| **Statistik-Caching** | Client-side | Einfacher, Stats ändern sich selten |

### Wiederverwendbare Komponenten

Bestehend und direkt nutzbar:
- `BarcodeScanner` - Kamera-Scan-Logik
- `StatusBadge` - Status-Anzeige
- `InventoryItemCard` - Item-Darstellung
- Tab-Navigation (Radix UI)
- Progress-Bar (shadcn/ui)

Neu zu erstellen:
- `AuditProgressCard` - Fortschritts-Anzeige
- `AuditItemDialog` - Nach-Scan-Dialog
- `AuditMissingList` - Nicht-verifizierte Items

### Scanner-Integration

**Bestehender Scanner-Flow:**
1. Scan → Item gefunden → Item-Detail

**Neuer Inventur-Flow:**
1. Scan → Item gefunden → Inventur-Dialog
2. Status wählen → Speichern
3. Automatisch zurück zu Scanner

**Unterscheidung:** URL-Parameter `?mode=audit&auditId=xxx`

### Dependencies

Keine neuen Packages nötig:
- Barcode-Scanner (existiert)
- Progress-Bar (shadcn/ui)
- Accordion (Radix UI - für Kategorie-Aufschlüsselung)

### Rollen & Berechtigungen

| Aktion | Vorstand | Mitglied |
|--------|----------|----------|
| Inventur starten | ✅ | ❌ |
| Items scannen/verifizieren | ✅ | ❌ |
| Inventur abschließen | ✅ | ❌ |
| Inventur löschen | ✅ | ❌ |
| Inventur-Status eigener Items sehen | ✅ | ✅ |

---

## Nicht im Scope

- Automatische jährliche Erinnerung
- Mehrere Inventuren gleichzeitig
- Teil-Inventuren (nur eine Kategorie)
- Barcode-Support (nur QR-Code)
- Hardware-Scanner (nur Smartphone-Kamera)
- Unterschriften/Freigabe-Workflow
