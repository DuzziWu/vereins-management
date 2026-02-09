"use client"

import { MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EventMapsLinkProps {
  address: string | null
  locationName?: string | null
  variant?: "button" | "link" | "icon"
  className?: string
}

export function EventMapsLink({
  address,
  locationName,
  variant = "button",
  className,
}: EventMapsLinkProps) {
  if (!address) return null

  // Generate Google Maps URL
  const query = encodeURIComponent(address)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`

  const handleClick = () => {
    window.open(mapsUrl, "_blank", "noopener,noreferrer")
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn("h-8 w-8", className)}
        title="In Google Maps öffnen"
      >
        <Navigation className="h-4 w-4" />
      </Button>
    )
  }

  if (variant === "link") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 text-sm text-primary hover:underline",
          className
        )}
      >
        <MapPin className="h-3.5 w-3.5" />
        <span>{locationName || address}</span>
      </button>
    )
  }

  // Default: button variant
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={className}
    >
      <Navigation className="h-4 w-4 mr-1.5" />
      Route planen
    </Button>
  )
}

// Helper component for inline address display with maps link
interface EventLocationDisplayProps {
  locationName: string | null
  address: string | null
  showMapsLink?: boolean
  className?: string
}

export function EventLocationDisplay({
  locationName,
  address,
  showMapsLink = true,
  className,
}: EventLocationDisplayProps) {
  if (!locationName && !address) return null

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {locationName && (
            <span className="text-sm font-medium">{locationName}</span>
          )}
          {address && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{address}</span>
              {showMapsLink && (
                <EventMapsLink address={address} variant="icon" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
