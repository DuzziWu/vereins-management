'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createEvent } from '@/actions/events'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export default function NewEventPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [eventType, setEventType] = useState('training')
  const [teams, setTeams] = useState([])
  const [locations, setLocations] = useState([])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const [teamsRes, locationsRes] = await Promise.all([
        supabase.from('teams').select('id, name').order('name'),
        supabase.from('locations').select('id, name').order('name'),
      ])

      setTeams(teamsRes.data || [])
      setLocations(locationsRes.data || [])
    }

    fetchData()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.target)
    formData.set('type', eventType)

    try {
      const result = await createEvent(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
      // Redirect happens in the action on success
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
      setIsLoading(false)
    }
  }

  // Default start time: tomorrow at current hour, rounded to nearest 30 min
  const getDefaultStartTime = () => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    date.setMinutes(Math.round(date.getMinutes() / 30) * 30)
    date.setSeconds(0)
    return date.toISOString().slice(0, 16)
  }

  const getDefaultEndTime = (startTime) => {
    const date = new Date(startTime || getDefaultStartTime())
    date.setHours(date.getHours() + 2)
    return date.toISOString().slice(0, 16)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/coach/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-display font-bold">Neuer Termin</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Termindetails</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Type */}
            <div className="space-y-2">
              <Label>Art des Termins</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(EVENT_TYPES).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEventType(type)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      eventType === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {EVENT_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Title (optional) */}
            <div className="space-y-2">
              <Label htmlFor="title">Titel (optional)</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="z.B. Trainingslager, Derby gegen..."
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Beginn</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="datetime-local"
                  defaultValue={getDefaultStartTime()}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Ende</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="datetime-local"
                  defaultValue={getDefaultEndTime()}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="locationId">Ort</Label>
              <select
                id="locationId"
                name="locationId"
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Keinen Ort auswählen</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team */}
            <div className="space-y-2">
              <Label htmlFor="teamId">Team</Label>
              <select
                id="teamId"
                name="teamId"
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Alle Spieler</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Weitere Details zum Termin..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Termin erstellen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
