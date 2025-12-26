'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MoveRight, Loader2, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AuthHeader } from '@/components/auth-header'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.target)
    const email = formData.get('email')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 speed-lines opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <AuthHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-muted-foreground hover:text-foreground transition-colors group uppercase"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Zurück
          </Link>

          {/* Hero Text */}
          <div className="space-y-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/30 glow-primary">
                {success ? (
                  <CheckCircle className="w-10 h-10 text-primary" />
                ) : (
                  <Mail className="w-10 h-10 text-primary" />
                )}
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-balance uppercase leading-none">
              {success ? 'Check' : 'Reset'}
              <br />
              {success ? 'Email' : 'Password'}
            </h1>
            <p className="text-base text-muted-foreground tracking-wide px-4 font-medium">
              {success
                ? 'Wir haben dir einen Link gesendet!'
                : 'Kein Problem. Wir senden dir einen Link.'}
            </p>
          </div>

          {/* Reset Card */}
          <Card className="p-8 space-y-6 bg-card/80 backdrop-blur-sm border-border border-2 diagonal-cut relative overflow-hidden">
            {/* Corner glow */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 blur-2xl" />

            {success ? (
              <div className="space-y-6 relative z-10">
                <div className="p-5 rounded-xl bg-primary/5 border-2 border-primary/20 backdrop-blur-sm">
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    <span className="font-black text-primary uppercase tracking-wide">Geschafft!</span>{' '}
                    Überprüfe dein E-Mail-Postfach und klicke auf den Link, um dein Passwort zurückzusetzen.
                  </p>
                </div>

                <Button
                  asChild
                  className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black tracking-[0.15em] uppercase text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 group"
                >
                  <Link href="/login">
                    Zurück zum Login
                    <MoveRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
                    E-Mail-Adresse
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
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Gib die E-Mail-Adresse ein, die mit deinem Konto verknüpft ist.
                  </p>
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
                  className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black tracking-[0.15em] uppercase text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 group"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Link senden
                      <MoveRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Info Box */}
            {!success && (
              <div className="p-5 rounded-xl bg-primary/5 border-2 border-primary/20 backdrop-blur-sm">
                <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                  <span className="font-black text-primary uppercase tracking-wide">Tipp:</span> Überprüfe auch deinen
                  Spam-Ordner, falls die E-Mail nicht ankommt.
                </p>
              </div>
            )}
          </Card>

          {/* Additional Help */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border border-2">
            <div className="text-center space-y-3">
              <p className="text-sm font-bold text-foreground uppercase tracking-wide">Immer noch Probleme?</p>
              <p className="text-xs text-muted-foreground font-medium">
                Kontaktiere unseren Support unter{' '}
                <a
                  href="mailto:support@vereinsplattform.de"
                  className="text-primary hover:text-primary/80 font-bold underline"
                >
                  support@vereinsplattform.de
                </a>
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
