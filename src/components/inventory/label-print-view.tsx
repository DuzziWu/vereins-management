"use client"

import * as React from "react"
import { Download, Printer, QrCode, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateQRCodeDataUrl, generateQRCodeData, LABEL_SIZES, type LabelSize } from "@/lib/qr-code"
import type { InventoryItem, InventoryLocation } from "@/lib/validations/inventory"

interface LabelItem {
  id: string
  type: "item" | "location"
  name: string
  code: string // inventory_number or location path
}

interface LabelPrintViewProps {
  items?: InventoryItem[]
  locations?: InventoryLocation[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onClose?: () => void
}

export function LabelPrintView({
  items = [],
  locations = [],
  selectedIds,
  onSelectionChange,
  onClose,
}: LabelPrintViewProps) {
  const [labelSize, setLabelSize] = React.useState<LabelSize>("medium")
  const [qrCodes, setQrCodes] = React.useState<Map<string, string>>(new Map())
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Combine items and locations into label items
  const allItems: LabelItem[] = React.useMemo(() => {
    const itemLabels: LabelItem[] = items.map((item) => ({
      id: item.id,
      type: "item" as const,
      name: item.name,
      code: item.inventory_number || item.id.slice(0, 8),
    }))

    const locationLabels: LabelItem[] = locations.map((loc) => ({
      id: loc.id,
      type: "location" as const,
      name: loc.name,
      code: loc.name,
    }))

    return [...itemLabels, ...locationLabels]
  }, [items, locations])

  // Selected items for printing
  const selectedItems = allItems.filter((item) => selectedIds.includes(item.id))

  // Generate QR codes for selected items
  React.useEffect(() => {
    async function generateCodes() {
      if (selectedIds.length === 0) return

      setIsGenerating(true)
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const newCodes = new Map<string, string>()

      for (const item of selectedItems) {
        if (!qrCodes.has(item.id)) {
          try {
            const data = generateQRCodeData(item.type, item.id)
            const url = await generateQRCodeDataUrl(data, baseUrl, { width: 200 })
            newCodes.set(item.id, url)
          } catch (err) {
            console.error(`Error generating QR code for ${item.id}:`, err)
          }
        }
      }

      setQrCodes((prev) => new Map([...prev, ...newCodes]))
      setIsGenerating(false)
    }

    generateCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds])

  // Toggle item selection
  function toggleSelection(id: string) {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  // Select all
  function selectAll() {
    onSelectionChange(allItems.map((item) => item.id))
  }

  // Clear selection
  function clearSelection() {
    onSelectionChange([])
  }

  // Print labels
  function handlePrint() {
    if (selectedItems.length === 0) return

    const size = LABEL_SIZES[labelSize]
    const labelsPerRow = Math.floor(210 / size.width) // A4 width = 210mm
    const labelsPerPage = labelsPerRow * Math.floor(297 / size.height) // A4 height = 297mm

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const labelHtml = selectedItems
      .map((item) => {
        const qrUrl = qrCodes.get(item.id)
        if (!qrUrl) return ""

        return `
          <div class="label">
            <img src="${qrUrl}" alt="QR Code" />
            <div class="text">${item.code}</div>
          </div>
        `
      })
      .join("")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-Code Labels</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              display: flex;
              flex-wrap: wrap;
              gap: 2mm;
            }
            .label {
              width: ${size.width}mm;
              height: ${size.height}mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 0.5mm dotted #ccc;
              box-sizing: border-box;
              padding: 1mm;
            }
            .label img {
              width: ${size.qrSize}mm;
              height: ${size.qrSize}mm;
            }
            .label .text {
              font-size: ${size.fontSize}pt;
              margin-top: 1mm;
              text-align: center;
              max-width: ${size.width - 2}mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            @media print {
              .label {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${labelHtml}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR-Code Labels drucken
            </CardTitle>
            <CardDescription>
              {selectedIds.length} von {allItems.length} ausgewählt
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Label-Größe:</span>
            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Klein (30x20mm)</SelectItem>
                <SelectItem value="medium">Mittel (50x30mm)</SelectItem>
                <SelectItem value="large">Groß (70x50mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Alle auswählen
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Auswahl aufheben
            </Button>
          </div>
        </div>

        {/* Item Selection List */}
        <div className="border rounded-lg max-h-[300px] overflow-y-auto">
          {allItems.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Keine Items oder Lagerorte vorhanden
            </div>
          ) : (
            <div className="divide-y">
              {allItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === "item" ? "Item" : "Lagerort"} - {item.code}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {selectedItems.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Vorschau:</p>
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex flex-wrap gap-2">
                {selectedItems.slice(0, 8).map((item) => {
                  const qrUrl = qrCodes.get(item.id)
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-center p-2 bg-white rounded border"
                      style={{
                        width: `${LABEL_SIZES[labelSize].width * 2}px`,
                      }}
                    >
                      {isGenerating || !qrUrl ? (
                        <Skeleton
                          className="aspect-square"
                          style={{
                            width: `${LABEL_SIZES[labelSize].qrSize * 2}px`,
                          }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrUrl}
                          alt={`QR ${item.code}`}
                          style={{
                            width: `${LABEL_SIZES[labelSize].qrSize * 2}px`,
                          }}
                        />
                      )}
                      <span
                        className="text-center truncate w-full mt-1"
                        style={{ fontSize: `${LABEL_SIZES[labelSize].fontSize * 1.5}px` }}
                      >
                        {item.code}
                      </span>
                    </div>
                  )
                })}
                {selectedItems.length > 8 && (
                  <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                    +{selectedItems.length - 8} weitere
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handlePrint}
            disabled={selectedItems.length === 0 || isGenerating}
          >
            <Printer className="mr-2 h-4 w-4" />
            {selectedItems.length} Label{selectedItems.length !== 1 ? "s" : ""} drucken
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
