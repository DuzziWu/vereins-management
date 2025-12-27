'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 speed-lines opacity-20" />
      <div className="absolute top-40 left-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="text-center space-y-8 max-w-md">
          {/* 404 Number */}
          <div className="relative">
            <h1 className="text-[12rem] font-bold text-primary/10 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-foreground">Oops!</span>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              Seite nicht gefunden
            </h2>
            <p className="text-muted-foreground">
              Die angeforderte Seite existiert nicht oder wurde verschoben.
              Vielleicht hilft dir einer der folgenden Links weiter.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" className="gap-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
            <Button asChild className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Zur Startseite
              </Link>
            </Button>
          </div>

          {/* Session Issues */}
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm text-muted-foreground">
              Falls du einen Einladungslink verwendet hast, ist dieser möglicherweise
              abgelaufen oder wurde bereits genutzt.
            </p>
            <p className="text-sm text-muted-foreground">
              Probleme mit der Anmeldung?
            </p>
            <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
              <Link href="/api/auth/logout">
                <LogOut className="h-4 w-4" />
                Abmelden und neu anmelden
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
