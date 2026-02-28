"use client"

import * as React from "react"
import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  Info,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { parseBarcodeValue } from "@/lib/barcode"

export interface BarcodeScanResult {
  type: "item" | "location" | "set"
  code: string
}

interface BarcodeScannerProps {
  onScan: (data: BarcodeScanResult) => void
  onManualSearch?: (query: string) => void
  onClose?: () => void
}

type ScannerMode = "native" | "fallback" | "loading"

export function BarcodeScanner({
  onScan,
  onManualSearch,
  onClose,
}: BarcodeScannerProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [isScanning, setIsScanning] = React.useState(false)
  const [hasTorch, setHasTorch] = React.useState(false)
  const [torchOn, setTorchOn] = React.useState(false)
  const [manualInput, setManualInput] = React.useState("")
  const [scannerMode, setScannerMode] = React.useState<ScannerMode>("loading")
  const [showTips, setShowTips] = React.useState(false)
  const [lastScanned, setLastScanned] = React.useState<string | null>(null)
  const [scanCount, setScanCount] = React.useState(0)

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const detectorRef = React.useRef<BarcodeDetector | null>(null)
  const scanIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const lastScanTimeRef = React.useRef<number>(0)

  // Check if BarcodeDetector is available
  const checkBarcodeDetectorSupport = React.useCallback(async (): Promise<boolean> => {
    if (!("BarcodeDetector" in globalThis)) {
      return false
    }

    try {
      const formats = await BarcodeDetector.getSupportedFormats()
      // Check if Code128 is supported (main format we use)
      return formats.includes("code_128") || formats.includes("ean_13")
    } catch {
      return false
    }
  }, [])

  // Initialize camera stream
  const initCamera = React.useCallback(async () => {
    try {
      // Request camera with optimal settings for barcode scanning
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          // @ts-expect-error - focusMode is not in the type but works on many devices
          focusMode: { ideal: "continuous" },
          torch: false,
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Check torch capability
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
      setHasTorch(!!capabilities.torch)

      setIsScanning(true)
      setError(null)

      return true
    } catch (err) {
      console.error("Camera init error:", err)
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Kamera-Zugriff verweigert. Bitte in den Einstellungen erlauben.")
        } else if (err.name === "NotFoundError") {
          setError("Keine Kamera gefunden.")
        } else {
          setError(`Kamera-Fehler: ${err.message}`)
        }
      }
      return false
    }
  }, [])

  // Native BarcodeDetector scanning
  const startNativeScanning = React.useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      // Create detector with multiple formats
      detectorRef.current = new BarcodeDetector({
        formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"],
      })

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      // Scan every 100ms for responsive detection
      scanIntervalRef.current = setInterval(async () => {
        if (!detectorRef.current || video.readyState !== 4) return

        // Update canvas size to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          const barcodes = await detectorRef.current.detect(canvas)

          if (barcodes.length > 0) {
            const barcode = barcodes[0]
            handleBarcodeDetected(barcode.rawValue)
          }
        } catch (err) {
          // Detection error - ignore and continue
        }

        setScanCount((prev) => prev + 1)
      }, 100)
    } catch (err) {
      console.error("Native scanner error:", err)
      setError("Fehler beim Starten des Scanners")
    }
  }, [])

  // Fallback using html5-qrcode
  const startFallbackScanning = React.useCallback(async () => {
    // Dynamically import html5-qrcode only when needed
    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode")

    const scanner = new Html5Qrcode("barcode-fallback-scanner", {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    })

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 300, height: 120 },
          aspectRatio: 16 / 9,
        },
        (decodedText) => handleBarcodeDetected(decodedText),
        () => {}
      )

      setIsScanning(true)
      setError(null)

      // Store scanner for cleanup
      ;(window as Window & { __barcodeScanner?: typeof scanner }).__barcodeScanner = scanner
    } catch (err) {
      console.error("Fallback scanner error:", err)
      setError("Konnte Scanner nicht starten. Bitte Seite neu laden.")
    }
  }, [])

  // Handle detected barcode
  const handleBarcodeDetected = React.useCallback(
    (rawValue: string) => {
      // Debounce - prevent same code within 2 seconds
      const now = Date.now()
      if (rawValue === lastScanned && now - lastScanTimeRef.current < 2000) {
        return
      }

      setLastScanned(rawValue)
      lastScanTimeRef.current = now

      // Try to parse as our format
      const data = parseBarcodeValue(rawValue)

      if (data) {
        // Vibrate on success
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }

        stopScanning()
        onScan(data)
      } else if (onManualSearch && rawValue.length > 2) {
        // Use raw value as search term
        if (navigator.vibrate) {
          navigator.vibrate(100)
        }

        stopScanning()
        onManualSearch(rawValue)
      } else {
        setError(`Unbekanntes Format: ${rawValue}`)
        setTimeout(() => setError(null), 3000)
      }
    },
    [lastScanned, onScan, onManualSearch]
  )

  // Stop scanning and cleanup
  const stopScanning = React.useCallback(() => {
    // Stop interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Stop fallback scanner
    const fallbackScanner = (window as Window & { __barcodeScanner?: { stop: () => Promise<void> } }).__barcodeScanner
    if (fallbackScanner) {
      fallbackScanner.stop().catch(() => {})
      delete (window as Window & { __barcodeScanner?: unknown }).__barcodeScanner
    }

    setIsScanning(false)
  }, [])

  // Toggle torch
  const toggleTorch = React.useCallback(async () => {
    if (!streamRef.current || !hasTorch) return

    try {
      const track = streamRef.current.getVideoTracks()[0]
      const newState = !torchOn

      await track.applyConstraints({
        // @ts-expect-error - advanced is not in the type
        advanced: [{ torch: newState }],
      })

      setTorchOn(newState)
    } catch (err) {
      console.error("Torch error:", err)
    }
  }, [hasTorch, torchOn])

  // Determine scanner mode on mount
  React.useEffect(() => {
    async function detectMode() {
      const hasNativeSupport = await checkBarcodeDetectorSupport()
      setScannerMode(hasNativeSupport ? "native" : "fallback")
    }

    detectMode()

    return () => {
      stopScanning()
    }
  }, [checkBarcodeDetectorSupport, stopScanning])

  // Start native scanner when mode is set to native
  React.useEffect(() => {
    if (scannerMode !== "native") return

    async function startNative() {
      const cameraReady = await initCamera()
      if (cameraReady) {
        await startNativeScanning()
      }
    }

    startNative()
  }, [scannerMode, initCamera, startNativeScanning])

  // Start fallback scanner when mode is set to fallback (after DOM renders)
  React.useEffect(() => {
    if (scannerMode !== "fallback") return

    // Small delay to ensure DOM element exists
    const timeoutId = setTimeout(() => {
      startFallbackScanning()
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [scannerMode, startFallbackScanning])

  // Manual search handler
  const handleManualSearch = React.useCallback(() => {
    if (manualInput.trim() && onManualSearch) {
      onManualSearch(manualInput.trim())
    }
  }, [manualInput, onManualSearch])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Barcode-Scanner
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {scannerMode === "native" && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Optimiert
                </Badge>
              )}
              Barcode im Rahmen zentrieren
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTips(!showTips)}
              className="text-muted-foreground"
            >
              <Info className="h-5 w-5" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tips Panel */}
        {showTips && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Tipps für besseres Scannen:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Abstand: <strong>10-20 cm</strong> zum Barcode</li>
                <li>Barcode <strong>horizontal</strong> ausrichten</li>
                <li>Handy <strong>ruhig</strong> halten</li>
                <li>Bei schlechtem Licht <strong>Blitz</strong> aktivieren</li>
                <li>Barcode muss <strong>vollständig</strong> im Rahmen sein</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Scanner Container */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Native Scanner */}
          {scannerMode === "native" && (
            <>
              <video
                ref={videoRef}
                className="w-full aspect-[4/3] object-cover"
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}

          {/* Fallback Scanner Container */}
          {scannerMode === "fallback" && (
            <div id="barcode-fallback-scanner" className="w-full aspect-[4/3]" />
          )}

          {/* Loading state */}
          {scannerMode === "loading" && (
            <div className="w-full aspect-[4/3] flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                <p>Kamera wird gestartet...</p>
              </div>
            </div>
          )}

          {/* Scanner Overlay */}
          {!isScanning && scannerMode !== "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <CameraOff className="h-12 w-12 text-white/50" />
            </div>
          )}

          {/* Scan Frame */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[85%] max-w-[320px] h-[100px] border-2 border-primary/70 rounded-lg">
                {/* Animated scan line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />

                {/* Corner markers */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />

                {/* Guide text */}
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                  <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">
                    Barcode hier positionieren
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Top hint */}
          {isScanning && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2">
              <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                <ZoomIn className="h-3 w-3" />
                <span>10-20 cm Abstand</span>
                <ZoomOut className="h-3 w-3" />
              </div>
            </div>
          )}

          {/* Bottom controls */}
          {isScanning && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {hasTorch && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleTorch}
                  className={`bg-black/70 hover:bg-black/90 ${torchOn ? "text-yellow-400" : "text-white"}`}
                >
                  {torchOn ? <FlashlightOff className="h-4 w-4 mr-1" /> : <Flashlight className="h-4 w-4 mr-1" />}
                  {torchOn ? "Aus" : "Blitz"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Manual Input */}
        {onManualSearch && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Barcode nicht erkannt? Manuell eingeben:</p>
            <div className="flex gap-2">
              <Input
                placeholder="z.B. KOS-0001"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              />
              <Button onClick={handleManualSearch} disabled={!manualInput.trim()}>
                <Search className="mr-2 h-4 w-4" />
                Suchen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// TypeScript declarations for BarcodeDetector API
declare global {
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector
  }

  class BarcodeDetector {
    constructor(options?: { formats: string[] })
    static getSupportedFormats(): Promise<string[]>
    detect(image: ImageBitmapSource): Promise<{ rawValue: string; format: string; boundingBox: DOMRectReadOnly }[]>
  }
}
