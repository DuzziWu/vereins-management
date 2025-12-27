'use client'

import { useState } from 'react'
import {
  Check,
  Package,
  Trophy,
  Brain,
  TrendingUp,
  MessageSquare,
  FileText,
  BarChart3,
  Heart,
  Users,
  Handshake,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toggleModule } from '@/actions/modules'

const iconMap = {
  Trophy,
  Brain,
  Package,
  TrendingUp,
  MessageSquare,
  FileText,
  BarChart3,
  Heart,
  Users,
  Handshake,
}

export function ModulesClient({ modules }) {
  const [moduleStates, setModuleStates] = useState(
    modules.reduce((acc, module) => ({ ...acc, [module.id]: module.isActive }), {})
  )
  const [loadingStates, setLoadingStates] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('Alle')

  const categories = ['Alle', ...new Set(modules.map((m) => m.category).filter(Boolean))]

  const filteredModules = selectedCategory === 'Alle'
    ? modules
    : modules.filter((m) => m.category === selectedCategory)

  const activeCount = Object.values(moduleStates).filter(Boolean).length

  async function handleToggle(moduleId) {
    const currentState = moduleStates[moduleId]
    setLoadingStates(prev => ({ ...prev, [moduleId]: true }))

    const formData = new FormData()
    formData.set('moduleId', moduleId)
    formData.set('isActive', String(currentState))

    const result = await toggleModule(formData)

    if (!result.error) {
      setModuleStates(prev => ({ ...prev, [moduleId]: !currentState }))
    }

    setLoadingStates(prev => ({ ...prev, [moduleId]: false }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Modul-Shop</h1>
          <p className="text-muted-foreground">Erweitere deine Vereinsplattform mit zusätzlichen Funktionen</p>
        </div>

        <Card className="bg-card border-2 border-primary">
          <CardContent className="py-4 px-6">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground tabular-nums">{activeCount}</div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Aktive Module</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory !== category ? 'bg-transparent' : ''}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const Icon = iconMap[module.icon] || Package
          const isActive = moduleStates[module.id]
          const isLoading = loadingStates[module.id]

          return (
            <Card
              key={module.id}
              className={`bg-card border-2 transition-all ${
                isActive ? 'border-primary' : 'border-border hover:border-muted-foreground'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg ${isActive ? 'bg-primary' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {module.category}
                    </Badge>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggle(module.id)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <CardTitle className="text-lg mt-3">{module.name}</CardTitle>
                <CardDescription className="text-sm">{module.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                {module.features && module.features.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Funktionen</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {module.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          <span className="text-xs text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-green-500">Kostenlos</span>

                  {isActive ? (
                    <Badge className="bg-primary text-primary-foreground">
                      <Check className="h-3 w-3 mr-1" />
                      Aktiviert
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Deaktiviert
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Keine Module in dieser Kategorie gefunden.
        </div>
      )}
    </div>
  )
}
