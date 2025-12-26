import { Package, Lock, Check, Sparkles } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModuleToggle } from './module-toggle'

export const metadata = {
  title: 'Module | Vereins-Master',
}

export default async function ModulesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  // Get all modules
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('name')

  // Get club's active modules
  const { data: clubModules } = await supabase
    .from('club_modules')
    .select('module_id, is_active, activated_at')
    .eq('club_id', profile.club_id)

  // Combine data
  const modulesWithStatus = modules?.map(module => {
    const clubModule = clubModules?.find(cm => cm.module_id === module.id)
    return {
      ...module,
      isActive: clubModule?.is_active || false,
      activatedAt: clubModule?.activated_at || null,
    }
  }) || []

  const activeCount = modulesWithStatus.filter(m => m.isActive).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Modul-Shop</h1>
        <p className="text-muted-foreground">
          {activeCount} von {modulesWithStatus.length} Modulen aktiviert
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modulesWithStatus.map((module) => (
          <Card
            key={module.id}
            className={module.isActive ? 'border-primary/50' : ''}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${module.isActive ? 'bg-primary/20' : 'bg-secondary'}`}>
                    <Package className={`h-5 w-5 ${module.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{module.name}</CardTitle>
                    {module.is_premium && (
                      <Badge variant="secondary" className="mt-1">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                {module.isActive && (
                  <Badge variant="success">
                    <Check className="mr-1 h-3 w-3" />
                    Aktiv
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{module.description}</CardDescription>

              {module.is_premium ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Premium-Modul (demnächst verfügbar)</span>
                </div>
              ) : (
                <ModuleToggle
                  moduleId={module.id}
                  isActive={module.isActive}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
