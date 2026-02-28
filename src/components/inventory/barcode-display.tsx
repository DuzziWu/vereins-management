"use client"

import * as React from "react"
import { Download, Printer, Barcode } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  generateBarcodeValue,
  generateBarcodeDataUrl,
  BARCODE_LABEL_SIZES,
  type BarcodeLabelSize,
} from "@/lib/barcode"

interface BarcodeDisplayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "item" | "location" | "set"
  id: string
  name: string
  inventoryNumber?: string | null
}

export function BarcodeDisplay({
  open,
  onOpenChange,
  type,
  id,
  name,
  inventoryNumber,
}: BarcodeDisplayProps) {
  const [barcodeUrl, setBarcodeUrl] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [labelSize, setLabelSize] = React.useState<BarcodeLabelSize>("medium")
  const [barcodeValue, setBarcodeValue] = React.useState<string>("")

  // Generate barcode when dialog opens
  React.useEffect(() => {
    if (open && (inventoryNumber || id)) {
      setIsLoading(true)

      // Use inventory number if available, otherwise use ID prefix
      const code = inventoryNumber || id.substring(0, 8).toUpperCase()
      const value = generateBarcodeValue(type, code)
      setBarcodeValue(value)

      generateBarcodeDataUrl(value, {
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
      })
        .then(setBarcodeUrl)
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [open, id, type, inventoryNumber])

  // Download barcode as PNG
  async function handleDownload() {
    if (!barcodeUrl) return

    const link = document.createElement("a")
    link.download = `barcode-${type}-${inventoryNumber || id}.png`
    link.href = barcodeUrl
    link.click()
  }

  // Print barcode label
  function handlePrint() {
    if (!barcodeUrl) return

    const size = BARCODE_LABEL_SIZES[labelSize]
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Label</title>
          <style>
            @page {
              size: ${size.width}mm ${size.height}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 1mm 2mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: ${size.width}mm;
              height: ${size.height}mm;
              box-sizing: border-box;
              font-family: Arial, sans-serif;
            }
            img {
              max-width: ${size.width - 4}mm;
              height: auto;
            }
            .name {
              font-size: ${size.fontSize - 2}pt;
              margin-bottom: 1mm;
              text-align: center;
              max-width: ${size.width - 4}mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div class="name">${name}</div>
          <img src="${barcodeUrl}" alt="Barcode" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const typeLabels = {
    item: "Item",
    location: "Lagerort",
    set: "Set",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Barcode
          </DialogTitle>
          <DialogDescription>
            {typeLabels[type]}: {name}
            {inventoryNumber && (
              <span className="block font-mono text-sm">{inventoryNumber}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isLoading ? (
            <Skeleton className="h-[100px] w-[300px]" />
          ) : barcodeUrl ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={barcodeUrl}
                alt={`Barcode für ${name}`}
                className="max-h-[100px] w-auto rounded-md border p-2 bg-white"
              />
              <p className="text-xs text-muted-foreground font-mono">{barcodeValue}</p>
            </div>
          ) : (
            <div className="flex h-[100px] w-[300px] items-center justify-center rounded-md border text-muted-foreground">
              Fehler beim Laden
            </div>
          )}

          <div className="flex w-full items-center gap-2">
            <span className="text-sm text-muted-foreground">Label-Größe:</span>
            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as BarcodeLabelSize)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Klein (40x20mm)</SelectItem>
                <SelectItem value="medium">Mittel (60x25mm)</SelectItem>
                <SelectItem value="large">Groß (80x35mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!barcodeUrl}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!barcodeUrl}
            className="w-full sm:w-auto"
          >
            <Printer className="mr-2 h-4 w-4" />
            Label drucken
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
