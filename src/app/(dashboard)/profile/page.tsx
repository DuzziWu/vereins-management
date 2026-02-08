import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  getMyProfile,
  getAuthUserEmail,
  hasPasswordSet,
  getMyGroups,
  getMyFees,
} from "@/lib/actions/profile"
import { getMyNotificationPreferences } from "@/lib/actions/notification-preferences"
import {
  PersonalDataForm,
  PasswordChangeForm,
  NotificationPreferences,
  ClubInfoSection,
} from "@/components/profile"

export default async function ProfilePage() {
  // Load all data in parallel
  const [profile, email, hasPassword, groups, fees, notificationPrefs] = await Promise.all([
    getMyProfile(),
    getAuthUserEmail(),
    hasPasswordSet(),
    getMyGroups(),
    getMyFees(),
    getMyNotificationPreferences(),
  ])

  // Redirect if not authenticated
  if (!profile || !email) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mein Profil</h1>

      {/* Section 1: Personal Data */}
      <PersonalDataForm
        profile={{
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          date_of_birth: profile.date_of_birth,
          address_street: profile.address_street,
          address_zip: profile.address_zip,
          address_city: profile.address_city,
        }}
        email={email}
      />

      {/* Section 2: Password Change */}
      <PasswordChangeForm hasPassword={hasPassword} />

      {/* Section 3: Notification Preferences */}
      <NotificationPreferences initialPreferences={notificationPrefs} />

      {/* Section 4: Club Info (Read-only) */}
      <ClubInfoSection
        profile={{
          role: profile.role,
          is_active: profile.is_active,
          created_at: profile.created_at,
        }}
        groups={groups}
        fees={fees}
      />
    </div>
  )
}

// Loading skeleton for the page
export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />

      {/* Personal Data Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full sm:col-span-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>

      {/* Password Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>

      {/* Notifications Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Club Info Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
