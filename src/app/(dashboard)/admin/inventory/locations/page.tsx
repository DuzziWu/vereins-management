"use client"

import * as React from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Plus, MapPin, Package, Filter, LayoutGrid, QrCode, Printer } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LocationTree } from "@/components/inventory/location-tree"
import { LocationForm } from "@/components/inventory/location-form"
import { LocationSelect } from "@/components/inventory/location-select"
import { StatusBadge } from "@/components/inventory/status-badge"
import {
  InventoryLocation,
  InventoryItem,
  LocationFormData,
} from "@/lib/validations/inventory"

// Dynamic import for QR code display (not SSR compatible due to qrcode lib)
const QRCodeDisplay = dynamic(
  () => import("@/components/inventory/qr-code-display").then(mod => mod.QRCodeDisplay),
  { ssr: false }
)

interface LocationWithChildren extends InventoryLocation {
  children: LocationWithChildren[]
}

function buildLocationTree(locations: InventoryLocation[]): LocationWithChildren[] {
  const map = new Map<string, LocationWithChildren>()
  const roots: LocationWithChildren[] = []

  // First pass: create map of all locations
  for (const loc of locations) {
    map.set(loc.id, { ...loc, children: [] })
  }

  // Second pass: build tree structure
  for (const loc of locations) {
    const node = map.get(loc.id)!
    if (loc.parent_id && map.has(loc.parent_id)) {
      map.get(loc.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export default function LocationsPage() {
  const [locations, setLocations] = React.useState<InventoryLocation[]>([])
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isVorstand, setIsVorstand] = React.useState(false)

  // Tree state
  const [selectedLocationId, setSelectedLocationId] = React.useState<string | null>(null)
  const [expandedLocationIds, setExpandedLocationIds] = React.useState<Set<string>>(new Set())

  // Dialog states
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingLocation, setEditingLocation] = React.useState<InventoryLocation | null>(null)
  const [parentIdForNew, setParentIdForNew] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [locationToDelete, setLocationToDelete] = React.useState<InventoryLocation | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = React.useState(false)
  const [qrLocation, setQrLocation] = React.useState<InventoryLocation | null>(null)

  // Fetch data
  const fetchLocations = React.useCallback(async () => {
    try {
      const response = await fetch("/api/inventory/locations")
      if (!response.ok) throw new Error("Failed to fetch locations")
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      console.error("Error fetching locations:", error)
      toast.error("Fehler beim Laden der Lagerorte")
    }
  }, [])

  const fetchItemsForLocation = React.useCallback(async (locationId: string | null) => {
    try {
      const params = new URLSearchParams()
      if (locationId) {
        params.set("location_id", locationId)
      }
      params.set("limit", "100")

      const response = await fetch(`/api/inventory/items?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch items")
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }, [])

  const checkVorstand = React.useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setIsVorstand(data.user?.is_vorstand || false)
      }
    } catch (error) {
      console.error("Error checking vorstand:", error)
    }
  }, [])

  React.useEffect(() => {
    async function init() {
      setIsLoading(true)
      await Promise.all([fetchLocations(), checkVorstand()])
      setIsLoading(false)
    }
    init()
  }, [fetchLocations, checkVorstand])

  React.useEffect(() => {
    fetchItemsForLocation(selectedLocationId)
  }, [selectedLocationId, fetchItemsForLocation])

  // Tree as LocationWithChildren[]
  const locationTree = React.useMemo(() => buildLocationTree(locations), [locations])

  // Selected location details
  const selectedLocation = React.useMemo(() => {
    if (!selectedLocationId) return null
    return locations.find((l) => l.id === selectedLocationId) || null
  }, [selectedLocationId, locations])

  // Handlers
  function handleLocationExpand(id: string) {
    setExpandedLocationIds((prev) => new Set([...prev, id]))
  }

  function handleLocationCollapse(id: string) {
    setExpandedLocationIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleNewLocation(parentId: string | null) {
    setEditingLocation(null)
    setParentIdForNew(parentId)
    setFormOpen(true)
  }

  function handleEditLocation(locationId: string) {
    const loc = locations.find((l) => l.id === locationId)
    if (loc) {
      setEditingLocation(loc)
      setParentIdForNew(null)
      setFormOpen(true)
    }
  }

  function handleDeleteLocation(locationId: string) {
    const loc = locations.find((l) => l.id === locationId)
    if (loc) {
      setLocationToDelete(loc)
      setDeleteDialogOpen(true)
    }
  }

  function handleQRCode(locationId: string) {
    const loc = locations.find((l) => l.id === locationId)
    if (loc) {
      setQrLocation(loc)
      setQrDialogOpen(true)
    }
  }

  async function handleFormSubmit(data: LocationFormData) {
    try {
      if (editingLocation) {
        // Update
        const response = await fetch(`/api/inventory/locations/${editingLocation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Aktualisieren")
        }
        toast.success("Lagerort aktualisiert")
      } else {
        // Create
        const response = await fetch("/api/inventory/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Erstellen")
        }
        toast.success("Lagerort erstellt")
      }
      await fetchLocations()
    } catch (error) {
      console.error("Error saving location:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
      throw error
    }
  }

  async function handleConfirmDelete() {
    if (!locationToDelete) return

    try {
      const response = await fetch(`/api/inventory/locations/${locationToDelete.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }
      toast.success("Lagerort gelöscht")
      await fetchLocations()
      if (selectedLocationId === locationToDelete.id) {
        setSelectedLocationId(null)
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
    } finally {
      setDeleteDialogOpen(false)
      setLocationToDelete(null)
    }
  }

  // Get breadcrumb path for selected location
  const breadcrumbPath = React.useMemo(() => {
    if (!selectedLocation) return []
    const path: InventoryLocation[] = []
    let current: InventoryLocation | undefined = selectedLocation

    while (current) {
      path.unshift(current)
      current = locations.find((l) => l.id === current?.parent_id)
    }

    return path
  }, [selectedLocation, locations])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Lagerorte</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Lagerorte für Ihr Inventar.
          </p>
        </div>
        {isVorstand && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/inventory/scanner">
                <QrCode className="mr-2 h-4 w-4" />
                Scanner
              </Link>
            </Button>
            <Button onClick={() => handleNewLocation(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Lagerort
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items" asChild>
            <Link href="/admin/inventory" className="gap-2">
              <Package className="h-4 w-4" />
              Items
            </Link>
          </TabsTrigger>
          <TabsTrigger value="categories" asChild>
            <Link href="/admin/inventory/categories" className="gap-2">
              <Filter className="h-4 w-4" />
              Kategorien
            </Link>
          </TabsTrigger>
          <TabsTrigger value="sets" asChild>
            <Link href="/admin/inventory/sets" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Sets
            </Link>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            Lagerorte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            {/* Sidebar - Location Tree */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Lagerorte</CardTitle>
                <CardDescription>{locations.length} Lagerorte</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <LocationTree
                  locations={locationTree}
                  selectedLocationId={selectedLocationId}
                  expandedLocationIds={expandedLocationIds}
                  isVorstand={isVorstand}
                  isLoading={isLoading}
                  onLocationSelect={setSelectedLocationId}
                  onLocationExpand={handleLocationExpand}
                  onLocationCollapse={handleLocationCollapse}
                  onLocationEdit={handleEditLocation}
                  onLocationDelete={handleDeleteLocation}
                  onLocationQRCode={handleQRCode}
                  onNewSubLocation={handleNewLocation}
                />
              </CardContent>
            </Card>

            {/* Main Content - Selected Location Details */}
            <Card>
              <CardHeader>
                {selectedLocation ? (
                  <>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <button
                        className="hover:underline"
                        onClick={() => setSelectedLocationId(null)}
                      >
                        Alle
                      </button>
                      {breadcrumbPath.map((loc, i) => (
                        <React.Fragment key={loc.id}>
                          <span>/</span>
                          <button
                            className="hover:underline"
                            onClick={() => setSelectedLocationId(loc.id)}
                          >
                            {loc.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          {selectedLocation.name}
                        </CardTitle>
                        {selectedLocation.description && (
                          <CardDescription>{selectedLocation.description}</CardDescription>
                        )}
                      </div>
                      {isVorstand && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQRCode(selectedLocation.id)}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            QR-Code
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                    <CardTitle>Alle Items</CardTitle>
                    <CardDescription>
                      Wählen Sie einen Lagerort aus der Liste
                    </CardDescription>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {/* Items at this location */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Items {selectedLocation ? `an diesem Lagerort` : "ohne Lagerort"}
                    </h3>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Keine Items an diesem Lagerort</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Inventarnr.</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Link
                                href={`/admin/inventory/${item.id}`}
                                className="font-medium hover:underline"
                              >
                                {item.name}
                              </Link>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.inventory_number || "-"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={item.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Location Form Dialog */}
      <LocationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        location={editingLocation}
        parentId={parentIdForNew}
        locations={locations}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lagerort löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Lagerort &quot;{locationToDelete?.name}&quot; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      {qrLocation && (
        <QRCodeDisplay
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          type="location"
          id={qrLocation.id}
          name={qrLocation.name}
        />
      )}
    </div>
  )
}
