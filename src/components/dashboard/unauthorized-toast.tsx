"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function UnauthorizedToast() {
  const router = useRouter()

  React.useEffect(() => {
    toast.error("Zugriff verweigert", {
      description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
    })

    // URL-Parameter entfernen, ohne die Seite neu zu laden
    router.replace("/dashboard")
  }, [router])

  return null
}
