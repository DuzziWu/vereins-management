import { Suspense } from "react"
import { DocumentsView } from "@/components/documents"
import { Skeleton } from "@/components/ui/skeleton"

function DocumentsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        <Skeleton className="hidden md:block w-64 h-full" />
        <Skeleton className="flex-1 h-full" />
      </div>
    </div>
  )
}

export default function AdminDocumentsPage() {
  return (
    <Suspense fallback={<DocumentsPageSkeleton />}>
      <DocumentsView isVorstand={true} basePath="/admin/documents" />
    </Suspense>
  )
}
