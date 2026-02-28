import JsBarcode from "jsbarcode"

// Barcode Data structure
export interface BarcodeData {
  type: "item" | "location" | "set"
  id: string
  code: string // The inventory_number or location code
}

/**
 * Generate a unique barcode value for an item, location or set
 * Format: TYPE-CODE where TYPE is I (item), L (location), S (set)
 */
export function generateBarcodeValue(type: "item" | "location" | "set", inventoryNumber: string): string {
  const prefix = type === "item" ? "I" : type === "location" ? "L" : "S"
  // Clean the inventory number (remove special chars that might cause issues)
  const cleanCode = inventoryNumber.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase()
  return `${prefix}-${cleanCode}`
}

/**
 * Parse a barcode value back to type and code
 */
export function parseBarcodeValue(value: string): { type: "item" | "location" | "set"; code: string } | null {
  const match = value.match(/^([ILS])-(.+)$/)
  if (!match) return null

  const typeMap: Record<string, "item" | "location" | "set"> = {
    I: "item",
    L: "location",
    S: "set",
  }

  return {
    type: typeMap[match[1]],
    code: match[2],
  }
}

/**
 * Generate barcode as SVG string
 */
export function generateBarcodeSvg(
  value: string,
  options: {
    width?: number
    height?: number
    displayValue?: boolean
    fontSize?: number
    margin?: number
  } = {}
): string {
  // Create a temporary SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")

  JsBarcode(svg, value, {
    format: "CODE128",
    width: options.width || 2,
    height: options.height || 50,
    displayValue: options.displayValue !== false,
    fontSize: options.fontSize || 14,
    margin: options.margin || 10,
    background: "#ffffff",
    lineColor: "#000000",
  })

  return svg.outerHTML
}

/**
 * Generate barcode as data URL (for display/download)
 */
export function generateBarcodeDataUrl(
  value: string,
  options: {
    width?: number
    height?: number
    displayValue?: boolean
    fontSize?: number
  } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas element
      const canvas = document.createElement("canvas")

      JsBarcode(canvas, value, {
        format: "CODE128",
        width: options.width || 2,
        height: options.height || 80,
        displayValue: options.displayValue !== false,
        fontSize: options.fontSize || 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      })

      resolve(canvas.toDataURL("image/png"))
    } catch (error) {
      reject(error)
    }
  })
}

// Label sizes for printing (rectangular format for barcodes)
export const BARCODE_LABEL_SIZES = {
  small: {
    width: 40,
    height: 20,
    barcodeWidth: 1.5,
    barcodeHeight: 30,
    fontSize: 8,
    name: "Klein (40x20mm)"
  },
  medium: {
    width: 60,
    height: 25,
    barcodeWidth: 2,
    barcodeHeight: 40,
    fontSize: 10,
    name: "Mittel (60x25mm)"
  },
  large: {
    width: 80,
    height: 35,
    barcodeWidth: 2.5,
    barcodeHeight: 60,
    fontSize: 12,
    name: "Groß (80x35mm)"
  },
} as const

export type BarcodeLabelSize = keyof typeof BARCODE_LABEL_SIZES

/**
 * Returns the target path for a barcode scan
 */
export function getBarcodeTargetPath(data: { type: "item" | "location" | "set"; code: string }): string {
  if (data.type === "item") {
    return `/admin/inventory?search=${encodeURIComponent(data.code)}`
  }
  if (data.type === "set") {
    return `/admin/inventory/sets?search=${encodeURIComponent(data.code)}`
  }
  return `/admin/inventory/locations?search=${encodeURIComponent(data.code)}`
}
