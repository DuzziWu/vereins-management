"use client"

import * as React from "react"
import { Download, Printer, QrCode } from "lucide-react"

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
import { generateQRCodeDataUrl, generateQRCodeData, LABEL_SIZES, type LabelSize } from "@/lib/qr-code"

interface QRCodeDisplayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "item" | "location"
  id: string
  name: string
  inventoryNumber?: string | null
}

export function QRCodeDisplay({
  open,
  onOpenChange,
  type,
  id,
  name,
  inventoryNumber,
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [labelSize, setLabelSize] = React.useState<LabelSize>("medium")

  // Generate QR code when dialog opens
  React.useEffect(() => {
    if (open && id) {
      setIsLoading(true)
      const data = generateQRCodeData(type, id)
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

      generateQRCodeDataUrl(data, baseUrl, {
        width: 300,
        margin: 2,
      })
        .then(setQrCodeUrl)
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [open, id, type])

  // Download QR code as PNG
  async function handleDownload() {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.download = `qr-${type}-${inventoryNumber || id}.png`
    link.href = qrCodeUrl
    link.click()
  }

  // Print QR code label
  function handlePrint() {
    if (!qrCodeUrl) return

    const size = LABEL_SIZES[labelSize]
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-Code Label</title>
          <style>
            @page {
              size: ${size.width}mm ${size.height}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 2mm;
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
              width: ${size.qrSize}mm;
              height: ${size.qrSize}mm;
            }
            .label {
              font-size: ${size.fontSize}pt;
              margin-top: 1mm;
              text-align: center;
              max-width: ${size.width - 4}mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <img src="${qrCodeUrl}" alt="QR Code" />
          <div class="label">${inventoryNumber || name}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR-Code
          </DialogTitle>
          <DialogDescription>
            {type === "item" ? "Item" : "Lagerort"}: {name}
            {inventoryNumber && (
              <span className="block font-mono text-sm">{inventoryNumber}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isLoading ? (
            <Skeleton className="h-[200px] w-[200px]" />
          ) : qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeUrl}
              alt={`QR-Code für ${name}`}
              className="h-[200px] w-[200px] rounded-md border"
            />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border text-muted-foreground">
              Fehler beim Laden
            </div>
          )}

          <div className="flex w-full items-center gap-2">
            <span className="text-sm text-muted-foreground">Label-Größe:</span>
            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Klein (30x20mm)</SelectItem>
                <SelectItem value="medium">Mittel (50x30mm)</SelectItem>
                <SelectItem value="large">Groß (70x50mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!qrCodeUrl}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!qrCodeUrl}
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
