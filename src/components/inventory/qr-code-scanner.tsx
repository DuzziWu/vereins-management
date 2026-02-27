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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseQRCodeUrl, type QRCodeData } from "@/lib/qr-code"

interface QRCodeScannerProps {
  onScan: (data: QRCodeData) => void
  onManualSearch?: (query: string) => void
  onClose?: () => void
}

export function QRCodeScanner({
  onScan,
  onManualSearch,
  onClose,
}: QRCodeScannerProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [isScanning, setIsScanning] = React.useState(false)
  const [hasTorch, setHasTorch] = React.useState(false)
  const [torchOn, setTorchOn] = React.useState(false)
  const [manualInput, setManualInput] = React.useState("")
  const [cameras, setCameras] = React.useState<{ id: string; label: string }[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = React.useState(0)

  const scannerRef = React.useRef<Html5Qrcode | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Initialize scanner
  React.useEffect(() => {
    const scannerId = "qr-scanner-container"

    async function initScanner() {
      try {
        // Get available cameras
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setCameras(devices)

          // Create scanner instance
          scannerRef.current = new Html5Qrcode(scannerId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          })

          await startScanning(devices[0].id)
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

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        onQrCodeSuccess,
        () => {} // Ignore scan failures (normal during scanning)
      )

      // Check if torch is available
      const capabilities = scannerRef.current.getRunningTrackCameraCapabilities()
      if (capabilities.torchFeature) {
        setHasTorch(capabilities.torchFeature().isSupported())
      }
    } catch (err) {
      console.error("Start scanning error:", err)
      setIsScanning(false)
      setError("Konnte Scanner nicht starten.")
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

  function onQrCodeSuccess(decodedText: string) {
    // Parse the QR code URL
    const data = parseQRCodeUrl(decodedText)

    if (data) {
      // Vibrate on successful scan (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }

      // Stop scanning and notify parent
      stopScanning()
      onScan(data)
    } else {
      // Not a valid inventory QR code
      setError("Dieser QR-Code gehört nicht zum Inventar-System.")
    }
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              QR-Scanner
            </CardTitle>
            <CardDescription>
              Scannen Sie einen QR-Code oder geben Sie die Inventarnummer ein
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
        {/* Scanner Container */}
        <div className="relative">
          <div
            id="qr-scanner-container"
            ref={containerRef}
            className="aspect-square w-full overflow-hidden rounded-lg bg-black"
          />

          {/* Scanner Overlay */}
          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <CameraOff className="h-12 w-12 text-white/50" />
            </div>
          )}

          {/* Scanner Controls */}
          {isScanning && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {hasTorch && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={toggleTorch}
                  className="bg-black/50 hover:bg-black/70"
                >
                  {torchOn ? (
                    <FlashlightOff className="h-5 w-5 text-white" />
                  ) : (
                    <Flashlight className="h-5 w-5 text-white" />
                  )}
                </Button>
              )}
              {cameras.length > 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={switchCamera}
                  className="bg-black/50 hover:bg-black/70"
                >
                  <RefreshCw className="h-5 w-5 text-white" />
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
            <p className="text-sm text-muted-foreground">
              Oder Inventarnummer manuell eingeben:
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
