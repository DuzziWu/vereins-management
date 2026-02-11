"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface BottomNavItemProps {
  icon: LucideIcon
  label: string
  href: string
  isActive: boolean
  badge?: number
  isEvents?: boolean // PROJ-24: Accent-Styling für Events
}

export function BottomNavItem({ icon: Icon, label, href, isActive, badge, isEvents }: BottomNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded-md transition-all duration-150",
        isActive
          ? "text-primary"
          : isEvents
            ? "text-[hsl(var(--nav-accent))]" // Events immer in Accent-Farbe
            : "text-muted-foreground"
      )}
    >
      <div className="relative">
        <Icon
          className={cn(
            "h-5 w-5 transition-transform duration-150",
            isActive && "scale-110",
            // Events-Icon hat Filled-Effekt wenn aktiv
            isEvents && isActive && "fill-current"
          )}
        />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      {isActive && (
        <span className="text-[10px] font-medium leading-tight">{label}</span>
      )}
    </Link>
  )
}
