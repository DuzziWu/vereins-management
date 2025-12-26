import Link from 'next/link'
import { Activity } from 'lucide-react'

export function AuthHeader() {
  return (
    <header className="w-full py-6 px-6 border-b-2 border-border bg-card/50 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-3 group w-fit">
        <div className="relative p-2 bg-primary rounded-lg group-hover:bg-primary/80 transition-colors duration-300 action-glow">
          <Activity className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-foreground block leading-none">
            Vereinsplattform
          </span>
          <span className="text-xs tracking-wide text-muted-foreground uppercase mt-0.5 block">
            Digital Management
          </span>
        </div>
      </Link>
    </header>
  )
}
