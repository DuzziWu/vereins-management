"use client"

import { use } from "react"
import { WorkgroupDetailContent } from "@/components/workgroups/workgroup-detail-content"

interface TrainerWorkgroupDetailPageProps {
  params: Promise<{ id: string }>
}

export default function TrainerWorkgroupDetailPage({
  params,
}: TrainerWorkgroupDetailPageProps) {
  const { id } = use(params)

  return (
    <WorkgroupDetailContent
      workgroupId={id}
      basePath="/trainer/workgroups"
      dashboardPath="/dashboard"
    />
  )
}
