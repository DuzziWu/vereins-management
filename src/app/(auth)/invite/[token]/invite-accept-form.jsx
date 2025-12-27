'use client'

import { useState } from 'react'
import { MoveRight, Loader2, Shield, Users, User } from 'lucide-react'

import { acceptInvite } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const roleIcons = {
  admin: Shield,
  coach: Users,
  player: User,
}

export function InviteAcceptForm({ invite }) {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const RoleIcon = roleIcons[invite.role] || User

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.target)

    // Check password confirmation
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setIsLoading(false)
      return
    }

    // Add invite token
    formData.set('inviteToken', invite.token)

    try {
      const result = await acceptInvite(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Hero Text */}
      <div className="space-y-3 text-center volt-stripe pl-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance leading-tight">
          Willkommen bei
          <br />
          <span className="text-primary">{invite.clubName}</span>
        </h1>
        <p className="text-base text-muted-foreground tracking-wide">
          Du wurdest eingeladen, dem Verein beizutreten
        </p>
      </div>

      {/* Invite Info Card */}
      <Card className="p-6 space-y-4 bg-primary/5 border-primary/20 border-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Eingeladen als</p>
            <p className="text-lg font-semibold text-foreground">{invite.fullName}</p>
          </div>
          <Badge className="bg-primary text-primary-foreground flex items-center gap-1.5 px-3 py-1.5">
            <RoleIcon className="h-4 w-4" />
            {invite.roleLabel}
          </Badge>
        </div>
      </Card>

      {/* Registration Form */}
      <Card className="p-8 space-y-6 bg-card/80 backdrop-blur-sm border-border border-2 diagonal-cut relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-primary/10 blur-xl" />

        <div className="relative z-10">
          <h2 className="text-xl font-semibold text-foreground mb-1">Konto erstellen</h2>
          <p className="text-sm text-muted-foreground">
            Erstelle dein Benutzerkonto, um die Einladung anzunehmen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Name Field (pre-filled, editable) */}
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-xs font-semibold tracking-wider uppercase text-muted-foreground"
            >
              Vollständiger Name
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              defaultValue={invite.fullName || ''}
              placeholder="Max Mustermann"
              className="h-12 bg-input/50 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* Email Field (pre-filled if available) */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-semibold tracking-wider uppercase text-muted-foreground"
            >
              E-Mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={invite.email || ''}
              placeholder="deine@email.com"
              className="h-12 bg-input/50 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Fields */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-semibold tracking-wider uppercase text-muted-foreground"
            >
              Passwort
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              minLength={6}
              className="h-12 bg-input/50 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-semibold tracking-wider uppercase text-muted-foreground"
            >
              Passwort bestätigen
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              minLength={6}
              className="h-12 bg-input/50 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wider uppercase text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 group"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <>
                Einladung annehmen
                <MoveRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Footer Note */}
      <p className="text-center text-xs text-muted-foreground tracking-wide px-8 leading-relaxed">
        Mit der Registrierung stimmst du unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.
      </p>
    </div>
  )
}
