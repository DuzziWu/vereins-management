"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, LayoutGrid, List, Search, Package, Filter, MapPin, QrCode } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/inventory/status-badge"
import { ItemStatusDialog } from "@/components/inventory/item-status-dialog"
import {
  Category,
  InventoryItem,
  ItemStatus,
  ITEM_STATUS,
  STATUS_CONFIG,
  InventoryFilters,
  defaultFilters,
} from "@/lib/validations/inventory"

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-20" />
        </div>
      ))}
    </div>
  )
}

function ItemCard({ item, onStatusClick }: { item: InventoryItem; onStatusClick: (item: InventoryItem) => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {item.images && item.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.images[0].public_url || ""}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/admin/inventory/${item.id}`}
              className="font-medium hover:underline line-clamp-1"
            >
              {item.name}
            </Link>
            <button onClick={() => onStatusClick(item)}>
              <StatusBadge status={item.status} showDot={false} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {item.category?.icon && <span>{item.category.icon}</span>}
            <span>{item.category?.name}</span>
          </div>
          {item.size_info && (
            <Badge variant="outline" className="text-xs">
              {item.size_info}
            </Badge>
          )}
          {item.status === "loaned" && item.current_holder && (
            <p className="text-xs text-muted-foreground">
              an {item.current_holder.first_name} {item.current_holder.last_name}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function InventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table")
  const [filters, setFilters] = React.useState<InventoryFilters>(defaultFilters)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)

  // Status dialog state
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null)

  const PAGE_SIZE = 50

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search.length >= 2 || filters.search.length === 0) {
        setDebouncedSearch(filters.search)
        setCurrentPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await fetch("/api/inventory/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [])

  // Fetch items
  const fetchItems = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", currentPage.toString())
      params.set("limit", PAGE_SIZE.toString())

      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      }
      if (filters.category_id) {
        params.set("category_id", filters.category_id)
      }
      if (filters.status) {
        params.set("status", filters.status)
      }

      const response = await fetch(`/api/inventory/items?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch items")

      const data = await response.json()
      setItems(data.items || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error fetching items:", error)
      toast.error("Fehler beim Laden der Items")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.category_id, filters.status])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  React.useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function handleStatusClick(item: InventoryItem) {
    setSelectedItem(item)
    setStatusDialogOpen(true)
  }

  async function handleStatusChange(itemId: string, data: { status: ItemStatus; holder_id?: string | null; note?: string }) {
    try {
      const response = await fetch(`/api/inventory/items/${itemId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Ändern des Status")
      }

      toast.success(`Status geändert auf "${STATUS_CONFIG[data.status].label}"`)
      await fetchItems()
    } catch (error) {
      console.error("Error changing status:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Ändern des Status")
      throw error
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Inventar</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Inventar-Gegenstände des Vereins.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/inventory/scanner">
              <QrCode className="mr-2 h-4 w-4" />
              Scanner
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/inventory/new">
              <Plus className="mr-2 h-4 w-4" />
              Neues Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs for Items / Categories / Sets / Locations */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            Items
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
          <TabsTrigger value="locations" asChild>
            <Link href="/admin/inventory/locations" className="gap-2">
              <MapPin className="h-4 w-4" />
              Lagerorte
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Alle Items</CardTitle>
                  <CardDescription>{totalCount} Items insgesamt</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("table")}
                    title="Tabellenansicht"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("cards")}
                    title="Kartenansicht"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Name oder Inventarnummer..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filters.category_id || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category_id: value === "all" ? null : value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Alle Kategorien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value === "all" ? null : (value as ItemStatus) })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    {ITEM_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              {isLoading ? (
                <TableSkeleton />
              ) : viewMode === "table" ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Größe</TableHead>
                        <TableHead>Inventarnr.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Keine Items gefunden.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
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
                              <Link
                                href={`/admin/inventory/${item.id}`}
                                className="font-medium hover:underline"
                              >
                                {item.name}
                              </Link>
                              {item.status === "loaned" && item.current_holder && (
                                <p className="text-xs text-muted-foreground">
                                  an {item.current_holder.first_name} {item.current_holder.last_name}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {item.category?.icon && <span>{item.category.icon}</span>}
                                <span>{item.category?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <button onClick={() => handleStatusClick(item)}>
                                <StatusBadge status={item.status} />
                              </button>
                            </TableCell>
                            <TableCell>{item.size_info || "-"}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.inventory_number || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {items.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Keine Items gefunden.
                    </div>
                  ) : (
                    items.map((item) => (
                      <ItemCard key={item.id} item={item} onStatusClick={handleStatusClick} />
                    ))
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Seite {currentPage} von {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Zurück
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Weiter
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Dialog */}
      {selectedItem && (
        <ItemStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          item={selectedItem}
          onSubmit={(data) => handleStatusChange(selectedItem.id, data)}
        />
      )}
    </div>
  )
}
