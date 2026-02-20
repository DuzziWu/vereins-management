# PROJ-27: Inventory Items & Kategorien

## Status: READY FOR BROWSER TESTING

### Frontend-Implementierung (abgeschlossen)
- [x] Navigation: Inventar-Menüpunkt in Admin-Sidebar
- [x] Validierungen: Zod Schemas für Categories, Items, Sets
- [x] Components: StatusBadge, CategoryForm, ItemForm, SetForm, ItemStatusDialog
- [x] Seiten: /admin/inventory (Items), /admin/inventory/categories, /admin/inventory/sets
- [x] Seiten: /admin/inventory/new, /admin/inventory/[id] (Detail/Edit)
- [x] Seiten: /admin/inventory/sets/[id] (Set-Detail)
- [x] Seiten: /member/equipment (Mein Equipment für Mitglieder)
- [x] API-Routes: Alle CRUD-Endpoints erstellt
- [x] Bug-Fixes: HTTP Method, Pagination, Public URLs (2026-02-20)

### Backend-Implementierung (abgeschlossen)
- [x] Datenbank-Migration (6 Tabellen) - Migration 20260220094926
- [x] Supabase Storage Bucket "inventory-images" - Migration create_inventory_images_bucket
- [x] RLS Policies aktiviert - Migration 20260220095001
- [x] Trigger für Inventarnummer-Generierung aktiv
- [ ] TypeScript-Typen regenerieren: `npx supabase gen types typescript`

## Abhangigkeiten
- Benotigt: PROJ-1 (User Authentication) - fur eingeloggte User-Checks
- Benotigt: PROJ-4 (Member Management) - fur Verleih an Mitglieder
- Unabhangig von: Document-Features (PROJ-26ff), Workgroup-Features (PROJ-25ff)

---

## Ubersicht

Ein flexibles Inventar-System zur Verwaltung von Vereinsvermogen wie Kostumen, Equipment, Requisiten und technischen Geraten. Vereine konnen eigene Kategorien anlegen und Items mit Details wie Grosse, Zustand und Status erfassen.

**Wichtig:** Dies ist das Basis-Feature fur INV-01. Location-Tracking, QR/Barcode-System und Inventory-Audit werden in separaten Features spezifiziert.

**Design-Entscheidung:** Keine vordefinierten Kategorien - jeder Verein legt seine eigenen Kategorien an, da die Anforderungen stark variieren (Karneval vs. Sport vs. Musik etc.).

---

## User Stories

### US-1: Kategorie erstellen
**Als** Vorstand
**mochte ich** eigene Inventar-Kategorien erstellen
**um** Items nach den Bedurfnissen meines Vereins zu organisieren.

### US-2: Item erfassen
**Als** Vorstand
**mochte ich** neue Items mit Name, Beschreibung, Kategorie und optionalen Details erfassen
**um** das Vereinsinventar zu dokumentieren.

### US-3: Item-Details anzeigen
**Als** Vereinsmitglied
**mochte ich** Details zu einem Item sehen (Beschreibung, Grosse, Zustand)
**um** zu wissen ob es fur meinen Bedarf passt.

### US-4: Item-Status setzen
**Als** Vorstand
**mochte ich** den Status eines Items andern (Verfugbar, Verliehen, Defekt, In Reinigung)
**um** den aktuellen Zustand zu dokumentieren.

### US-5: Item-Set erstellen
**Als** Vorstand
**mochte ich** mehrere Items zu einem Set zusammenfassen (z.B. Garde-Uniform: Jacke + Hose + Hut)
**um** zusammengehorige Items gemeinsam zu verwalten.

### US-6: Inventar durchsuchen
**Als** Vereinsmitglied
**mochte ich** das Inventar nach Name, Kategorie oder Status durchsuchen
**um** benotigte Items schnell zu finden.

### US-7: Item-Bild hochladen
**Als** Vorstand
**mochte ich** ein Foto zu einem Item hinzufugen
**um** das Item visuell identifizierbar zu machen.

---

## Acceptance Criteria

### Kategorien-Verwaltung

- [ ] Neuer Menupunkt "Inventar" in Admin-Navigation (nur Vorstand)
- [ ] Sub-Navigation: "Items" | "Kategorien" | "Sets"
- [ ] "Neue Kategorie" Button offnet Dialog
- [ ] Pflichtfeld: Name (min. 2, max. 50 Zeichen)
- [ ] Optionales Feld: Beschreibung (max. 200 Zeichen)
- [ ] Optionales Feld: Icon/Emoji fur schnelle Erkennung
- [ ] Kategorien konnen bearbeitet und geloscht werden
- [ ] Kategorie mit zugewiesenen Items kann nicht geloscht werden
- [ ] Drag & Drop oder Pfeile zum Sortieren der Kategorien

### Item CRUD

- [ ] "Neues Item" Button offnet Formular (als Seite, nicht Dialog - viele Felder)
- [ ] Pflichtfelder:
  - Name (min. 2, max. 100 Zeichen)
  - Kategorie (Dropdown)
  - Status (Default: Verfugbar)
- [ ] Optionale Felder:
  - Beschreibung (max. 1000 Zeichen)
  - Grosse/Masse (Freitext, z.B. "M", "42", "150cm x 80cm")
  - Inventarnummer (eindeutig, auto-generiert oder manuell)
  - Anschaffungsdatum
  - Anschaffungspreis
  - Zustand (Neu, Gut, Gebraucht, Reparaturbedurftig)
  - Notizen (intern, nur fur Vorstand)
- [ ] Item bearbeiten uber Detail-Seite
- [ ] Item loschen mit Bestatigungsdialog
- [ ] Geloschte Items werden archiviert (Soft-Delete), nicht permanent geloscht

### Item-Status

- [ ] Verfugbare Status:
  - `available` - Verfugbar (grun)
  - `loaned` - Verliehen (orange)
  - `defective` - Defekt (rot)
  - `in_cleaning` - In Reinigung (blau)
  - `reserved` - Reserviert (gelb)
- [ ] Status-Badge wird farblich hervorgehoben
- [ ] Status-Anderung wird mit Timestamp protokolliert
- [ ] Bei Status "Verliehen": Pflichtfeld "Verliehen an" (Mitglied auswahlen)

### Item-Sets

- [ ] Set = Gruppierung mehrerer Items die zusammengehoren
- [ ] Set-Erstellung: Name + Beschreibung + Items auswahlen (Multi-Select)
- [ ] Set-Ansicht zeigt alle enthaltenen Items mit jeweiligem Status
- [ ] Set-Status = schlechtester Status der enthaltenen Items (z.B. ein Item defekt → Set defekt)
- [ ] Items konnen in mehreren Sets sein (z.B. Jacke in "Garde-Uniform" und "Trainer-Set")
- [ ] Set-Verleih: Alle Items im Set werden auf "Verliehen" gesetzt

### Item-Bilder

- [ ] Upload von 1-5 Bildern pro Item
- [ ] Erlaubte Formate: JPG, PNG, WebP
- [ ] Max. Dateigrosse: 5 MB pro Bild
- [ ] Erstes Bild = Thumbnail in Listen-Ansicht
- [ ] Bilder konnen geloscht und neu sortiert werden
- [ ] Bild-Komprimierung auf Server-Seite (max. 1200px Breite)

### Inventar-Liste

- [ ] Tabellen-Ansicht mit: Bild-Thumbnail, Name, Kategorie, Status, Grosse, Inventarnummer
- [ ] Karten-Ansicht als Alternative (Toggle)
- [ ] Filter nach: Kategorie, Status, Zustand
- [ ] Sortierung nach: Name, Kategorie, Status, Hinzugefugt am
- [ ] Suche nach Name oder Inventarnummer
- [ ] Paginierung bei >50 Items

### Mitglieder-Ansicht

- [ ] Mitglieder sehen "Mein verliehenes Equipment" auf Dashboard oder eigenem Menupunkt
- [ ] Liste zeigt: Item-Name, Kategorie, Verliehen seit
- [ ] Keine Bearbeitungsmoglichkeit fur Mitglieder (nur Ansicht)

---

## Edge Cases

### E-1: Kategorie mit Items loschen
- **Szenario:** Vorstand versucht Kategorie zu loschen die Items enthalt
- **Losung:** Loschen blockiert
- **Meldung:** "Diese Kategorie enthalt X Items. Bitte zuerst alle Items loschen oder einer anderen Kategorie zuweisen."

### E-2: Item in mehreren Sets loschen
- **Szenario:** Item wird geloscht das in Sets enthalten ist
- **Losung:** Item wird aus allen Sets entfernt, Sets bleiben bestehen
- **Hinweis:** Warnung vor Loschung: "Dieses Item ist in X Sets enthalten und wird dort entfernt."

### E-3: Verliehenes Item loschen
- **Szenario:** Vorstand versucht verliehenes Item zu loschen
- **Losung:** Loschen blockiert
- **Meldung:** "Dieses Item ist aktuell verliehen an [Name]. Bitte zuerst die Ruckgabe erfassen."

### E-4: Doppelte Inventarnummer
- **Szenario:** Manuelle Eingabe einer bereits verwendeten Inventarnummer
- **Losung:** Validierung server-seitig, Fehlermeldung
- **Meldung:** "Diese Inventarnummer ist bereits vergeben. Bitte eine andere wahlen."

### E-5: Sehr viele Items (>1000)
- **Szenario:** Verein mit grossem Inventar
- **Losung:** Lazy-Loading, Virtualisierte Liste, Paginierung
- **Performance:** Max. 50 Items pro Seite laden, "Mehr laden" Button

### E-6: Bild-Upload fehlschlagt
- **Szenario:** Netzwerkfehler oder Datei zu gross
- **Losung:** Klare Fehlermeldung, Bild nicht gespeichert
- **Retry:** "Erneut versuchen" Button

### E-7: Mitglied mit verliehenen Items wird deaktiviert
- **Szenario:** Mitglied verlasst Verein, hat noch Items
- **Losung:** Warnung an Vorstand: "Dieses Mitglied hat noch X verliehene Items"
- **Automatik:** Items bleiben "verliehen", Vorstand muss manuell Ruckgabe erfassen

### E-8: Set-Verleih mit teilweise verliehenen Items
- **Szenario:** Set soll verliehen werden, aber ein Item ist bereits verliehen
- **Losung:** Warnung mit Option: "1 von 3 Items ist bereits verliehen. Nur verfugbare Items verleihen?"

---

## Technische Anforderungen

### Datenbank (Supabase)

```sql
-- inventory_categories: Benutzer-definierte Kategorien
CREATE TABLE inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  icon VARCHAR(10), -- Emoji
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT inventory_categories_name_unique UNIQUE (name)
);

-- inventory_items: Einzelne Inventar-Gegenstande
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES inventory_categories(id),
  inventory_number VARCHAR(50) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'loaned', 'defective', 'in_cleaning', 'reserved')),
  condition VARCHAR(20) DEFAULT 'good'
    CHECK (condition IN ('new', 'good', 'used', 'needs_repair')),
  size_info VARCHAR(100), -- Freitext fur Grosse
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  notes TEXT, -- Interne Notizen
  current_holder_id UUID REFERENCES profiles(id), -- Wer hat es gerade
  loaned_at TIMESTAMPTZ, -- Wann verliehen
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- inventory_item_images: Bilder zu Items
CREATE TABLE inventory_item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- inventory_sets: Gruppierung von Items
CREATE TABLE inventory_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- inventory_set_items: Zuordnung Items zu Sets (M:N)
CREATE TABLE inventory_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES inventory_sets(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,

  CONSTRAINT inventory_set_items_unique UNIQUE (set_id, item_id)
);

-- inventory_status_log: Protokoll der Status-Anderungen
CREATE TABLE inventory_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  holder_id UUID REFERENCES profiles(id), -- Bei Verleih: an wen
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_holder ON inventory_items(current_holder_id);
CREATE INDEX idx_inventory_items_archived ON inventory_items(is_archived);
CREATE INDEX idx_inventory_set_items_set ON inventory_set_items(set_id);
CREATE INDEX idx_inventory_set_items_item ON inventory_set_items(item_id);
CREATE INDEX idx_inventory_status_log_item ON inventory_status_log(item_id);

-- RLS Policies
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_status_log ENABLE ROW LEVEL SECURITY;

-- Categories: Alle lesen, nur Vorstand schreiben
CREATE POLICY "inventory_categories_select" ON inventory_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inventory_categories_insert" ON inventory_categories
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "inventory_categories_update" ON inventory_categories
  FOR UPDATE TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "inventory_categories_delete" ON inventory_categories
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Items: Alle lesen (nicht-archivierte), nur Vorstand schreiben
CREATE POLICY "inventory_items_select" ON inventory_items
  FOR SELECT TO authenticated USING (
    is_archived = false OR is_vorstand(auth.uid())
  );

CREATE POLICY "inventory_items_insert" ON inventory_items
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "inventory_items_update" ON inventory_items
  FOR UPDATE TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "inventory_items_delete" ON inventory_items
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Images: Gleiche Regeln wie Items
CREATE POLICY "inventory_item_images_select" ON inventory_item_images
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE id = item_id AND (is_archived = false OR is_vorstand(auth.uid()))
    )
  );

CREATE POLICY "inventory_item_images_insert" ON inventory_item_images
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "inventory_item_images_delete" ON inventory_item_images
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Sets: Alle lesen, nur Vorstand schreiben
CREATE POLICY "inventory_sets_select" ON inventory_sets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inventory_sets_insert" ON inventory_sets
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "inventory_sets_update" ON inventory_sets
  FOR UPDATE TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "inventory_sets_delete" ON inventory_sets
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Set Items: Gleiche Regeln wie Sets
CREATE POLICY "inventory_set_items_select" ON inventory_set_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inventory_set_items_insert" ON inventory_set_items
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "inventory_set_items_delete" ON inventory_set_items
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Status Log: Alle lesen, nur Vorstand schreiben
CREATE POLICY "inventory_status_log_select" ON inventory_status_log
  FOR SELECT TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "inventory_status_log_insert" ON inventory_status_log
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

-- Funktion: Automatische Inventarnummer generieren
CREATE OR REPLACE FUNCTION generate_inventory_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  next_number INT;
BEGIN
  IF NEW.inventory_number IS NULL THEN
    -- Prefix aus Kategorie-Name (erste 3 Buchstaben, uppercase)
    SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO prefix
    FROM inventory_categories WHERE id = NEW.category_id;

    -- Nachste freie Nummer
    SELECT COALESCE(MAX(
      CASE
        WHEN inventory_number ~ (prefix || '-[0-9]+$')
        THEN SUBSTRING(inventory_number FROM prefix || '-([0-9]+)$')::INT
        ELSE 0
      END
    ), 0) + 1 INTO next_number
    FROM inventory_items
    WHERE inventory_number LIKE prefix || '-%';

    NEW.inventory_number := prefix || '-' || LPAD(next_number::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_inventory_number
  BEFORE INSERT ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION generate_inventory_number();
```

### Performance

- Item-Liste mit Kategorie-Join geladen
- Bilder werden lazy-loaded (nur Thumbnail in Liste)
- Status-Log nur bei Bedarf geladen (Klick auf History)
- Set-Items als separate Abfrage bei Set-Detail

### Supabase Storage

```
Bucket: inventory-images
Struktur: /{item_id}/{image_id}.webp

Policies:
- SELECT: authenticated users (alle konnen lesen)
- INSERT: nur Vorstand
- DELETE: nur Vorstand
```

### Neue Dateien

```
src/app/(dashboard)/admin/inventory/page.tsx           - Items-Ubersicht
src/app/(dashboard)/admin/inventory/new/page.tsx       - Neues Item
src/app/(dashboard)/admin/inventory/[id]/page.tsx      - Item-Detail/Bearbeiten
src/app/(dashboard)/admin/inventory/categories/page.tsx - Kategorien
src/app/(dashboard)/admin/inventory/sets/page.tsx      - Sets
src/app/(dashboard)/admin/inventory/sets/[id]/page.tsx - Set-Detail
src/app/(dashboard)/member/equipment/page.tsx          - Mein Equipment (Mitglied)
src/components/inventory/item-form.tsx                 - Item-Formular
src/components/inventory/item-card.tsx                 - Karten-Ansicht
src/components/inventory/category-form.tsx             - Kategorie-Dialog
src/components/inventory/set-form.tsx                  - Set-Dialog
src/components/inventory/image-upload.tsx              - Bild-Upload
src/components/inventory/status-badge.tsx              - Status-Anzeige
src/components/inventory/item-status-dialog.tsx        - Status andern
src/lib/validations/inventory.ts                       - Zod Schemas
src/hooks/use-inventory-filters.ts                     - Filter/Sortierung State
```

---

## UI/UX Anforderungen

### Inventar-Ubersicht (Tabelle)

```
+-------------------------------------------------------------+
| Inventar                           [Karten] [+ Neues Item]  |
+-------------------------------------------------------------+
| [Alle Kategorien v] [Alle Status v] [Suche...            ]  |
+-------------------------------------------------------------+
|       | Name              | Kategorie | Status    | Grosse   |
+-------+-------------------+-----------+-----------+----------+
| [IMG] | Garde-Jacke #1    | Kostume   | Verfugbar | M        |
| [IMG] | Garde-Jacke #2    | Kostume   | Verliehen | L        |
| [IMG] | Megafon           | Technik   | Verfugbar | -        |
| [IMG] | Trainingsmatte    | Training  | Defekt    | 180x60   |
+-------------------------------------------------------------+
| Seite 1 von 3                           [<] [1] [2] [3] [>] |
+-------------------------------------------------------------+
```

### Inventar-Ubersicht (Karten)

```
+-------------------------------------------------------------+
| Inventar                          [Tabelle] [+ Neues Item]  |
+-------------------------------------------------------------+
| +---------------------------+  +---------------------------+ |
| | [    BILD    ]            |  | [    BILD    ]            | |
| | Garde-Jacke #1            |  | Garde-Jacke #2            | |
| | Kostume | M               |  | Kostume | L               | |
| | [Verfugbar]               |  | [Verliehen] an Max M.     | |
| +---------------------------+  +---------------------------+ |
+-------------------------------------------------------------+
```

### Item-Formular (Neue Seite)

```
+-------------------------------------------------------------+
| <- Zuruck                                                    |
+-------------------------------------------------------------+
| Neues Item erfassen                                          |
+-------------------------------------------------------------+
|                                                              |
| +---------------------------+  +---------------------------+ |
| | Name *                    |  | Kategorie *               | |
| | [                      ]  |  | [Kostume              v]  | |
| +---------------------------+  +---------------------------+ |
|                                                              |
| +---------------------------+  +---------------------------+ |
| | Inventarnummer            |  | Grosse/Masse              | |
| | [KOS-0001] (auto)         |  | [M                     ]  | |
| +---------------------------+  +---------------------------+ |
|                                                              |
| +---------------------------+  +---------------------------+ |
| | Anschaffungsdatum         |  | Anschaffungspreis         | |
| | [          ]              |  | [         ] EUR           | |
| +---------------------------+  +---------------------------+ |
|                                                              |
| +---------------------------+                                |
| | Zustand                   |                                |
| | (o) Neu  (o) Gut  (o) Gebraucht  (o) Reparaturbedurftig   |
| +---------------------------+                                |
|                                                              |
| +-------------------------------------------------------+   |
| | Beschreibung                                          |   |
| | [                                                  ]  |   |
| | [                                                  ]  |   |
| +-------------------------------------------------------+   |
|                                                              |
| +-------------------------------------------------------+   |
| | Bilder                                   [+ Hinzufugen]   |
| | [IMG1] [IMG2] [IMG3]                                  |   |
| +-------------------------------------------------------+   |
|                                                              |
| +-------------------------------------------------------+   |
| | Interne Notizen (nur fur Vorstand sichtbar)           |   |
| | [                                                  ]  |   |
| +-------------------------------------------------------+   |
|                                                              |
+-------------------------------------------------------------+
|                              [Abbrechen]  [Item speichern]  |
+-------------------------------------------------------------+
```

### Status-Dialog

```
+---------------------------------------------+
| Status andern: Garde-Jacke #1               |
+---------------------------------------------+
|                                             |
| Aktueller Status: [Verfugbar]               |
|                                             |
| Neuer Status:                               |
| ( ) Verfugbar                               |
| (o) Verliehen                               |
| ( ) Defekt                                  |
| ( ) In Reinigung                            |
| ( ) Reserviert                              |
|                                             |
| Verliehen an: *                             |
| [Max Mustermann                      v]     |
|                                             |
| Notiz (optional):                           |
| [Fur Auftritt am 15.02.             ]      |
|                                             |
+---------------------------------------------+
|              [Abbrechen]  [Speichern]       |
+---------------------------------------------+
```

### Kategorien-Verwaltung

```
+-------------------------------------------------------------+
| Kategorien                                [+ Neue Kategorie] |
+-------------------------------------------------------------+
| [Drag] | Name              | Items  | Aktionen              |
+--------+-------------------+--------+-----------------------+
| [=]    | Kostume           | 24     | [Bearbeiten] [...]   |
| [=]    | Technik           | 12     | [Bearbeiten] [...]   |
| [=]    | Requisiten        | 8      | [Bearbeiten] [...]   |
| [=]    | Training          | 15     | [Bearbeiten] [...]   |
+-------------------------------------------------------------+
```

---

## Nicht im Scope

- Location-Tracking (Lagerorte) - PROJ-28
- QR/Barcode-System - PROJ-29
- Inventory Audit - PROJ-30
- Automatische Erinnerungen bei langer Verleih-Dauer
- Import/Export von Inventar-Daten (CSV)
- Kostum-spezifische Felder (Schnittmuster, Material)
- Wartungsplane fur technische Gerate

---

## Folge-Features

Nach PROJ-27 werden diese Features das Inventar-System erweitern:

1. **PROJ-28: Location & Rental Tracking** - Lagerorte, detaillierte Verleih-Historie
2. **PROJ-29: QR/Barcode System** - Code-Generierung und Scanner
3. **PROJ-30: Inventory Audit** - Jahrliche Inventur-Prufung

---

## Checklist vor Abschluss

- [x] Fragen gestellt: User hat alle wichtigen Fragen beantwortet
- [x] User Stories komplett: 7 User Stories definiert
- [x] Acceptance Criteria konkret: Jedes Kriterium ist testbar
- [x] Edge Cases identifiziert: 8 Edge Cases dokumentiert
- [x] Feature-ID vergeben: PROJ-27
- [x] File gespeichert: `/features/PROJ-27-inventory-items.md`
- [x] Status gesetzt: Planned
- [ ] User Review: Ausstehend

---

---

## Tech-Design (Solution Architect)

### Bestehende Architektur-Analyse

Das Projekt hat bereits:
- **Event-Attachments** → Bild-Upload Pattern mit Supabase Storage
- **Event-Types** → Kategorien-Verwaltung Pattern
- **DataTable** → Tabellen mit Filter, Sortierung, Paginierung
- **Gruppen-Mitglieder** → M:N Beziehungen (für Item-Sets)

### Component-Struktur

```
Admin-Dashboard
├── Navigation
│   └── Neuer Menüpunkt: "Inventar" (in Administration)
│       ├── Items
│       ├── Kategorien
│       └── Sets
│
└── Inventar-Bereich
    ├── Items-Übersicht
    │   ├── Ansicht-Toggle: [Tabelle] [Karten]
    │   ├── Filter-Leiste
    │   │   ├── Kategorie-Dropdown
    │   │   ├── Status-Dropdown
    │   │   └── Suchfeld
    │   ├── Tabellen-Ansicht
    │   │   └── Zeile: Thumbnail | Name | Kategorie | Status-Badge | Größe | Inventarnr.
    │   ├── Karten-Ansicht
    │   │   └── Karte: Bild + Name + Status-Badge + Kategorie
    │   └── Paginierung
    │
    ├── Item-Formular (eigene Seite)
    │   ├── Basis-Daten
    │   │   ├── Name (Pflicht)
    │   │   ├── Kategorie (Pflicht)
    │   │   ├── Inventarnummer (auto oder manuell)
    │   │   └── Größe/Maße
    │   ├── Anschaffungs-Daten
    │   │   ├── Datum
    │   │   └── Preis
    │   ├── Zustand-Auswahl (Radio)
    │   ├── Beschreibung (Textfeld)
    │   ├── Bilder-Upload (bis zu 5)
    │   └── Interne Notizen (nur Vorstand)
    │
    ├── Status-Dialog
    │   ├── Aktuelle Status-Anzeige
    │   ├── Neuer Status (Radio-Auswahl)
    │   ├── "Verliehen an" Mitglieder-Suche (bei Verleih)
    │   └── Notiz-Feld
    │
    ├── Kategorien-Verwaltung
    │   ├── Sortierbare Liste mit Drag & Drop
    │   └── Erstellen/Bearbeiten Dialog
    │       ├── Name
    │       ├── Beschreibung
    │       └── Emoji-Auswahl
    │
    └── Sets-Verwaltung
        ├── Sets-Liste
        └── Set-Formular
            ├── Name
            ├── Beschreibung
            └── Item-Multi-Select

Mitglieder-Dashboard
├── Navigation
│   └── Neuer Menüpunkt: "Mein Equipment" (oder im Dashboard-Widget)
│
└── Mein Equipment
    └── Liste: Item-Name | Kategorie | Verliehen seit
```

### Daten-Model (vereinfacht)

```
Kategorien:
- Name (Pflicht, eindeutig)
- Beschreibung (optional)
- Emoji/Icon (optional)
- Sortierreihenfolge

Items:
- Name (Pflicht)
- Verknüpfte Kategorie
- Inventarnummer (auto-generiert: KAT-0001)
- Status: Verfügbar | Verliehen | Defekt | In Reinigung | Reserviert
- Zustand: Neu | Gut | Gebraucht | Reparaturbedürftig
- Größe/Maße (Freitext)
- Anschaffungsdatum & -preis
- Beschreibung
- Interne Notizen
- Aktueller Besitzer (bei Verleih)
- Archiviert-Markierung

Item-Bilder:
- Verknüpftes Item
- Speicherpfad (Supabase Storage)
- Sortierreihenfolge (erstes = Thumbnail)

Sets:
- Name
- Beschreibung
- Verknüpfte Items (M:N)

Status-Protokoll:
- Verknüpftes Item
- Alter & Neuer Status
- Geändert von (Vorstand)
- Verliehen an (bei Verleih)
- Zeitstempel
```

### Status-Workflow (visuell)

```
           ┌─────────────┐
           │  Verfügbar  │ (grün)
           └─────┬───────┘
                 │
    ┌────────────┼────────────┬─────────────┐
    ↓            ↓            ↓             ↓
┌────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐
│Verliehen│ │  Defekt  │ │ In Rein. │ │ Reserviert│
│(orange) │ │  (rot)   │ │  (blau)  │ │  (gelb)   │
└────────┘ └──────────┘ └──────────┘ └───────────┘

Alle Status können zu "Verfügbar" zurückwechseln
```

### Inventarnummer-Schema

```
Automatisch generiert:
[Kategorie-Prefix]-[Laufende Nummer]

Beispiele:
- KOS-0001 (Kostüme)
- TEC-0001 (Technik)
- REQ-0001 (Requisiten)
- TRA-0001 (Training)

Prefix = Erste 3 Buchstaben der Kategorie (uppercase)
```

### Bild-Upload & Storage

```
Supabase Storage Bucket: "inventory-images"

Struktur:
inventory-images/
├── {item-id}/
│   ├── {image-id}-thumb.webp (300px)
│   └── {image-id}-full.webp (1200px)

Komprimierung serverseitig:
- Thumbnail: 300px Breite, für Listen
- Vollbild: 1200px Breite, für Details
```

### Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| **Keine vordefinierten Kategorien** | Jeder Verein hat andere Anforderungen |
| **Auto-generierte Inventarnummer** | Weniger Fehler, konsistentes Format |
| **Sets als separate Entität** | Items können in mehreren Sets sein |
| **Status-Log Tabelle** | Nachvollziehbare Verleih-Historie |
| **Soft-Delete für Items** | Archivierte Items bleiben erhalten |
| **WebP für Bilder** | Modernes Format, gute Komprimierung |

### Wiederverwendbare Komponenten

- **DataTable** → Für Item-Listen (wie Members-Tabelle)
- **Badge** → Für Status-Anzeige (verschiedene Farben)
- **Avatar** → Für Mitglieder bei "Verliehen an"
- **Combobox** → Für Mitglieder-Suche bei Verleih
- **File-Upload** → Ähnlich zu Event-Attachments
- **Radio-Group** → Für Status & Zustand

### Neue UI-Komponenten (zu erstellen)

- **Image-Gallery** → Mehrere Bilder mit Thumbnail-Auswahl
- **Status-Badge** → Farbcodierte Status-Anzeige
- **Inventory-Card** → Karten-Ansicht für Items
- **Set-Item-Picker** → Multi-Select für Items in Sets

### Dependencies

| Package | Zweck | Bereits installiert? |
|---------|-------|---------------------|
| **sharp** (Backend) | Bild-Komprimierung | ❓ Prüfen |
| **Keine neuen für UI** | Alles mit shadcn/ui umsetzbar | ✅ |

### Aufwand-Schätzung

| Bereich | Komplexität |
|---------|-------------|
| Datenbank-Setup | Mittel (6 Tabellen, Trigger für Inventarnummer) |
| Kategorien-CRUD | Niedrig (bekanntes Pattern) |
| Item-Formular | Mittel (viele Felder, Multi-Image-Upload) |
| Status-Workflow | Mittel (Dialog, Log, Mitglieder-Suche) |
| Sets-Verwaltung | Niedrig (einfache M:N) |
| Tabellen/Karten-Toggle | Niedrig (State + zwei Views) |
| Mitglieder-Ansicht | Niedrig (einfache Liste) |

---

## Git Workflow

```bash
git commit -m "feat(PROJ-27): Add inventory items & categories specification"
```

---

## QA Test Results

**Tested:** 2026-02-20
**Test Type:** Code Review + Bug Fixes
**Full Report:** [test-reports/PROJ-27-qa-report.md](../test-reports/PROJ-27-qa-report.md)

### Fixed Bugs (4)

| ID | Severity | Status |
|----|----------|--------|
| BUG-1 | Critical | FIXED - HTTP Method auf PUT geandert |
| BUG-2 | High | FIXED - Pagination Response Format korrigiert |
| BUG-3 | High | FIXED - Public URLs in Items-API hinzugefugt |
| BUG-4 | Critical | FIXED - Backend deployed (DB + Storage + RLS) |

### Remaining Issues (Medium/Low - Nachste Iteration)

| ID | Severity | Description |
|----|----------|-------------|
| BUG-5 | Medium | Drag & Drop fur Kategorien fehlt |
| BUG-6 | Medium | Bild-Sortierung fehlt |
| SEC-1 | Medium | SQL Injection Pattern verbessern |
| SEC-2 | Medium | Magic-Bytes Validierung |
| SEC-3 | Low | Rate-Limiting |

### Summary

- **Acceptance Criteria:** 35 passed, 6 nachste Iteration
- **Critical/High Bugs:** 4 FIXED, 0 offen
- **Production-Ready:** READY FOR BROWSER TESTING

### Nachste Schritte

1. Manuelle Browser-Tests durchfuhren
2. Cross-Browser testen (Chrome, Firefox, Safari)
3. Mobile-Responsiveness testen
4. TypeScript-Typen regenerieren
