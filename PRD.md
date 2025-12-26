# **Product Requirements Document (PRD): Vereins-Master**

**Version:** 1.0.0 | **Status:** Draft | **Author:** Lead Architect

## **1\. Executive Summary & Vision**

"Vereins-Master" ist eine mandantenfähige SaaS-Lösung, die Sportvereine in das digitale Zeitalter führt. Im Gegensatz zu traditioneller, tabellarischer Verwaltungssoftware setzt Vereins-Master auf eine **User Experience (UX), die an moderne Consumer-Apps erinnert** ("Nike-Vibe").

Das Kernziel ist die **Dezentralisierung der Vereinsarbeit**: Weg von einem überlasteten Admin, hin zu empowered Coaches und engagierten Spielern durch rollenspezifische Dashboards. Die Architektur ist strikt modular ("Pay what you need"), gesteuert über einen internen Modul-Shop.

## **2\. Technische Architektur**

### **2.1 Tech Stack Übersicht**

* **Frontend Framework:** Next.js 14+ (App Router). Nutzung von React Server Components (RSC) für maximale Performance und SEO.  
* **Styling System:** TailwindCSS.  
  * *Design Token:* High-Contrast Dark Mode (Backgrounds: \#0f172a, Accents: \#d9f99d / Lime oder Custom Club Color).  
  * *Komponenten:* Shadcn/ui (angepasst auf "Sport-Look").  
* **Backend / Database:** Supabase (PostgreSQL).  
* **Auth:** Supabase Auth (Email/Passwort, Magic Link).  
* **State Management:** Server-State via TanStack Query (für Client-Components), URL-State für Filter.  
* **Deploy:** Vercel (empfohlen) oder Docker-Container.

### **2.2 Multi-Tenancy & Datensicherheit**

Das System basiert auf einer strikten Trennung der Mandanten auf Datenbankebene (Shared Database, Shared Schema, Row Isolation).

* **Identifikator:** club\_id (UUID) ist Pflichtfeld in fast allen Tabellen.  
* **Row Level Security (RLS):** Keine Abfrage darf ohne RLS erfolgen.  
  * *Policy Pattern:* auth.uid() IN (SELECT user\_id FROM club\_members WHERE club\_id \= target\_table.club\_id)  
* **Isolation:** Ein User kann theoretisch in mehreren Vereinen sein, aber die Session ist immer auf einen aktiven club\_context gescoopt.

### **2.3 Modularitäts-Logik (Feature Flags)**

Features werden nicht hart codiert angezeigt, sondern basieren auf der Tabelle subscriptions.

**Logik-Flow:**

1. Admin aktiviert "Skill Arena" im Modul-Shop.  
2. Eintrag in subscriptions (club\_id, module\_key='skill\_arena', status='active').  
3. **Middleware/Layout Check:** Next.js Layout prüft beim Laden, ob das Modul aktiv ist. Wenn nicht \-\> Feature nicht rendern oder "Locked"-State anzeigen.

## **3\. Design System & UX Guidelines**

### **3.1 Ästhetik ("The Nike Vibe")**

* **Farben:** Tiefe Schwarztöne, Graustufen für Container. Grelle Akzentfarben (Volt, Electric Blue) für Call-to-Actions (CTAs).  
* **Typografie:** Fett, Sans-Serif (z.B. 'Inter' oder 'Oswald' für Headlines), weite Laufweite (Tracking).  
* **Layout:**  
  * **Keine klassische Sidebar:** Navigation erfolgt primär über ein "Bento-Grid" Dashboard.  
  * **Mobile-First:** Alle Buttons müssen "Daumen-freundlich" (mind. 44px Höhe) sein.  
  * **Whitespace:** Großzügige Abstände. Daten werden nicht in engen Tabellen, sondern in "Cards" präsentiert.

### **3.2 Dynamic Branding**

Der Verein lädt sein Logo hoch und definiert eine Primärfarbe.

* **Logo:** Erscheint im Header und auf generierten PDFs (Aufstellungen).  
* **Farbe:** Wird via CSS-Variables (--club-primary) in Tailwind integriert (bg-\[var(--club-primary)\]).

## **4\. Rollenspezifische Dashboards (Core Features)**

### **4.1 Rolle: VEREINS-ADMIN (Der Manager)**

* **Dashboard-Widgets:**  
  * *Finanz-Ticker:* Offene Beiträge Summe (Rot) vs. Bezahlte (Grün).  
  * *Mitglieder-Zuwachs:* Line-Chart.  
  * *Action Center:* Offene Aufgaben / Genehmigungen.  
* **Core Features:**  
  * **Modul-Shop:** Grid-View aller verfügbaren Add-ons. Toggle-Switch zum Aktivieren (löst DB-Eintrag aus).  
  * **User Management:** Invite-Link Generierung für Coaches/Spieler. Zuweisung zu Teams (1. Herren, U19 etc.).  
  * **Finanz-Zentrale:**  
    * Mitgliedsbeiträge: Status-Tracking.  
    * Auslagen-Workflow: Coach reicht Rechnung ein (Foto) \-\> Admin erhält Notifikation \-\> Klick auf "Freigeben" \-\> Status-Update & Trigger für Auszahlungsvorbereitung.  
  * **Delegation:** Erstellen von Tasks ("Rasen mähen", "Trikots waschen") \-\> Zuweisung an Mitglieder.

### **4.2 Rolle: COACH (Der Operative)**

* **Dashboard-Widgets:**  
  * *Next Match:* Countdown, Gegner, Ort.  
  * *Trainings-Beteiligung:* %-Wert der letzten Woche.  
* **Core Features:**  
  * **Dreierspieltag-Event-Manager:**  
    * Spezielle Eingabemaske für Events, die aus mehreren Sub-Events bestehen (z.B. Spiel 1: 12:00, Spiel 2: 14:00, Spiel 3: 16:00).  
    * Orts-Zuweisung (Google Maps Link).  
  * **Kader-Tool (Taktik Board):**  
    * Drag & Drop von Spielern auf ein Spielfeld.  
    * **Export:** Generierung eines PDF mit Vereinslogo, Sponsoren (optional) und Aufstellung.  
  * **Attendance-Tracker:** Live-Liste (Grün: Zusage, Rot: Absage, Gelb: Unsicher \+ Begründung).

### **4.3 Rolle: PLAYER (Der Konsument)**

* **Dashboard-Widgets:**  
  * *Mein nächster Termin:* Großer "Teilnehmen / Absagen" Button direkt auf dem Home-Screen.  
  * *Meine Stats:* (Falls Skill-Arena aktiv).  
* **Core Features:**  
  * **Personal Hub:** Read-only Sicht auf Events.  
  * **Abwesenheits-Assistent:** "Ich bin im Urlaub von X bis Y" (blockt Verfügbarkeit automatisch).

## **5\. Erweiterungs-Module (The "Shop")**

### **5.1 Skill Arena (Gamification)**

* **Konzept:** Spieler sammeln XP durch Anwesenheit und Challenges.  
* **Level-System:** Berechnung basierend auf XP (z.B. Zinc \-\> Bronze \-\> Silver \-\> Gold \-\> Red).  
* **Challenge-Pool:** Tabelle challenges. DB-Trigger oder Cronjob wählt wöchentlich 3 zufällige Missionen ("Laufe 10km", "Triff die Latte").  
* **Trophäenschrank:** Visuelle Darstellung von Badges im Spielerprofil.

### **5.2 KI-Trainings-Assistent**

* **Input:** Coach gibt Parameter (Schwerpunkt: Ausdauer, Dauer: 90min, Spieleranzahl: 14).  
* **Process:** Call an OpenAI/Gemini API mit System-Prompt basierend auf Fußball-Metadaten.  
* **Output:** Strukturierter Trainingsplan als Text/Liste, speicherbar in training\_plans.

### **5.3 Inventar-Manager**

* **CRUD:** Items (Bälle, Hütchen, Trikotsätze).  
* **Leihe:** QR-Code Scan (Webcam) checkt Item aus \-\> Zuweisung an User \-\> Auto-Reminder bei Überfälligkeit.

## **6\. Datenbank-Schema & Logik (Auszug)**

### **6.1 Wichtige Tabellen**

\-- Mandanten  
table: clubs (id, name, logo\_url, primary\_color, subdomain)

\-- User (Erweitert Supabase Auth)  
table: profiles (id, club\_id, role enum('admin','coach','player'), team\_id, xp\_points)

\-- Module  
table: modules (key, name, price, description)  
table: subscriptions (club\_id, module\_key, active\_until, status)

\-- Finanzen  
table: expenses (id, club\_id, user\_id, amount, proof\_image\_url, status enum('pending','approved','paid'))

### **6.2 Automation (Trigger)**

1. **XP-Automatik:** Wenn attendance.status auf 'present' gesetzt wird \-\> Trigger inkrementiert profiles.xp\_points \+10.  
2. **Finance-Check:** Wenn expenses.status auf 'approved' wechselt \-\> Trigger erstellt Eintrag in payout\_queue Tabelle.

## **7\. Entwicklungs-Standards**

### **7.1 Code-Qualität**

* **Single Responsibility:** Eine Datei pro Komponente. Max 250 Zeilen.  
* **Server Actions:** Sämtliche Mutationen (POST/PUT/DELETE Logik) liegen in src/actions.  
* **Hooks:** Client-Side Logik (z.B. UI-State) in src/hooks.  
* **No Magic Strings:** Nutzung von Enums/Konstanten für Status und Rollen.

### **7.2 Dokumentation & Tracking**

* **CURRENT\_PROJECT\_STATE.md:** Muss nach jedem signifikanten Commit/Feature-Abschluss aktualisiert werden. Enthält:  
  * Aktuelle Version.  
  * Implementierte Features (Checklist).  
  * Bekannte Bugs.  
  * Nächste Schritte.  
* **Modul-Doku:** Jedes Modul (src/modules/skill-arena) erhält eine README.md mit Erklärung der Business Logic.

### **7.3 Testing Strategie**

* **Unit Tests:** Für Utility Functions (z.B. XP-Berechner).  
* **Integration Tests:** Für RLS-Policies (Sicherstellen, dass Club A keine Daten von Club B sieht).  
* **End-to-End (E2E):** Playwright Tests für den kritischen Pfad: "User Login \-\> Dashboard Load \-\> Event RSVP".

## **8\. Roadmap Phase 1 (MVP)**

1. **Setup:** Supabase Init, Auth Setup, RLS Policies für profiles und clubs.  
2. **Foundation:** Admin Dashboard Layout, Member Invite Flow.  
3. **Feature:** Event Management (Basic) & Attendance Tracker.  
4. **UI Polish:** Design System Integration (Tailwind Setup).  
5. **Module:** Implementierung des "Modul Shops" (nur technische Aktivierung, noch keine komplexen Module).