# Vereins-Management

> Club/Association Management System built with Next.js and Supabase

---

## Tech Stack Overview

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (pre-installed)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes + Supabase Client

### Dev Tools
- **Linting:** ESLint (Next.js config)
- **Package Manager:** npm

---

## Folder Structure

```
vereins-management/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   └── ui/              # shadcn/ui components (Button, Card, Dialog, etc.)
│   └── lib/                 # Utility functions
│       ├── supabase.ts      # Supabase client initialization
│       └── utils.ts         # Helper functions (cn for classnames)
├── public/                  # Static assets (images, fonts)
├── features/                # Feature specifications (AI workflow)
├── .claude/                 # AI agent configurations
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration (strict mode)
└── package.json             # Dependencies and scripts
```

---

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get these values:**
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to Settings > API
4. Copy the "Project URL" and "anon public" key

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Pre-installed UI Components

The following shadcn/ui components are ready to use:

- **Layout:** Card, Separator, Scroll Area, Sheet, Sidebar
- **Forms:** Button, Input, Label, Checkbox, Radio Group, Select, Switch, Form
- **Feedback:** Alert, Alert Dialog, Dialog, Toast (Sonner), Progress, Skeleton
- **Navigation:** Navigation Menu, Dropdown Menu, Tabs, Accordion, Breadcrumb, Pagination
- **Display:** Avatar, Badge, Tooltip, Popover, Command (search), Collapsible

Import example:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

---

## Next Steps for Development

1. **Set up Supabase project**
   - Create a new project at supabase.com
   - Add credentials to `.env.local`

2. **Design your database schema**
   - Members table (name, email, role, etc.)
   - Events table (title, date, description)
   - Memberships table (fees, status)

3. **Build core features**
   - Member management (CRUD)
   - Event calendar
   - Membership tracking
   - Dashboard with statistics

4. **Add authentication**
   - Supabase Auth for login/signup
   - Role-based access control

---

## Development Workflow

This project includes an AI agent workflow (see `HOW_TO_USE_AGENTS.md`):

1. **Requirements Engineer** - Define feature specs
2. **Solution Architect** - Design database/architecture
3. **Frontend Developer** - Build UI components
4. **Backend Developer** - Supabase queries & API
5. **QA Engineer** - Test features
6. **DevOps** - Deployment

---

**Ready to start building!**
