"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PasswordInput } from "./password-input"
import { TurnstileCaptcha } from "./turnstile-captcha"
import { login } from "@/lib/actions"

const loginSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige Email-Adresse ein"),
  password: z.string().min(1, "Passwort ist erforderlich"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [requiresCaptcha, setRequiresCaptcha] = React.useState(false)
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function handleSubmit(values: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    // If CAPTCHA is required but not solved, show error
    if (requiresCaptcha && !captchaToken) {
      setError("Bitte lösen Sie das CAPTCHA")
      setIsLoading(false)
      return
    }

    const result = await login({
      ...values,
      captchaToken: captchaToken || undefined,
    })

    if (result.error) {
      setError(result.error)
      // Check if CAPTCHA is now required
      if (result.requiresCaptcha) {
        setRequiresCaptcha(true)
        setCaptchaToken(null) // Reset token to require fresh solve
      }
      setIsLoading(false)
      return
    }

    if (result.success) {
      // Hard redirect to ensure cookies are set
      window.location.href = "/dashboard"
    } else {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@beispiel.de"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passwort</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Ihr Passwort"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {requiresCaptcha && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Bitte bestätigen Sie, dass Sie kein Roboter sind
            </p>
            <TurnstileCaptcha
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || (requiresCaptcha && !captchaToken)}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Anmelden
        </Button>

        <div className="text-center text-sm">
          <Link
            href="/reset-password"
            className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            Passwort vergessen?
          </Link>
        </div>
      </form>
    </Form>
  )
}
