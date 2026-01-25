"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  UserPlus,
  Mail,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  UsersRound,
  Calendar,
  FileText,
  ClipboardList,
  Bell,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { logout } from "@/lib/actions"
import { useDashboardView } from "@/contexts/dashboard-view-context"
import { UserRole } from "@/lib/database.types"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationBadge } from "./notification-badge"

interface NavItem {
  title: string
  url: string
  icon: typeof LayoutDashboard
}

// Navigation Items pro Rolle
const ROLE_NAV_ITEMS: Record<UserRole, { main: NavItem[]; admin?: NavItem[] }> = {
  vorstand: {
    main: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
    admin: [
      { title: "Mitglieder", url: "/admin/users", icon: Users },
      { title: "User einladen", url: "/admin/users/invite", icon: UserPlus },
      { title: "Einladungen", url: "/admin/users/invitations", icon: Mail },
      { title: "Gruppen", url: "/admin/groups", icon: UsersRound },
      { title: "Dokumente", url: "/admin/documents", icon: FileText },
    ],
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

function NavItemsList({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
          >
            <Link href={item.url}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function SidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Vereins-Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function AppSidebar() {
  const { activeView, isLoading, profile } = useDashboardView()

  if (isLoading || !profile) {
    return <SidebarSkeleton />
  }

  const navConfig = ROLE_NAV_ITEMS[activeView]

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Vereins-Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItemsList items={navConfig.main} />
            {/* Benachrichtigungen-Link mit Badge für Mitglieder */}
            {activeView === "mitglied" && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/member/notifications" className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span>Benachrichtigungen</span>
                      </span>
                      <NotificationBadge />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {navConfig.admin && navConfig.admin.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavItemsList items={navConfig.admin} />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Einstellungen</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton asChild>
                <button type="submit" className="w-full">
                  <LogOut className="h-4 w-4" />
                  <span>Abmelden</span>
                </button>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
