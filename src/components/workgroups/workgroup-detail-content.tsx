"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronRight, Users, Calendar, FolderKanban, MessageSquare } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
      } catch (error) {
        console.error("Error fetching workgroup:", error)
        toast.error("Fehler beim Laden der Workgroup")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkgroup()
  }, [workgroupId, router, basePath])

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

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Members Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mitglieder
            </CardTitle>
            <CardDescription>
              {workgroup.members.length} Mitglieder in dieser Workgroup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workgroup.members.map((member) => (
                <div
                  key={member.profile_id}
                  className="flex items-center gap-3"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {getInitials(member.first_name, member.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {member.first_name} {member.last_name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Cards for future features */}
        <div className="space-y-6">
          {/* Kanban Placeholder */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <FolderKanban className="h-5 w-5" />
                Kanban-Board
              </CardTitle>
              <CardDescription>
                Task-Management kommt in PROJ-26
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">Bald verfügbar...</p>
              </div>
            </CardContent>
          </Card>

          {/* Chat Placeholder */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
                Workgroup-Chat
              </CardTitle>
              <CardDescription>
                Chat-Funktion kommt in PROJ-28
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">Bald verfügbar...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
