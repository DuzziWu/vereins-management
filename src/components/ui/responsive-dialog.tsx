"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ResponsiveDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Renders Dialog on desktop, bottom Sheet on mobile */
function ResponsiveDialog({ children, open, onOpenChange }: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children}
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

function ResponsiveDialogTrigger({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTrigger>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <SheetTrigger {...props}>{children}</SheetTrigger>
  }

  return <DialogTrigger {...props}>{children}</DialogTrigger>
}

function ResponsiveDialogContent({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogContent>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SheetContent side="bottom" className="rounded-t-xl pb-[env(safe-area-inset-bottom)]">
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>
        {children}
      </SheetContent>
    )
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <SheetHeader {...props}>{children}</SheetHeader>
  }

  return <DialogHeader {...props}>{children}</DialogHeader>
}

function ResponsiveDialogTitle({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTitle>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <SheetTitle {...props}>{children}</SheetTitle>
  }

  return <DialogTitle {...props}>{children}</DialogTitle>
}

function ResponsiveDialogDescription({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogDescription>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <SheetDescription {...props}>{children}</SheetDescription>
  }

  return <DialogDescription {...props}>{children}</DialogDescription>
}

function ResponsiveDialogFooter({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <SheetFooter {...props}>{children}</SheetFooter>
  }

  return <DialogFooter {...props}>{children}</DialogFooter>
}

function ResponsiveDialogClose({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogClose>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <SheetClose {...props}>{children}</SheetClose>
  }

  return <DialogClose {...props}>{children}</DialogClose>
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
}
