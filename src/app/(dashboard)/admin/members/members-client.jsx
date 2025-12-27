'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, Download, Save, X, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateMemberRole, assignToTeam } from '@/actions/members'
import { useDebounce } from '@/lib/hooks/use-debounce'

const availableRoles = [
  { value: 'admin', label: 'Admin' },
  { value: 'coach', label: 'Trainer' },
  { value: 'player', label: 'Spieler' },
]

export function MembersClient({ initialMembers, teams, clubId }) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [teamFilter, setTeamFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ role: '', teamId: '' })
  const [saving, setSaving] = useState(false)

  // Get unique teams from members
  const memberTeams = ['all', ...new Set(members.map((m) => m.team))]

  // Filter logic with debounced search
  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesTeam = teamFilter === 'all' || member.team === teamFilter
    const matchesRole = roleFilter === 'all' || member.role === roleFilter

    return matchesSearch && matchesTeam && matchesRole
  })

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-warning'
      case 'coach':
        return 'badge-info'
      case 'player':
        return 'badge-success'
      default:
        return ''
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'coach':
        return 'Trainer'
      case 'player':
        return 'Spieler'
      default:
        return role
    }
  }

  const startEditing = (member) => {
    setEditingId(member.id)
    setEditForm({
      role: member.role,
      teamId: member.teamId || 'none',
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({ role: '', teamId: '' })
  }

  const saveChanges = async (memberId) => {
    setSaving(true)
    try {
      // Update role if changed
      const member = members.find(m => m.id === memberId)
      if (member.role !== editForm.role) {
        await updateMemberRole({ memberId, newRole: editForm.role })
      }

      // Update team if changed
      const newTeamId = editForm.teamId === 'none' ? null : editForm.teamId
      if (member.teamId !== newTeamId) {
        await assignToTeam({ memberId, teamId: newTeamId })
      }

      // Update local state
      const newTeam = teams.find(t => t.id === newTeamId)
      setMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.id === memberId
            ? {
                ...m,
                role: editForm.role,
                team: newTeam?.name || 'Nicht zugewiesen',
                teamId: newTeamId,
              }
            : m
        )
      )

      setEditingId(null)
      setEditForm({ role: '', teamId: '' })
      router.refresh()
    } catch (error) {
      console.error('Error saving changes:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-3">Mitglieder</h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-24 bg-primary rounded-full" />
              <p className="text-muted-foreground font-medium">
                {filteredMembers.length} {filteredMembers.length === 1 ? 'Mitglied' : 'Mitglieder'}
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
      </div>

      {/* Filter & Search Section */}
      <Card className="mb-8 bg-card border-2 border-border energy-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach Namen suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-input border-2 border-border focus:border-primary"
              />
            </div>

            {/* Team Filter */}
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="h-11 bg-input border-2 border-border">
                <SelectValue placeholder="Mannschaft" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mannschaften</SelectItem>
                {memberTeams
                  .filter((t) => t !== 'all')
                  .map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-11 bg-input border-2 border-border">
                <SelectValue placeholder="Rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card
            key={member.id}
            className={`bg-card border-2 ${editingId === member.id ? 'border-primary' : 'border-border'} hover-lift-sport group`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-foreground text-lg font-semibold mb-2">{member.name}</CardTitle>
                  {editingId === member.id ? (
                    <Select
                      value={editForm.role}
                      onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                    >
                      <SelectTrigger className="h-8 w-32 bg-input border-2 border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`text-xs font-semibold ${getRoleBadgeClass(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  )}
                </div>
                {editingId === member.id ? (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => saveChanges(member.id)}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditing}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => startEditing(member)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Only show team assignment for non-admins */}
                {(editingId === member.id ? editForm.role : member.role) !== 'admin' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground uppercase tracking-wider text-xs">Mannschaft</span>
                    {editingId === member.id ? (
                      <Select
                        value={editForm.teamId || 'none'}
                        onValueChange={(value) => setEditForm({ ...editForm, teamId: value })}
                      >
                        <SelectTrigger className="h-8 w-40 bg-input border-2 border-border text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nicht zugewiesen</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`font-medium ${member.team === 'Nicht zugewiesen' ? 'text-orange-400' : 'text-foreground'}`}
                      >
                        {member.team}
                      </span>
                    )}
                  </div>
                )}
                {/* Only show pending badge for non-admins without team */}
                {member.role !== 'admin' && member.team === 'Nicht zugewiesen' && editingId !== member.id && (
                  <div className="pt-3 border-t border-border">
                    <Badge className="badge-warning text-xs">Zuweisung ausstehend</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card className="bg-card border-2 border-border text-center py-12">
          <CardContent>
            <p className="text-muted-foreground text-lg">Keine Mitglieder gefunden</p>
            <p className="text-muted-foreground text-sm mt-2">Versuche deine Suchkriterien anzupassen</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
