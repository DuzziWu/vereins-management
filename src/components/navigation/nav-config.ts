import {
  Users,
  UserPlus,
  Mail,
  LayoutDashboard,
  User,
  UsersRound,
  Calendar,
  CalendarDays,
  FileText,
  ClipboardList,
  Wallet,
  CreditCard,
  Receipt,
  BookOpen,
  Tag,
  FolderKanban,
  type LucideIcon,
} from "lucide-react"
import { UserRole } from "@/components/auth"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

export interface NavItemWithSub {
  title: string
  icon: LucideIcon
  items: NavItem[]
}

export interface RoleNavConfig {
  main: NavItem[]
  admin?: NavItem[]
  finance?: NavItemWithSub
}

// Navigation Items pro Rolle
export const ROLE_NAV_ITEMS: Record<UserRole, RoleNavConfig> = {
  vorstand: {
    main: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Mein Profil", url: "/profile", icon: User },
      { title: "Meine Workgroups", url: "/admin/my-workgroups", icon: FolderKanban },
    ],
    admin: [
      { title: "Mitglieder", url: "/admin/members", icon: Users },
      { title: "User einladen", url: "/admin/users/invite", icon: UserPlus },
      { title: "Einladungen", url: "/admin/users/invitations", icon: Mail },
      { title: "Gruppen", url: "/admin/groups", icon: UsersRound },
      { title: "Workgroups", url: "/admin/workgroups", icon: FolderKanban },
      { title: "Veranstaltungen", url: "/admin/events", icon: CalendarDays },
      { title: "Dokumente", url: "/admin/documents", icon: FileText },
    ],
    finance: {
      title: "Finanzen",
      icon: Wallet,
      items: [
        { title: "Beiträge", url: "/admin/finances/fees", icon: Receipt },
        { title: "Beitragsarten", url: "/admin/finances/membership-types", icon: CreditCard },
        { title: "Vereinskasse", url: "/admin/finances/treasury", icon: BookOpen },
        { title: "Kategorien", url: "/admin/finances/treasury/categories", icon: Tag },
      ],
    },
  },
  trainer: {
    main: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Mein Profil", url: "/profile", icon: User },
      { title: "Meine Gruppen", url: "/trainer/groups", icon: UsersRound },
      { title: "Meine Workgroups", url: "/trainer/workgroups", icon: FolderKanban },
      { title: "Trainingsplan", url: "/trainer/schedule", icon: Calendar },
      { title: "Veranstaltungen", url: "/trainer/events", icon: CalendarDays },
      { title: "Anwesenheit", url: "/trainer/attendance", icon: ClipboardList },
    ],
  },
  mitglied: {
    main: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Mein Profil", url: "/profile", icon: User },
      { title: "Meine Gruppen", url: "/member/groups", icon: UsersRound },
      { title: "Meine Workgroups", url: "/member/workgroups", icon: FolderKanban },
      { title: "Termine", url: "/member/schedule", icon: Calendar },
      { title: "Veranstaltungen", url: "/member/events", icon: CalendarDays },
      { title: "Dokumente", url: "/member/documents", icon: FileText },
    ],
  },
}

// Bottom Navigation: Die wichtigsten 3 Items pro Rolle + "Mehr"
// PROJ-24: Events an Position 2 für alle Rollen (prominentere Platzierung)
export interface BottomNavItem {
  title: string
  url: string
  icon: LucideIcon
  isEvents?: boolean // Marker für Events-Item (Accent-Styling)
}

export const BOTTOM_NAV_ITEMS: Record<UserRole, BottomNavItem[]> = {
  vorstand: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Events", url: "/admin/events", icon: CalendarDays, isEvents: true },
    { title: "Mitglieder", url: "/admin/members", icon: Users },
  ],
  trainer: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Events", url: "/trainer/events", icon: CalendarDays, isEvents: true },
    { title: "Gruppen", url: "/trainer/groups", icon: UsersRound },
  ],
  mitglied: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Events", url: "/member/events", icon: CalendarDays, isEvents: true },
    { title: "Termine", url: "/member/schedule", icon: Calendar },
  ],
}

// Alle Navigation-Items flach als Liste (fuer "Mehr"-Menu)
export function getAllNavItems(role: UserRole): NavItem[] {
  const config = ROLE_NAV_ITEMS[role]
  const items: NavItem[] = [...config.main]

  if (config.admin) {
    items.push(...config.admin)
  }

  if (config.finance) {
    items.push(...config.finance.items)
  }

  return items
}

// Events URL pro Rolle
export function getEventsUrl(role: UserRole): string {
  switch (role) {
    case "vorstand":
      return "/admin/events"
    case "trainer":
      return "/trainer/events"
    case "mitglied":
      return "/member/events"
    default:
      return "/member/events"
  }
}
