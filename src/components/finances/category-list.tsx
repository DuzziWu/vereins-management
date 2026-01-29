"use client"

import { MoreHorizontal, Pencil, Trash2, Lock, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TransactionCategory } from "./treasury-toolbar"

interface CategoryListProps {
  categories: TransactionCategory[]
  type: "income" | "expense"
  onEdit: (category: TransactionCategory) => void
  onDelete: (category: TransactionCategory) => void
  isLoading?: boolean
}

export function CategoryList({ categories, type, onEdit, onDelete, isLoading }: CategoryListProps) {
  const filtered = categories.filter((c) => c.type === type)

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Tag className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          Keine {type === "income" ? "Einnahme" : "Ausgabe"}-Kategorien vorhanden.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Icon</TableHead>
            <TableHead className="hidden sm:table-cell">Farbe</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {category.name}
                  {category.is_system && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="mr-1 h-3 w-3" />
                      Standard
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {category.icon || "–"}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {category.color ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-sm border"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-muted-foreground">{category.color}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">–</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={type === "income" ? "default" : "secondary"}>
                  {type === "income" ? "Einnahme" : "Ausgabe"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Aktionen</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(category)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Bearbeiten
                    </DropdownMenuItem>
                    {!category.is_system && (
                      <DropdownMenuItem
                        onClick={() => onDelete(category)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
