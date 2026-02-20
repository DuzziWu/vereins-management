"use client"

import * as React from "react"
import { Package } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InventoryItem } from "@/lib/validations/inventory"

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
        </div>
      ))}
    </div>
  )
}

export default function MemberEquipmentPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchMyEquipment() {
      try {
        const response = await fetch("/api/inventory/my-equipment")
        if (!response.ok) throw new Error("Failed to fetch equipment")
        const data = await response.json()
        setItems(data.items || [])
      } catch (error) {
        console.error("Error fetching equipment:", error)
        toast.error("Fehler beim Laden des Equipments")
      } finally {
        setIsLoading(false)
      }
    }
    fetchMyEquipment()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Mein Equipment</h1>
        <p className="text-muted-foreground">
          Übersicht über alle an Sie verliehenen Gegenstände.
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Verliehene Items</CardTitle>
          <CardDescription>
            {items.length} {items.length === 1 ? "Item" : "Items"} aktuell verliehen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Sie haben aktuell keine verliehenen Items.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Verliehen seit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0].public_url || ""}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.size_info && (
                            <p className="text-xs text-muted-foreground">Größe: {item.size_info}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.category?.icon && <span>{item.category.icon}</span>}
                          <span>{item.category?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.loaned_at
                          ? new Date(item.loaned_at).toLocaleDateString("de-DE")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Bei Fragen zu verliehenen Items wenden Sie sich bitte an den Vorstand.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
