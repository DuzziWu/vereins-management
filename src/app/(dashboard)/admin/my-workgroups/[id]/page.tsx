"use client"

import { use } from "react"
import { WorkgroupDetailContent } from "@/components/workgroups/workgroup-detail-content"

interface AdminWorkgroupDetailPageProps {
  params: Promise<{ id: string }>
}

export default function AdminWorkgroupDetailPage({
  params,
}: AdminWorkgroupDetailPageProps) {
  const { id } = use(params)

  return (
    <WorkgroupDetailContent
      workgroupId={id}
      basePath="/admin/my-workgroups"
      dashboardPath="/dashboard"
    />
  )
}
