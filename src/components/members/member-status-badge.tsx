"use client"

import { CheckCircle, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MemberStatus, STATUS_CONFIG } from "@/lib/validations/member"

interface MemberStatusBadgeProps {
  status: MemberStatus
}

const STATUS_ICONS: Record<MemberStatus, React.ElementType> = {
  active: CheckCircle,
  inactive: XCircle,
  pending: Clock,
}

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = STATUS_ICONS[status]

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
