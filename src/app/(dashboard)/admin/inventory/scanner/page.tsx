"use client"

import * as React from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  MapPin,
  Package,
  Barcode,
  ExternalLink,
  RefreshCw,
  Edit,
  HandCoins,
  Undo2,
  Layers,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/inventory/status-badge"
import { LoanDialog } from "@/components/inventory/loan-dialog"
import { ReturnDialog } from "@/components/inventory/return-dialog"
import type { BarcodeScanResult } from "@/components/inventory/barcode-scanner"
import type {
  InventoryItem,
  InventoryLocation,
  InventoryLoan,
  InventorySet,
} from "@/lib/validations/inventory"

// Dynamic import for barcode scanner (not SSR compatible)
const BarcodeScanner = dynamic(
  () => import("@/components/inventory/barcode-scanner").then(mod => mod.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="aspect-video w-full max-w-[300px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }
)

type ScanResult = {
  type: "item" | "location" | "set"
  data: InventoryItem | InventoryLocation | InventorySet
  loan?: InventoryLoan
} | null

export default function ScannerPage() {
  const router = useRouter()
  const [scanResult, setScanResult] = React.useState<ScanResult>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [locations, setLocations] = React.useState<InventoryLocation[]>([])
  const [loanDialogOpen, setLoanDialogOpen] = React.useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = React.useState(false)

  // Fetch locations for return dialog
  React.useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch("/api/inventory/locations")
        if (response.ok) {
          const data = await response.json()
          setLocations(data.locations || [])
        }
      } catch (error) {
        console.error("Error fetching locations:", error)
      }
    }
    fetchLocations()
  }, [])

  async function handleScan(barcodeData: BarcodeScanResult) {
    setIsLoading(true)
    setScanResult(null)

    try {
      if (barcodeData.type === "item") {
        // Search for item by inventory number
        const response = await fetch(
          `/api/inventory/items?search=${encodeURIComponent(barcodeData.code)}&limit=1`
        )
        if (!response.ok) throw new Error("Fehler beim Laden")

        const data = await response.json()
        if (!data.items || data.items.length === 0) {
          toast.error(`Item "${barcodeData.code}" nicht gefunden`)
          setIsLoading(false)
          return
        }

        const item: InventoryItem = data.items[0]

        // If item is loaned, fetch active loan
        let activeLoan: InventoryLoan | undefined
        if (item.status === "loaned") {
          const loansResponse = await fetch(
            `/api/inventory/items/${item.id}/loans?active=true`
          )
          if (loansResponse.ok) {
            const loansData = await loansResponse.json()
            activeLoan = loansData.loans?.[0]
          }
        }

        setScanResult({ type: "item", data: item, loan: activeLoan })
        toast.success("Item erkannt!")

      } else if (barcodeData.type === "location") {
        // Search for location by code/name
        const response = await fetch(
          `/api/inventory/locations?search=${encodeURIComponent(barcodeData.code)}`
        )
        if (!response.ok) throw new Error("Fehler beim Laden")

        const data = await response.json()
        // Find exact match or first result
        const location = data.locations?.find(
          (l: InventoryLocation) => l.name.toUpperCase() === barcodeData.code
        ) || data.locations?.[0]

        if (!location) {
          toast.error(`Lagerort "${barcodeData.code}" nicht gefunden`)
          setIsLoading(false)
          return
        }

        setScanResult({ type: "location", data: location })
        toast.success("Lagerort erkannt!")

      } else if (barcodeData.type === "set") {
        // Search for set by name
        const response = await fetch(
          `/api/inventory/sets?search=${encodeURIComponent(barcodeData.code)}`
        )
        if (!response.ok) throw new Error("Fehler beim Laden")

        const data = await response.json()
        if (!data.sets || data.sets.length === 0) {
          toast.error(`Set "${barcodeData.code}" nicht gefunden`)
          setIsLoading(false)
          return
        }

        setScanResult({ type: "set", data: data.sets[0] })
        toast.success("Set erkannt!")
      }
    } catch (error) {
      console.error("Error processing scan:", error)
      toast.error("Fehler beim Verarbeiten des Barcodes")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleManualSearch(query: string) {
    setIsLoading(true)
    setScanResult(null)

    try {
      // Search by inventory number
      const response = await fetch(
        `/api/inventory/items?search=${encodeURIComponent(query)}&limit=1`
      )
      if (!response.ok) throw new Error("Fehler bei der Suche")

      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const item = data.items[0]

        // If item is loaned, fetch active loan
        let activeLoan: InventoryLoan | undefined
        if (item.status === "loaned") {
          const loansResponse = await fetch(
            `/api/inventory/items/${item.id}/loans?active=true`
          )
          if (loansResponse.ok) {
            const loansData = await loansResponse.json()
            activeLoan = loansData.loans?.[0]
          }
        }

        setScanResult({ type: "item", data: item, loan: activeLoan })
        toast.success("Item gefunden!")
      } else {
        toast.error("Kein Item mit dieser Inventarnummer gefunden")
      }
    } catch (error) {
      console.error("Error searching:", error)
      toast.error("Fehler bei der Suche")
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setScanResult(null)
  }

  async function handleLoanSubmit(data: { borrower_id: string; expected_return_date?: string; loan_note?: string }) {
    if (!scanResult || scanResult.type !== "item") return

    try {
      const response = await fetch(`/api/inventory/items/${scanResult.data.id}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Verleihen")
      }

      toast.success("Item erfolgreich verliehen")
      setLoanDialogOpen(false)

      // Refresh scan result
      const item = scanResult.data as InventoryItem
      handleScan({ type: "item", code: item.inventory_number || item.id })
    } catch (error) {
      console.error("Error creating loan:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Verleihen")
      throw error
    }
  }

  async function handleReturnSubmit(data: { return_location_id?: string | null; return_note?: string; return_condition?: string }) {
    if (!scanResult || scanResult.type !== "item" || !scanResult.loan) return

    try {
      // Use PATCH on /api/inventory/items/[id]/loans - it finds active loan automatically
      const response = await fetch(
        `/api/inventory/items/${scanResult.data.id}/loans`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler bei der Rückgabe")
      }

      toast.success("Rückgabe erfasst")
      setReturnDialogOpen(false)

      // Refresh scan result
      const item = scanResult.data as InventoryItem
      handleScan({ type: "item", code: item.inventory_number || item.id })
    } catch (error) {
      console.error("Error recording return:", error)
      toast.error(error instanceof Error ? error.message : "Fehler bei der Rückgabe")
      throw error
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/inventory">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Barcode Scanner</h1>
          <p className="text-muted-foreground">
            Scannen Sie Barcodes von Items, Lagerorten oder Sets
          </p>
        </div>
      </div>

      {/* Scanner or Result */}
      {!scanResult ? (
        <BarcodeScanner
          onScan={handleScan}
          onManualSearch={handleManualSearch}
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      ) : scanResult.type === "item" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>{(scanResult.data as InventoryItem).name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span className="font-mono">
                    {(scanResult.data as InventoryItem).inventory_number || "Keine Inventarnr."}
                  </span>
                  <StatusBadge status={(scanResult.data as InventoryItem).status} />
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Kategorie:</span>
                <p className="font-medium">
                  {(scanResult.data as InventoryItem).category?.icon}{" "}
                  {(scanResult.data as InventoryItem).category?.name || "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Lagerort:</span>
                <p className="font-medium">
                  {(scanResult.data as InventoryItem).location?.name || "Kein Lagerort"}
                </p>
              </div>
            </div>

            {/* Loan Info */}
            {(scanResult.data as InventoryItem).status === "loaned" && scanResult.loan && (
              <div className="rounded-md border p-3 bg-orange-50 dark:bg-orange-950/20">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  Verliehen an: {scanResult.loan.borrower?.first_name}{" "}
                  {scanResult.loan.borrower?.last_name}
                </p>
                {scanResult.loan.loan_note && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {scanResult.loan.loan_note}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/admin/inventory/${scanResult.data.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Details anzeigen
                </Link>
              </Button>

              {(scanResult.data as InventoryItem).status === "available" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLoanDialogOpen(true)}
                >
                  <HandCoins className="mr-2 h-4 w-4" />
                  Verleihen
                </Button>
              )}

              {(scanResult.data as InventoryItem).status === "loaned" && scanResult.loan && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setReturnDialogOpen(true)}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Rückgabe erfassen
                </Button>
              )}

              <Button variant="ghost" className="w-full" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Weiteren Code scannen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : scanResult.type === "set" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Layers className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <CardTitle>{(scanResult.data as InventorySet).name}</CardTitle>
                <CardDescription>
                  {(scanResult.data as InventorySet).description || "Inventar-Set"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Set Details */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {(scanResult.data as InventorySet).item_count || 0} Items
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/admin/inventory/sets/${scanResult.data.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Set-Details anzeigen
                </Link>
              </Button>

              <Button variant="ghost" className="w-full" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Weiteren Code scannen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-3">
                <MapPin className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <CardTitle>{(scanResult.data as InventoryLocation).name}</CardTitle>
                <CardDescription>
                  {(scanResult.data as InventoryLocation).description || "Lagerort"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Details */}
            <div className="text-sm">
              <span className="text-muted-foreground">Pfad:</span>
              <p className="font-medium font-mono">
                {(scanResult.data as InventoryLocation).path}
              </p>
            </div>

            {(scanResult.data as InventoryLocation).item_count !== undefined && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {(scanResult.data as InventoryLocation).item_count} Items
                </Badge>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/admin/inventory/locations?selected=${scanResult.data.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Lagerort-Inhalt anzeigen
                </Link>
              </Button>

              <Button variant="ghost" className="w-full" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Weiteren Code scannen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Dialog */}
      {scanResult?.type === "item" && (
        <LoanDialog
          open={loanDialogOpen}
          onOpenChange={setLoanDialogOpen}
          item={scanResult.data as InventoryItem}
          onSubmit={handleLoanSubmit}
        />
      )}

      {/* Return Dialog */}
      {scanResult?.type === "item" && scanResult.loan && (
        <ReturnDialog
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          item={scanResult.data as InventoryItem}
          loan={scanResult.loan}
          locations={locations}
          onSubmit={handleReturnSubmit}
        />
      )}
    </div>
  )
}
