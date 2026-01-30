# PROJ-12: Offene Bugs & Improvements

**Stand:** 2026-01-30
**Feature:** Gruppenverwaltung (Group Administration)
**Prioritaet:** Keine deployment-blockierenden Issues. Alle Critical/High Bugs wurden gefixt.

---

## Offene Bugs

### BUG-10: Fehlende /api/groups/[id]/trainers Endpunkte
- **Severity:** Low
- **Typ:** Design-Abweichung
- **Status:** Offen (akzeptierte Design-Entscheidung)
- **Beschreibung:** Laut Spec sollte es separate `/api/groups/[id]/trainers` Endpunkte geben (GET, POST, DELETE). Aktuell laeuft die Trainer-Verwaltung ueber PATCH `/api/groups/[id]` mit `co_trainer_ids`.
- **Impact:** Funktional aequivalent, weicht nur von der API-Spec ab. Kein Funktionsverlust.
- **Fix:** Optional -- Separate Route-Datei `src/app/api/groups/[id]/trainers/route.ts` erstellen mit GET/POST/DELETE Handlern.

---

### FINDING-1: Members-Endpoint fehlt UUID-Validierung auf Group-ID
- **Severity:** Low
- **Typ:** Inkonsistenz
- **Status:** Offen
- **Location:** `src/app/api/groups/[id]/members/route.ts` (POST + DELETE)
- **Beschreibung:** Der Members-Endpoint validiert `profile_id` per UUID-Regex, aber NICHT die `groupId` aus dem URL-Parameter. Eine ungueltige `groupId` fuehrt zu "Group not found" (404) statt "Invalid format" (400).
- **Impact:** Minimal -- `checkGroupAccess` faengt ungueltige IDs als 404 ab.
- **Fix:**
  ```typescript
  // Am Anfang von POST und DELETE hinzufuegen:
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(groupId)) {
    return NextResponse.json({ error: 'Invalid group ID format' }, { status: 400 });
  }
  ```

---

### FINDING-2: Server Action `getGroup()` ohne Autorisierungspruefung
- **Severity:** Low
- **Typ:** Best Practice
- **Status:** Offen
- **Location:** `src/lib/actions/groups.ts:288-325`
- **Beschreibung:** Die Server Action `getGroup(groupId)` hat keinen expliziten Auth- oder Rollen-Check. Sie fuehrt direkt einen Supabase-Query aus. RLS auf der `groups`-Tabelle schuetzt auf DB-Ebene.
- **Impact:** Niedrig -- RLS ist korrekt konfiguriert. Die Action wird nur server-seitig aufgerufen.
- **Fix:**
  ```typescript
  // Am Anfang von getGroup() hinzufuegen (analog zu getMyGroups):
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { groups: [], error: 'Not authenticated' };
  ```

---

## Offene Security Findings

### SEC-6: Keine Rate-Limits auf API-Endpunkte
- **Severity:** Low
- **Typ:** Security Enhancement
- **Status:** Offen (akzeptiert)
- **Beschreibung:** Keine Rate-Limits auf den `/api/groups/*` Endpunkten.
- **Impact:** Niedrig -- Rate-Limiting wird typischerweise auf Infrastructure-Ebene (Vercel/Cloudflare) implementiert.
- **Fix:** Vercel Rate-Limiting oder `@upstash/ratelimit` integrieren.

---

### SEC-8: Mitglieder-Daten-Abruf durch Trainer
- **Severity:** Low
- **Typ:** Security Enhancement
- **Status:** Offen (akzeptiert)
- **Beschreibung:** Trainer-Page ruft `/api/members?limit=999&statuses=active` auf, was alle aktiven Mitglieder zurueckgibt. Die API prueft ob der User mindestens Trainer ist, aber gibt alle Mitglieder zurueck (nicht nur die eigenen Gruppen-Mitglieder).
- **Impact:** Niedrig -- Trainer benoetigen Zugriff auf alle Mitglieder fuer die Mitglieder-Zuordnung. Eine Einschraenkung wuerde die Funktionalitaet beeintraechtigen.
- **Fix:** Optional -- Separaten Endpoint fuer Mitglieder-Suche innerhalb der Gruppenverwaltung erstellen.

---

## Offene Edge Cases

### E-1: DB-Trigger fuer Auto-Promotion bei Profil-Deaktivierung
- **Severity:** Low
- **Typ:** Enhancement
- **Status:** Offen
- **Beschreibung:** Wenn ein Trainer-Profil geloescht/deaktiviert wird, setzt `ON DELETE SET NULL` den `trainer_id` auf NULL. Es gibt keinen DB-Trigger der automatisch einen Co-Trainer zum Trainer befoerdert oder den Vorstand benachrichtigt.
- **Impact:** Vorstand muss manuell eingreifen. Auto-Promotion funktioniert bereits beim manuellen Entfernen via PATCH-Handler.
- **Fix:**
  ```sql
  CREATE OR REPLACE FUNCTION promote_co_trainer_on_trainer_removal()
  RETURNS TRIGGER AS $$
  DECLARE
    v_co_trainer_id UUID;
  BEGIN
    IF NEW.trainer_id IS NULL AND OLD.trainer_id IS NOT NULL THEN
      SELECT profile_id INTO v_co_trainer_id
      FROM group_trainers
      WHERE group_id = NEW.id AND role = 'co_trainer'
      ORDER BY created_at ASC
      LIMIT 1;

      IF v_co_trainer_id IS NOT NULL THEN
        NEW.trainer_id := v_co_trainer_id;
        DELETE FROM group_trainers
        WHERE group_id = NEW.id AND profile_id = v_co_trainer_id;
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trigger_promote_co_trainer
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION promote_co_trainer_on_trainer_removal();
  ```

---

## Zusammenfassung

| # | Issue | Severity | Typ |
|---|-------|----------|-----|
| BUG-10 | /trainers Endpoints fehlen | Low | Design-Abweichung |
| FINDING-1 | UUID-Check auf Group-ID im Members-Endpoint | Low | Inkonsistenz |
| FINDING-2 | Auth-Check in Server Action getGroup() | Low | Best Practice |
| SEC-6 | Rate-Limiting | Low | Security Enhancement |
| SEC-8 | Mitglieder-Daten durch Trainer abrufbar | Low | Security Enhancement |
| E-1 | DB-Trigger fuer Auto-Promotion | Low | Enhancement |

**Gesamt: 6 offene Items (alle Low Severity)**
