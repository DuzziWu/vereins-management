"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface BottomNavItemProps {
  icon: LucideIcon
  label: string
  href: string
  isActive: boolean
}

export function BottomNavItem({ icon: Icon, label, href, isActive }: BottomNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded-md transition-colors",
        isActive
          ? "text-primary"
          : "text-muted-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "scale-110 transition-transform")} />
      {isActive && (
        <span className="text-[10px] font-medium leading-tight">{label}</span>
      )}
    </Link>
  )
}
