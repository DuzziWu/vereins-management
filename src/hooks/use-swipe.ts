import * as React from "react"

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number // Minimum distance in pixels
}

interface SwipeState {
  touchStartX: number | null
  touchEndX: number | null
}

/**
 * Hook for detecting horizontal swipe gestures on touch devices.
 *
 * Usage:
 * ```tsx
 * const swipeHandlers = useSwipe({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 * })
 *
 * return <div {...swipeHandlers}>Swipeable content</div>
 * ```
 */
export function useSwipe(options: SwipeOptions = {}) {
  const { onSwipeLeft, onSwipeRight, threshold = 50 } = options

  const stateRef = React.useRef<SwipeState>({
    touchStartX: null,
    touchEndX: null,
  })

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    stateRef.current.touchStartX = e.touches[0].clientX
    stateRef.current.touchEndX = null
  }, [])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    stateRef.current.touchEndX = e.touches[0].clientX
  }, [])

  const handleTouchEnd = React.useCallback(() => {
    const { touchStartX, touchEndX } = stateRef.current

    if (touchStartX === null || touchEndX === null) return

    const distance = touchStartX - touchEndX
    const absDistance = Math.abs(distance)

    if (absDistance < threshold) return

    if (distance > 0) {
      // Swiped left (next)
      onSwipeLeft?.()
    } else {
      // Swiped right (previous)
      onSwipeRight?.()
    }

    // Reset state
    stateRef.current.touchStartX = null
    stateRef.current.touchEndX = null
  }, [onSwipeLeft, onSwipeRight, threshold])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}
