# Changelog

**Important:** This is an append-only log. Never delete entries - always add new ones at the top below this header.

See `CLAUDE.md` for documentation rules.

---

## [2025-12-28 10:00] - ClubGrid Rebranding

**Description:** Rebranded the platform from "Vereins-Master" to "ClubGrid" (clubgrid.app). Updated all references across the codebase including email templates, page titles, documentation, and package configuration. Added ClubGrid footer to email templates.

**Files Changed:**
- `src/components/emails/invite-email.js` - Updated branding, added "Powered by ClubGrid" footer with clubgrid.app link
- `src/actions/members.js` - Changed email sender name to "ClubGrid", default from address to noreply@clubgrid.app
- `src/app/(dashboard)/admin/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/coach/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/player/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/admin/members/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/admin/members/invite/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/admin/modules/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/admin/settings/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/admin/teams/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/coach/events/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/coach/events/[id]/page.jsx` - Updated page title to ClubGrid
- `src/app/(dashboard)/player/events/page.jsx` - Updated page title to ClubGrid
- `src/app/(auth)/invite/[token]/page.jsx` - Updated dynamic page title to ClubGrid
- `src/components/dashboard/header.jsx` - Updated fallback club name to ClubGrid
- `package.json` - Changed project name from "vereins-master" to "clubgrid"
- `CLAUDE.md` - Updated project name and description
- `PACKAGES.md` - Updated codebase reference
- `DATABASE_SCHEMA.md` - Updated title
- `PRD.md` - Updated title and description

**Files Added:**
- None

**Files Deleted:**
- None

---

## [2025-12-27 08:45] - Nodemailer Email Integration

**Description:** Integrated Nodemailer for sending invite emails via SMTP. Created branded HTML and plain text email templates. Replaced Resend with Nodemailer for more flexible email configuration.

**Files Added:**
- `src/components/emails/invite-email.js` - HTML/text email template generators

**Files Changed:**
- `src/actions/members.js` - Updated sendInviteEmail to use Nodemailer SMTP
- `PACKAGES.md` - Replaced resend with nodemailer

**Files Deleted:**
- `src/components/emails/invite-email.jsx` - Old React email template (replaced)

**Environment Variables Required:**
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@your-domain.com (optional)
```

---

## [2025-12-27 08:00] - Pending Invites Management

**Description:** Added a comprehensive invite management system to the members page. Admins can now view all invites (pending, expired, used), copy invite links, resend expired invites with new tokens, and delete invites. The members page now has tabs to switch between Members and Invites views.

**Files Added:**
- `src/app/(dashboard)/admin/members/invites-client.jsx` - Client component displaying invite list with stats, actions (copy, resend, delete)
- `src/app/(dashboard)/admin/members/members-page-client.jsx` - Tab wrapper component for Members/Invites navigation

**Files Changed:**
- `src/actions/members.js` - Added getInvites() and resendInvite() server actions
- `src/app/(dashboard)/admin/members/page.jsx` - Fetches invites, passes to new MembersPageClient
- `src/app/(dashboard)/admin/members/members-client.jsx` - Added hideHeader prop for tab integration

**Files Deleted:**
- None

---

## [2025-12-27 07:00] - Vercel Deployment Fix

**Description:** Fixed middleware crash on Vercel due to missing environment variables. Added proper error handling to all Supabase client factories to prevent crashes when env vars are not set.

**Files Added:**
- None

**Files Changed:**
- `src/middleware.js` - Added check for missing env vars, graceful fallback
- `src/lib/supabase/server.js` - Added error handling for missing env vars
- `src/lib/supabase/client.js` - Added error handling for missing env vars

**Files Deleted:**
- None

---

## [2025-12-27 06:15] - Middleware Performance Fix

**Description:** Fixed slow page loads (10+ seconds) caused by database query in middleware. Removed profile query from middleware and created a dedicated /dashboard redirect page that handles role-based routing. Middleware now stays fast by only checking authentication.

**Files Added:**
- `src/app/(dashboard)/dashboard/page.jsx` - Redirect page that checks user role and redirects to correct dashboard

**Files Changed:**
- `src/middleware.js` - Removed database query, redirects to /dashboard instead; added /dashboard to protected routes

**Files Deleted:**
- None

---

## [2025-12-27 06:00] - Session & Redirect Fixes

**Description:** Fixed middleware redirect logic that was causing users to get stuck. Added logout API endpoint for clearing stale sessions. Updated 404 page with logout option.

**Files Added:**
- `src/app/api/auth/logout/route.js` - GET/POST endpoint to sign out and redirect to login

**Files Changed:**
- `src/app/not-found.jsx` - Added "Abmelden und neu anmelden" button for session issues

**Files Deleted:**
- None

---

## [2025-12-27 05:45] - Invite Session Security Fix

**Description:** Fixed security issue where accepting an invite while logged in as another user would cause session conflicts. Now the system signs out any existing user before creating the new account. Added a warning banner on the invite page when someone is already logged in.

**Files Added:**
- None

**Files Changed:**
- `src/actions/auth.js` - Added signOut() before signUp() in acceptInvite function to prevent session conflicts
- `src/app/(auth)/invite/[token]/page.jsx` - Added check for current user and warning banner when already logged in

**Files Deleted:**
- None

---

## [2025-12-27 05:15] - Enhanced Invite System & Custom 404 Page

**Description:** Completely redesigned the member invite system with a proper dashboard layout, fullname field, and a dedicated invite acceptance page for invited users. Users now receive a personalized invite link that shows club details, their assigned role, and allows them to create their account. Added custom 404 page with consistent design. Invite page now shows specific messages for used/expired invites instead of generic 404.

**Files Added:**
- `supabase/migrations/014_make_all_modules_free.sql` - Make all modules free for testing
- `supabase/migrations/015_add_fullname_to_invites.sql` - Add full_name column to club_invites table
- `src/app/(dashboard)/admin/members/invite/invite-form.jsx` - New client component for invite creation form
- `src/app/(auth)/invite/[token]/page.jsx` - Public invite acceptance page with used/expired states
- `src/app/(auth)/invite/[token]/invite-accept-form.jsx` - Client component for invite acceptance form
- `src/app/not-found.jsx` - Custom 404 page with website design

**Files Changed:**
- `src/app/(dashboard)/admin/members/invite/page.jsx` - Added DashboardHeader, proper layout matching website design
- `src/actions/members.js` - Updated createInvite to include fullName, added sendInviteEmail and getInviteByToken functions
- `src/actions/auth.js` - Added acceptInvite function for processing invite acceptance
- `src/app/(dashboard)/admin/modules/modules-client.jsx` - Removed premium/paywall UI, all modules now free

**Files Deleted:**
- None

---

## [2025-12-27 04:30] - Enhanced Module Shop

**Description:** Expanded the module shop with 7 new modules for sports club management. Added enhanced UI with category filters, feature lists, pricing display, and improved module cards. Modules include Finance, Team Chat, Documents, Match Analysis, Medical & Fitness, Parent Portal, and Sponsoring Manager.

**Files Added:**
- `supabase/migrations/013_expand_modules.sql` - Migration to add new modules with categories, icons, features, and pricing
- `src/app/(dashboard)/admin/modules/modules-client.jsx` - New client component with enhanced module shop UI

**Files Changed:**
- `src/lib/constants.js` - Added 7 new modules, MODULE_CATEGORIES, and expanded MODULE_INFO with full metadata
- `src/app/(dashboard)/admin/modules/page.jsx` - Refactored to use new ModulesClient component

**Files Deleted:**
- `src/app/(dashboard)/admin/modules/module-toggle.jsx` - Functionality merged into modules-client.jsx

---

## [2025-12-27 04:00] - CLAUDE.md Improvements

**Description:** Enhanced CLAUDE.md with middleware documentation, server actions list, and complete constants reference.

**Files Added:**
- None

**Files Changed:**
- `CLAUDE.md` - Added middleware behavior section, server actions file list, expanded constants list (FINANCE_TYPES, MODULES, MODULE_INFO, DASHBOARD_ROUTES)

**Files Deleted:**
- None

---

## [2025-12-27 03:30] - Documentation Rules Added

**Description:** Added changelog documentation rule to ensure all changes are tracked. The CHANGELOG.md is now append-only with a standardized format including date/time, description, and file lists.

**Files Added:**
- None

**Files Changed:**
- `CHANGELOG.md` - Added standardized format header and documentation structure
- `CLAUDE.md` - Added "Documentation Rules" section explaining changelog and package documentation requirements

**Files Deleted:**
- None

---

## [2025-12-27 03:15] - Performance Optimizations

**Description:** Improved webapp performance with loading skeletons, image optimization, query optimization, and search debouncing. Reduced bundle size by removing unused dependencies.

**Files Added:**
- `src/components/ui/skeleton.jsx` - Reusable skeleton component for loading states
- `src/app/(dashboard)/coach/loading.jsx` - Coach dashboard loading skeleton
- `src/app/(dashboard)/player/loading.jsx` - Player dashboard loading skeleton
- `src/app/(dashboard)/coach/events/loading.jsx` - Coach events loading skeleton
- `src/app/(dashboard)/player/events/loading.jsx` - Player events loading skeleton
- `src/lib/hooks/use-debounce.js` - Custom debounce hook for search inputs

**Files Changed:**
- `src/app/(dashboard)/admin/loading.jsx` - Added proper skeleton UI
- `src/app/(dashboard)/admin/members/loading.jsx` - Added proper skeleton UI
- `src/app/(dashboard)/admin/teams/loading.jsx` - Added proper skeleton UI
- `src/components/ui/avatar.jsx` - Replaced img with Next.js Image
- `src/components/dashboard/header.jsx` - Replaced img with Next.js Image for club logo
- `src/app/(dashboard)/admin/settings/settings-client.jsx` - Replaced img with Next.js Image
- `src/app/(dashboard)/admin/members/members-client.jsx` - Added debounced search
- `src/app/(dashboard)/player/page.jsx` - Optimized queries (merged 2 into 1)
- `package.json` - Removed unused @tanstack/react-query
- `PACKAGES.md` - Updated to reflect removed dependency

**Files Deleted:**
- None

---

## [2025-12-27 02:45] - Package Documentation & Security Updates

**Description:** Created PACKAGES.md documentation, installed missing dependencies, upgraded Next.js from 15.1.3 to 15.5.9 to fix critical security vulnerabilities.

**Files Added:**
- `PACKAGES.md` - Documentation of all npm packages used
- `.eslintrc.json` - ESLint configuration for Next.js

**Files Changed:**
- `package.json` - Upgraded next, eslint, eslint-config-next

**Files Deleted:**
- None

---

## [2025-12-27 02:30] - CLAUDE.md Updates

**Description:** Updated CLAUDE.md with new migrations (010-012), Supabase client async/sync patterns, and design system clarifications.

**Files Changed:**
- `CLAUDE.md` - Added migrations 010-012, Supabase client patterns, dynamic theming info

**Files Deleted:**
- None

---

## 2025-12-26 - Corporate Design & Kalender Integration

### Features

#### Corporate Design / Primärfarbe
- Admin kann in den Einstellungen eine Primärfarbe (HEX) festlegen
- Die Farbe wird dynamisch als CSS-Variable (`--primary`, `--accent`, `--ring`) gesetzt
- Alle UI-Elemente (Buttons, Progress Bars, Hover-Effekte, etc.) passen sich automatisch an
- Neue Utility-Funktion `hexToHsl()` für die Farbkonvertierung

#### Club-Logo im Header
- Das vom Admin hochgeladene Vereinslogo wird im Header angezeigt
- Logo-Größe: 56x56px mit Rahmen in Primärfarbe
- Fallback: Activity-Icon wenn kein Logo vorhanden
- Next.js Image-Konfiguration für Supabase Storage

#### Wochenkalender & Nächstes Event
- Neue Komponente `WeekCalendar`: Zeigt Events der aktuellen Woche (Mo-So)
  - Farbcodierung: Grün (Training), Rot (Spiel), Blau (Meeting)
  - Heutiger Tag hervorgehoben
  - Vergangene Tage ausgegraut
  - Klickbare Events mit Link zur Detail-Seite
  - Legende für Event-Typen

- Neue Komponente `NextEvent`: Großes Widget für das nächste Event
  - Countdown in Tagen/Stunden/Minuten
  - Event-Details (Typ, Datum, Uhrzeit, Ort)
  - Bei Spielen: Gegner und Heim/Auswärts-Badge
  - Anzahl der Zusagen
  - Farbcodierte Rahmen je nach Event-Typ

- Integration auf allen Dashboards:
  - `/admin` - Admin Dashboard
  - `/coach` - Trainer Dashboard
  - `/player` - Spieler Dashboard

### Geänderte Dateien

```
src/lib/utils.js                              # hexToHsl() Funktion
src/app/(dashboard)/layout.jsx                # Dynamische CSS-Variablen
src/actions/settings.js                       # Revalidierung aller Pfade
src/components/dashboard-header.jsx           # Club-Logo Anzeige
next.config.js                                # Supabase Storage Config
src/components/dashboard/week-calendar.jsx    # NEU: Wochenkalender
src/components/dashboard/next-event.jsx       # NEU: Nächstes Event Widget
src/app/(dashboard)/admin/page.jsx            # Kalender Integration
src/app/(dashboard)/coach/page.jsx            # Kalender Integration
src/app/(dashboard)/player/page.jsx           # Kalender Integration
src/app/(dashboard)/admin/members/page.jsx    # clubLogoUrl Prop
src/app/(dashboard)/admin/teams/page.jsx      # clubLogoUrl Prop
src/app/(dashboard)/admin/settings/page.jsx   # clubLogoUrl Prop
```

### Commit Message

```
feat: Corporate Design & Kalender Integration

- Dynamische Primärfarbe aus Club-Einstellungen (HEX -> HSL)
- Club-Logo im Header anstelle des Platzhalter-Icons
- Neuer Wochenkalender mit Event-Übersicht (Mo-So)
- Neues "Nächstes Event" Widget mit Countdown
- Kalender auf allen Dashboards (Admin, Coach, Player)
```
