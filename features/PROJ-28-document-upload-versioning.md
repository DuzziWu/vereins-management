# PROJ-28: Document Upload & Versioning

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - für eingeloggte User-Checks
- Benötigt: PROJ-26 (Document Folder System) - für Ordnerstruktur und Berechtigungen
- Unabhängig von: Workgroup-Features (PROJ-25ff), Inventory-Features (PROJ-27ff)

---

## Übersicht

Erweiterung des Document Folder Systems um Dokument-Upload, Versionierung und optionale Lesebestätigungen. Unterstützt alle gängigen Dateiformate und ermöglicht es dem Vorstand, wichtige Dokumente zu verwalten und deren Kenntnisnahme zu tracken.

**Wichtig:** Baut auf PROJ-26 (Folder System) auf. Berechtigungen werden vom Ordner geerbt.

---

## User Stories

### US-1: Dokument hochladen
**Als** Vorstand
**möchte ich** Dokumente in einen Ordner hochladen
**um** Vereinsinformationen digital zu archivieren.

### US-2: Dokument anzeigen
**Als** Vereinsmitglied
**möchte ich** freigegebene Dokumente im Browser ansehen
**um** Informationen ohne Download einzusehen.

### US-3: Dokument herunterladen
**Als** Vereinsmitglied
**möchte ich** Dokumente herunterladen
**um** sie offline zu lesen oder auszudrucken.

### US-4: Neue Version hochladen
**Als** Vorstand
**möchte ich** eine neue Version eines bestehenden Dokuments hochladen
**um** Aktualisierungen zu veröffentlichen.

### US-5: Versionshistorie einsehen
**Als** Vorstand
**möchte ich** alle Versionen eines Dokuments sehen
**um** Änderungen nachzuvollziehen oder alte Versionen wiederherzustellen.

### US-6: Lesebestätigung einfordern
**Als** Vorstand
**möchte ich** bei wichtigen Dokumenten eine Lesebestätigung anfordern
**um** sicherzustellen, dass alle Mitglieder informiert sind.

### US-7: Lesebestätigung abgeben
**Als** Vereinsmitglied
**möchte ich** bestätigen, dass ich ein wichtiges Dokument gelesen habe
**um** meine Kenntnisnahme zu dokumentieren.

### US-8: Lesebestätigungs-Status einsehen
**Als** Vorstand
**möchte ich** sehen, welche Mitglieder ein Dokument bereits bestätigt haben
**um** Nachfragen zu können.

---

## Acceptance Criteria

### Dokument-Upload

- [ ] "Dokument hochladen" Button in Ordner-Ansicht (nur Vorstand)
- [ ] Drag & Drop Upload-Zone
- [ ] Erlaubte Dateitypen:
  - PDF (.pdf)
  - Microsoft Office (.docx, .xlsx, .pptx)
  - OpenDocument (.odt, .ods, .odp)
  - Bilder (.jpg, .jpeg, .png, .webp)
  - Archive (.zip)
- [ ] Maximale Dateigröße: 25 MB pro Datei
- [ ] Pflichtfeld: Dokumentname (automatisch aus Dateiname, editierbar)
- [ ] Optionales Feld: Beschreibung (max. 500 Zeichen)
- [ ] Option: "Lesebestätigung erforderlich" (Checkbox)
- [ ] Option: "Berechtigung für alle Gruppen" (überschreibt Ordner-Berechtigung)
- [ ] Fortschrittsanzeige während Upload
- [ ] Validierung: Dateityp und Größe vor Upload prüfen

### Dokument-Ansicht & Download

- [ ] Dokumente werden in der Ordner-Ansicht unterhalb der Unterordner angezeigt
- [ ] Anzeige pro Dokument: Icon (nach Typ), Name, Größe, Hochgeladen am, Hochgeladen von
- [ ] PDF-Vorschau: Eingebetteter PDF-Viewer (keine Installation nötig)
- [ ] Office-Dokumente: Info "Zum Bearbeiten herunterladen"
- [ ] Bilder: Lightbox-Ansicht
- [ ] Download-Button für alle Dateitypen
- [ ] Bei Lesebestätigungs-Dokumenten: "Gelesen"-Badge nach Bestätigung

### Versionierung

- [ ] Vorstand kann "Neue Version hochladen" wählen statt neues Dokument
- [ ] Automatische Versionsnummer (v1, v2, v3...)
- [ ] Aktuelle Version wird standardmäßig angezeigt
- [ ] Versionshistorie über Dropdown oder Sidebar zugänglich
- [ ] Alte Versionen können angesehen und heruntergeladen werden
- [ ] Option: "Alte Version wiederherstellen" (erstellt neue Version mit altem Inhalt)
- [ ] Versionsnotiz: "Was hat sich geändert?" (optional, max. 200 Zeichen)

### Lesebestätigungen (Optional pro Dokument)

- [ ] Toggle bei Upload: "Lesebestätigung erforderlich"
- [ ] Berechtigte Mitglieder sehen "Ich habe dieses Dokument gelesen" Button
- [ ] Nach Klick: Bestätigung mit Zeitstempel gespeichert
- [ ] Bestätigungs-Badge am Dokument für bestätigte User
- [ ] Vorstand sieht Bestätigungs-Status:
  - Fortschrittsanzeige: "12 von 24 haben bestätigt"
  - Liste: Wer hat bestätigt (mit Datum), wer noch nicht
- [ ] Erinnerungsfunktion: Vorstand kann "Erinnerung senden" an ausstehende Mitglieder
- [ ] Bei neuer Version: Bestätigungen werden zurückgesetzt, User müssen erneut bestätigen

### Dokument löschen & archivieren

- [ ] Dokument löschen mit Bestätigungsdialog
- [ ] Löschen entfernt alle Versionen
- [ ] Optional: Soft-Delete (Papierkorb für 30 Tage)
- [ ] Dokument verschieben in anderen Ordner (erbt neue Berechtigungen)

### Suche & Filterung

- [ ] Suche nach Dokumentname innerhalb der Ordnerstruktur
- [ ] Filter nach Dateityp (PDF, Office, Bilder, etc.)
- [ ] Filter nach "Lesebestätigung ausstehend" (für Mitglieder)
- [ ] Sortierung: Name, Datum, Größe

---

## Edge Cases

### E-1: Datei zu groß
- **Szenario:** User versucht Datei >25MB hochzuladen
- **Lösung:** Upload wird clientseitig blockiert
- **Meldung:** "Diese Datei ist zu groß (X MB). Maximale Größe: 25 MB."

### E-2: Falscher Dateityp
- **Szenario:** User versucht nicht unterstützten Dateityp hochzuladen
- **Lösung:** Upload wird clientseitig blockiert
- **Meldung:** "Dieser Dateityp wird nicht unterstützt. Erlaubte Formate: PDF, Word, Excel, PowerPoint, Bilder, ZIP."

### E-3: Dokument mit gleichem Namen
- **Szenario:** Dokument mit gleichem Namen im selben Ordner
- **Lösung:** Warnung mit Optionen
- **Meldung:** "Ein Dokument mit diesem Namen existiert bereits. [Als neue Version hochladen] [Umbenennen] [Abbrechen]"

### E-4: Upload während Offline
- **Szenario:** Netzwerkverbindung bricht während Upload ab
- **Lösung:** Fehlermeldung mit Retry-Option
- **Meldung:** "Upload fehlgeschlagen. Bitte Internetverbindung prüfen. [Erneut versuchen]"

### E-5: Ordner-Berechtigung ändert sich
- **Szenario:** Ordner-Berechtigung wird eingeschränkt, Mitglied hat bereits Lesebestätigung
- **Lösung:** Bestätigung bleibt erhalten, Zugriff aber entzogen
- **Verhalten:** Mitglied kann Dokument nicht mehr sehen, Bestätigung in Historie

### E-6: Sehr großes PDF (>100 Seiten)
- **Szenario:** PDF-Vorschau bei sehr großem Dokument
- **Lösung:** Lazy-Loading, nur aktuelle Seite laden
- **Performance:** Paginierte Ansicht, nicht alle Seiten auf einmal

### E-7: Lesebestätigung für Gruppen-Dokument
- **Szenario:** Dokument ist für Gruppe freigegeben, Gruppe bekommt neue Mitglieder
- **Lösung:** Neue Mitglieder sehen Dokument, haben aber noch keine Bestätigung
- **Verhalten:** Zähler aktualisiert sich automatisch

### E-8: Dokument im Browser nicht anzeigbar
- **Szenario:** Spezielle Office-Formate oder beschädigte PDFs
- **Lösung:** Fallback auf Download-only
- **Meldung:** "Vorschau nicht verfügbar. [Herunterladen]"

---

## Technische Anforderungen

### Datenbank (Supabase)

```sql
-- documents: Dokument-Metadaten
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  current_version_id UUID, -- Wird nach erstem Version-Insert aktualisiert
  requires_confirmation BOOLEAN NOT NULL DEFAULT false,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft-Delete

  CONSTRAINT documents_name_folder_unique UNIQUE (folder_id, name)
);

-- document_versions: Versionierte Dateien
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  change_note VARCHAR(200),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT document_versions_unique UNIQUE (document_id, version_number)
);

-- document_confirmations: Lesebestätigungen
CREATE TABLE document_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES document_versions(id),
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT document_confirmations_unique UNIQUE (document_id, profile_id)
);

-- Indexes
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_confirmations_document ON document_confirmations(document_id);
CREATE INDEX idx_document_confirmations_profile ON document_confirmations(profile_id);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_confirmations ENABLE ROW LEVEL SECURITY;

-- Documents: Sichtbar wenn Ordner-Berechtigung existiert
CREATE POLICY "documents_select" ON documents
  FOR SELECT TO authenticated USING (
    deleted_at IS NULL AND (
      is_vorstand(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM folders f
        JOIN folder_permissions fp ON f.id = fp.folder_id OR f.path LIKE fp.folder_id::text || '%'
        WHERE f.id = folder_id
        AND (
          fp.role = get_user_role(auth.uid()) OR
          fp.group_id IN (SELECT group_id FROM group_members WHERE profile_id = get_profile_id_for_user(auth.uid())) OR
          fp.profile_id = get_profile_id_for_user(auth.uid())
        )
      )
    )
  );

CREATE POLICY "documents_insert" ON documents
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

CREATE POLICY "documents_update" ON documents
  FOR UPDATE TO authenticated USING (is_vorstand(auth.uid()));

CREATE POLICY "documents_delete" ON documents
  FOR DELETE TO authenticated USING (is_vorstand(auth.uid()));

-- Versions: Gleiche Regeln wie Documents
CREATE POLICY "document_versions_select" ON document_versions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM documents WHERE id = document_id AND deleted_at IS NULL)
  );

CREATE POLICY "document_versions_insert" ON document_versions
  FOR INSERT TO authenticated WITH CHECK (is_vorstand(auth.uid()));

-- Confirmations: User kann eigene lesen/schreiben, Vorstand sieht alle
CREATE POLICY "document_confirmations_select" ON document_confirmations
  FOR SELECT TO authenticated USING (
    is_vorstand(auth.uid()) OR profile_id = get_profile_id_for_user(auth.uid())
  );

CREATE POLICY "document_confirmations_insert" ON document_confirmations
  FOR INSERT TO authenticated WITH CHECK (
    profile_id = get_profile_id_for_user(auth.uid())
  );

-- Trigger: current_version_id aktualisieren
CREATE OR REPLACE FUNCTION update_document_current_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE documents
  SET current_version_id = NEW.id, updated_at = NOW()
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_current_version
  AFTER INSERT ON document_versions
  FOR EACH ROW EXECUTE FUNCTION update_document_current_version();

-- Trigger: Lesebestätigungen bei neuer Version zurücksetzen
CREATE OR REPLACE FUNCTION reset_confirmations_on_new_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version_number > 1 THEN
    DELETE FROM document_confirmations WHERE document_id = NEW.document_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_confirmations_on_new_version
  AFTER INSERT ON document_versions
  FOR EACH ROW EXECUTE FUNCTION reset_confirmations_on_new_version();
```

### Supabase Storage

```
Bucket: documents
Struktur: /{document_id}/{version_id}.{ext}

Policies:
- SELECT: authenticated users (mit Folder-Berechtigung)
- INSERT: nur Vorstand
- DELETE: nur Vorstand

Bucket-Einstellungen:
- Max. Dateigröße: 25 MB
- Erlaubte MIME-Types konfiguriert
```

### Neue Dateien

```
src/app/(dashboard)/[role]/documents/[folderId]/upload/page.tsx  - Upload-Seite
src/components/documents/document-list.tsx                        - Dokumentenliste
src/components/documents/document-item.tsx                        - Einzelnes Dokument
src/components/documents/document-upload.tsx                      - Upload-Formular
src/components/documents/document-preview.tsx                     - Vorschau (PDF, Bilder)
src/components/documents/version-history.tsx                      - Versionshistorie
src/components/documents/confirmation-status.tsx                  - Lesebestätigungs-Anzeige
src/components/documents/confirmation-button.tsx                  - "Gelesen" Button
src/lib/validations/documents.ts                                  - Zod Schemas
src/hooks/use-document-preview.ts                                 - Preview-State
```

---

## UI/UX Anforderungen

### Ordner-Ansicht mit Dokumenten

```
+-------------------------------------------------------------+
| Home > Protokolle > 2026                                     |
+-------------------------------------------------------------+
| 2026                           [+ Neuer Ordner] [+ Dokument] |
+-------------------------------------------------------------+
|                                                              |
| ORDNER                                                       |
| [📁] Januar                                    04.01.2026   |
| [📁] Februar                                   01.02.2026   |
|                                                              |
| DOKUMENTE                                                    |
| [📄] Jahresplanung.pdf          1.2 MB         05.01.2026   |
|      [Lesebestätigung: 18/24]                  [👁️] [⬇️]    |
| [📊] Budget.xlsx                 450 KB         05.01.2026   |
|                                                  [👁️] [⬇️]    |
| [🖼️] Gruppenfoto.jpg            2.8 MB         10.01.2026   |
|                                                  [👁️] [⬇️]    |
+-------------------------------------------------------------+
```

### Upload-Formular

```
+-------------------------------------------------------------+
| Dokument hochladen                                           |
+-------------------------------------------------------------+
|                                                              |
| +-------------------------------------------------------+   |
| |                                                       |   |
| |     📂 Datei hier ablegen oder klicken zum Auswählen  |   |
| |                                                       |   |
| |     Erlaubt: PDF, Word, Excel, PowerPoint, Bilder, ZIP   |
| |     Max. Größe: 25 MB                                 |   |
| |                                                       |   |
| +-------------------------------------------------------+   |
|                                                              |
| Dokumentname *                                               |
| [Jahresplanung_2026.pdf                              ]      |
|                                                              |
| Beschreibung                                                 |
| [Planung für das Vereinsjahr 2026                   ]      |
|                                                              |
| [x] Lesebestätigung erforderlich                            |
|     Mitglieder müssen bestätigen, dass sie das Dokument     |
|     gelesen haben.                                          |
|                                                              |
+-------------------------------------------------------------+
|                              [Abbrechen]  [Hochladen]       |
+-------------------------------------------------------------+
```

### Dokument-Vorschau (PDF)

```
+-------------------------------------------------------------+
| Jahresplanung_2026.pdf                              [X]     |
+-------------------------------------------------------------+
| v2 vom 15.01.2026 | Seite 1 von 12                          |
+-------------------------------------------------------------+
|                                                              |
| +-------------------------------------------------------+   |
| |                                                       |   |
| |                 [PDF INHALT]                          |   |
| |                                                       |   |
| +-------------------------------------------------------+   |
|                                                              |
+-------------------------------------------------------------+
| [< Zurück] [1] [2] ... [12] [Weiter >]        [⬇️ Download] |
+-------------------------------------------------------------+
| [✓ Ich habe dieses Dokument gelesen]                        |
+-------------------------------------------------------------+
```

### Lesebestätigungs-Status (Vorstand)

```
+-------------------------------------------------------------+
| Lesebestätigungen: Jahresplanung_2026.pdf                   |
+-------------------------------------------------------------+
| Fortschritt: 18 von 24 (75%)                                |
| [====================================        ]              |
|                                                              |
| ✅ BESTÄTIGT (18)                  ⏳ AUSSTEHEND (6)         |
+-------------------------------------------------------------+
| ✅ Max Mustermann     15.01.2026   | ⏳ Lisa Weber          |
| ✅ Anna Schmidt       15.01.2026   | ⏳ Tom Fischer         |
| ✅ Peter Meyer        16.01.2026   | ⏳ Sarah Koch          |
| ...                                 | ...                    |
+-------------------------------------------------------------+
|                              [Erinnerung an Ausstehende]    |
+-------------------------------------------------------------+
```

---

## Nicht im Scope

- Dokumenten-Editor im Browser (nur Ansicht/Download)
- OCR / Volltextsuche im Dokumentinhalt
- Automatische Kategorisierung
- Wasserzeichen
- Digitale Signaturen
- Gemeinsame Bearbeitung (Collaboration)
- Automatische Archivierung nach X Jahren

---

## Checklist vor Abschluss

- [x] Fragen gestellt: User hat alle wichtigen Fragen beantwortet
- [x] User Stories komplett: 8 User Stories definiert
- [x] Acceptance Criteria konkret: Jedes Kriterium ist testbar
- [x] Edge Cases identifiziert: 8 Edge Cases dokumentiert
- [x] Feature-ID vergeben: PROJ-28
- [x] File gespeichert: `/features/PROJ-28-document-upload-versioning.md`
- [x] Status gesetzt: 🔵 Planned
- [ ] User Review: Ausstehend

---

## Git Workflow

```bash
git commit -m "feat(PROJ-28): Add document upload & versioning specification"
```
