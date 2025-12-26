'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MoveRight, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AuthHeader } from '@/components/auth-header'

function RegisterForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.target)

    // Combine first and last name
    const firstName = formData.get('firstName')
    const lastName = formData.get('lastName')
    formData.set('fullName', `${firstName} ${lastName}`)

    // Check password confirmation
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setIsLoading(false)
      return
    }

    // Add invite token if present
    if (inviteToken) {
      formData.set('inviteToken', inviteToken)
    }

    try {
      const result = await signUp(formData)
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
          Vereinsarbeit
          <br />
          <span className="text-primary">Digitalisiert</span>
        </h1>
        <p className="text-base text-muted-foreground tracking-wide">
          Erstelle dein Benutzerkonto und starte durch
        </p>
      </div>

      {/* Register Card */}
      <Card className="p-8 space-y-6 bg-card/80 backdrop-blur-sm border-border border-2 diagonal-cut relative overflow-hidden">
        {/* Corner accent */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-primary/10 blur-xl" />

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-xs font-semibold tracking-wider uppercase text-muted-foreground"
              >
                Vorname
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Max"
                className="h-12 bg-input/50 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-xs font-semibold tracking-wider uppercase text-muted-foreground"
              >
                Nachname
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Mustermann"
                className="h-12 bg-input/50 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              E-Mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
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
                Konto erstellen
                <MoveRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-4 text-muted-foreground font-semibold tracking-wider">Oder</span>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Bereits ein Konto?</p>
          <Button
            variant="outline"
            asChild
            className="w-full h-12 border-2 border-primary/40 text-foreground hover:bg-primary/10 hover:border-primary font-semibold tracking-wider uppercase text-sm transition-all bg-transparent"
          >
            <Link href="/login">Anmelden</Link>
          </Button>
        </div>
      </Card>

      {/* Footer Note */}
      <p className="text-center text-xs text-muted-foreground tracking-wide px-8 leading-relaxed">
        Mit der Registrierung stimmst du unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 speed-lines opacity-30" />
      <div className="absolute top-40 left-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <AuthHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <Suspense fallback={
          <div className="w-full max-w-md flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  )
}
