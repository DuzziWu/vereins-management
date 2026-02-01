"use client"

import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { useDashboardView } from "@/contexts/dashboard-view-context"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { BOTTOM_NAV_ITEMS, getAllNavItems } from "./nav-config"
import { BottomNavItem } from "./bottom-nav-item"
import { MoreMenuSheet } from "./more-menu-sheet"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const GROUP_URLS = ["/trainer/groups", "/member/groups", "/admin/groups"]

export function BottomNav() {
  const { activeView, isLoading } = useDashboardView()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const { totalUnread } = useUnreadMessages()

  // Prüfe ob aktuelle Route eine "Mehr"-Route ist (nicht in Bottom-Nav-Items)
  const isMoreRouteActive = useMemo(() => {
    if (isLoading) return false
    const bottomNavUrls = BOTTOM_NAV_ITEMS[activeView].map((item) => item.url)
    const isOnBottomNavRoute = bottomNavUrls.some(
      (url) => pathname === url || pathname.startsWith(url + "/")
    )
    if (isOnBottomNavRoute) return false

    // Prüfe ob die Route zu einer "Mehr"-Menu-Route gehört
    const allItems = getAllNavItems(activeView)
    const moreUrls = allItems
      .filter((item) => !bottomNavUrls.includes(item.url))
      .map((item) => item.url)

    // Zusätzliche statische "Mehr"-Routen (Settings, Notifications)
    const staticMoreRoutes = ["/settings", "/member/notifications"]

    return [...moreUrls, ...staticMoreRoutes].some(
      (url) => pathname === url || pathname.startsWith(url + "/")
    )
  }, [activeView, pathname, isLoading])

  if (isLoading) {
    return (
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 md:hidden",
          "border-t bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="flex h-16 items-center justify-around px-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-2 w-8 rounded" />
            </div>
          ))}
        </div>
      </nav>
    )
  }

  const items = BOTTOM_NAV_ITEMS[activeView]
  const moreActive = moreOpen || isMoreRouteActive

  // Show unread badge on groups item, or on "Mehr" button if groups is in the more menu
  const groupInBottomNav = items.some((item) =>
    GROUP_URLS.some((url) => item.url === url)
  )
  const showMoreBadge = !groupInBottomNav && totalUnread > 0

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 md:hidden",
          "border-t bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="flex h-16 items-center justify-around px-2">
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
            const isGroupItem = GROUP_URLS.some((url) => item.url === url)
            return (
              <BottomNavItem
                key={item.url}
                icon={item.icon}
                label={item.title}
                href={item.url}
                isActive={isActive}
                badge={isGroupItem ? totalUnread : undefined}
              />
            )
          })}

          {/* "Mehr"-Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded-md transition-colors",
              moreActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <Menu className={cn("h-5 w-5", moreActive && "scale-110 transition-transform")} />
              {showMoreBadge && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            {moreActive && (
              <span className="text-[10px] font-medium leading-tight">Mehr</span>
            )}
          </button>
        </div>
      </nav>

      <MoreMenuSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  )
}
