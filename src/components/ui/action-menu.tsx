"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface ActionMenuItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  /** Title for the mobile sheet */
  title?: string
  /** Trigger element. Defaults to a "..." button. */
  trigger?: React.ReactNode
  className?: string
}

/** Desktop: DropdownMenu, Mobile: Bottom Sheet */
export function ActionMenu({
  items,
  title = "Aktionen",
  trigger,
  className,
}: ActionMenuProps) {
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const triggerButton = trigger ?? (
    <Button variant="ghost" size="icon" className={cn("h-8 w-8", className)}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Aktionen</span>
    </Button>
  )

  if (isMobile) {
    return (
      <>
        <div onClick={() => setSheetOpen(true)}>{triggerButton}</div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-xl pb-[env(safe-area-inset-bottom)]"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base">{title}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1">
              {items.map((item, index) => {
                const Icon = item.icon
                return (
                  <React.Fragment key={item.label}>
                    {index > 0 &&
                      item.variant === "destructive" &&
                      items[index - 1]?.variant !== "destructive" && (
                        <div className="my-1 h-px bg-border" />
                      )}
                    <button
                      onClick={() => {
                        setSheetOpen(false)
                        item.onClick()
                      }}
                      disabled={item.disabled}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors min-h-[44px] w-full text-left",
                        item.variant === "destructive"
                          ? "text-destructive hover:bg-destructive/10"
                          : "text-foreground hover:bg-accent",
                        item.disabled && "opacity-50 pointer-events-none"
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5 shrink-0" />}
                      <span>{item.label}</span>
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <React.Fragment key={item.label}>
              {index > 0 &&
                item.variant === "destructive" &&
                items[index - 1]?.variant !== "destructive" && (
                  <DropdownMenuSeparator />
                )}
              <DropdownMenuItem
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  item.variant === "destructive" && "text-destructive focus:text-destructive"
                )}
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {item.label}
              </DropdownMenuItem>
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
