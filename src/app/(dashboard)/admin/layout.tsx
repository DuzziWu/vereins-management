import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/actions"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getMyProfile()

  // Redirect wenn User nicht eingeloggt oder kein Vorstand
  if (!profile || profile.role !== "vorstand") {
    redirect("/dashboard")
  }

  return <>{children}</>
}
