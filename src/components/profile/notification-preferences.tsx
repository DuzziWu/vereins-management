"use client"

import * as React from "react"
import { Bell, Check, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  NOTIFICATION_CATEGORIES,
  NotificationCategory,
  NotificationPreference,
} from "@/lib/validations/profile"
import { updateNotificationPreference } from "@/lib/actions/notification-preferences"

interface NotificationPreferencesProps {
  initialPreferences: NotificationPreference[]
}

export function NotificationPreferences({ initialPreferences }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = React.useState<NotificationPreference[]>(initialPreferences)
  const [savingStates, setSavingStates] = React.useState<Record<string, boolean>>({})
  const [savedStates, setSavedStates] = React.useState<Record<string, boolean>>({})
  const [pushPermission, setPushPermission] = React.useState<NotificationPermission | null>(null)
  const debounceTimers = React.useRef<Record<string, NodeJS.Timeout>>({})

  // Check push notification permission on mount
  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission)
    }
  }, [])

  const getPreferenceValue = (
    category: NotificationCategory,
    type: "email" | "push"
  ): boolean => {
    const pref = preferences.find((p) => p.category === category)
    if (!pref) return type === "email" // Default: email enabled, push disabled
    return type === "email" ? pref.email_enabled : pref.push_enabled
  }

  const handleToggle = async (
    category: NotificationCategory,
    type: "email" | "push",
    enabled: boolean
  ) => {
    const key = `${category}-${type}`

    // Optimistically update UI
    setPreferences((prev) =>
      prev.map((p) =>
        p.category === category
          ? {
              ...p,
              [type === "email" ? "email_enabled" : "push_enabled"]: enabled,
            }
          : p
      )
    )

    // Clear existing debounce timer
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key])
    }

    // Set saving state
    setSavingStates((prev) => ({ ...prev, [key]: true }))
    setSavedStates((prev) => ({ ...prev, [key]: false }))

    // Debounce the save
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        const result = await updateNotificationPreference(category, type, enabled)
        if (result.success) {
          setSavedStates((prev) => ({ ...prev, [key]: true }))
          // Clear saved indicator after 2 seconds
          setTimeout(() => {
            setSavedStates((prev) => ({ ...prev, [key]: false }))
          }, 2000)
        } else {
          toast.error(result.error || "Fehler beim Speichern")
          // Revert on error
          setPreferences((prev) =>
            prev.map((p) =>
              p.category === category
                ? {
                    ...p,
                    [type === "email" ? "email_enabled" : "push_enabled"]: !enabled,
                  }
                : p
            )
          )
        }
      } catch {
        toast.error("Ein unerwarteter Fehler ist aufgetreten")
        // Revert on error
        setPreferences((prev) =>
          prev.map((p) =>
            p.category === category
              ? {
                  ...p,
                  [type === "email" ? "email_enabled" : "push_enabled"]: !enabled,
                }
              : p
          )
        )
      } finally {
        setSavingStates((prev) => ({ ...prev, [key]: false }))
      }
    }, 500)
  }

  const requestPushPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission === "granted") {
        toast.success("Push-Benachrichtigungen aktiviert")
      } else if (permission === "denied") {
        toast.error("Push-Benachrichtigungen wurden blockiert")
      }
    }
  }

  const renderSaveIndicator = (key: string) => {
    if (savingStates[key]) {
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
    }
    if (savedStates[key]) {
      return <Check className="h-3 w-3 text-green-500" />
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Benachrichtigungs-Einstellungen
        </CardTitle>
        <CardDescription>
          Wähle aus, welche Benachrichtigungen du erhalten möchtest
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* E-Mail Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">E-Mail-Benachrichtigungen</h3>
          <div className="space-y-3">
            {NOTIFICATION_CATEGORIES.map((category) => {
              const key = `${category.id}-email`
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={key} className="text-sm font-medium">
                      {category.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSaveIndicator(key)}
                    <Switch
                      id={key}
                      checked={getPreferenceValue(category.id, "email")}
                      onCheckedChange={(checked) =>
                        handleToggle(category.id, "email", checked)
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Push-Benachrichtigungen</h3>

          {/* Push Permission Alert */}
          {pushPermission === "denied" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Push-Benachrichtigungen wurden im Browser blockiert.
                Bitte aktiviere sie in deinen Browser-Einstellungen.
              </AlertDescription>
            </Alert>
          )}

          {pushPermission === "default" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Browser-Berechtigung für Push-Benachrichtigungen erforderlich.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPushPermission}
                  className="ml-2"
                >
                  Berechtigung erteilen
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {NOTIFICATION_CATEGORIES.map((category) => {
              const key = `${category.id}-push`
              const isDisabled = pushPermission !== "granted"
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isDisabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={key} className="text-sm font-medium">
                      {category.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSaveIndicator(key)}
                    <Switch
                      id={key}
                      checked={getPreferenceValue(category.id, "push")}
                      onCheckedChange={(checked) =>
                        handleToggle(category.id, "push", checked)
                      }
                      disabled={isDisabled}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {pushPermission === "granted" && (
            <p className="text-xs text-muted-foreground">
              Push-Benachrichtigungen werden in einem zukünftigen Update
              vollständig aktiviert.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
