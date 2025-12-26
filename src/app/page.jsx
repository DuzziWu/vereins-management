import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
          <span className="text-primary">Vereins</span>-Master
        </h1>

        <p className="text-xl text-muted-foreground">
          Moderne Vereinsverwaltung für Sportvereine.
          Einfach. Digital. Gemeinsam.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="touch-target inline-flex items-center justify-center px-8 py-3 text-lg font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Anmelden
          </Link>
          <Link
            href="/register"
            className="touch-target inline-flex items-center justify-center px-8 py-3 text-lg font-semibold rounded-lg border border-border hover:bg-card transition-colors"
          >
            Verein registrieren
          </Link>
        </div>
      </div>
    </main>
  )
}
