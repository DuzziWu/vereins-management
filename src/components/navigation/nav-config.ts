import {
  Users,
  UserPlus,
  Mail,
  LayoutDashboard,
  User,
  UsersRound,
  Calendar,
  FileText,
  ClipboardList,
  Wallet,
  CreditCard,
  Receipt,
  type LucideIcon,
} from "lucide-react"
import { UserRole } from "@/lib/database.types"

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
    ],
    admin: [
      { title: "Mitglieder", url: "/admin/members", icon: Users },
      { title: "User einladen", url: "/admin/users/invite", icon: UserPlus },
      { title: "Einladungen", url: "/admin/users/invitations", icon: Mail },
      { title: "Gruppen", url: "/admin/groups", icon: UsersRound },
      { title: "Dokumente", url: "/admin/documents", icon: FileText },
    ],
    finance: {
      title: "Finanzen",
      icon: Wallet,
      items: [
        { title: "Beitr\u00e4ge", url: "/admin/finances/fees", icon: Receipt },
        { title: "Beitragsarten", url: "/admin/finances/membership-types", icon: CreditCard },
      ],
    },
  },
  trainer: {
    main: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Meine Gruppen", url: "/trainer/groups", icon: UsersRound },
      { title: "Trainingsplan", url: "/trainer/schedule", icon: Calendar },
      { title: "Anwesenheit", url: "/trainer/attendance", icon: ClipboardList },
    ],
  },
  mitglied: {
    main: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Mein Profil", url: "/profile", icon: User },
      { title: "Meine Gruppen", url: "/member/groups", icon: UsersRound },
      { title: "Termine", url: "/member/schedule", icon: Calendar },
      { title: "Dokumente", url: "/member/documents", icon: FileText },
    ],
  },
}

// Bottom Navigation: Die wichtigsten 3 Items pro Rolle + "Mehr"
export interface BottomNavItem {
  title: string
  url: string
  icon: LucideIcon
}

export const BOTTOM_NAV_ITEMS: Record<UserRole, BottomNavItem[]> = {
  vorstand: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Mitglieder", url: "/admin/members", icon: Users },
    { title: "Finanzen", url: "/admin/finances/fees", icon: Wallet },
  ],
  trainer: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Gruppen", url: "/trainer/groups", icon: UsersRound },
    { title: "Training", url: "/trainer/schedule", icon: Calendar },
  ],
  mitglied: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Profil", url: "/profile", icon: User },
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
