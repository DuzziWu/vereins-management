import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { UnauthorizedToast } from "@/components/dashboard/unauthorized-toast"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <>
      {params.error === "unauthorized" && <UnauthorizedToast />}
      <DashboardContent />
    </>
  )
}
