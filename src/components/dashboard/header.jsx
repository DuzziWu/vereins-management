'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/avatar'
import { ROLE_LABELS, DASHBOARD_ROUTES } from '@/lib/constants'

/**
 * Dashboard Header with club logo, navigation, and user menu
 */
export function DashboardHeader({ user, club, onSignOut }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const role = user?.role || 'player'
  const roleLabel = ROLE_LABELS[role] || role

  // Navigation items based on role
  const navItems = getNavItemsForRole(role)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo / Club Name */}
        <Link
          href={DASHBOARD_ROUTES[role] || '/admin'}
          className="flex items-center gap-3"
        >
          {club?.logo_url ? (
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src={club.logo_url}
                alt={club.name}
                fill
                sizes="32px"
                className="rounded-full object-cover"
              />
            </div>
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: club?.primary_color || '#d9f99d', color: '#0f172a' }}
            >
              {club?.name?.charAt(0) || 'V'}
            </div>
          )}
          <span className="font-display font-bold text-lg hidden sm:inline">
            {club?.name || 'Vereins-Master'}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-foreground',
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <Badge variant={role}>{roleLabel}</Badge>
          <UserAvatar user={user} size="sm" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="hidden sm:flex"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Abmelden</span>
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="container px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={onSignOut}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground"
            >
              Abmelden
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}

function getNavItemsForRole(role) {
  const items = {
    admin: [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/members', label: 'Mitglieder' },
      { href: '/admin/teams', label: 'Teams' },
      { href: '/admin/finances', label: 'Finanzen' },
      { href: '/admin/modules', label: 'Module' },
    ],
    coach: [
      { href: '/coach', label: 'Dashboard' },
      { href: '/coach/events', label: 'Termine' },
      { href: '/coach/team', label: 'Mannschaft' },
    ],
    player: [
      { href: '/player', label: 'Dashboard' },
      { href: '/player/events', label: 'Termine' },
      { href: '/player/profile', label: 'Profil' },
    ],
  }

  return items[role] || items.player
}
