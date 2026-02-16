"use client"

import { use } from "react"
import { WorkgroupDetailContent } from "@/components/workgroups/workgroup-detail-content"

interface MemberWorkgroupDetailPageProps {
  params: Promise<{ id: string }>
}

export default function MemberWorkgroupDetailPage({
  params,
}: MemberWorkgroupDetailPageProps) {
  const { id } = use(params)

  return (
    <WorkgroupDetailContent
      workgroupId={id}
      basePath="/member/workgroups"
      dashboardPath="/dashboard"
    />
  )
}
