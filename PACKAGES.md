# PACKAGES.md

This file documents all npm packages used in the Vereins-Master codebase. Update this file when adding or removing dependencies.

## Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.5.9 | React framework with App Router, Server Components |
| `react` | ^18 | UI library |
| `react-dom` | ^18 | React DOM renderer |
| `@supabase/ssr` | ^0.5.2 | Supabase SSR client (createServerClient, createBrowserClient) |
| `@supabase/supabase-js` | ^2.47.10 | Supabase JavaScript client |
| `@radix-ui/react-select` | ^2.2.6 | Accessible select component (src/components/ui/select.jsx) |
| `@radix-ui/react-switch` | ^1.2.6 | Accessible switch/toggle component (src/components/ui/switch.jsx) |
| `lucide-react` | ^0.468.0 | Icon library |
| `class-variance-authority` | ^0.7.1 | Variant styling utility (cva) |
| `clsx` | ^2.1.1 | Conditional class name utility |
| `tailwind-merge` | ^2.6.0 | Merge Tailwind classes without conflicts |

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^3.4.1 | Utility-first CSS framework |
| `autoprefixer` | ^10.4.20 | PostCSS plugin for vendor prefixes |
| `postcss` | ^8 | CSS transformation tool |
| `eslint` | ^8.57.1 | JavaScript linter |
| `eslint-config-next` | ^15.5.9 | Next.js ESLint configuration |
| `@eslint/eslintrc` | ^3.3.3 | ESLint configuration utilities |

## Icons Used (lucide-react)

The following icons are imported across the codebase:
- **Navigation:** ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Menu
- **Actions:** Plus, Edit2, Save, Trash2, Copy, Upload, Download, Search
- **Status:** Check, X, CheckCircle, XCircle, HelpCircle, Loader2
- **Objects:** Calendar, Clock, MapPin, Users, User, Bell, Settings, Shield
- **Features:** Activity, Star, Package, Lock, Sparkles, Palette, Database
- **Finance:** DollarSign, TrendingUp
- **Auth:** LogOut, UserPlus, UserCog, MoreVertical, Mail, MoveRight

## Adding New Packages

When adding a new package:
1. Install with `npm install <package>` (or `npm install -D <package>` for dev)
2. Update this file with package name, version, and purpose
3. If adding UI components, document which file uses them

## Package Maintenance

```bash
# Check for outdated packages
npm outdated

# Update all packages (minor/patch)
npm update

# Check for security vulnerabilities
npm audit

# Install all dependencies
npm install
```

---
*Last updated: 2025-12-27*
