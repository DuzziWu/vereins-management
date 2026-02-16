"use client"

import * as React from "react"
import { toast } from "sonner"

import { Skeleton } from "@/components/ui/skeleton"
import { WorkgroupCardsGrid } from "@/components/workgroups/workgroup-card"
import { WorkgroupListItem } from "@/components/workgroups/workgroup-form"

interface MyWorkgroupsContentProps {
  basePath: string // e.g., "/member/workgroups" or "/trainer/workgroups"
}

function CardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex -space-x-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MyWorkgroupsContent({ basePath }: MyWorkgroupsContentProps) {
  const [workgroups, setWorkgroups] = React.useState<
    (WorkgroupListItem & {
      members?: { id: string; first_name: string; last_name: string }[]
    })[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch my workgroups
  React.useEffect(() => {
    async function fetchMyWorkgroups() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/workgroups/my")

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Error fetching workgroups:", errorData)
          toast.error("Fehler beim Laden der Workgroups")
          return
        }

        const data = await response.json()
        setWorkgroups(data.workgroups || [])
      } catch (error) {
        console.error("Error fetching workgroups:", error)
        toast.error("Fehler beim Laden der Workgroups")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyWorkgroups()
  }, [])

  if (isLoading) {
    return <CardsSkeleton />
  }

  return (
    <WorkgroupCardsGrid
      workgroups={workgroups}
      getHref={(workgroup) => `${basePath}/${workgroup.id}`}
    />
  )
}
