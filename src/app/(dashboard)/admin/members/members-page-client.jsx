'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Mail, UserPlus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MembersClient } from './members-client'
import { InvitesClient } from './invites-client'

export function MembersPageClient({
  initialMembers,
  teams,
  clubId,
  initialInvites,
  pendingInvitesCount,
}) {
  const [activeTab, setActiveTab] = useState('members')

  return (
    <>
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-3">
              Mitglieder
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-24 bg-primary rounded-full" />
              <p className="text-muted-foreground font-medium">
                {initialMembers.length} {initialMembers.length === 1 ? 'Mitglied' : 'Mitglieder'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 border-2 border-border hover:border-primary bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 action-glow">
              <Link href="/admin/members/invite">
                <UserPlus className="mr-2 h-4 w-4" />
                Mitglied einladen
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b-2 border-border">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'members'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Mitglieder
            {activeTab === 'members' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'invites'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="h-4 w-4" />
            Einladungen
            {pendingInvitesCount > 0 && (
              <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-primary text-primary-foreground text-xs">
                {pendingInvitesCount}
              </Badge>
            )}
            {activeTab === 'invites' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' ? (
        <MembersClient
          initialMembers={initialMembers}
          teams={teams}
          clubId={clubId}
          hideHeader={true}
        />
      ) : (
        <InvitesClient initialInvites={initialInvites} />
      )}
    </>
  )
}
