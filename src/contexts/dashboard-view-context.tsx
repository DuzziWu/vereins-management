"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { UserRole, Profile } from "@/lib/database.types"

// Rollen-Hierarchie: vorstand > trainer > mitglied
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  vorstand: ["vorstand", "trainer", "mitglied"],
  trainer: ["trainer", "mitglied"],
  mitglied: ["mitglied"],
}

// Rollen-Labels für die UI
export const ROLE_LABELS: Record<UserRole, string> = {
  vorstand: "Vorstand",
  trainer: "Trainer",
  mitglied: "Mitglied",
}

// localStorage Key
const STORAGE_KEY = "dashboard-active-view"

interface DashboardViewContextValue {
  // User-Profil Daten
  profile: Profile | null
  setProfile: (profile: Profile | null) => void

  // User E-Mail (aus Supabase Auth)
  email: string | null
  setEmail: (email: string | null) => void

  // Aktuelle Dashboard-Ansicht
  activeView: UserRole
  setActiveView: (view: UserRole) => void

  // Verfügbare Ansichten basierend auf User-Rolle
  availableViews: UserRole[]

  // Hat der User mehrere Ansichten?
  hasMultipleViews: boolean

  // Loading State
  isLoading: boolean
}

const DashboardViewContext = createContext<DashboardViewContextValue | null>(null)

interface DashboardViewProviderProps {
  children: ReactNode
  initialProfile?: Profile | null
  initialEmail?: string | null
}

export function DashboardViewProvider({
  children,
  initialProfile = null,
  initialEmail = null,
}: DashboardViewProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [email, setEmail] = useState<string | null>(initialEmail)
  const [activeView, setActiveViewState] = useState<UserRole>("mitglied")
  const [isLoading, setIsLoading] = useState(true)

  // Berechne verfügbare Ansichten basierend auf User-Rolle
  const availableViews: UserRole[] = profile
    ? ROLE_HIERARCHY[profile.role as UserRole] || ["mitglied"]
    : ["mitglied"]

  const hasMultipleViews = availableViews.length > 1

  // Initialisiere aktive Ansicht aus localStorage oder Profil
  useEffect(() => {
    if (profile) {
      const storedView = localStorage.getItem(STORAGE_KEY) as UserRole | null
      const userRole = profile.role as UserRole

      // Wenn gespeicherte Ansicht existiert und verfügbar ist, nutze sie
      if (storedView && availableViews.includes(storedView)) {
        setActiveViewState(storedView)
      } else {
        // Sonst nutze die höchste verfügbare Rolle
        setActiveViewState(userRole)
      }
      setIsLoading(false)
    }
  }, [profile, availableViews])

  // Setze aktive Ansicht und speichere in localStorage
  const setActiveView = useCallback(
    (view: UserRole) => {
      if (availableViews.includes(view)) {
        setActiveViewState(view)
        localStorage.setItem(STORAGE_KEY, view)
      }
    },
    [availableViews]
  )

  return (
    <DashboardViewContext.Provider
      value={{
        profile,
        setProfile,
        email,
        setEmail,
        activeView,
        setActiveView,
        availableViews,
        hasMultipleViews,
        isLoading,
      }}
    >
      {children}
    </DashboardViewContext.Provider>
  )
}

export function useDashboardView() {
  const context = useContext(DashboardViewContext)
  if (!context) {
    throw new Error(
      "useDashboardView must be used within a DashboardViewProvider"
    )
  }
  return context
}
