"use client"

import * as React from "react"
import { ChevronRight, ChevronDown, MoreHorizontal, Pencil, CreditCard, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatCurrency } from "@/lib/validations/membership-type"

export type PaymentStatus = "paid" | "partial" | "open"

export interface FeeEntry {
  id: string
  type: "individual" | "family"
  name: string
  membershipTypeName: string | null
  amountDue: number
  amountPaid: number
  amountOpen: number
  status: PaymentStatus
  // Für Familien: Mitglieder-Details
  members?: FamilyMember[]
  memberCount?: number
  isFamilyFlat?: boolean
}

export interface FamilyMember {
  id: string
  name: string
  membershipTypeName: string | null
  amountDue: number
  amountPaid: number
  status: PaymentStatus
}

interface FeesTableProps {
  entries: FeeEntry[]
  onAdjust: (entry: FeeEntry) => void
  isLoading?: boolean
  isReadonly?: boolean
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const variants: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    paid: { label: "Bezahlt", variant: "default" },
    partial: { label: "Teilweise", variant: "secondary" },
    open: { label: "Offen", variant: "destructive" },
  }

  const { label, variant } = variants[status]

  return (
    <Badge variant={variant} className={status === "paid" ? "bg-green-600 hover:bg-green-700" : ""}>
      {label}
    </Badge>
  )
}

function PaymentProgress({ amountPaid, amountDue }: { amountPaid: number; amountDue: number }) {
  const percentage = amountDue > 0 ? Math.min((amountPaid / amountDue) * 100, 100) : 0

  return (
    <div className="w-16">
      <Progress value={percentage} className="h-1.5" />
    </div>
  )
}

interface FamilyRowProps {
  entry: FeeEntry
  onAdjust: (entry: FeeEntry) => void
  isLoading?: boolean
  isReadonly?: boolean
}

function FamilyRow({ entry, onAdjust, isLoading, isReadonly }: FamilyRowProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="bg-muted/30">
        <TableCell>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="sr-only">Familie aufklappen</span>
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            {entry.name}
            <Badge variant="outline" className="ml-1">
              {entry.memberCount} Mitglieder
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {entry.isFamilyFlat ? (
            <span className="italic">Familie-Flat</span>
          ) : (
            entry.membershipTypeName || "–"
          )}
        </TableCell>
        <TableCell className="text-right tabular-nums font-medium">
          {formatCurrency(entry.amountDue)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {formatCurrency(entry.amountPaid)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          <div className="flex items-center justify-end gap-2">
            <PaymentProgress amountPaid={entry.amountPaid} amountDue={entry.amountDue} />
            {formatCurrency(entry.amountOpen)}
          </div>
        </TableCell>
        <TableCell>
          <StatusBadge status={entry.status} />
        </TableCell>
        <TableCell>
          {!isReadonly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Aktionen</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAdjust(entry)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Beitrag anpassen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <>
          {entry.members?.map((member, index) => (
            <TableRow
              key={member.id}
              className="bg-muted/10 border-l-2 border-l-muted"
            >
              <TableCell></TableCell>
              <TableCell className="pl-8">
                <span className="text-muted-foreground mr-2">
                  {index === (entry.members?.length ?? 0) - 1 ? "└─" : "├─"}
                </span>
                {member.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {entry.isFamilyFlat ? (
                  <span className="italic">(Flat)</span>
                ) : (
                  member.membershipTypeName || "–"
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {entry.isFamilyFlat ? "–" : formatCurrency(member.amountDue)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {entry.isFamilyFlat ? "–" : formatCurrency(member.amountPaid)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {entry.isFamilyFlat ? "–" : formatCurrency(member.amountDue - member.amountPaid)}
              </TableCell>
              <TableCell>
                {!entry.isFamilyFlat && <StatusBadge status={member.status} />}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          ))}
        </>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface IndividualRowProps {
  entry: FeeEntry
  onAdjust: (entry: FeeEntry) => void
  isLoading?: boolean
  isReadonly?: boolean
}

function IndividualRow({ entry, onAdjust, isLoading, isReadonly }: IndividualRowProps) {
  return (
    <TableRow>
      <TableCell></TableCell>
      <TableCell className="font-medium">{entry.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {entry.membershipTypeName || "–"}
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
        {formatCurrency(entry.amountDue)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(entry.amountPaid)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <div className="flex items-center justify-end gap-2">
          <PaymentProgress amountPaid={entry.amountPaid} amountDue={entry.amountDue} />
          {formatCurrency(entry.amountOpen)}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={entry.status} />
      </TableCell>
      <TableCell>
        {!isReadonly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isLoading}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Aktionen</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAdjust(entry)}>
                <Pencil className="mr-2 h-4 w-4" />
                Beitrag anpassen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  )
}

export function FeesTable({ entries, onAdjust, isLoading, isReadonly }: FeesTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CreditCard className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Keine Beiträge gefunden</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Für das ausgewählte Jahr wurden noch keine Beiträge generiert oder es gibt keine Treffer für Ihre Suche.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Beitragsart</TableHead>
            <TableHead className="text-right">Soll</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Bezahlt</TableHead>
            <TableHead className="text-right">Offen</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) =>
            entry.type === "family" ? (
              <FamilyRow
                key={entry.id}
                entry={entry}
                onAdjust={onAdjust}
                isLoading={isLoading}
                isReadonly={isReadonly}
              />
            ) : (
              <IndividualRow
                key={entry.id}
                entry={entry}
                onAdjust={onAdjust}
                isLoading={isLoading}
                isReadonly={isReadonly}
              />
            )
          )}
        </TableBody>
      </Table>
    </div>
  )
}
