"use client"

import * as React from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { parseQRCodeUrl, type QRCodeData } from "@/lib/qr-code"

interface UseQRScannerOptions {
  onScan?: (data: QRCodeData) => void
  onError?: (error: string) => void
  autoStart?: boolean
}

interface UseQRScannerReturn {
  isScanning: boolean
  error: string | null
  hasTorch: boolean
  torchOn: boolean
  cameras: { id: string; label: string }[]
  currentCameraIndex: number
  start: () => Promise<void>
  stop: () => Promise<void>
  toggleTorch: () => Promise<void>
  switchCamera: () => Promise<void>
  containerId: string
}

export function useQRScanner(options: UseQRScannerOptions = {}): UseQRScannerReturn {
  const { onScan, onError, autoStart = true } = options

  const [isScanning, setIsScanning] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasTorch, setHasTorch] = React.useState(false)
  const [torchOn, setTorchOn] = React.useState(false)
  const [cameras, setCameras] = React.useState<{ id: string; label: string }[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = React.useState(0)

  const scannerRef = React.useRef<Html5Qrcode | null>(null)
  const containerId = React.useId()

  // Safe container ID for HTML (replace colons)
  const safeContainerId = `qr-scanner-${containerId.replace(/:/g, "-")}`

  const handleQrCodeSuccess = React.useCallback(
    (decodedText: string) => {
      const data = parseQRCodeUrl(decodedText)

      if (data) {
        // Vibrate on successful scan
        if (navigator.vibrate) {
          navigator.vibrate(100)
        }
        onScan?.(data)
      } else {
        const errorMsg = "Dieser QR-Code gehört nicht zum Inventar-System."
        setError(errorMsg)
        onError?.(errorMsg)
      }
    },
    [onScan, onError]
  )

  const start = React.useCallback(async () => {
    if (isScanning) return

    try {
      setError(null)

      // Get cameras if not already fetched
      let deviceList = cameras
      if (deviceList.length === 0) {
        deviceList = await Html5Qrcode.getCameras()
        if (deviceList && deviceList.length > 0) {
          setCameras(deviceList)
        } else {
          throw new Error("Keine Kamera gefunden.")
        }
      }

      // Create scanner if not exists
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(safeContainerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        })
      }

      const cameraId = deviceList[currentCameraIndex].id

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleQrCodeSuccess,
        () => {} // Ignore scan failures
      )

      setIsScanning(true)

      // Check torch support
      const capabilities = scannerRef.current.getRunningTrackCameraCapabilities()
      if (capabilities.torchFeature) {
        setHasTorch(capabilities.torchFeature().isSupported())
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message.includes("Permission")
            ? "Kamera-Zugriff verweigert."
            : err.message
          : "Konnte Scanner nicht starten."

      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [cameras, currentCameraIndex, handleQrCodeSuccess, isScanning, onError, safeContainerId])

  const stop = React.useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch {
        // Ignore stop errors
      }
    }
    setIsScanning(false)
    setTorchOn(false)
  }, [])

  const toggleTorch = React.useCallback(async () => {
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
  }, [hasTorch, torchOn])

  const switchCamera = React.useCallback(async () => {
    if (cameras.length <= 1) return

    await stop()

    const nextIndex = (currentCameraIndex + 1) % cameras.length
    setCurrentCameraIndex(nextIndex)

    // Small delay to allow cleanup
    await new Promise((resolve) => setTimeout(resolve, 100))

    await start()
  }, [cameras.length, currentCameraIndex, start, stop])

  // Auto start on mount
  React.useEffect(() => {
    if (autoStart) {
      start()
    }

    return () => {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isScanning,
    error,
    hasTorch,
    torchOn,
    cameras,
    currentCameraIndex,
    start,
    stop,
    toggleTorch,
    switchCamera,
    containerId: safeContainerId,
  }
}
