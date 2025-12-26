'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { toggleModule } from '@/actions/modules'

export function ModuleToggle({ moduleId, isActive }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleToggle() {
    setIsLoading(true)
    const formData = new FormData()
    formData.set('moduleId', moduleId)
    formData.set('isActive', String(isActive))
    await toggleModule(formData)
    setIsLoading(false)
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isActive ? 'outline' : 'default'}
      className="w-full"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isActive ? 'Deaktivieren' : 'Aktivieren'}
    </Button>
  )
}
