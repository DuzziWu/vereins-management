import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardProvider } from "@/components/dashboard/dashboard-provider"
import { RoleSwitcher } from "@/components/dashboard/role-switcher"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { getMyProfile, getAuthUserEmail } from "@/lib/actions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, email] = await Promise.all([
    getMyProfile(),
    getAuthUserEmail(),
  ])

  return (
    <DashboardProvider profile={profile} email={email}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 hidden md:flex" />
              <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
            </div>
            <RoleSwitcher />
          </header>
          <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        </SidebarInset>
        <BottomNav />
      </SidebarProvider>
    </DashboardProvider>
  )
}
