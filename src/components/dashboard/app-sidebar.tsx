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
import { ROLE_NAV_ITEMS, type NavItem, type NavItemWithSub } from "@/components/navigation/nav-config"
import { createClient } from "@/lib/supabase/client"

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

function FinanceNavItem({ finance }: { finance: NavItemWithSub }) {
  const pathname = usePathname()
  const isActive = finance.items.some(
    (item) => pathname === item.url || pathname.startsWith(item.url + "/")
  )

  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <finance.icon className="h-4 w-4" />
            <span>{finance.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {finance.items.map((item) => (
              <SidebarMenuSubItem key={item.url}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                >
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
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
  const logoUrl = useSidebarLogo()

  if (isLoading || !profile) {
    return <SidebarSkeleton />
  }

  const navConfig = ROLE_NAV_ITEMS[activeView]

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          {logoUrl ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Vereinslogo"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-4 w-4" />
            </div>
          )}
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

        {navConfig.finance && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Finanzverwaltung</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <FinanceNavItem finance={navConfig.finance} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {profile.role === "vorstand" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  <span>Einstellungen</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
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
