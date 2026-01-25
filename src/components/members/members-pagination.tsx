"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MembersPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function MembersPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: MembersPaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-2">
      <p className="text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <>
            Zeige {startItem}–{endItem} von {totalItems} Mitgliedern
          </>
        ) : (
          "Keine Mitglieder"
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück
        </Button>
        <span className="text-sm text-muted-foreground">
          Seite {currentPage} von {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Weiter
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
