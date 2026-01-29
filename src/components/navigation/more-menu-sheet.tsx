"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { logout } from "@/lib/actions"
import { useDashboardView } from "@/contexts/dashboard-view-context"
import { getAllNavItems, BOTTOM_NAV_ITEMS } from "./nav-config"
import { cn } from "@/lib/utils"
import { NotificationBadge } from "@/components/dashboard/notification-badge"
import { Bell } from "lucide-react"

interface MoreMenuSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoreMenuSheet({ open, onOpenChange }: MoreMenuSheetProps) {
  const { activeView } = useDashboardView()
  const pathname = usePathname()

  // Alle Nav-Items holen und die Bottom-Nav-Items herausfiltern
  const allItems = getAllNavItems(activeView)
  const bottomNavUrls = new Set(BOTTOM_NAV_ITEMS[activeView].map((item) => item.url))
  const moreItems = allItems.filter((item) => !bottomNavUrls.has(item.url))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl pb-[env(safe-area-inset-bottom)]">
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Weitere Optionen</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1">
          {moreItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
            return (
              <Link
                key={item.url}
                href={item.url}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors min-h-[44px]",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            )
          })}

          {/* Benachrichtigungen fuer Mitglieder */}
          {activeView === "mitglied" && (
            <Link
              href="/member/notifications"
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors min-h-[44px]",
                pathname === "/member/notifications"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Bell className="h-5 w-5 shrink-0" />
              <span className="flex-1">Benachrichtigungen</span>
              <NotificationBadge />
            </Link>
          )}

          {/* Separator */}
          <div className="my-1 h-px bg-border" />

          {/* Einstellungen */}
          <Link
            href="/settings"
            onClick={() => onOpenChange(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors min-h-[44px]",
              pathname === "/settings"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>Einstellungen</span>
          </Link>

          {/* Abmelden */}
          <form action={logout}>
            <button
              type="submit"
              onClick={() => onOpenChange(false)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors min-h-[44px]"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Abmelden</span>
            </button>
          </form>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
