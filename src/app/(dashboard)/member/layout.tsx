import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/actions"

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getMyProfile()

  if (!profile) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
