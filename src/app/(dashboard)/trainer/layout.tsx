import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/actions"

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getMyProfile()

  // Redirect wenn User nicht eingeloggt oder weder Trainer noch Vorstand
  if (!profile || (profile.role !== "trainer" && profile.role !== "vorstand")) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
