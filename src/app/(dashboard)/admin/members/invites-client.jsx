'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  User,
  Shield,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteInvite, resendInvite } from '@/actions/members'
import { ROLE_LABELS } from '@/lib/constants'

const roleIcons = {
  admin: Shield,
  coach: Users,
  player: User,
}

export function InvitesClient({ initialInvites }) {
  const router = useRouter()
  const [invites, setInvites] = useState(initialInvites)
  const [copiedId, setCopiedId] = useState(null)
  const [loadingId, setLoadingId] = useState(null)

  const getInviteStatus = (invite) => {
    if (invite.used_at) {
      return { status: 'used', label: 'Verwendet', variant: 'success' }
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { status: 'expired', label: 'Abgelaufen', variant: 'destructive' }
    }
    return { status: 'pending', label: 'Ausstehend', variant: 'warning' }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTimeRemaining = (expiresAt) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now

    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days} Tag${days > 1 ? 'e' : ''} übrig`
    if (hours > 0) return `${hours} Stunde${hours > 1 ? 'n' : ''} übrig`
    return 'Läuft bald ab'
  }

  const copyInviteLink = async (invite) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const inviteUrl = `${baseUrl}/invite/${invite.token}`

    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedId(invite.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleResend = async (inviteId) => {
    setLoadingId(inviteId)
    try {
      const result = await resendInvite(inviteId)
      if (result.error) {
        alert(result.error)
      } else {
        // Copy new link to clipboard
        await navigator.clipboard.writeText(result.inviteUrl)
        setCopiedId(inviteId)
        setTimeout(() => setCopiedId(null), 2000)
        router.refresh()
      }
    } catch (error) {
      console.error('Error resending invite:', error)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (inviteId) => {
    if (!confirm('Möchtest du diese Einladung wirklich löschen?')) return

    setLoadingId(inviteId)
    try {
      const result = await deleteInvite(inviteId)
      if (result.error) {
        alert(result.error)
      } else {
        setInvites(invites.filter(i => i.id !== inviteId))
      }
    } catch (error) {
      console.error('Error deleting invite:', error)
    } finally {
      setLoadingId(null)
    }
  }

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

  const getStatusBadgeClass = (variant) => {
    switch (variant) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'destructive':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return ''
    }
  }

  const pendingInvites = invites.filter(i => !i.used_at && new Date(i.expires_at) >= new Date())
  const expiredInvites = invites.filter(i => !i.used_at && new Date(i.expires_at) < new Date())
  const usedInvites = invites.filter(i => i.used_at)

  if (invites.length === 0) {
    return (
      <Card className="bg-card border-2 border-border text-center py-12">
        <CardContent>
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Keine Einladungen vorhanden</p>
          <p className="text-muted-foreground text-sm mt-2">
            Erstelle eine neue Einladung über den Button oben
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Ausstehend</p>
                <p className="text-3xl font-bold text-yellow-400">{pendingInvites.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Abgelaufen</p>
                <p className="text-3xl font-bold text-red-400">{expiredInvites.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Angenommen</p>
                <p className="text-3xl font-bold text-green-400">{usedInvites.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invites List */}
      <div className="space-y-4">
        {invites.map((invite) => {
          const { status, label, variant } = getInviteStatus(invite)
          const RoleIcon = roleIcons[invite.role] || User
          const timeRemaining = status === 'pending' ? getTimeRemaining(invite.expires_at) : null
          const isLoading = loadingId === invite.id
          const isCopied = copiedId === invite.id

          return (
            <Card
              key={invite.id}
              className={`bg-card border-2 ${status === 'pending' ? 'border-primary/50' : 'border-border'} hover-lift-sport`}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Invite Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {invite.full_name || 'Unbekannt'}
                      </h3>
                      <Badge className={`text-xs font-semibold ${getRoleBadgeClass(invite.role)}`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {ROLE_LABELS[invite.role] || invite.role}
                      </Badge>
                      <Badge className={`text-xs ${getStatusBadgeClass(variant)}`}>
                        {label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {invite.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {invite.email}
                        </span>
                      )}
                      <span>Erstellt: {formatDate(invite.created_at)}</span>
                      {invite.created_by_profile?.full_name && (
                        <span>von {invite.created_by_profile.full_name}</span>
                      )}
                      {timeRemaining && (
                        <span className="text-yellow-400">{timeRemaining}</span>
                      )}
                      {status === 'used' && invite.used_at && (
                        <span className="text-green-400">Angenommen: {formatDate(invite.used_at)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 border-2 border-border hover:border-primary"
                        onClick={() => copyInviteLink(invite)}
                        disabled={isLoading}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1 text-green-400" />
                            Kopiert
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Link kopieren
                          </>
                        )}
                      </Button>
                    )}

                    {status === 'expired' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 border-2 border-border hover:border-primary"
                        onClick={() => handleResend(invite.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        {isCopied ? 'Link kopiert!' : 'Erneut senden'}
                      </Button>
                    )}

                    {status !== 'used' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDelete(invite.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
