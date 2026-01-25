"use client"

import { useEffect, type ReactNode } from "react"
import { DashboardViewProvider, useDashboardView } from "@/contexts/dashboard-view-context"
import { Profile } from "@/lib/database.types"

interface DashboardProviderProps {
  children: ReactNode
  profile: Profile | null
  email: string | null
}

function DataInitializer({ profile, email }: { profile: Profile | null; email: string | null }) {
  const { setProfile, setEmail } = useDashboardView()

  useEffect(() => {
    setProfile(profile)
  }, [profile, setProfile])

  useEffect(() => {
    setEmail(email)
  }, [email, setEmail])

  return null
}

export function DashboardProvider({ children, profile, email }: DashboardProviderProps) {
  return (
    <DashboardViewProvider initialProfile={profile} initialEmail={email}>
      <DataInitializer profile={profile} email={email} />
      {children}
    </DashboardViewProvider>
  )
}
