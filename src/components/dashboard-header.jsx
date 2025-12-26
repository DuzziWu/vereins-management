'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bell, Settings, LogOut, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { signOut } from '@/actions/auth'

export default function DashboardHeader({ userName = 'Max Mustermann', userRole = 'Admin', clubName = 'FC Beispiel', isAdmin = false, avatarUrl = null, clubLogoUrl = null }) {
  const handleLogout = async () => {
    await signOut()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-card/80 backdrop-blur-xl sport-stripe">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {clubLogoUrl ? (
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-primary bg-card">
              <Image
                src={clubLogoUrl}
                alt={`${clubName} Logo`}
                fill
                className="object-contain p-1"
                sizes="56px"
              />
            </div>
          ) : (
            <div className="relative p-3 bg-primary rounded-lg">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
          )}
          <div className="hidden md:block">
            <h2 className="text-base font-bold text-foreground tracking-tight">{clubName}</h2>
            <Badge className="mt-1 text-xs font-semibold badge-info">{userRole}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-primary transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center text-xs font-bold bg-primary text-primary-foreground rounded-full">
              3
            </span>
          </Button>

          {isAdmin ? (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors" asChild>
              <Link href="/admin/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
              <Settings className="h-5 w-5" />
            </Button>
          )}

          <div className="ml-2 flex items-center gap-3 border-l-2 border-border pl-4">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                {userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-semibold text-foreground">{userName}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
