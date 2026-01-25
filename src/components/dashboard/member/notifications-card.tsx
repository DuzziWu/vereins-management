"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Mail,
  FileText,
  Calendar,
  UsersRound,
  Info,
  Check,
  CheckCheck,
  Loader2,
  X,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
  type NotificationType,
} from "@/lib/actions"
import { cn } from "@/lib/utils"

// Icons für jeden Notification-Typ
const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  invitation: Mail,
  document: FileText,
  event: Calendar,
  group_change: UsersRound,
  system: Info,
}

// Labels für jeden Notification-Typ
const TYPE_LABELS: Record<NotificationType, string> = {
  invitation: "Einladung",
  document: "Dokument",
  event: "Termin",
  group_change: "Gruppe",
  system: "System",
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const Icon = TYPE_ICONS[notification.type]
  const isUnread = !notification.read_at

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return "Gerade eben"
    if (hours < 24) return `vor ${hours} Std.`
    if (days === 1) return "Gestern"
    if (days < 7) return `vor ${days} Tagen`
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg transition-colors",
        isUnread
          ? "bg-primary/5 hover:bg-primary/10"
          : "hover:bg-muted/50",
        notification.link && "cursor-pointer"
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              isUnread && "font-medium"
            )}
          >
            {notification.title}
          </p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUnread && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkRead(notification.id)
                }}
                title="Als gelesen markieren"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
              title="Löschen"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {TYPE_LABELS[notification.type]}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatDate(notification.created_at)}
          </span>
        </div>
      </div>
      {isUnread && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
      )}
    </div>
  )
}

export function NotificationsCard() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const unreadCount = notifications.filter((n) => !n.read_at).length

  useEffect(() => {
    async function loadNotifications() {
      const data = await getMyNotifications({ limit: 20 })
      setNotifications(data)
      setIsLoading(false)
    }

    loadNotifications()
  }, [])

  const handleMarkRead = async (id: string) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(id)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          )
        )
      }
    })
  }

  const handleMarkAllRead = async () => {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        )
      }
    })
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteNotification(id)
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Benachrichtigungen</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-lg">Benachrichtigungen</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-1">
                {unreadCount} neu
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Alle gelesen
            </Button>
          )}
        </div>
        <CardDescription>
          Neuigkeiten und Updates zu deiner Mitgliedschaft
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine Benachrichtigungen vorhanden
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-3 -mr-3">
            <div className="space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
