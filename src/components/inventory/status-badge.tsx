"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ItemStatus, STATUS_CONFIG } from "@/lib/validations/inventory"

interface StatusBadgeProps {
  status: ItemStatus
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "gap-1.5",
        status === "available" && "bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400",
        status === "loaned" && "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-400",
        status === "defective" && "bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400",
        status === "in_cleaning" && "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400",
        status === "reserved" && "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400",
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            status === "available" && "bg-green-500",
            status === "loaned" && "bg-orange-500",
            status === "defective" && "bg-red-500",
            status === "in_cleaning" && "bg-blue-500",
            status === "reserved" && "bg-yellow-500"
          )}
        />
      )}
      {config.label}
    </Badge>
  )
}
