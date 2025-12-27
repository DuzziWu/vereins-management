'use client'

import { useState } from 'react'
import { Copy, Check, Loader2, UserPlus, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { createInvite, sendInviteEmail } from '@/actions/members'
import { USER_ROLES, ROLE_LABELS } from '@/lib/constants'

export function InviteForm({ clubName }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('player')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [error, setError] = useState('')
  const [inviteData, setInviteData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setInviteData(null)

    const formData = new FormData()
    formData.set('fullName', fullName)
    if (email) formData.set('email', email)
    formData.set('role', role)

    const result = await createInvite(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setInviteData({
        url: result.inviteUrl,
        email: email || null,
        fullName: fullName,
        role: role,
      })
    }

    setIsLoading(false)
  }

  async function handleSendEmail() {
    if (!inviteData?.email) return

    setIsSendingEmail(true)
    const result = await sendInviteEmail({
      email: inviteData.email,
      fullName: inviteData.fullName,
      role: inviteData.role,
      inviteUrl: inviteData.url,
      clubName: clubName,
    })

    if (result.success) {
      setEmailSent(true)
    } else {
      setError(result.error || 'Fehler beim Senden der E-Mail')
    }
    setIsSendingEmail(false)
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(inviteData.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function resetForm() {
    setInviteData(null)
    setFullName('')
    setEmail('')
    setRole('player')
    setEmailSent(false)
    setError('')
  }

  return (
    <div className="max-w-2xl">
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Einladungslink erstellen
          </CardTitle>
          <CardDescription>
            Erstelle einen personalisierten Einladungslink, den du per E-Mail oder Messenger teilen kannst.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteData ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-primary font-medium mb-1">
                  Einladung erstellt!
                </p>
                <p className="text-sm text-muted-foreground">
                  {inviteData.fullName} wurde als {ROLE_LABELS[inviteData.role]} eingeladen.
                </p>
              </div>

              {/* Invite Link */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Einladungslink
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteData.url}
                    readOnly
                    className="font-mono text-xs bg-muted"
                  />
                  <Button onClick={copyToClipboard} variant="outline" className="shrink-0">
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Send Email Option */}
              {inviteData.email && !emailSent && (
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">E-Mail senden?</p>
                      <p className="text-xs text-muted-foreground">
                        Sende die Einladung direkt an {inviteData.email}
                      </p>
                    </div>
                    <Button
                      onClick={handleSendEmail}
                      disabled={isSendingEmail}
                      size="sm"
                    >
                      {isSendingEmail ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Senden
                    </Button>
                  </div>
                </div>
              )}

              {emailSent && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-green-500 font-medium text-sm flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    E-Mail wurde erfolgreich gesendet!
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Weitere Einladung erstellen
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Vollständiger Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Max Mustermann"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  E-Mail (optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="max.mustermann@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Falls angegeben, kann die Einladung direkt per E-Mail versendet werden.
                </p>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Rolle
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(USER_ROLES).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`p-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        role === r
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-muted-foreground bg-card'
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {role === 'admin' && 'Voller Zugriff auf alle Vereinsfunktionen'}
                  {role === 'coach' && 'Kann Events erstellen und Anwesenheit verwalten'}
                  {role === 'player' && 'Kann Events einsehen und Zu-/Absagen'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full h-11" disabled={isLoading || !fullName}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Einladungslink erstellen
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
