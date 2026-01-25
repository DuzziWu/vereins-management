"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { getUnreadNotificationCount } from "@/lib/actions"

export function NotificationBadge() {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    async function loadCount() {
      const unreadCount = await getUnreadNotificationCount()
      setCount(unreadCount)
    }

    loadCount()

    // Optional: Polling alle 30 Sekunden für Updates
    const interval = setInterval(loadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  return (
    <Badge
      variant="default"
      className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-medium"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  )
}
