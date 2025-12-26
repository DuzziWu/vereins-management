# **Database Schema Specification: Vereins-Master**

**Version:** 1.0.0 | **Target:** PostgreSQL (Supabase) | **Author:** Senior Database Architect

## **1\. Entity-Relationship Diagram (ERD)**

Dieses Diagramm visualisiert die Beziehungen zwischen den fünf Hauptmodulen.

erDiagram  
    %% 1\. ORGANISATION & AUTH  
    CLUBS ||--o{ PROFILES : "has members"  
    CLUBS ||--o{ CLUB\_MODULES : "activates"  
    MODULES ||--o{ CLUB\_MODULES : "is enabled in"  
    PROFILES }|--|| AUTH\_USERS : "extends"

    %% 2\. SPORTLICHE STRUKTUR  
    CLUBS ||--o{ TEAMS : "manages"  
    CLUBS ||--o{ LOCATIONS : "owns/uses"  
    TEAMS ||--o{ TEAM\_MEMBERS : "has roster"  
    PROFILES ||--o{ TEAM\_MEMBERS : "plays in"

    %% 3\. EVENT-MANAGEMENT (Dreierspieltag Logic)  
    TEAMS ||--o{ EVENTS : "organizes"  
    LOCATIONS ||--o{ EVENTS : "hosted at"  
    EVENTS ||--o{ MATCHES : "contains sub-events"  
    EVENTS ||--o{ ATTENDANCE : "tracks rsvp"  
    PROFILES ||--o{ ATTENDANCE : "responds to"

    %% 4\. FINANZEN & TASKS  
    CLUBS ||--o{ FINANCES : "tracks"  
    PROFILES ||--o{ FINANCES : "incurs/pays"  
    TEAMS ||--|| BUDGETS : "has"  
    CLUBS ||--o{ TASKS : "manages"  
    PROFILES ||--o{ TASKS : "assigned to"

    %% 5\. SKILL ARENA (Gamification)  
    PROFILES ||--|| PLAYER\_STATS : "has stats"  
    CLUBS ||--o{ ACHIEVEMENTS : "awards"  
    PROFILES ||--o{ ACHIEVEMENTS : "earns"

    %% DEFINITIONS  
    CLUBS {  
        uuid id PK  
        string name  
        string logo\_url  
        string subscription\_status  
    }  
    PROFILES {  
        uuid id PK "FK \-\> auth.users"  
        uuid club\_id FK  
        enum role "admin, coach, player"  
    }  
    EVENTS {  
        uuid id PK  
        uuid team\_id FK  
        enum type "matchday, training"  
        timestamp start\_time  
    }  
    MATCHES {  
        uuid id PK  
        uuid event\_id FK  
        string opponent  
        timestamp start\_time  
    }

## **2\. SQL Schema Definitionen**

Hier sind die SQL-Statements für die Kern-Tabellen. Wir nutzen Supabase-Best-Practices (UUIDs, timestamptz).

### **2.1 Enum Typen & Extensions**

\-- Extensions  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\-- Enums für Type Safety  
CREATE TYPE user\_role AS ENUM ('admin', 'coach', 'player');  
CREATE TYPE event\_type AS ENUM ('training', 'matchday', 'meeting', 'social');  
CREATE TYPE attendance\_status AS ENUM ('confirmed', 'declined', 'pending', 'late');  
CREATE TYPE finance\_type AS ENUM ('contribution', 'expense', 'sponsorship');  
CREATE TYPE finance\_status AS ENUM ('open', 'approved', 'paid', 'rejected');  
CREATE TYPE task\_status AS ENUM ('todo', 'in\_progress', 'done');

### **2.2 Organisation & Auth**

CREATE TABLE clubs (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    name TEXT NOT NULL,  
    slug TEXT UNIQUE NOT NULL,  
    logo\_url TEXT,  
    primary\_color TEXT DEFAULT '\#000000',  
    subscription\_status TEXT DEFAULT 'trial' \-- active, trial, cancelled  
);

CREATE TABLE profiles (  
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
    club\_id UUID REFERENCES clubs(id) ON DELETE CASCADE,  
    full\_name TEXT,  
    avatar\_url TEXT,  
    role user\_role DEFAULT 'player',  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    \-- Constraint: Ein User gehört in diesem Schema zu EINEM Club (Simplifizierung für MVP)  
    CONSTRAINT fk\_club FOREIGN KEY (club\_id) REFERENCES clubs(id)  
);

CREATE TABLE modules (  
    id TEXT PRIMARY KEY, \-- z.B. 'skill\_arena', 'inventory'  
    name TEXT NOT NULL,  
    description TEXT,  
    is\_premium BOOLEAN DEFAULT FALSE  
);

CREATE TABLE club\_modules (  
    club\_id UUID REFERENCES clubs(id) ON DELETE CASCADE,  
    module\_id TEXT REFERENCES modules(id) ON DELETE CASCADE,  
    is\_active BOOLEAN DEFAULT TRUE,  
    activated\_at TIMESTAMPTZ DEFAULT NOW(),  
    PRIMARY KEY (club\_id, module\_id)  
);

### **2.3 Sportliche Struktur**

CREATE TABLE teams (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    club\_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,  
    name TEXT NOT NULL, \-- z.B. "1. Herren", "U19"  
    sport\_type TEXT DEFAULT 'football',  
    age\_group TEXT  
);

CREATE TABLE team\_members (  
    team\_id UUID REFERENCES teams(id) ON DELETE CASCADE,  
    profile\_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  
    position TEXT, \-- z.B. "Torwart", "Sturm"  
    is\_captain BOOLEAN DEFAULT FALSE,  
    PRIMARY KEY (team\_id, profile\_id)  
);

CREATE TABLE locations (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    club\_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,  
    name TEXT NOT NULL, \-- z.B. "Hauptplatz", "Halle Nord"  
    address\_link TEXT, \-- Google Maps URL  
    geo\_data JSONB \-- { lat: ..., lng: ... }  
);

### **2.4 Event Management ("Dreierspieltag")**

CREATE TABLE events (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    club\_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,  
    team\_id UUID REFERENCES teams(id) ON DELETE SET NULL,  
    location\_id UUID REFERENCES locations(id) ON DELETE SET NULL,  
    type event\_type NOT NULL,  
    start\_time TIMESTAMPTZ NOT NULL,  
    end\_time TIMESTAMPTZ NOT NULL,  
    title TEXT, \-- Optional, z.B. "Trainingslager"  
    description TEXT  
);

\-- Diese Tabelle ermöglicht mehrere Spiele pro "Event-Tag" (Dreierspieltag)  
CREATE TABLE matches (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    event\_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,  
    start\_time TIMESTAMPTZ NOT NULL, \-- Zeit-Slot innerhalb des Events  
    opponent TEXT NOT NULL,  
    is\_home\_game BOOLEAN DEFAULT TRUE,  
    result\_home INT,  
    result\_guest INT,  
    lineup\_json JSONB \-- Snapshot der Aufstellung  
);

CREATE TABLE attendance (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    event\_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,  
    profile\_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,  
    status attendance\_status DEFAULT 'pending',  
    reason TEXT, \-- Begründung bei Absage  
    updated\_at TIMESTAMPTZ DEFAULT NOW(),  
    UNIQUE(event\_id, profile\_id)  
);

### **2.5 Finanzen**

CREATE TABLE finances (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    club\_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,  
    profile\_id UUID REFERENCES profiles(id) ON DELETE SET NULL, \-- Kann NULL sein bei generischen Ausgaben  
    amount DECIMAL(10,2) NOT NULL, \-- Negativ für Ausgaben, Positiv für Einnahmen  
    type finance\_type NOT NULL,  
    status finance\_status DEFAULT 'open',  
    description TEXT,  
    receipt\_url TEXT,  
    due\_date DATE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE TABLE budgets (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    club\_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,  
    team\_id UUID REFERENCES teams(id) ON DELETE CASCADE, \-- Optional: Budget kann auch Club-weit sein  
    season TEXT NOT NULL, \-- "2024/2025"  
    total\_amount DECIMAL(12,2) DEFAULT 0,  
    spent\_amount DECIMAL(12,2) DEFAULT 0,  
    UNIQUE(team\_id, season)  
);

## **3\. Security: Row Level Security (RLS) Strategie**

Supabase RLS ist der Kern der Mandantentrennung. Da wir club\_id in fast jeder Tabelle haben, ist die Prüfung effizient.

### **Performance Indexing**

Zuerst müssen wir Indizes setzen, damit RLS die Datenbank nicht verlangsamt.

CREATE INDEX idx\_profiles\_club\_id ON profiles(club\_id);  
CREATE INDEX idx\_teams\_club\_id ON teams(club\_id);  
CREATE INDEX idx\_events\_club\_id ON events(club\_id);  
CREATE INDEX idx\_finances\_club\_id ON finances(club\_id);

### **Beispiel RLS Policy: teams Tabelle**

**Ziel:** Ein User darf nur Teams sehen (SELECT), die zu seinem Verein gehören.

\-- 1\. RLS aktivieren  
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

\-- 2\. Policy erstellen  
CREATE POLICY "Users can view teams of their own club"  
ON teams  
FOR SELECT  
USING (  
  club\_id IN (  
    SELECT club\_id   
    FROM profiles   
    WHERE id \= auth.uid() \-- auth.uid() ist die Supabase Funktion für den aktuellen User  
  )  
);

\-- 3\. Policy für Admins/Coaches zum Bearbeiten (INSERT/UPDATE)  
CREATE POLICY "Admins and Coaches can edit teams"  
ON teams  
FOR ALL  
USING (  
  club\_id IN (  
    SELECT club\_id   
    FROM profiles   
    WHERE id \= auth.uid()   
    AND role IN ('admin', 'coach')  
  )  
);

## **4\. Automatisierung & Trigger**

Wir nutzen PostgreSQL Trigger, um Business-Logik nah an den Daten zu halten. Dies verhindert Inkonsistenzen im Frontend.

### **Use Case: Budget-Aktualisierung bei Auszahlung**

Logik:  
Wenn eine Ausgabe (finance record vom typ expense) den Status auf paid ändert, muss der Betrag automatisch vom verbrauchten Budget (spent\_amount) des Teams abgezogen/addiert werden.  
\-- 1\. Die Trigger Funktion  
CREATE OR REPLACE FUNCTION update\_team\_budget()  
RETURNS TRIGGER AS $$  
BEGIN  
    \-- Prüfen ob Status sich zu 'paid' geändert hat und es eine Ausgabe ist  
    IF NEW.status \= 'paid' AND OLD.status \!= 'paid' AND NEW.type \= 'expense' THEN  
          
        \-- Versuchen, das Budget zu finden, das dem User (via Team-Zugehörigkeit) zugeordnet ist  
        \-- Hier vereinfacht: Wir nehmen an, die finance row hat eine team\_id referenz oder wir lösen es über den User  
        \-- Für dieses Beispiel nehmen wir an, wir fügen 'team\_id' zur finance Tabelle hinzu oder leiten es ab.  
          
        UPDATE budgets  
        SET spent\_amount \= spent\_amount \+ NEW.amount,  
            updated\_at \= NOW()  
        WHERE club\_id \= NEW.club\_id   
          AND season \= '2024/2025'; \-- In Prod: Dynamisch ermitteln  
            
    END IF;  
    RETURN NEW;  
END;  
$$ LANGUAGE plpgsql;

\-- 2\. Trigger binden  
CREATE TRIGGER on\_expense\_paid  
AFTER UPDATE ON finances  
FOR EACH ROW  
EXECUTE FUNCTION update\_team\_budget();

### **Use Case: XP-Calculation (Skill Arena)**

Ein weiterer Trigger würde auf der attendance Tabelle lauschen.

* AFTER UPDATE auf attendance  
* IF NEW.status \= 'confirmed'  
* UPDATE player\_stats SET xp \= xp \+ 10 WHERE profile\_id \= NEW.profile\_id

## **5\. Performance Checkliste**

1. **Foreign Keys:** Alle FK-Spalten müssen indiziert sein, sonst werden Joins (besonders bei RLS-Subqueries) langsam.  
2. **JSONB:** Für match.lineup\_json und locations.geo\_data verwenden wir GIN-Indizes, falls wir innerhalb des JSON suchen müssen.  
3. **RLS Helper:** Für komplexe Policies empfiehlt es sich, eine Stored Procedure get\_my\_club\_id() zu schreiben, die das Ergebnis von SELECT club\_id FROM profiles WHERE id \= auth.uid() cached, um wiederholte Lookups zu vermeiden.