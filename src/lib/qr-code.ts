import QRCode from "qrcode"

// QR Code Data structure
export interface QRCodeData {
  type: "item" | "location"
  id: string
  v: number // Version for future compatibility
}

// Current version of QR code format
const QR_VERSION = 1

/**
 * Generate QR code data for an item or location
 */
export function generateQRCodeData(type: "item" | "location", id: string): QRCodeData {
  return {
    type,
    id,
    v: QR_VERSION,
  }
}

/**
 * Encode QR code data as URL for scanning
 */
export function encodeQRCodeUrl(data: QRCodeData, baseUrl: string = ""): string {
  const params = new URLSearchParams({
    t: data.type,
    id: data.id,
    v: data.v.toString(),
  })
  return `${baseUrl}/scan?${params.toString()}`
}

/**
 * Parse QR code URL back to data
 */
export function parseQRCodeUrl(url: string): QRCodeData | null {
  try {
    const urlObj = new URL(url)
    const type = urlObj.searchParams.get("t")
    const id = urlObj.searchParams.get("id")
    const v = urlObj.searchParams.get("v")

    if (!type || !id || !v) {
      return null
    }

    if (type !== "item" && type !== "location") {
      return null
    }

    return {
      type,
      id,
      v: parseInt(v, 10),
    }
  } catch {
    return null
  }
}

/**
 * Generate QR code as data URL (for display in browser)
 */
export async function generateQRCodeDataUrl(
  data: QRCodeData,
  baseUrl: string = "",
  options: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
  } = {}
): Promise<string> {
  const url = encodeQRCodeUrl(data, baseUrl)

  return QRCode.toDataURL(url, {
    width: options.width || 200,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || "#000000",
      light: options.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  })
}

/**
 * Generate QR code as PNG buffer (for download/print)
 */
export async function generateQRCodePng(
  data: QRCodeData,
  baseUrl: string = "",
  options: {
    width?: number
    margin?: number
  } = {}
): Promise<Buffer> {
  const url = encodeQRCodeUrl(data, baseUrl)

  return QRCode.toBuffer(url, {
    type: "png",
    width: options.width || 300,
    margin: options.margin || 2,
    errorCorrectionLevel: "H", // High error correction for print
  })
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSvg(
  data: QRCodeData,
  baseUrl: string = "",
  options: {
    width?: number
    margin?: number
  } = {}
): Promise<string> {
  const url = encodeQRCodeUrl(data, baseUrl)

  return QRCode.toString(url, {
    type: "svg",
    width: options.width || 200,
    margin: options.margin || 2,
    errorCorrectionLevel: "M",
  })
}

// Label sizes for printing
export const LABEL_SIZES = {
  small: { width: 30, height: 20, qrSize: 15, fontSize: 6, name: 'Klein (30x20mm)' },    // 30x20mm
  medium: { width: 50, height: 30, qrSize: 25, fontSize: 8, name: 'Mittel (50x30mm)' },   // 50x30mm
  large: { width: 70, height: 50, qrSize: 40, fontSize: 10, name: 'Groß (70x50mm)' },   // 70x50mm
} as const

export type LabelSize = keyof typeof LABEL_SIZES

/**
 * Returns the target path for a QR code
 */
export function getQRCodeTargetPath(data: QRCodeData): string {
  if (data.type === 'item') {
    return `/admin/inventory/${data.id}`
  }
  return `/admin/inventory/locations?selected=${data.id}`
}

/**
 * Parse QR code data from URLSearchParams
 */
export function parseQRCodeFromSearchParams(searchParams: URLSearchParams): QRCodeData | null {
  const type = searchParams.get('t')
  const id = searchParams.get('id')
  const v = searchParams.get('v')

  if (!type || !id) {
    return null
  }

  if (type !== 'item' && type !== 'location') {
    return null
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return null
  }

  return {
    type,
    id,
    v: v ? parseInt(v, 10) : 1,
  }
}
