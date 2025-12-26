'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Save, X, Shield, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createTeam, updateTeam, deleteTeam } from '@/actions/teams'

export function TeamsClient({ initialTeams }) {
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', league: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', league: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleEdit = (team) => {
    setEditingId(team.id)
    setEditForm({ name: team.name, league: team.league })
  }

  const handleSaveEdit = async (id) => {
    setSaving(true)
    setError(null)
    try {
      const result = await updateTeam({
        teamId: id,
        name: editForm.name,
        league: editForm.league,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setTeams(teams.map((team) => (team.id === id ? { ...team, ...editForm } : team)))
      setEditingId(null)
      setEditForm({ name: '', league: '' })
      router.refresh()
    } catch (err) {
      console.error('Error updating team:', err)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: '', league: '' })
    setError(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Möchten Sie diese Mannschaft wirklich löschen?')) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const result = await deleteTeam({ teamId: id })

      if (result.error) {
        setError(result.error)
        return
      }

      setTeams(teams.filter((team) => team.id !== id))
      router.refresh()
    } catch (err) {
      console.error('Error deleting team:', err)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTeam = async () => {
    if (!newTeam.name.trim()) {
      setError('Bitte geben Sie einen Mannschaftsnamen ein')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const result = await createTeam({
        name: newTeam.name,
        league: newTeam.league,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      // Add the new team to local state immediately
      if (result.team) {
        setTeams([...teams, {
          id: result.team.id,
          name: result.team.name,
          league: result.team.league || '',
          memberCount: 0,
          createdAt: result.team.created_at,
        }])
      }

      setNewTeam({ name: '', league: '' })
      setShowAddForm(false)
    } catch (err) {
      console.error('Error creating team:', err)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelAdd = () => {
    setNewTeam({ name: '', league: '' })
    setShowAddForm(false)
    setError(null)
  }

  return (
    <>
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">Mannschaften</h1>
        <div className="flex items-center gap-3">
          <div className="h-1 w-24 bg-primary rounded-full" />
          <p className="text-muted-foreground font-medium">{teams.length} Teams verwalten</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Add Button */}
      <div className="mb-8">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 action-glow h-12 px-6 text-sm uppercase tracking-wider"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neue Mannschaft anlegen
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="bg-card border-2 border-primary mb-8 energy-card">
          <CardHeader>
            <CardTitle className="text-foreground text-lg font-normal flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Neue Mannschaft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="new-name" className="text-muted-foreground uppercase tracking-wider text-xs">
                  Mannschaftsname
                </Label>
                <Input
                  id="new-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="z.B. 1. Herren"
                  className="bg-input border-2 border-border text-foreground h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-league" className="text-muted-foreground uppercase tracking-wider text-xs">
                  Liga
                </Label>
                <Input
                  id="new-league"
                  value={newTeam.league}
                  onChange={(e) => setNewTeam({ ...newTeam, league: e.target.value })}
                  placeholder="z.B. Bezirksliga"
                  className="bg-input border-2 border-border text-foreground h-12"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAddTeam}
                disabled={saving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 text-sm uppercase tracking-wider"
              >
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
              <Button
                onClick={handleCancelAdd}
                variant="outline"
                className="border-border hover:border-destructive hover:text-destructive h-10 px-6 text-sm bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card
            key={team.id}
            className={`bg-card border-2 hover-lift-sport ${
              editingId === team.id ? 'border-primary energy-card' : 'border-border'
            }`}
          >
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {editingId === team.id ? 'Team bearbeiten' : team.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingId === team.id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground uppercase tracking-wider text-xs">Mannschaftsname</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="bg-input border-2 border-border text-foreground h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground uppercase tracking-wider text-xs">Liga</Label>
                    <Input
                      value={editForm.league}
                      onChange={(e) => setEditForm({ ...editForm, league: e.target.value })}
                      className="bg-input border-2 border-border text-foreground h-11"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleSaveEdit(team.id)}
                      disabled={saving}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-xs uppercase tracking-wider flex-1"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Speichern
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className="border-border hover:border-destructive hover:text-destructive h-9 px-4 text-xs bg-transparent"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Liga</p>
                    <p className="text-foreground font-light text-lg">{team.league || 'Keine Liga'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {team.memberCount} {team.memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleEdit(team)}
                      size="sm"
                      variant="outline"
                      className="border-border hover:border-primary hover:text-primary h-9 px-4 text-xs uppercase tracking-wider flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Bearbeiten
                    </Button>
                    <Button
                      onClick={() => handleDelete(team.id)}
                      disabled={saving}
                      size="sm"
                      variant="outline"
                      className="border-border hover:border-destructive hover:text-destructive h-9 px-4 text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <Card className="bg-card border-2 border-border text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Noch keine Mannschaften vorhanden</p>
            <p className="text-muted-foreground text-sm mt-2">Erstelle deine erste Mannschaft mit dem Button oben</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
