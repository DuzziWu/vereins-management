'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoveRight, Loader2 } from 'lucide-react'

import { signIn } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AuthHeader } from '@/components/auth-header'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.target)

    try {
      const result = await signIn(formData)
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
    <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 speed-lines opacity-30" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <AuthHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Hero Text with volt stripe */}
          <div className="space-y-3 text-center volt-stripe pl-6">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-balance uppercase leading-none">
              Welcome
              <br />
              Back
            </h1>
            <p className="text-lg text-muted-foreground tracking-wider font-medium">
              Bereit für dein nächstes Training?
            </p>
          </div>

          {/* Login Card with diagonal cut */}
          <Card className="p-8 space-y-6 bg-card/80 backdrop-blur-sm border-border border-2 diagonal-cut relative overflow-hidden">
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 blur-xl" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
                  E-Mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="deine@email.com"
                  className="h-14 bg-input/50 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
                  >
                    Passwort
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide"
                  >
                    Vergessen?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-14 bg-input/50 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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

              {/* Submit Button with icon */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black tracking-[0.15em] uppercase text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 group"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Anmelden
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
                <span className="bg-card px-4 text-muted-foreground font-black tracking-[0.2em]">Oder</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground font-medium">Noch kein Konto?</p>
              <Button
                variant="outline"
                asChild
                className="w-full h-14 border-2 border-primary/40 text-foreground hover:bg-primary/10 hover:border-primary font-black tracking-[0.15em] uppercase text-sm transition-all bg-transparent"
              >
                <Link href="/register">Jetzt registrieren</Link>
              </Button>
            </div>
          </Card>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground tracking-wide px-8 leading-relaxed">
            Mit der Anmeldung stimmst du unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.
          </p>
        </div>
      </main>
    </div>
  )
}
