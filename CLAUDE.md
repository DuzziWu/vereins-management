# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vereins-Master** is a multi-tenant SaaS platform for sports club management (football focus, German-speaking market). The platform replaces centralized admin workflows with role-distributed, empowered dashboards.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Frontend:** Next.js 15 (App Router) with React Server Components
- **Styling:** TailwindCSS + custom shadcn-style components
- **Backend:** Supabase (PostgreSQL + Storage)
- **Auth:** Supabase Auth (email/password, magic links)
- **Language:** JavaScript with `.jsx` extension for React components

## Architecture

### Project Structure
```
src/
├── app/
│   ├── (auth)/           # Login, register pages
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── admin/        # Admin pages (members, modules, finances)
│   │   ├── coach/        # Coach pages (events, team)
│   │   └── player/       # Player pages (events, profile)
│   └── auth/callback/    # OAuth/magic link callback
├── actions/              # Server Actions (auth, events, members, modules)
├── components/
│   ├── ui/               # Base UI components (button, card, input, etc.)
│   └── dashboard/        # Dashboard-specific components
├── lib/
│   ├── supabase/         # Supabase clients (client.js, server.js)
│   ├── utils.js          # Utility functions (cn, formatDate, etc.)
│   └── constants.js      # Enums and constants (ROLES, EVENT_TYPES, etc.)
└── middleware.js         # Auth middleware, route protection
```

### Multi-Tenancy
- Row-level isolation via `club_id` (UUID) in all tables
- Supabase RLS policies enforce data separation
- Helper functions: `get_my_club_id()`, `get_my_role()`

### Role-Based Access
Three roles with distinct dashboards:
- **admin**: Full club management, finances, module activation, user management
- **coach**: Event management, attendance tracking
- **player**: Event RSVP, personal hub

### Database
SQL migrations in `supabase/migrations/`:
1. `001_extensions_and_enums.sql` - Extensions and enum types
2. `002_core_tables.sql` - clubs, profiles, modules, club_modules, club_invites
3. `003_sports_structure.sql` - teams, team_members, locations
4. `004_events.sql` - events, matches, attendance
5. `005_finances.sql` - finances, budgets, tasks
6. `006_indexes.sql` - Performance indexes
7. `007_rls_policies.sql` - Row Level Security
8. `008_triggers.sql` - Automation (profile creation, budget updates)
9. `009_seed_modules.sql` - Default module data
10. `010_add_league_to_teams.sql` - Team league field
11. `011_add_description_to_clubs.sql` - Club description field
12. `012_storage_buckets.sql` - Storage buckets (club-logos, avatars) with RLS
13. `013_expand_modules.sql` - Expanded modules with categories, icons, features, pricing
14. `014_make_all_modules_free.sql` - Make all modules free for testing
15. `015_add_fullname_to_invites.sql` - Add full_name to club_invites

## Code Patterns

### Supabase Clients
Two client factories in `src/lib/supabase/`:
- `server.js`: `createClient()` is **async** - use `await createClient()` in Server Components/Actions
- `client.js`: `createClient()` is **sync** - for Client Components

### Middleware (src/middleware.js)
- Refreshes auth session on each request
- Protected routes: `/admin/*`, `/coach/*`, `/player/*` redirect to `/login` if unauthenticated
- Auth routes: `/login`, `/register` redirect to `/admin` if already authenticated

### Server Actions
All mutations use Server Actions in `src/actions/`:
- Return `{ error: string }` on failure, `{ success: true }` on success
- Use `revalidatePath()` after mutations
- Check role permissions before operations
- German error messages (e.g., 'Keine Berechtigung')

Available actions:
- `auth.js` - Login, register, logout, password reset
- `events.js` - CRUD for events, attendance management
- `members.js` - Member/profile management, invites
- `modules.js` - Module activation/deactivation
- `settings.js` - Club settings (name, logo, primary color)
- `teams.js` - Team CRUD, member assignment
- `upload.js` - File uploads to Supabase Storage

### Constants (src/lib/constants.js)
Use constants instead of magic strings:
- `USER_ROLES`, `ROLE_LABELS`, `DASHBOARD_ROUTES`
- `EVENT_TYPES`, `EVENT_TYPE_LABELS`
- `ATTENDANCE_STATUS`, `ATTENDANCE_STATUS_LABELS`
- `FINANCE_TYPES`, `FINANCE_TYPE_LABELS`, `FINANCE_STATUS`, `FINANCE_STATUS_LABELS`
- `TASK_STATUS`, `TASK_STATUS_LABELS`
- `MODULES`, `MODULE_INFO`

### UI Components
Custom shadcn-style components with dark theme:
- `Button` - Multiple variants (default, destructive, outline, ghost, success)
- `Card` - Container component with header, content, footer
- `Badge` - Role badges with color variants (admin, coach, player)
- `DashboardCard`, `StatCard` - Dashboard widgets
- `BentoGrid`, `BentoItem` - Responsive grid layout

## Design System

- **Background:** #0f172a (slate-900)
- **Accent:** #d9f99d (lime-200) default, overridden by `--club-primary` per club
- **Dynamic Theming:** Dashboard layout injects club's `primary_color` as CSS variables via `hexToHsl()` conversion
- **Layout:** Bento-grid dashboard, mobile-first, 44px+ touch targets
- **Fonts:** Inter (body)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # For magic links
```

## Documentation Rules

### Changelog (CHANGELOG.md)

**Every change must be documented in `CHANGELOG.md`.** This is an append-only file - never delete entries.

Format for new entries (add at top, below header):
```markdown
## [YYYY-MM-DD HH:MM] - Short Title

**Description:** What was changed and why

**Files Added:**
- `path/to/new/file.js` - Brief description

**Files Changed:**
- `path/to/modified/file.js` - What changed

**Files Deleted:**
- `path/to/removed/file.js` - Why removed
```

### Package Documentation (PACKAGES.md)

When adding/removing npm packages, update `PACKAGES.md` with:
- Package name and version
- Purpose/what it's used for
- Which files use it (for UI components)
