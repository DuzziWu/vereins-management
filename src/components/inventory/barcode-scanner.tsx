"use client"

import * as React from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

type ScanHint = "none" | "closer" | "further" | "steady" | "light"

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
  const [cameras, setCameras] = React.useState<{ id: string; label: string }[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = React.useState(0)
  const [lastScanned, setLastScanned] = React.useState<string | null>(null)
  const [scanAttempts, setScanAttempts] = React.useState(0)
  const [scanHint, setScanHint] = React.useState<ScanHint>("none")
  const [showTips, setShowTips] = React.useState(false)

  const scannerRef = React.useRef<Html5Qrcode | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const scanAttemptsRef = React.useRef(0)
  const lastHintTimeRef = React.useRef(0)

  // Calculate optimal scan box size based on screen
  const getScanBoxSize = React.useCallback(() => {
    if (typeof window === "undefined") return { width: 280, height: 100 }

    const screenWidth = window.innerWidth
    // For mobile, use larger scanning area relative to screen
    const width = Math.min(screenWidth - 40, 350)
    const height = Math.floor(width * 0.35) // Barcode aspect ratio

    return { width, height }
  }, [])

  // Show hint based on scan attempts
  React.useEffect(() => {
    if (!isScanning) {
      setScanAttempts(0)
      setScanHint("none")
      return
    }

    const interval = setInterval(() => {
      scanAttemptsRef.current += 1
      setScanAttempts(scanAttemptsRef.current)

      // Show hints after several failed attempts
      const now = Date.now()
      if (scanAttemptsRef.current > 30 && now - lastHintTimeRef.current > 5000) {
        // Cycle through hints
        const hints: ScanHint[] = ["closer", "further", "steady", "light"]
        const hintIndex = Math.floor((scanAttemptsRef.current - 30) / 50) % hints.length
        setScanHint(hints[hintIndex])
        lastHintTimeRef.current = now
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isScanning])

  // Initialize scanner
  React.useEffect(() => {
    const scannerId = "barcode-scanner-container"

    async function initScanner() {
      try {
        // Get available cameras
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setCameras(devices)

          // Prefer back/rear camera for mobile
          const backCameraIndex = devices.findIndex(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("rück") ||
              d.label.toLowerCase().includes("environment")
          )
          const startIndex = backCameraIndex >= 0 ? backCameraIndex : 0
          setCurrentCameraIndex(startIndex)

          // Create scanner instance with barcode formats
          scannerRef.current = new Html5Qrcode(scannerId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          })

          await startScanning(devices[startIndex].id)
        } else {
          setError("Keine Kamera gefunden. Bitte Kamera-Berechtigung erteilen.")
        }
      } catch (err) {
        console.error("Scanner init error:", err)
        if (err instanceof Error) {
          if (err.message.includes("Permission")) {
            setError("Kamera-Zugriff verweigert. Bitte in den Einstellungen erlauben.")
          } else {
            setError(`Kamera-Fehler: ${err.message}`)
          }
        } else {
          setError("Konnte Kamera nicht starten.")
        }
      }
    }

    initScanner()

    return () => {
      stopScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startScanning(cameraId: string) {
    if (!scannerRef.current) return

    try {
      setIsScanning(true)
      setError(null)
      scanAttemptsRef.current = 0
      setScanAttempts(0)
      setScanHint("none")

      const scanBox = getScanBoxSize()

      await scannerRef.current.start(
        cameraId,
        {
          fps: 15, // Higher FPS for faster detection
          qrbox: scanBox,
          aspectRatio: 16 / 9,
          // Disable mirror for back camera
          videoConstraints: {
            facingMode: "environment", // Prefer back camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        onBarcodeSuccess,
        onBarcodeError
      )

      // Check if torch is available
      try {
        const capabilities = scannerRef.current.getRunningTrackCameraCapabilities()
        if (capabilities.torchFeature) {
          setHasTorch(capabilities.torchFeature().isSupported())
        }
      } catch {
        // Torch not available
      }
    } catch (err) {
      console.error("Start scanning error:", err)
      setIsScanning(false)
      setError("Konnte Scanner nicht starten. Bitte Seite neu laden.")
    }
  }

  async function stopScanning() {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch {
        // Ignore stop errors
      }
    }
    setIsScanning(false)
  }

  function onBarcodeSuccess(decodedText: string) {
    // Prevent duplicate scans of same code within short time
    if (decodedText === lastScanned) return
    setLastScanned(decodedText)

    // Reset scan attempts on successful scan
    scanAttemptsRef.current = 0
    setScanAttempts(0)
    setScanHint("none")

    // Try to parse as our barcode format
    const data = parseBarcodeValue(decodedText)

    if (data) {
      // Vibrate on successful scan (if supported)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]) // Double vibrate for success
      }

      // Stop scanning and notify parent
      stopScanning()
      onScan(data)
    } else {
      // Not our barcode format - might be a raw inventory number
      // Try using it directly as item search
      if (onManualSearch && decodedText.length > 2) {
        if (navigator.vibrate) {
          navigator.vibrate(100)
        }
        stopScanning()
        onManualSearch(decodedText)
      } else {
        setError(`Unbekanntes Format: ${decodedText}`)
        setTimeout(() => {
          setError(null)
          setLastScanned(null)
        }, 3000)
      }
    }
  }

  function onBarcodeError() {
    // This is called on every frame without a barcode - normal behavior
    // We use this to track scan attempts for hints
  }

  async function toggleTorch() {
    if (!scannerRef.current?.isScanning || !hasTorch) return

    try {
      const capabilities = scannerRef.current.getRunningTrackCameraCapabilities()
      if (capabilities.torchFeature) {
        const newState = !torchOn
        await capabilities.torchFeature().apply(newState)
        setTorchOn(newState)
      }
    } catch (err) {
      console.error("Torch toggle error:", err)
    }
  }

  async function switchCamera() {
    if (cameras.length <= 1) return

    await stopScanning()

    const nextIndex = (currentCameraIndex + 1) % cameras.length
    setCurrentCameraIndex(nextIndex)

    await startScanning(cameras[nextIndex].id)
  }

  function handleManualSearch() {
    if (manualInput.trim() && onManualSearch) {
      onManualSearch(manualInput.trim())
    }
  }

  // Get hint message
  function getHintMessage(): string | null {
    switch (scanHint) {
      case "closer":
        return "📱 Näher an den Barcode herangehen (15-20 cm)"
      case "further":
        return "📱 Etwas weiter weg vom Barcode (20-30 cm)"
      case "steady":
        return "✋ Handy ruhig halten, Barcode mittig ausrichten"
      case "light":
        return "💡 Für bessere Erkennung Blitz aktivieren"
      default:
        return null
    }
  }

  const hintMessage = getHintMessage()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Barcode-Scanner
            </CardTitle>
            <CardDescription>
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
                <li>Abstand: <strong>15-25 cm</strong> zum Barcode</li>
                <li>Barcode <strong>mittig</strong> im Rahmen platzieren</li>
                <li>Handy <strong>ruhig</strong> halten</li>
                <li>Bei schlechtem Licht <strong>Blitz</strong> aktivieren</li>
                <li>Barcode muss <strong>scharf</strong> und vollständig sichtbar sein</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Scanner Container */}
        <div className="relative">
          <div
            id="barcode-scanner-container"
            ref={containerRef}
            className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-black"
          />

          {/* Scanner Overlay */}
          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <CameraOff className="h-12 w-12 text-white/50" />
            </div>
          )}

          {/* Scan Frame with animated corners */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="relative border-2 border-primary/70 rounded-lg"
                style={{
                  width: `${getScanBoxSize().width}px`,
                  height: `${getScanBoxSize().height}px`
                }}
              >
                {/* Animated scan line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />

                {/* Corner markers */}
                <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl" />
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr" />
                <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br" />
              </div>
            </div>
          )}

          {/* Scanner Controls */}
          {isScanning && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {hasTorch && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleTorch}
                  className={`bg-black/60 hover:bg-black/80 ${torchOn ? 'text-yellow-400' : 'text-white'}`}
                >
                  {torchOn ? (
                    <FlashlightOff className="h-4 w-4 mr-1" />
                  ) : (
                    <Flashlight className="h-4 w-4 mr-1" />
                  )}
                  {torchOn ? 'Aus' : 'Blitz'}
                </Button>
              )}
              {cameras.length > 1 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={switchCamera}
                  className="bg-black/60 hover:bg-black/80 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Kamera
                </Button>
              )}
            </div>
          )}

          {/* Distance/Hint indicator at top */}
          {isScanning && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                <ZoomIn className="h-3 w-3" />
                <span>15-25 cm Abstand</span>
                <ZoomOut className="h-3 w-3" />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Hint Message */}
        {hintMessage && (
          <Alert className="border-primary/50 bg-primary/5">
            <AlertDescription className="text-sm font-medium">
              {hintMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Manual Input */}
        {onManualSearch && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Barcode nicht erkannt? Manuell eingeben:
            </p>
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
