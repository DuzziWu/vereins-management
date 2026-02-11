"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  LogOut,
  Settings,
  Bell,
  ChevronRight,
  CalendarDays,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { logout } from "@/lib/actions"
import { useDashboardView } from "@/contexts/dashboard-view-context"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationBadge } from "./notification-badge"
import { ROLE_NAV_ITEMS, type NavItem, type NavItemWithSub, getEventsUrl } from "@/components/navigation/nav-config"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

function useSidebarLogo() {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null)
  const supabase = createClient()

  React.useEffect(() => {
    async function loadLogo() {
      try {
        const { data } = await supabase
          .from("club_settings")
          .select("logo_path")
          .limit(1)
          .single()

        if (data?.logo_path) {
          const { data: urlData } = supabase.storage
            .from("club-assets")
            .getPublicUrl(data.logo_path)
          if (urlData?.publicUrl) {
            setLogoUrl(urlData.publicUrl + "?t=" + Date.now())
          }
        } else {
          setLogoUrl(null)
        }
      } catch {
        // Silently fail - just show default icon
      }
    }
    loadLogo()

    function handleLogoUpdated() {
      loadLogo()
    }

    window.addEventListener("logo-updated", handleLogoUpdated)
    return () => {
      window.removeEventListener("logo-updated", handleLogoUpdated)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return logoUrl
}

function NavItemsList({ items, excludeEvents = false }: { items: NavItem[], excludeEvents?: boolean }) {
  const pathname = usePathname()

  const filteredItems = excludeEvents
    ? items.filter(item => !item.url.includes("/events"))
    : items

  return (
    <SidebarMenu>
      {filteredItems.map((item) => {
        const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
        return (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              className={cn(
                "relative h-10 transition-all duration-150 hover:bg-[hsl(var(--nav-hover-bg))]",
                isActive && "bg-[hsl(var(--nav-active-bg))]"
              )}
            >
              <Link href={item.url}>
                {/* Aktiver Balken links */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[hsl(var(--nav-active-bar))]" />
                )}
                <item.icon className="h-5 w-5 ml-1" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

function FinanceNavItem({ finance }: { finance: NavItemWithSub }) {
  const pathname = usePathname()
  const isActive = finance.items.some(
    (item) => pathname === item.url || pathname.startsWith(item.url + "/")
  )

  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="h-10 transition-all duration-150 hover:bg-[hsl(var(--nav-hover-bg))]">
            <finance.icon className="h-5 w-5" />
            <span>{finance.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {finance.items.map((item) => {
              const isSubActive = pathname === item.url || pathname.startsWith(item.url + "/")
              return (
                <SidebarMenuSubItem key={item.url}>
                  <SidebarMenuSubButton
                    asChild
                    className={cn(
                      "relative transition-all duration-150 hover:bg-[hsl(var(--nav-hover-bg))]",
                      isSubActive && "bg-[hsl(var(--nav-active-bg))]"
                    )}
                  >
                    <Link href={item.url}>
                      {isSubActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-[hsl(var(--nav-active-bar))]" />
                      )}
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader className="pb-0">
        <div className="flex flex-col items-center gap-3 px-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold">Vereins-Management</span>
        </div>
        {/* Gradient Trennlinie */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[hsl(var(--nav-gradient-start))] via-[hsl(var(--nav-gradient-end))] to-transparent opacity-60" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-xs tracking-wider text-muted-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function AppSidebar() {
  const { activeView, isLoading, profile } = useDashboardView()
  const { state: sidebarState } = useSidebar()
  const logoUrl = useSidebarLogo()
  const pathname = usePathname()
  const eventsUrl = getEventsUrl(activeView)
  const isEventsActive = pathname.includes("/events")
  const isCollapsed = sidebarState === "collapsed"

  if (isLoading || !profile) {
    return <SidebarSkeleton />
  }

  const navConfig = ROLE_NAV_ITEMS[activeView]

  return (
    <Sidebar>
      {/* Redesigned Header - größeres Logo, zentriert, mit Gradient */}
      <SidebarHeader className="pb-0">
        <div className={cn(
          "flex flex-col items-center gap-3 px-4 py-4",
          isCollapsed && "px-2 py-3"
        )}>
          {logoUrl ? (
            <div className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md",
              isCollapsed ? "h-8 w-8" : "h-12 w-12"
            )}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Vereinslogo"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className={cn(
              "flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md",
              isCollapsed ? "h-8 w-8" : "h-12 w-12"
            )}>
              <Users className={cn(isCollapsed ? "h-4 w-4" : "h-6 w-6")} />
            </div>
          )}
          {/* Vereinsname nur bei expanded state */}
          {!isCollapsed && (
            <span className="text-sm font-semibold truncate max-w-full" title="Vereins-Management">
              Vereins-Management
            </span>
          )}
        </div>
        {/* Gradient Trennlinie */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[hsl(var(--nav-gradient-start))] via-[hsl(var(--nav-gradient-end))] to-transparent opacity-60" />
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Sektion */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-xs tracking-wider text-muted-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItemsList items={navConfig.main} excludeEvents />
            {/* Benachrichtigungen-Link mit Badge für Mitglieder */}
            {activeView === "mitglied" && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-10 transition-all duration-150 hover:bg-[hsl(var(--nav-hover-bg))]">
                    <Link href="/member/notifications" className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
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

        {/* Veranstaltungen - hervorgehobene Sektion */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="uppercase text-xs tracking-wider bg-[hsl(var(--nav-section-bg))] -mx-2 px-4 py-2 rounded-md text-[hsl(var(--nav-accent))]">
            Veranstaltungen
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "relative h-10 transition-all duration-150 hover:bg-[hsl(var(--nav-hover-bg))]",
                    isEventsActive && "bg-[hsl(var(--nav-active-bg))]"
                  )}
                >
                  <Link href={eventsUrl}>
                    {isEventsActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[hsl(var(--nav-active-bar))]" />
                    )}
                    <CalendarDays className={cn(
                      "h-5 w-5 ml-1",
                      !isEventsActive && "text-[hsl(var(--nav-accent))]"
                    )} />
                    <span>Events</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration Sektion (nur Vorstand) */}
        {navConfig.admin && navConfig.admin.length > 0 && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="uppercase text-xs tracking-wider text-muted-foreground/70">
                Administration
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <NavItemsList items={navConfig.admin} excludeEvents />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Finanzen Sektion (nur Vorstand) */}
        {navConfig.finance && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="uppercase text-xs tracking-wider text-muted-foreground/70">
                Finanzverwaltung
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <FinanceNavItem finance={navConfig.finance} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer mit visueller Trennung */}
      <SidebarFooter className="border-t pt-2">
        <SidebarMenu>
          {profile.role === "vorstand" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 transition-all duration-150 hover:bg-[hsl(var(--nav-hover-bg))]">
                <Link href="/settings">
                  <Settings className="h-5 w-5" />
                  <span>Einstellungen</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton
                asChild
                className="h-10 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive"
              >
                <button type="submit" className="w-full">
                  <LogOut className="h-5 w-5" />
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
