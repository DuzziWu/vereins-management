"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronRight, Users, FolderKanban, MessageSquare } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/kanban"
import { WorkgroupChatTab } from "./workgroup-chat-tab"
import { WorkgroupListItem, WorkgroupCategory } from "./workgroup-form"

interface WorkgroupMember {
  profile_id: string
  first_name: string
  last_name: string
  joined_at: string
}

interface WorkgroupDetail extends WorkgroupListItem {
  members: WorkgroupMember[]
}

interface WorkgroupDetailContentProps {
  workgroupId: string
  basePath: string // e.g., "/member/workgroups" or "/admin/my-workgroups"
  dashboardPath: string // e.g., "/dashboard" or "/admin"
}

function getCategoryBadgeColor(category: WorkgroupCategory | null): string {
  if (!category) return ""

  const colorMap: Record<string, string> = {
    "Wagenbau": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "Event-Planung": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Kostüme": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    "Organisation": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Sonstiges": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  }

  return colorMap[category.name] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

export function WorkgroupDetailContent({
  workgroupId,
  basePath,
  dashboardPath,
}: WorkgroupDetailContentProps) {
  const router = useRouter()
  const [workgroup, setWorkgroup] = React.useState<WorkgroupDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isVorstand, setIsVorstand] = React.useState(false)
  const [currentUserId, setCurrentUserId] = React.useState<string>("")
  const [isMembersOpen, setIsMembersOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"board" | "chat">("board")
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    async function fetchWorkgroup() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/workgroups/${workgroupId}`)

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Workgroup nicht gefunden")
            router.push(basePath)
            return
          }
          if (response.status === 403) {
            toast.error("Kein Zugriff auf diese Workgroup")
            router.push(basePath)
            return
          }
          throw new Error("Fehler beim Laden der Workgroup")
        }

        const data = await response.json()
        setWorkgroup(data.workgroup)
        setIsVorstand(data.is_vorstand || false)
        setCurrentUserId(data.current_user_id || "")
      } catch (error) {
        console.error("Error fetching workgroup:", error)
        toast.error("Fehler beim Laden der Workgroup")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkgroup()
  }, [workgroupId, router, basePath])

  const handleTabChange = React.useCallback((value: string) => {
    setActiveTab(value as "board" | "chat")
    if (value === "chat") {
      setUnreadCount(0)
    }
  }, [])

  const handleNewMessage = React.useCallback(() => {
    setUnreadCount((prev) => prev + 1)
  }, [])

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (!workgroup) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={dashboardPath}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={basePath}>Meine Workgroups</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{workgroup.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold sm:text-3xl">{workgroup.name}</h1>
          {workgroup.category && (
            <Badge
              className={getCategoryBadgeColor(workgroup.category)}
              variant="outline"
            >
              {workgroup.category.name}
            </Badge>
          )}
        </div>
        {workgroup.description && (
          <p className="text-muted-foreground">{workgroup.description}</p>
        )}
      </div>

      {/* Members Collapsible */}
      <Collapsible open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5" />
                  Mitglieder ({workgroup.members.length})
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {isMembersOpen ? "Einklappen" : "Anzeigen"}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-3">
                {workgroup.members.map((member) => (
                  <div
                    key={member.profile_id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {member.first_name} {member.last_name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Board + Chat Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="board" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Board
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="h-5 min-w-5 px-1 text-[10px] leading-none"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" forceMount hidden={activeTab !== "board"}>
          <KanbanBoard
            workgroupId={workgroupId}
            isVorstand={isVorstand}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="chat" forceMount hidden={activeTab !== "chat"}>
          <WorkgroupChatTab
            workgroupId={workgroupId}
            currentUserId={currentUserId}
            isActive={activeTab === "chat"}
            onNewMessage={handleNewMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
