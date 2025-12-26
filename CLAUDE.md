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
- **Backend:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password, magic links)
- **Language:** JavaScript (not TypeScript)

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

## Code Patterns

### Server Actions
All mutations use Server Actions in `src/actions/`:
- Return `{ error: string }` on failure
- Use `revalidatePath()` after mutations
- Check role permissions before operations

### Constants (src/lib/constants.js)
Use constants instead of magic strings:
- `USER_ROLES`, `ROLE_LABELS`
- `EVENT_TYPES`, `EVENT_TYPE_LABELS`
- `ATTENDANCE_STATUS`, `ATTENDANCE_STATUS_LABELS`
- `FINANCE_STATUS`, `TASK_STATUS`

### UI Components
Custom shadcn-style components with dark theme:
- `Button` - Multiple variants (default, destructive, outline, ghost, success)
- `Card` - Container component with header, content, footer
- `Badge` - Role badges with color variants (admin, coach, player)
- `DashboardCard`, `StatCard` - Dashboard widgets
- `BentoGrid`, `BentoItem` - Responsive grid layout

## Design System

- **Background:** #0f172a (slate-900)
- **Accent:** #d9f99d (lime-200) or `--club-primary`
- **Layout:** Bento-grid dashboard, mobile-first, 44px+ touch targets
- **Fonts:** Inter (body), Oswald (display)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # For magic links
```
