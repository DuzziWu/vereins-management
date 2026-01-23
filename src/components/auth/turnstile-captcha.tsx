"use client"

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import * as React from "react"

interface TurnstileCaptchaProps {
  onSuccess: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

export function TurnstileCaptcha({
  onSuccess,
  onError,
  onExpire,
}: TurnstileCaptchaProps) {
  const ref = React.useRef<TurnstileInstance>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  // Use test key in development if no site key is configured
  const effectiveSiteKey = siteKey || "1x00000000000000000000AA" // Turnstile test key (always passes)

  return (
    <div className="flex justify-center">
      <Turnstile
        ref={ref}
        siteKey={effectiveSiteKey}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: "auto",
          size: "normal",
        }}
      />
    </div>
  )
}
