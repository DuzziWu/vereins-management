'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { createInvite } from '@/actions/members'
import { USER_ROLES, ROLE_LABELS } from '@/lib/constants'

export default function InviteMemberPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('player')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setInviteUrl('')

    const formData = new FormData()
    if (email) formData.set('email', email)
    formData.set('role', role)

    const result = await createInvite(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setInviteUrl(result.inviteUrl)
    }

    setIsLoading(false)
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/members">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-display font-bold">Mitglied einladen</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Einladungslink erstellen</CardTitle>
          <CardDescription>
            Erstelle einen Einladungslink, den du per E-Mail oder Messenger teilen kannst.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteUrl ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-success font-medium mb-2">
                  Einladungslink erstellt!
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Teile diesen Link mit dem neuen Mitglied:
                </p>
                <div className="flex gap-2">
                  <Input
                    value={inviteUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button onClick={copyToClipboard} variant="outline">
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setInviteUrl('')
                  setEmail('')
                }}
              >
                Weitere Einladung erstellen
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="neues.mitglied@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leer lassen für einen allgemeinen Einladungslink
                </p>
              </div>

              <div className="space-y-2">
                <Label>Rolle</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(USER_ROLES).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        role === r
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
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
